// @ts-nocheck
import type { Ad } from "@/types/ad";

// ---------------------------------------------------------------------------
// Ad Strength engine
// ---------------------------------------------------------------------------
// A Google-Ads-style quality signal for each ad. It scores the ad 0–100 across
// a weighted checklist (headline breadth, uniqueness, keyword coverage,
// descriptions, landing page and — for Display/PMax — creative assets) and maps
// that to a level the way Google surfaces "Ad Strength". Every check carries an
// actionable hint so the editor can tell the user exactly what to improve next.

export type StrengthLevel =
  | "Incomplete"
  | "Poor"
  | "Average"
  | "Good"
  | "Excellent";

export type StrengthTone = "slate" | "rose" | "amber" | "sky" | "emerald";

export interface StrengthCheck {
  id: string;
  label: string;
  passed: boolean;
  weight: number;
  hint: string;
}

export interface AdStrengthResult {
  score: number; // 0–100
  level: StrengthLevel;
  tone: StrengthTone;
  checks: StrengthCheck[];
  passedCount: number;
  totalCount: number;
  topSuggestion: string | null; // highest-weight failing check hint
}

const clean = (arr?: string[]): string[] =>
  (Array.isArray(arr) ? arr : []).map((s) => (s || "").trim()).filter(Boolean);

const uniqueCount = (arr: string[]): number =>
  new Set(arr.map((s) => s.toLowerCase())).size;

const looksLikeUrl = (url?: string): boolean =>
  !!url && /^https?:\/\/[^\s.]+\.[^\s]{2,}/i.test((url || "").trim());

// Does any headline/description contain at least one of the ad's keywords?
const keywordsUsed = (ad: Ad): boolean => {
  const kws = clean(ad.keywords);
  if (kws.length === 0) return false;
  const haystack = [...clean(ad.headlines), ...clean(ad.descriptions)]
    .join(" ")
    .toLowerCase();
  return kws.some((k) => haystack.includes(k.toLowerCase()));
};

export function computeAdStrength(ad: Ad): AdStrengthResult {
  const headlines = clean(ad.headlines);
  const descriptions = clean(ad.descriptions);
  const isVisual = ad.type === "display" || ad.type === "pmax";

  const checks: StrengthCheck[] = [];

  // --- Headlines -----------------------------------------------------------
  checks.push({
    id: "headlines_min",
    label: "At least 3 headlines",
    passed: headlines.length >= 3,
    weight: 16,
    hint: "Add at least 3 headlines so the network can assemble varied combinations.",
  });
  checks.push({
    id: "headlines_breadth",
    label: "8 or more headlines",
    passed: headlines.length >= 8,
    weight: 14,
    hint: "Aim for 8–15 headlines — more assets give the algorithm room to optimise.",
  });
  checks.push({
    id: "headlines_unique",
    label: "Headlines are distinct",
    passed: headlines.length >= 2 && uniqueCount(headlines) === headlines.length,
    weight: 10,
    hint: "Remove duplicate headlines and vary the angle so each one adds something new.",
  });
  checks.push({
    id: "headlines_length",
    label: "Headlines use the space",
    passed:
      headlines.length > 0 &&
      headlines.filter((h) => h.length >= 20).length >=
        Math.min(3, headlines.length),
    weight: 8,
    hint: "Longer headlines (20–30 chars) carry more message. Expand a few short ones.",
  });

  // --- Descriptions --------------------------------------------------------
  checks.push({
    id: "descriptions_min",
    label: "At least 2 descriptions",
    passed: descriptions.length >= 2,
    weight: 15,
    hint: "Provide at least 2 descriptions (up to 4) to describe your offer fully.",
  });
  checks.push({
    id: "descriptions_full",
    label: "3+ descriptions",
    passed: descriptions.length >= 3,
    weight: 7,
    hint: "Add a 3rd and 4th description to maximise coverage and testing surface.",
  });
  checks.push({
    id: "descriptions_unique",
    label: "Descriptions are distinct",
    passed:
      descriptions.length >= 2 &&
      uniqueCount(descriptions) === descriptions.length,
    weight: 6,
    hint: "Make each description unique — repeated copy wastes an asset slot.",
  });

  // --- Relevance & landing -------------------------------------------------
  checks.push({
    id: "keywords_used",
    label: "Keywords appear in copy",
    passed: keywordsUsed(ad),
    weight: 12,
    hint: "Work your target keywords into headlines and descriptions to lift relevance & Quality Score.",
  });
  checks.push({
    id: "final_url",
    label: "Valid final URL",
    passed: looksLikeUrl(ad.finalUrl),
    weight: 8,
    hint: "Set a valid https:// landing page URL — required for the ad to run.",
  });

  // --- Type-specific assets ------------------------------------------------
  if (isVisual) {
    checks.push({
      id: "images",
      label: "Marketing images added",
      passed: (ad.images || []).length >= 1,
      weight: 8,
      hint: "Upload marketing images — Display and Performance Max rely on strong visuals.",
    });
    checks.push({
      id: "logos",
      label: "Logo provided",
      passed: (ad.logos || []).length >= 1,
      weight: 4,
      hint: "Add a logo so your brand shows consistently across placements.",
    });
    checks.push({
      id: "business_name",
      label: "Business name set",
      passed: !!(ad.businessName || "").trim(),
      weight: 4,
      hint: "Provide a business name — it appears alongside your creative.",
    });
  } else {
    checks.push({
      id: "sitelinks",
      label: "Sitelinks / extensions",
      passed:
        (ad.sitelinks || []).length >= 1 || (ad.extensions || []).length >= 1,
      weight: 8,
      hint: "Add sitelinks or extensions — they expand your ad and lift click-through rate.",
    });
    checks.push({
      id: "display_path",
      label: "Display path set",
      passed: !!(ad.displayPath || "").trim(),
      weight: 4,
      hint: "Fill the display path to make the shown URL more descriptive and relevant.",
    });
  }

  const totalWeight = checks.reduce((a, c) => a + c.weight, 0);
  const gained = checks.reduce((a, c) => a + (c.passed ? c.weight : 0), 0);
  const score = totalWeight > 0 ? Math.round((gained / totalWeight) * 100) : 0;
  const passedCount = checks.filter((c) => c.passed).length;

  // "Incomplete" mirrors Google: an ad with no real headline/description can't
  // be graded on quality yet.
  const incomplete = headlines.length < 1 || descriptions.length < 1;

  let level: StrengthLevel;
  let tone: StrengthTone;
  if (incomplete) {
    level = "Incomplete";
    tone = "slate";
  } else if (score >= 85) {
    level = "Excellent";
    tone = "emerald";
  } else if (score >= 65) {
    level = "Good";
    tone = "sky";
  } else if (score >= 40) {
    level = "Average";
    tone = "amber";
  } else {
    level = "Poor";
    tone = "rose";
  }

  // Highest-weight failing check drives the single most useful suggestion.
  const topFail = [...checks]
    .filter((c) => !c.passed)
    .sort((a, b) => b.weight - a.weight)[0];

  return {
    score: incomplete ? Math.min(score, 20) : score,
    level,
    tone,
    checks,
    passedCount,
    totalCount: checks.length,
    topSuggestion: topFail ? topFail.hint : null,
  };
}
