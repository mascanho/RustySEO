// @ts-nocheck
// Builds a single, comprehensive PDF report from the current in-memory crawl
// (store) plus a handful of on-demand backend fetches for data that is only
// ever lazily loaded when the user visits a specific table tab (images,
// redirects, broken links). This is the sole "Reports" feature in the top
// menubar — it replaces the old ad-hoc "Performance History" / "SEO History"
// CSV exports, which pulled from an unrelated legacy single-URL database.
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { invoke } from "@tauri-apps/api/core";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { ISSUE_REGISTRY } from "@/app/global/_components/Sidebar/Issues/libs/issuesRegistry";
import { FixesData } from "@/app/global/_components/Sidebar/BottomContainer/Fixes/FixesData";

const MARGIN = 14;
const BRAND_COLOR = [37, 99, 235]; // blue-600
const DANGER_COLOR = [220, 38, 38]; // red-600
const APPENDIX_ROW_CAP = 200;
const ISSUE_APPENDIX_ROW_CAP = 100;
const FULL_INVENTORY_ROW_CAP = 500;
const ROBOTS_TXT_LINE_CAP = 1000;
const DUPLICATE_GROUP_CAP = 50;
const TOP_KEYWORDS_CAP = 30;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

// PSI category scores are stored as raw Lighthouse 0-1 floats (see
// get_psi_score in models.rs, which averages categories.<cat>.score
// verbatim), so every display of these fields must scale by 100 first.
const psi100 = (score: number | null | undefined): number | null =>
  score == null ? null : Math.round(score * 100);

const average = (nums: number[]): number | null => {
  const valid = nums.filter((n) => typeof n === "number" && !Number.isNaN(n));
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
};

const pct = (part: number | undefined, total: number | undefined): string => {
  if (!total || part === undefined || part === null) return "-";
  return `${((part / total) * 100).toFixed(1)}%`;
};

const truncate = (str: string, max: number): string => {
  if (!str) return "";
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
};

const domainFromUrl = (url: string | undefined): string => {
  if (!url) return "Unknown domain";
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

interface LoadedImage {
  dataUrl: string;
  width: number;
  height: number;
}

const loadImageDimensions = (
  dataUrl: string,
): Promise<{ width: number; height: number }> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
    img.onerror = () => resolve({ width: 1, height: 1 });
    img.src = dataUrl;
  });

// Fetches a public/ asset and returns it as a data URL + natural dimensions
// so it can be embedded via doc.addImage() at the correct aspect ratio.
// Resolves to null (never throws) so a missing/broken asset just means the
// report renders without the logo instead of failing outright.
const loadImageDataUrl = async (path: string): Promise<LoadedImage | null> => {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const dims = await loadImageDimensions(dataUrl);
    return { dataUrl, width: dims.width, height: dims.height };
  } catch {
    return null;
  }
};

// Lighthouse always computes a "final-screenshot" audit as part of the
// performance category (see runPagespeed's category=performance in
// bulk.rs), so PSI data already fetched during the crawl doubles as a free
// homepage preview — no separate screenshot infrastructure needed. Checks
// every strategy (mobile/desktop) and returns the first screenshot found.
const extractFinalScreenshot = (psiResults: any): string | null => {
  if (!Array.isArray(psiResults)) return null;
  for (const strategy of psiResults) {
    const data = strategy?.audits?.["final-screenshot"]?.details?.data;
    if (typeof data === "string" && data.length > 0) return data;
  }
  return null;
};

// Finds the URL for the crawl's root/homepage — deterministically, not by
// array position. crawlData is populated as page fetches complete, and under
// concurrent crawling that finishing order has nothing to do with crawl
// depth, so crawlData[0] is really just "whichever request finished first"
// and is NOT reliably the homepage. url_depth === 0 is the actual semantic
// marker for the seed URL, so it's the only thing trusted here; if that
// record isn't in the (possibly capped) buffer for some reason, the domain
// root is reconstructed directly from any crawled URL instead of guessing
// from array order.
const findRootPageUrl = (crawlData: any[]): string | null => {
  const depthZero = crawlData.find((p) => p?.url_depth === 0);
  if (depthZero?.url) return depthZero.url;

  const anyPage = crawlData.find((p) => p?.url);
  if (!anyPage?.url) return null;
  try {
    const u = new URL(anyPage.url);
    return `${u.protocol}//${u.host}/`;
  } catch {
    return anyPage.url;
  }
};

// Homepage preview for the cover page. PSI is opt-in and often wasn't run
// for a given crawl, so this can't rely on it alone: first checks for a free
// Lighthouse "final-screenshot" (no extra cost, already fetched during the
// crawl if PSI ran), then falls back to an on-demand headless-Chrome capture
// (capture_page_screenshot_command) so a preview is available either way.
// Never throws — a failure on both paths just means no preview.
const fetchRootScreenshot = async (
  crawlData: any[],
): Promise<LoadedImage | null> => {
  const rootUrl = findRootPageUrl(crawlData);
  if (!rootUrl) return null;

  try {
    const fullData: any = await invoke("get_url_data_command", {
      url: rootUrl,
    });
    const psiShot = extractFinalScreenshot(fullData?.psi_results);
    if (psiShot) {
      const dims = await loadImageDimensions(psiShot);
      return { dataUrl: psiShot, width: dims.width, height: dims.height };
    }
  } catch (error) {
    console.error("Failed to check PSI data for a homepage screenshot:", error);
  }

  try {
    const capturedShot: string = await invoke(
      "capture_page_screenshot_command",
      {
        url: rootUrl,
      },
    );
    if (!capturedShot) return null;
    const dims = await loadImageDimensions(capturedShot);
    return { dataUrl: capturedShot, width: dims.width, height: dims.height };
  } catch (error) {
    console.error("Failed to capture a homepage screenshot:", error);
    return null;
  }
};

const safeTitle = (page: any): string => page?.title?.[0]?.title || "";
const safeTitleLen = (page: any): number =>
  page?.title?.[0]?.title_len ?? safeTitle(page).length;

// Walks a parsed JSON-LD value (object, array, or @graph-wrapped) and collects
// every "@type" it finds. Schema.org allows @type to be a single string or an
// array of strings, and multiple entities are commonly nested under @graph.
const extractSchemaTypes = (raw: string): string[] => {
  const types: string[] = [];
  try {
    const visit = (node: any) => {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) {
        node.forEach(visit);
        return;
      }
      if (node["@type"]) {
        if (Array.isArray(node["@type"]))
          types.push(...node["@type"].map(String));
        else types.push(String(node["@type"]));
      }
      if (Array.isArray(node["@graph"])) node["@graph"].forEach(visit);
    };
    visit(JSON.parse(raw));
  } catch {
    // Malformed JSON-LD on the page — skip it rather than fail the report.
  }
  return types;
};

// ---------------------------------------------------------------------------
// PDF drawing helpers
// ---------------------------------------------------------------------------

const sectionTitle = (doc: jsPDF, text: string, y: number): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(text, MARGIN, y);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y + 2.5, pageWidth - MARGIN, y + 2.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  return y + 9;
};

const subNote = (doc: jsPDF, text: string, y: number): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const lines = doc.splitTextToSize(text, pageWidth - MARGIN * 2);
  doc.text(lines, MARGIN, y);
  doc.setTextColor(0, 0, 0);
  return y + lines.length * 4 + 3;
};

const ensureSpace = (doc: jsPDF, y: number, needed = 30): number => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 18) {
    doc.addPage();
    return 20;
  }
  return y;
};

const kvTable = (
  doc: jsPDF,
  startY: number,
  rows: [string, string][],
): number => {
  autoTable(doc, {
    startY,
    body: rows,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 1.6 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 75, textColor: [51, 65, 85] },
      1: { textColor: [15, 23, 42] },
    },
    margin: { left: MARGIN, right: MARGIN },
  });
  // @ts-ignore - attached by the autotable plugin
  return doc.lastAutoTable.finalY + 8;
};

const dataTable = (
  doc: jsPDF,
  startY: number,
  head: string[][],
  body: (string | number)[][],
  opts: Record<string, any> = {},
): number => {
  autoTable(doc, {
    startY,
    head,
    body,
    theme: opts.theme || "striped",
    // Explicit white text on every filled header row — relying on the
    // autoTable theme's default head textColor is fragile, since any future
    // headStyles override here could silently drop it and leave dark text
    // on a dark (blue/red) background.
    headStyles: {
      fillColor: opts.headColor || BRAND_COLOR,
      textColor: [255, 255, 255],
      fontSize: 8.5,
    },
    styles: {
      fontSize: opts.fontSize || 8.5,
      cellPadding: 1.8,
      overflow: "linebreak",
    },
    margin: { left: MARGIN, right: MARGIN },
    ...opts.extra,
  });
  // @ts-ignore
  return doc.lastAutoTable.finalY + 9;
};

// ---------------------------------------------------------------------------
// "General" sidebar tab — reproduces every category widget from
// app/global/_components/Sidebar/General/DropDowns/* as plain data, in the
// same order they render in the app (GeneralTopSideBarContainer.tsx), so the
// report carries the exact same breakdown the user sees while crawling.
// ---------------------------------------------------------------------------

interface GeneralCategory {
  title: string;
  rows: [string, string, string][]; // [label, value, percentage]
}

// 0-decimal, "0%"-on-empty-denominator percentage — matches the formatting
// used throughout the General tab widgets (as opposed to the 1-decimal,
// "-"-on-empty `pct` helper used by the rest of this report).
const pct0 = (part: number, total: number): string => {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
};

// Same as pct0 but capped at 100% — several widgets (MetaDescriptions, H1,
// H2, Security, URLinfo) clamp their percentage this way in the app.
const pctCapped0 = (part: number, total: number): string => {
  if (!total) return "0%";
  return `${Math.min(Math.round((part / total) * 100), 100)}%`;
};

const cat = (
  title: string,
  rows: [string, string, string][],
): GeneralCategory => ({ title, rows });

function computeGeneralOverview(
  crawlData: any[],
  finalStatsRaw: any | null,
): GeneralCategory[] {
  const totalPages = crawlData.length;
  const categories: GeneralCategory[] = [];

  // 1. Summary — prefer authoritative backend stats, else derive from crawlData.
  {
    let internalLinks: number;
    let externalLinks: number;
    let indexablePages: number;
    let notIndexablePages: number;
    let pages: number;
    if (finalStatsRaw) {
      pages = finalStatsRaw.pages ?? totalPages;
      internalLinks = finalStatsRaw.total_internal_links ?? 0;
      externalLinks = finalStatsRaw.total_external_links ?? 0;
      indexablePages = finalStatsRaw.indexable_pages ?? 0;
      notIndexablePages = finalStatsRaw.not_indexable_pages ?? 0;
    } else {
      pages = totalPages;
      internalLinks = crawlData.reduce(
        (s, p) => s + (p?.internal_links_count || 0),
        0,
      );
      externalLinks = crawlData.reduce(
        (s, p) => s + (p?.external_links_count || 0),
        0,
      );
      indexablePages = crawlData.filter(
        (p) => (p?.indexability?.indexability || 0) > 0.5,
      ).length;
      notIndexablePages = pages - indexablePages;
    }
    const totalLinks = internalLinks + externalLinks;
    categories.push(
      cat("Summary", [
        ["Pages crawled", String(pages), "100%"],
        ["Total Links Found", String(totalLinks), "100%"],
        [
          "Total Internal Links",
          String(internalLinks),
          pct0(internalLinks, totalLinks),
        ],
        [
          "Total External Links",
          String(externalLinks),
          pct0(externalLinks, totalLinks),
        ],
        [
          "Total Indexable Pages",
          String(indexablePages),
          pct0(indexablePages, pages),
        ],
        [
          "Total Not Indexable Pages",
          String(notIndexablePages),
          pct0(notIndexablePages, pages),
        ],
      ]),
    );
  }

  // 2. Crawl Depth
  {
    const depthCounts = new Map<number, number>();
    for (const p of crawlData) {
      const d = p?.url_depth || 0;
      depthCounts.set(d, (depthCounts.get(d) || 0) + 1);
    }
    const depths = [...depthCounts.keys()].sort((a, b) => a - b);
    categories.push(
      cat(
        "Crawl Depth",
        depths.map((d) => {
          const c = depthCounts.get(d) || 0;
          return [
            d === 0 ? "Homepage (Level 0)" : `Level ${d}`,
            String(c),
            pct0(c, totalPages),
          ];
        }),
      ),
    );
  }

  // 3. Page Titles
  {
    const titles = crawlData.map((p) => p?.title?.[0]?.title);
    const unique = [...new Set(titles)];
    const over60 = unique.filter((t: any) => (t?.length || 0) > 60).length;
    const missing = unique.filter((t: any) => !t).length;
    const below30 = unique.filter((t: any) => t && t.length < 30).length;
    categories.push(
      cat("Page Titles", [
        ["All", String(totalPages), "100%"],
        ["Over 60 Characters", String(over60), pct0(over60, totalPages)],
        ["Missing Page Title", String(missing), pct0(missing, totalPages)],
        ["Below 30 Characters", String(below30), pct0(below30, totalPages)],
      ]),
    );
  }

  // 4. Meta Description
  {
    const descriptions = crawlData.map((p) => p?.description);
    const unique = [...new Set(descriptions)];
    const empty = unique.filter((d: any) => !d || d === "").length;
    const duplicate = descriptions.length - unique.length;
    const over155 = unique.filter((d: any) => (d?.length || 0) > 155).length;
    const below70 = unique.filter((d: any) => d && d.length < 70).length;
    categories.push(
      cat("Meta Description", [
        ["Total Description", String(totalPages), "100%"],
        ["Empty Description", String(empty), pctCapped0(empty, totalPages)],
        [
          "Duplicate Description",
          String(duplicate),
          pctCapped0(duplicate, totalPages),
        ],
        [
          "Over 155 Characters",
          String(over155),
          pctCapped0(over155, totalPages),
        ],
        [
          "Below 70 Characters",
          String(below70),
          pctCapped0(below70, totalPages),
        ],
      ]),
    );
  }

  // 5 & 6. H1 / H2 (shared logic)
  const headingCategory = (tag: "h1" | "h2", label: string) => {
    const all = crawlData.flatMap((p) => p?.headings?.[tag] || []);
    const valid = all.filter((h: string) => h?.trim());
    const unique = [...new Set(valid)];
    const exists = valid.length;
    const missing = Math.abs(totalPages - exists);
    const duplicate = all.length - unique.length;
    const long = unique.filter((h: string) => h.length > 155).length;
    const short = unique.filter((h: string) => h.length < 70).length;
    categories.push(
      cat(label, [
        ["Total", String(exists), pctCapped0(exists, totalPages)],
        ["Missing", String(missing), pctCapped0(missing, totalPages)],
        [
          `Duplicate ${label} Headings`,
          String(duplicate),
          pctCapped0(duplicate, all.length),
        ],
        ["Over 155 Characters", String(long), pctCapped0(long, all.length)],
        ["Below 70 Characters", String(short), pctCapped0(short, all.length)],
      ]),
    );
  };
  headingCategory("h1", "H1");
  headingCategory("h2", "H2");

  // 7. Word Count
  {
    let noContent = 0,
      veryShort = 0,
      short = 0,
      medium = 0,
      long = 0,
      veryLong = 0;
    for (const p of crawlData) {
      const wc = p?.word_count || 0;
      if (wc === 0) noContent++;
      else if (wc <= 100) veryShort++;
      else if (wc <= 300) short++;
      else if (wc <= 600) medium++;
      else if (wc <= 1000) long++;
      else veryLong++;
    }
    categories.push(
      cat("Word Count", [
        ["Total Pages", String(totalPages), "100%"],
        ["No Content (0)", String(noContent), pct0(noContent, totalPages)],
        ["Very Short (1-100)", String(veryShort), pct0(veryShort, totalPages)],
        ["Short (101-300)", String(short), pct0(short, totalPages)],
        ["Medium (301-600)", String(medium), pct0(medium, totalPages)],
        ["Long (601-1000)", String(long), pct0(long, totalPages)],
        ["Very Long (1000+)", String(veryLong), pct0(veryLong, totalPages)],
      ]),
    );
  }

  // 8. Readability
  {
    let fleschCount = 0,
      fleschTotal = 0,
      easy = 0,
      standard = 0,
      difficult = 0,
      ratioCount = 0,
      thinRatio = 0;
    for (const p of crawlData) {
      const f = p?.flesch;
      if (f !== undefined && f !== null) {
        fleschCount++;
        fleschTotal += f;
        if (f >= 70) easy++;
        else if (f >= 50) standard++;
        else difficult++;
      }
      const tr = p?.text_ratio;
      if (tr !== undefined && tr !== null) {
        ratioCount++;
        if (tr < 10) thinRatio++;
      }
    }
    const avgFlesch = fleschCount
      ? String(Math.round(fleschTotal / fleschCount))
      : "N/A";
    categories.push(
      cat("Readability", [
        ["Average Reading Ease", avgFlesch, "-"],
        ["Easy to Read (70-100)", String(easy), pct0(easy, fleschCount)],
        ["Standard (50-69)", String(standard), pct0(standard, fleschCount)],
        ["Difficult (0-49)", String(difficult), pct0(difficult, fleschCount)],
        [
          "Low Text-to-HTML Ratio (<10%)",
          String(thinRatio),
          pct0(thinRatio, ratioCount),
        ],
      ]),
    );
  }

  // 9. Images
  {
    let imageCounts = 0,
      hasAlt = 0,
      hasNoAlt = 0;
    for (const p of crawlData) {
      imageCounts += p?.images_count || 0;
      hasAlt += p?.images_with_alt || 0;
      hasNoAlt += p?.images_without_alt || 0;
    }
    categories.push(
      cat("Images", [
        ["Total Images", String(imageCounts), "100%"],
        ["Images with Alt Tags", String(hasAlt), pct0(hasAlt, imageCounts)],
        [
          "Images without Alt Tags",
          String(hasNoAlt),
          pct0(hasNoAlt, imageCounts),
        ],
      ]),
    );
  }

  // 10. CSS
  {
    let extCss = 0,
      inlineCss = 0;
    for (const p of crawlData) {
      extCss += p?.css_external_count || 0;
      inlineCss += p?.css_inline_count || 0;
    }
    const totalCss = extCss + inlineCss;
    categories.push(
      cat("CSS", [
        ["External CSS", String(extCss), pct0(extCss, totalCss)],
        ["Internal CSS", String(inlineCss), pct0(inlineCss, totalCss)],
      ]),
    );
  }

  // 11. Javascript
  {
    const extSet = new Set<string>();
    const inlineSet = new Set<string>();
    for (const p of crawlData) {
      (p?.javascript?.external || []).forEach((s: string) => extSet.add(s));
      (p?.javascript?.inline || []).forEach((s: string) => inlineSet.add(s));
    }
    const totalScripts = extSet.size + inlineSet.size;
    categories.push(
      cat("Javascript", [
        ["Total Javascript", String(totalScripts), "100%"],
        [
          "External Scripts",
          String(extSet.size),
          pct0(extSet.size, totalScripts),
        ],
        [
          "Inline Scripts",
          String(inlineSet.size),
          pct0(inlineSet.size, totalScripts),
        ],
      ]),
    );
  }

  // 12. Schema
  {
    const hasSchema = crawlData.filter((p) => p?.schema).length;
    const missingSchema = totalPages - hasSchema;
    categories.push(
      cat("Schema", [
        ["Total Schemas Found", String(hasSchema), pct0(hasSchema, totalPages)],
        ["Pages With Schema", String(hasSchema), pct0(hasSchema, totalPages)],
        [
          "Pages Missing Schema",
          String(missingSchema),
          pct0(missingSchema, totalPages),
        ],
      ]),
    );
  }

  // 13. Indexing Status
  {
    let indexable = 0,
      nonIndexable = 0;
    const reasonMap = new Map<string, number>();
    for (const p of crawlData) {
      const ind = p?.indexability?.indexability || 0;
      if (ind >= 0.5) indexable++;
      else nonIndexable++;
      const reason = p?.indexability?.indexability_reason || "Unknown";
      reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
    }
    const topReasons = [...reasonMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    categories.push(
      cat("Indexing Status", [
        ["Indexable", String(indexable), pct0(indexable, totalPages)],
        ["Non-Indexable", String(nonIndexable), pct0(nonIndexable, totalPages)],
        ...topReasons.map(([reason, count]): [string, string, string] => [
          reason,
          String(count),
          pct0(count, totalPages),
        ]),
      ]),
    );
  }

  // 14. Meta Robots
  {
    let notSet = 0,
      indexFollow = 0,
      noindex = 0,
      nofollow = 0,
      noindexNofollow = 0;
    for (const p of crawlData) {
      const directives = (p?.meta_robots?.meta_robots || [])
        .join(", ")
        .toLowerCase();
      if (!directives) {
        notSet++;
      } else {
        const hasNoindex = directives.includes("noindex");
        const hasNofollow = directives.includes("nofollow");
        if (hasNoindex && hasNofollow) noindexNofollow++;
        else if (hasNoindex) noindex++;
        else if (hasNofollow) nofollow++;
        else indexFollow++;
      }
    }
    categories.push(
      cat("Meta Robots", [
        ["No Meta Robots Tag", String(notSet), pct0(notSet, totalPages)],
        ["Index, Follow", String(indexFollow), pct0(indexFollow, totalPages)],
        ["Noindex", String(noindex), pct0(noindex, totalPages)],
        ["Nofollow", String(nofollow), pct0(nofollow, totalPages)],
        [
          "Noindex, Nofollow",
          String(noindexNofollow),
          pct0(noindexNofollow, totalPages),
        ],
      ]),
    );
  }

  // 15. Canonicals
  {
    let withC = 0,
      withoutC = 0,
      selfRef = 0,
      externalC = 0;
    for (const p of crawlData) {
      const c = p?.canonicals;
      if (!c || c.length === 0) {
        withoutC++;
      } else {
        withC++;
        if (c[0] === p.url) {
          selfRef++;
        } else if (c[0]) {
          let hostname = "";
          try {
            hostname = new URL(p.url).hostname;
          } catch {
            // leave hostname empty — url isn't a valid absolute URL
          }
          if (hostname && !String(c[0]).includes(hostname)) externalC++;
        }
      }
    }
    categories.push(
      cat("Canonicals", [
        ["Total Pages", String(totalPages), "100%"],
        ["With Canonical", String(withC), pct0(withC, totalPages)],
        ["Without Canonical", String(withoutC), pct0(withoutC, totalPages)],
        ["Self-Referencing", String(selfRef), pct0(selfRef, totalPages)],
        ["External Canonical", String(externalC), pct0(externalC, totalPages)],
      ]),
    );
  }

  // 16. OpenGraph
  {
    let withOG = 0,
      withoutOG = 0,
      ogTitle = 0,
      ogDesc = 0,
      ogImage = 0,
      ogUrl = 0,
      ogType = 0;
    for (const p of crawlData) {
      const og = p?.opengraph;
      if (!og || Object.keys(og).length === 0) {
        withoutOG++;
      } else {
        withOG++;
        if (og["og:title"]) ogTitle++;
        if (og["og:description"]) ogDesc++;
        if (og["og:image"]) ogImage++;
        if (og["og:url"]) ogUrl++;
        if (og["og:type"]) ogType++;
      }
    }
    categories.push(
      cat("OpenGraph", [
        ["Total Pages", String(totalPages), "100%"],
        ["With OpenGraph", String(withOG), pct0(withOG, totalPages)],
        ["Without OpenGraph", String(withoutOG), pct0(withoutOG, totalPages)],
        ["Has og:title", String(ogTitle), pct0(ogTitle, totalPages)],
        ["Has og:description", String(ogDesc), pct0(ogDesc, totalPages)],
        ["Has og:image", String(ogImage), pct0(ogImage, totalPages)],
        ["Has og:url", String(ogUrl), pct0(ogUrl, totalPages)],
        ["Has og:type", String(ogType), pct0(ogType, totalPages)],
      ]),
    );
  }

  // 17. Cookies (adapted to the `cookies_count` field carried on LightCrawlResult
  // rows, rather than the raw per-page `cookies.Ok[]` array the widget itself reads)
  {
    let totalCookies = 0,
      withCookies = 0,
      withoutCookies = 0;
    for (const p of crawlData) {
      const count = p?.cookies_count || 0;
      totalCookies += count;
      if (count > 0) withCookies++;
      else withoutCookies++;
    }
    const avgCookies = totalPages
      ? (totalCookies / totalPages).toFixed(1)
      : "0.0";
    categories.push(
      cat("Cookies", [
        ["Total Pages", String(totalPages), "100%"],
        ["With Cookies", String(withCookies), pct0(withCookies, totalPages)],
        [
          "Without Cookies",
          String(withoutCookies),
          pct0(withoutCookies, totalPages),
        ],
        ["Avg. Cookies / Page", avgCookies, "-"],
        ["Total Cookies Found", String(totalCookies), "-"],
      ]),
    );
  }

  // 18. Language
  {
    let noLanguage = 0;
    const langMap = new Map<string, number>();
    for (const p of crawlData) {
      const lang = p?.language;
      if (!lang) noLanguage++;
      else langMap.set(lang, (langMap.get(lang) || 0) + 1);
    }
    const topLangs = [...langMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const rows: [string, string, string][] = [
      ["Total Pages", String(totalPages), "100%"],
    ];
    for (const [lang, count] of topLangs) {
      rows.push([lang.toUpperCase(), String(count), pct0(count, totalPages)]);
    }
    if (noLanguage > 0)
      rows.push([
        "No Language",
        String(noLanguage),
        pct0(noLanguage, totalPages),
      ]);
    categories.push(cat("Language", rows));
  }

  // 19. Mobile Friendliness
  {
    let mobileFriendly = 0,
      notMobileFriendly = 0,
      unknown = 0;
    for (const p of crawlData) {
      if (p?.mobile === true) mobileFriendly++;
      else if (p?.mobile === false) notMobileFriendly++;
      else unknown++;
    }
    categories.push(
      cat("Mobile Friendliness", [
        ["Total Pages", String(totalPages), "100%"],
        [
          "Mobile Friendly",
          String(mobileFriendly),
          pct0(mobileFriendly, totalPages),
        ],
        [
          "Not Mobile Friendly",
          String(notMobileFriendly),
          pct0(notMobileFriendly, totalPages),
        ],
        ["Unknown", String(unknown), pct0(unknown, totalPages)],
      ]),
    );
  }

  // 20. Security
  {
    let httpsCount = 0,
      httpCount = 0,
      mixedContentCount = 0,
      unsafeAnchors = 0,
      insecureIframes = 0,
      inlineScripts = 0;
    for (const p of crawlData) {
      if (p?.https === true) httpsCount++;
      else if (p?.https === false) httpCount++;
      if ((p?.security?.total_mixed_content || 0) > 0) mixedContentCount++;
      unsafeAnchors += p?.security?.total_unsafe_anchors || 0;
      insecureIframes += p?.security?.total_insecure_iframes || 0;
      inlineScripts += p?.security?.total_inline_scripts || 0;
    }
    categories.push(
      cat("Security", [
        ["HTTPS URLs", String(httpsCount), pctCapped0(httpsCount, totalPages)],
        ["HTTP URLs", String(httpCount), pctCapped0(httpCount, totalPages)],
        [
          "Mixed Content",
          String(mixedContentCount),
          pctCapped0(mixedContentCount, httpsCount),
        ],
        [
          "Unsafe Anchors",
          String(unsafeAnchors),
          pctCapped0(unsafeAnchors, totalPages),
        ],
        [
          "Insecure Iframes",
          String(insecureIframes),
          pctCapped0(insecureIframes, totalPages),
        ],
        [
          "Inline Scripts",
          String(inlineScripts),
          pctCapped0(inlineScripts, totalPages),
        ],
      ]),
    );
  }

  // 21. Chrome UX Report (Performance)
  {
    let perfSum = 0,
      perfCount = 0,
      accSum = 0,
      accCount = 0,
      bpSum = 0,
      bpCount = 0,
      seoSum = 0,
      seoCount = 0;
    let good = 0,
      needsImprovement = 0,
      poor = 0;
    for (const p of crawlData) {
      const perf = psi100(p?.performance_score);
      if (perf != null) {
        perfSum += perf;
        perfCount++;
        if (perf >= 90) good++;
        else if (perf >= 50) needsImprovement++;
        else poor++;
      }
      const acc = psi100(p?.accessibility_score);
      if (acc != null) {
        accSum += acc;
        accCount++;
      }
      const bp = psi100(p?.best_practices_score);
      if (bp != null) {
        bpSum += bp;
        bpCount++;
      }
      const seo = psi100(p?.seo_score);
      if (seo != null) {
        seoSum += seo;
        seoCount++;
      }
    }
    categories.push(
      cat("Chrome UX Report", [
        [
          "Performance Score",
          perfCount ? String(Math.round(perfSum / perfCount)) : "N/A",
          "-",
        ],
        [
          "Accessibility Score",
          accCount ? String(Math.round(accSum / accCount)) : "N/A",
          "-",
        ],
        [
          "Best Practices",
          bpCount ? String(Math.round(bpSum / bpCount)) : "N/A",
          "-",
        ],
        [
          "SEO Score",
          seoCount ? String(Math.round(seoSum / seoCount)) : "N/A",
          "-",
        ],
        ["Good (90-100)", String(good), pct0(good, perfCount)],
        [
          "Needs Improvement",
          String(needsImprovement),
          pct0(needsImprovement, perfCount),
        ],
        ["Poor (0-49)", String(poor), pct0(poor, perfCount)],
      ]),
    );
  }

  // 22. Page Weight
  {
    let count = 0,
      totalKb = 0,
      light = 0,
      medium = 0,
      heavy = 0,
      veryHeavy = 0;
    for (const p of crawlData) {
      const kb = p?.page_size?.[0]?.kb;
      if (kb === undefined || kb === null) continue;
      count++;
      totalKb += kb;
      if (kb < 100) light++;
      else if (kb < 500) medium++;
      else if (kb < 1024) heavy++;
      else veryHeavy++;
    }
    const avgKb = count ? `${Math.round(totalKb / count)} KB` : "N/A";
    categories.push(
      cat("Page Weight", [
        ["Average Page Size", avgKb, "-"],
        ["Light (< 100 KB)", String(light), pct0(light, count)],
        ["Medium (100-500 KB)", String(medium), pct0(medium, count)],
        ["Heavy (500 KB-1 MB)", String(heavy), pct0(heavy, count)],
        ["Very Heavy (> 1 MB)", String(veryHeavy), pct0(veryHeavy, count)],
      ]),
    );
  }

  // 23. Response Time
  {
    let count = 0,
      totalTime = 0,
      fast = 0,
      avgBucket = 0,
      slow = 0;
    for (const p of crawlData) {
      const rt = p?.response_time;
      if (rt === undefined || rt === null) continue;
      const time = rt * 1000;
      count++;
      totalTime += time;
      if (time < 200) fast++;
      else if (time <= 1000) avgBucket++;
      else slow++;
    }
    const avg = count ? Math.round(totalTime / count) : 0;
    categories.push(
      cat("Response Time", [
        ["Average Response Time", `${avg}ms`, "-"],
        ["Fast (< 200ms)", String(fast), pct0(fast, totalPages)],
        ["Average (200ms-1s)", String(avgBucket), pct0(avgBucket, totalPages)],
        ["Slow (> 1s)", String(slow), pct0(slow, totalPages)],
      ]),
    );
  }

  // 24. URL
  {
    const urls = crawlData.map((p) => p?.url || "").filter((u) => u);
    const total = urls.length;
    let nonAscii = 0,
      underscores = 0,
      uppercase = 0,
      multiSlash = 0,
      repetitivePath = 0,
      hasSpace = 0,
      internalSearch = 0,
      hasParams = 0,
      over115 = 0;
    for (const url of urls) {
      if (/[^\x00-\x7F]/.test(url)) nonAscii++;
      if (url.includes("_")) underscores++;
      if (/[A-Z]/.test(url)) uppercase++;
      if (/\/{2,}/.test(url.replace(/^https?:\/\//, ""))) multiSlash++;
      const segments = url.split("/").filter(Boolean);
      if (new Set(segments).size !== segments.length) repetitivePath++;
      if (/\s|%20/.test(url)) hasSpace++;
      if (/search\?|q=|\?.*=/.test(url)) internalSearch++;
      if (url.includes("?")) hasParams++;
      if (url.length > 115) over115++;
    }
    categories.push(
      cat("URL", [
        ["Total", String(total), "100%"],
        ["Non ASCII Characters", String(nonAscii), pctCapped0(nonAscii, total)],
        ["Underscores", String(underscores), pctCapped0(underscores, total)],
        ["Uppercase", String(uppercase), pctCapped0(uppercase, total)],
        ["Multiple Slashes", String(multiSlash), pctCapped0(multiSlash, total)],
        [
          "Repetitive Path",
          String(repetitivePath),
          pctCapped0(repetitivePath, total),
        ],
        ["Contains Space", String(hasSpace), pctCapped0(hasSpace, total)],
        [
          "Internal Search",
          String(internalSearch),
          pctCapped0(internalSearch, total),
        ],
        ["Parameters", String(hasParams), pctCapped0(hasParams, total)],
        ["Over 115 Characters", String(over115), pctCapped0(over115, total)],
      ]),
    );
  }

  // 25. Pages Status Codes
  {
    let s2xx = 0,
      s3xx = 0,
      s4xx = 0,
      s5xx = 0;
    for (const p of crawlData) {
      const sc = p?.status_code || 0;
      if (sc >= 200 && sc < 300) s2xx++;
      else if (sc >= 300 && sc < 400) s3xx++;
      else if (sc >= 400 && sc < 500) s4xx++;
      else if (sc >= 500) s5xx++;
    }
    const totalStatus = s2xx + s3xx + s4xx + s5xx;
    categories.push(
      cat("Pages Status Codes", [
        ["Total", String(totalStatus), "100%"],
        ["2xx Success", String(s2xx), pct0(s2xx, totalStatus)],
        ["3xx Redirection", String(s3xx), pct0(s3xx, totalStatus)],
        ["4xx Client Error", String(s4xx), pct0(s4xx, totalStatus)],
        ["5xx Server Error", String(s5xx), pct0(s5xx, totalStatus)],
      ]),
    );
  }

  // 26. Redirects (degrades gracefully — LightCrawlResult rows carry
  // had_redirect/redirect_count/status_code but not the full redirect_chain)
  {
    let totalRedirects = 0,
      permanent = 0,
      temporary = 0,
      single = 0,
      chains = 0;
    for (const p of crawlData) {
      const statusCode = p?.status_code;
      const hadRedirect = p?.had_redirect;
      const redirectChain = p?.redirect_chain;
      const redirectCount = p?.redirect_count || 0;
      const isRedirect =
        (statusCode && statusCode >= 300 && statusCode < 400) || hadRedirect;
      if (!isRedirect) continue;
      totalRedirects++;
      const firstHopStatus =
        redirectChain?.length > 0 ? redirectChain[0].status_code : statusCode;
      if (firstHopStatus === 301 || firstHopStatus === 308) permanent++;
      else if (
        firstHopStatus === 302 ||
        firstHopStatus === 307 ||
        firstHopStatus === 303
      )
        temporary++;
      if (redirectCount > 1 || redirectChain?.length > 2) chains++;
      else if (redirectCount === 1 || redirectChain?.length === 2) single++;
      else if (hadRedirect) single++;
    }
    categories.push(
      cat("Redirects", [
        ["Total Pages", String(totalPages), "100%"],
        [
          "Total Redirects",
          String(totalRedirects),
          pct0(totalRedirects, totalPages),
        ],
        ["Permanent (301/308)", String(permanent), pct0(permanent, totalPages)],
        [
          "Temporary (302/303/307)",
          String(temporary),
          pct0(temporary, totalPages),
        ],
        ["Single Redirects", String(single), pct0(single, totalPages)],
        ["Redirect Chains", String(chains), pct0(chains, totalPages)],
      ]),
    );
  }

  // 27. Link Score (only rendered if at least one row carries a score —
  // it's merged onto crawlData rows separately, only when the "Link Score"
  // setting is enabled for the crawl)
  {
    let scored = 0,
      total = 0,
      orphaned = 0,
      weak = 0,
      moderate = 0,
      strong = 0;
    for (const p of crawlData) {
      const score = p?.link_score;
      if (score === undefined || score === null) continue;
      scored++;
      total += score;
      if (score === 0) orphaned++;
      else if (score < 40) weak++;
      else if (score < 70) moderate++;
      else strong++;
    }
    if (scored > 0) {
      const avg = String(Math.round(total / scored));
      categories.push(
        cat("Link Score", [
          ["Average Link Score", avg, "-"],
          ["Strong (70-100)", String(strong), pct0(strong, scored)],
          ["Moderate (40-69)", String(moderate), pct0(moderate, scored)],
          ["Weak (1-39)", String(weak), pct0(weak, scored)],
          ["Orphaned (0 Score)", String(orphaned), pct0(orphaned, scored)],
        ]),
      );
    }
  }

  // 28. Custom Search (only rendered if at least one enabled rule has matched)
  {
    const ruleCounts = new Map<string, number>();
    for (const p of crawlData) {
      for (const match of p?.custom_search || []) {
        if (match.matched) {
          ruleCounts.set(match.rule_name, (ruleCounts.get(match.rule_name) || 0) + 1);
        }
      }
    }
    if (ruleCounts.size > 0) {
      const rows: [string, string, string][] = [...ruleCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([ruleName, count]) => [ruleName, String(count), pct0(count, totalPages)]);
      categories.push(cat("Custom Search", rows));
    }
  }

  return categories;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export interface CrawlReportResult {
  success: boolean;
  message: string;
}

export async function generateCrawlReportPDF(): Promise<CrawlReportResult> {
  const state = useGlobalCrawlStore.getState();
  const crawlData: any[] = state.crawlData || [];
  const stats: any = state.finalCrawlStats || {};
  const robotsBlocked: string[] = state.robotsBlocked || [];
  // Populated by the backend's "robots" event during a domain crawl —
  // robots[0] is the raw robots.txt body fetched for the crawled domain.
  const robotsTxt: string = (state.robots && state.robots[0]) || "";

  if (!crawlData.length) {
    return {
      success: false,
      message: "No crawl data available yet. Run a crawl first.",
    };
  }

  const domain = domainFromUrl(crawlData[0]?.url);
  const generatedAt = new Date();
  const totalPages = stats.pages ?? crawlData.length;

  // Data that's only ever lazily fetched when the user opens a specific table
  // tab — fetch it fresh here so the report never depends on which tabs the
  // user happened to visit during/after the crawl.
  const [
    imagesRes,
    redirectsRes,
    internalLinksRes,
    externalLinksRes,
    keywordsRes,
    filesRes,
    hreflangRes,
    schemaTypesRes,
    duplicateContentRes,
    diffRes,
    pageInventoryRes,
  ] = await Promise.allSettled([
    invoke("get_aggregated_crawl_data_command", { dataType: "images" }),
    invoke("get_aggregated_crawl_data_command", { dataType: "redirects" }),
    invoke("get_links_page_command", {
      dataType: "internal_links",
      limit: 0,
      offset: 0,
    }),
    invoke("get_links_page_command", {
      dataType: "external_links",
      limit: 0,
      offset: 0,
    }),
    invoke("get_aggregated_crawl_data_command", { dataType: "keywords" }),
    invoke("get_aggregated_crawl_data_command", { dataType: "files" }),
    invoke("get_aggregated_crawl_data_command", { dataType: "hreflang" }),
    invoke("get_aggregated_crawl_data_command", { dataType: "schema_types" }),
    invoke("find_duplicate_content_command"),
    // Depends on the separate, opt-in Diff Checker feature's diff.db — most
    // crawls won't have this populated, so a rejection here just means the
    // section below renders its "not available" state, not a report failure.
    invoke("get_url_diff_command"),
    // Straight from SQLite, unlike crawlData (a JS-heap ring buffer capped at
    // max_urls_stored) — this is what keeps the Full Page Inventory section's
    // page count matching the app UI's crawl totals for large crawls.
    invoke("get_aggregated_crawl_data_command", { dataType: "page_inventory" }),
  ]);

  // RustySEO branding — icon glyph for the cover + per-page header,
  // wordmark for the cover only. Missing assets degrade gracefully.
  const [logoIcon, logoWordmark, homepageScreenshot] = await Promise.all([
    loadImageDataUrl("/icon.png"),
    loadImageDataUrl("/rustyLight.png"),
    fetchRootScreenshot(crawlData),
  ]);

  const images: any[] =
    imagesRes.status === "fulfilled" && Array.isArray(imagesRes.value)
      ? imagesRes.value
      : [];
  const redirects: any[] =
    redirectsRes.status === "fulfilled" && Array.isArray(redirectsRes.value)
      ? redirectsRes.value
      : [];
  const internalLinks: any[] =
    internalLinksRes.status === "fulfilled" &&
    Array.isArray(internalLinksRes.value)
      ? internalLinksRes.value
      : [];
  const externalLinks: any[] =
    externalLinksRes.status === "fulfilled" &&
    Array.isArray(externalLinksRes.value)
      ? externalLinksRes.value
      : [];
  const brokenLinks = [...internalLinks, ...externalLinks].filter(
    (l) => typeof l?.status === "number" && l.status >= 400,
  );
  const keywordsData: any[] =
    keywordsRes.status === "fulfilled" && Array.isArray(keywordsRes.value)
      ? keywordsRes.value
      : [];
  const filesData: any[] =
    filesRes.status === "fulfilled" && Array.isArray(filesRes.value)
      ? filesRes.value
      : [];
  const hreflangData: any[] =
    hreflangRes.status === "fulfilled" && Array.isArray(hreflangRes.value)
      ? hreflangRes.value
      : [];
  const schemaTypesData: any[] =
    schemaTypesRes.status === "fulfilled" && Array.isArray(schemaTypesRes.value)
      ? schemaTypesRes.value
      : [];
  const duplicateContent: { enabled: boolean; groups: any[] } =
    duplicateContentRes.status === "fulfilled" && duplicateContentRes.value
      ? (duplicateContentRes.value as any)
      : { enabled: false, groups: [] };
  const diffAnalysis: { added: any; removed: any } | null =
    diffRes.status === "fulfilled" && diffRes.value
      ? (diffRes.value as any)
      : null;
  // Falls back to the in-memory crawlData (and its possibly-capped count) only
  // if the DB fetch itself failed — not merely because it's empty.
  const pageInventory: any[] =
    pageInventoryRes.status === "fulfilled" &&
    Array.isArray(pageInventoryRes.value) &&
    pageInventoryRes.value.length
      ? pageInventoryRes.value
      : crawlData;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ---------------------------------------------------------------------
  // Cover page
  // ---------------------------------------------------------------------
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Logo lockup: icon glyph above the RustySEO wordmark, falls back to a
  // plain text label if either asset failed to load.
  let coverY = 32;
  if (logoIcon) {
    const iconH = 24;
    const iconW = iconH * (logoIcon.width / logoIcon.height);
    doc.addImage(
      logoIcon.dataUrl,
      "PNG",
      pageWidth / 2 - iconW / 2,
      coverY,
      iconW,
      iconH,
    );
    coverY += iconH + 8;
  }
  if (logoWordmark) {
    const wmW = 62;
    const wmH = wmW * (logoWordmark.height / logoWordmark.width);
    doc.addImage(
      logoWordmark.dataUrl,
      "PNG",
      pageWidth / 2 - wmW / 2,
      coverY,
      wmW,
      wmH,
    );
    coverY += wmH + 14;
  } else {
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("RUSTYSEO", pageWidth / 2, coverY + 6, { align: "center" });
    coverY += 20;
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("SEO Crawl Report", pageWidth / 2, coverY, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(15);
  doc.setTextColor(226, 232, 240);
  doc.text(domain, pageWidth / 2, coverY + 11, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated ${generatedAt.toLocaleDateString()} at ${generatedAt.toLocaleTimeString()}`,
    pageWidth / 2,
    coverY + 20,
    { align: "center" },
  );

  const highlightStats: [string, string | number][] = [
    ["Pages Crawled", totalPages],
    ["Indexable", stats.indexable_pages ?? "-"],
    ["Errors (4xx/5xx)", stats.errors ?? "-"],
    [
      "Avg Response",
      stats.avg_response_time != null ? `${stats.avg_response_time}ms` : "-",
    ],
  ];
  const boxWidth = 40;
  const boxGap = 6;
  const totalBoxWidth =
    highlightStats.length * boxWidth + (highlightStats.length - 1) * boxGap;
  let bx = pageWidth / 2 - totalBoxWidth / 2;
  const boxY = coverY + 40;
  highlightStats.forEach(([label, value]) => {
    doc.setFillColor(30, 41, 59); // slate-800
    doc.roundedRect(bx, boxY, boxWidth, 26, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(String(value), bx + boxWidth / 2, boxY + 12, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(label, bx + boxWidth / 2, boxY + 19, { align: "center" });
    bx += boxWidth + boxGap;
  });

  // Homepage preview — pulled from the Lighthouse "final-screenshot" audit
  // already captured for the root page during PSI analysis, if it ran for
  // this crawl. Skipped entirely (cover page unchanged) when unavailable.
  if (homepageScreenshot) {
    const sectionTop = boxY + 26 + 14;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("HOMEPAGE PREVIEW", pageWidth / 2, sectionTop, {
      align: "center",
    });
    doc.setFont("helvetica", "normal");

    const frameTop = sectionTop + 6;
    const maxImgW = 150;
    const maxImgH = Math.max(40, Math.min(82, pageHeight - 34 - frameTop));
    let imgW = maxImgW;
    let imgH = imgW * (homepageScreenshot.height / homepageScreenshot.width);
    if (imgH > maxImgH) {
      imgH = maxImgH;
      imgW = imgH * (homepageScreenshot.width / homepageScreenshot.height);
    }
    const imgX = pageWidth / 2 - imgW / 2;
    const framePad = 0.5;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(
      imgX - framePad,
      frameTop - framePad,
      imgW + framePad * 2,
      imgH + framePad * 2,
      1,
      1,
      "F",
    );
    doc.addImage(
      homepageScreenshot.dataUrl,
      "JPEG",
      imgX,
      frameTop,
      imgW,
      imgH,
    );
  }

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Full technical SEO, on-page, performance and issue analysis for the crawled domain.",
    pageWidth / 2,
    pageHeight - 20,
    { align: "center" },
  );

  // ---------------------------------------------------------------------
  // Executive summary
  // ---------------------------------------------------------------------
  doc.addPage();
  let y = 20;
  y = sectionTitle(doc, "Executive Summary", y);
  y = kvTable(doc, y, [
    ["Domain", domain],
    ["Pages Crawled", String(totalPages)],
    [
      "Indexable Pages",
      `${stats.indexable_pages ?? "-"} (${pct(stats.indexable_pages, totalPages)})`,
    ],
    [
      "Non-Indexable Pages",
      `${stats.not_indexable_pages ?? "-"} (${pct(stats.not_indexable_pages, totalPages)})`,
    ],
    ["Pages with Errors (4xx/5xx)", String(stats.errors ?? "-")],
    ["Max Crawl Depth", String(stats.max_crawl_depth ?? "-")],
    [
      "Avg Response Time",
      stats.avg_response_time != null ? `${stats.avg_response_time} ms` : "-",
    ],
    ["Avg Word Count", String(stats.avg_word_count ?? "-")],
    ["Avg Readability (Flesch)", String(stats.avg_readability ?? "-")],
    [
      "Avg Page Size",
      stats.avg_page_size_kb != null ? `${stats.avg_page_size_kb} KB` : "-",
    ],
  ]);

  // ---------------------------------------------------------------------
  // HTTP status breakdown
  // ---------------------------------------------------------------------
  y = ensureSpace(doc, y, 45);
  y = sectionTitle(doc, "HTTP Status Code Breakdown", y);
  y = dataTable(
    doc,
    y,
    [["Status Range", "Count", "% of Pages"]],
    [
      [
        "2xx — Success",
        stats.status_2xx ?? 0,
        pct(stats.status_2xx, totalPages),
      ],
      [
        "3xx — Redirects",
        stats.status_3xx ?? 0,
        pct(stats.status_3xx, totalPages),
      ],
      [
        "4xx — Client Errors",
        stats.status_4xx ?? 0,
        pct(stats.status_4xx, totalPages),
      ],
      [
        "5xx — Server Errors",
        stats.status_5xx ?? 0,
        pct(stats.status_5xx, totalPages),
      ],
    ],
  );

  // ---------------------------------------------------------------------
  // Technical SEO health
  // ---------------------------------------------------------------------
  y = ensureSpace(doc, y, 90);
  y = sectionTitle(doc, "Technical SEO Health", y);
  y = dataTable(
    doc,
    y,
    [["Metric", "Count", "% of Pages"]],
    [
      [
        "Missing Titles",
        stats.missing_title ?? 0,
        pct(stats.missing_title, totalPages),
      ],
      [
        "Missing Descriptions",
        stats.missing_description ?? 0,
        pct(stats.missing_description, totalPages),
      ],
      ["Missing H1", stats.missing_h1 ?? 0, pct(stats.missing_h1, totalPages)],
      [
        "Missing Canonical",
        stats.missing_canonical ?? 0,
        pct(stats.missing_canonical, totalPages),
      ],
      [
        "Duplicate Titles",
        stats.duplicate_titles ?? 0,
        pct(stats.duplicate_titles, totalPages),
      ],
      [
        "Duplicate Descriptions",
        stats.duplicate_descriptions ?? 0,
        pct(stats.duplicate_descriptions, totalPages),
      ],
      [
        "Thin Content (<300 words)",
        stats.thin_content_pages ?? 0,
        pct(stats.thin_content_pages, totalPages),
      ],
      [
        "Noindex Pages",
        stats.noindex_pages ?? 0,
        pct(stats.noindex_pages, totalPages),
      ],
      [
        "Blocked by Robots.txt",
        robotsBlocked.length,
        pct(robotsBlocked.length, totalPages),
      ],
      [
        "Redirected Pages",
        stats.total_redirects ?? 0,
        pct(stats.total_redirects, totalPages),
      ],
      [
        "Secure (HTTPS) Pages",
        stats.total_secure_pages ?? 0,
        pct(stats.total_secure_pages, totalPages),
      ],
      [
        "Pages with Schema Markup",
        stats.total_schema_pages ?? 0,
        pct(stats.total_schema_pages, totalPages),
      ],
      [
        "Mobile-Friendly Pages",
        stats.total_mobile_pages ?? 0,
        pct(stats.total_mobile_pages, totalPages),
      ],
      [
        "Pages with Mixed Content",
        stats.mixed_content_pages ?? 0,
        pct(stats.mixed_content_pages, totalPages),
      ],
      [
        "Pages Using Cookies",
        stats.cookies_pages ?? 0,
        pct(stats.cookies_pages, totalPages),
      ],
    ],
  );

  // ---------------------------------------------------------------------
  // Resource & link totals
  // ---------------------------------------------------------------------
  y = ensureSpace(doc, y, 55);
  y = sectionTitle(doc, "Resource & Link Totals", y);
  y = dataTable(
    doc,
    y,
    [["Resource", "Total"]],
    [
      ["Internal Links", stats.total_internal_links ?? 0],
      ["External Links", stats.total_external_links ?? 0],
      ["Total Links", stats.total_links ?? 0],
      ["Image References (site-wide)", stats.total_images ?? 0],
      ["Unique Images", images.length],
      ["External CSS Files", stats.total_css ?? 0],
      ["External JS Files", stats.total_javascript ?? 0],
    ],
  );

  // ---------------------------------------------------------------------
  // General tab overview — every breakdown widget from the sidebar's
  // "General" tab, reproduced category-by-category in the same order.
  // ---------------------------------------------------------------------
  doc.addPage();
  y = 20;
  y = sectionTitle(doc, "General Overview", y);
  y = subNote(
    doc,
    "The full breakdown shown in the app's General sidebar tab — one table per category, in the same order.",
    y,
  );
  const generalCategories = computeGeneralOverview(
    crawlData,
    state.finalCrawlStats,
  );
  for (const category of generalCategories) {
    y = ensureSpace(doc, y, 20 + category.rows.length * 5);
    y = sectionTitle(doc, category.title, y);
    y = dataTable(doc, y, [["Metric", "Value", "%"]], category.rows, {
      fontSize: 8,
      extra: {
        columnStyles: {
          1: { cellWidth: 30, halign: "right" },
          2: { cellWidth: 24, halign: "right" },
        },
      },
    });
  }

  // ---------------------------------------------------------------------
  // PageSpeed Insights scores
  // ---------------------------------------------------------------------
  const perfRows = crawlData.filter((p) => p.performance_score != null);
  if (perfRows.length) {
    doc.addPage();
    y = 20;
    y = sectionTitle(doc, "PageSpeed Insights — Average Scores", y);
    const avgPerf = average(
      crawlData
        .map((p) => psi100(p.performance_score))
        .filter((v) => v != null),
    );
    const avgAcc = average(
      crawlData
        .map((p) => psi100(p.accessibility_score))
        .filter((v) => v != null),
    );
    const avgBP = average(
      crawlData
        .map((p) => psi100(p.best_practices_score))
        .filter((v) => v != null),
    );
    const avgSEO = average(
      crawlData.map((p) => psi100(p.seo_score)).filter((v) => v != null),
    );
    y = dataTable(
      doc,
      y,
      [["Category", "Average Score (0-100)"]],
      [
        ["Performance", avgPerf != null ? Math.round(avgPerf) : "-"],
        ["Accessibility", avgAcc != null ? Math.round(avgAcc) : "-"],
        ["Best Practices", avgBP != null ? Math.round(avgBP) : "-"],
        ["SEO", avgSEO != null ? Math.round(avgSEO) : "-"],
      ],
    );

    const worst = [...perfRows]
      .sort((a, b) => (a.performance_score ?? 0) - (b.performance_score ?? 0))
      .slice(0, 20);
    y = ensureSpace(doc, y, 50);
    y = sectionTitle(doc, "Lowest Performance-Score Pages", y);
    y = dataTable(
      doc,
      y,
      [["URL", "Performance", "Accessibility", "Best Practices", "SEO"]],
      worst.map((p) => [
        truncate(p.url, 70),
        psi100(p.performance_score) ?? "-",
        psi100(p.accessibility_score) ?? "-",
        psi100(p.best_practices_score) ?? "-",
        psi100(p.seo_score) ?? "-",
      ]),
      { fontSize: 7.5 },
    );
  }

  // ---------------------------------------------------------------------
  // Images
  // ---------------------------------------------------------------------
  if (images.length) {
    doc.addPage();
    y = 20;
    y = sectionTitle(doc, "Images", y);
    const withAlt = images.filter(
      (i) => (i?.[1] || "").toString().trim() !== "",
    ).length;
    const withoutAlt = images.length - withAlt;
    const brokenImages = images.filter(
      (i) => typeof i?.[4] === "number" && i[4] >= 400,
    ).length;
    y = kvTable(doc, y, [
      ["Unique Images Found", String(images.length)],
      ["With Alt Text", `${withAlt} (${pct(withAlt, images.length)})`],
      ["Missing Alt Text", `${withoutAlt} (${pct(withoutAlt, images.length)})`],
      ["Broken Images (4xx/5xx)", String(brokenImages)],
    ]);

    const largest = [...images]
      .filter((i) => typeof i?.[2] === "number")
      .sort((a, b) => (b[2] ?? 0) - (a[2] ?? 0))
      .slice(0, 20);
    if (largest.length) {
      y = ensureSpace(doc, y, 50);
      y = sectionTitle(doc, "Largest Images", y);
      y = dataTable(
        doc,
        y,
        [["Image URL", "Size (KB)", "Type", "Alt Text"]],
        largest.map((i) => [
          truncate(i[0] || "", 65),
          i[2] != null ? Math.round(i[2] / 1024) : "-",
          i[3] || "-",
          i[1] ? "Yes" : "Missing",
        ]),
        { fontSize: 7.5 },
      );
    }
  }

  // ---------------------------------------------------------------------
  // Top Keywords — summed across every crawled page, not just what's in the
  // JS-heap crawlData, since this comes straight from a SQL aggregation.
  // ---------------------------------------------------------------------
  if (keywordsData.length) {
    doc.addPage();
    y = 20;
    y = sectionTitle(doc, "Top Keywords", y);
    const keywordTotals = new Map<
      string,
      { count: number; pages: Set<string> }
    >();
    for (const entry of keywordsData) {
      const kws = entry?.keywords;
      if (!Array.isArray(kws)) continue;
      for (const kw of kws) {
        const word = Array.isArray(kw) ? kw[0] : kw?.word;
        const count = Array.isArray(kw) ? kw[1] : kw?.count;
        if (!word) continue;
        const rec = keywordTotals.get(word) || {
          count: 0,
          pages: new Set<string>(),
        };
        rec.count += Number(count) || 0;
        if (entry?.url) rec.pages.add(entry.url);
        keywordTotals.set(word, rec);
      }
    }
    const topKeywords = [...keywordTotals.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, TOP_KEYWORDS_CAP);
    if (topKeywords.length) {
      y = subNote(
        doc,
        `The ${topKeywords.length} most frequent keywords across all crawled pages.`,
        y,
      );
      y = dataTable(
        doc,
        y,
        [["Keyword", "Total Occurrences", "Pages Found On"]],
        topKeywords.map(([word, rec]) => [
          word,
          String(rec.count),
          String(rec.pages.size),
        ]),
        {
          fontSize: 8,
          extra: {
            columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
          },
        },
      );
    } else {
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("No keyword data available for this crawl.", MARGIN, y);
      doc.setTextColor(0, 0, 0);
    }
  }

  // ---------------------------------------------------------------------
  // Files Found — linked non-HTML resources (PDFs, docs, archives, etc.)
  // ---------------------------------------------------------------------
  if (filesData.length) {
    doc.addPage();
    y = 20;
    y = sectionTitle(doc, "Files Found", y);
    y = subNote(
      doc,
      `${filesData.length} linked file(s) detected (PDFs, documents, archives, etc.) across all crawled pages.`,
      y,
    );
    y = dataTable(
      doc,
      y,
      [["File URL", "Found On", "Status"]],
      filesData
        .slice(0, APPENDIX_ROW_CAP)
        .map((f: any) => [
          truncate(f.url || "", 60),
          truncate(f.found_at || "", 50),
          f.status ?? "-",
        ]),
      { fontSize: 7 },
    );
    if (filesData.length > APPENDIX_ROW_CAP) {
      y = subNote(doc, `…and ${filesData.length - APPENDIX_ROW_CAP} more.`, y);
    }
  }

  // ---------------------------------------------------------------------
  // Schema Types — what kind of structured data is actually deployed,
  // rather than just a with/without count.
  // ---------------------------------------------------------------------
  if (schemaTypesData.length) {
    doc.addPage();
    y = 20;
    y = sectionTitle(doc, "Schema Types", y);
    const schemaTypeCounts = new Map<string, number>();
    for (const entry of schemaTypesData) {
      const uniqueTypesOnPage = new Set(
        extractSchemaTypes(entry?.schema || ""),
      );
      for (const t of uniqueTypesOnPage) {
        schemaTypeCounts.set(t, (schemaTypeCounts.get(t) || 0) + 1);
      }
    }
    const schemaTypeRows = [...schemaTypeCounts.entries()].sort(
      (a, b) => b[1] - a[1],
    );
    if (schemaTypeRows.length) {
      y = subNote(
        doc,
        `${schemaTypesData.length} page(s) carry structured data; breakdown by schema.org @type below (a page can use more than one type).`,
        y,
      );
      y = dataTable(
        doc,
        y,
        [["Schema Type", "Pages Using It"]],
        schemaTypeRows.map(([type, count]) => [type, String(count)]),
        { fontSize: 8, extra: { columnStyles: { 1: { halign: "right" } } } },
      );
    } else {
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "Structured data was found but its JSON-LD could not be parsed for type analysis.",
        MARGIN,
        y,
      );
      doc.setTextColor(0, 0, 0);
    }
  }

  // ---------------------------------------------------------------------
  // Hreflang Analysis
  // ---------------------------------------------------------------------
  if (hreflangData.length) {
    doc.addPage();
    y = 20;
    y = sectionTitle(doc, "Hreflang Analysis", y);
    const crawledUrlSet = new Set(crawlData.map((p) => p.url));
    const codeCounts = new Map<string, number>();
    let missingSelfRef = 0;
    let danglingReferences = 0;
    for (const entry of hreflangData) {
      const tags = Array.isArray(entry?.hreflangs) ? entry.hreflangs : [];
      let hasSelfRef = false;
      for (const tag of tags) {
        const code = tag?.code;
        const target = tag?.url;
        if (code) codeCounts.set(code, (codeCounts.get(code) || 0) + 1);
        if (target && target === entry.url) hasSelfRef = true;
        if (target && !crawledUrlSet.has(target)) danglingReferences++;
      }
      if (!hasSelfRef) missingSelfRef++;
    }
    y = kvTable(doc, y, [
      ["Pages With Hreflang Tags", String(hreflangData.length)],
      ["Distinct Hreflang Codes", String(codeCounts.size)],
      ["Pages Missing Self-Referencing Hreflang", String(missingSelfRef)],
      ["References to URLs Outside This Crawl", String(danglingReferences)],
    ]);
    const codeRows = [...codeCounts.entries()].sort((a, b) => b[1] - a[1]);
    if (codeRows.length) {
      y = ensureSpace(doc, y, 30);
      y = dataTable(
        doc,
        y,
        [["Hreflang Code", "Pages Using It"]],
        codeRows.map(([code, count]) => [code, String(count)]),
        { fontSize: 8, extra: { columnStyles: { 1: { halign: "right" } } } },
      );
    }
  }

  // ---------------------------------------------------------------------
  // Broken links
  // ---------------------------------------------------------------------
  doc.addPage();
  y = 20;
  y = sectionTitle(doc, "Broken Links", y);
  if (!brokenLinks.length) {
    doc.setFontSize(10);
    doc.setTextColor(21, 128, 61);
    doc.text("No broken links (4xx/5xx) were found in the crawl.", MARGIN, y);
    doc.setTextColor(0, 0, 0);
    y += 10;
  } else {
    y = subNote(
      doc,
      `${brokenLinks.length} broken link(s) found. Showing the first ${Math.min(
        brokenLinks.length,
        APPENDIX_ROW_CAP,
      )}.`,
      y,
    );
    y = dataTable(
      doc,
      y,
      [["Source Page", "Broken URL", "Status", "Anchor Text"]],
      brokenLinks
        .slice(0, APPENDIX_ROW_CAP)
        .map((l) => [
          truncate(l.page || "", 45),
          truncate(l.url || "", 45),
          l.status ?? "-",
          truncate(l.anchor_text || "-", 25),
        ]),
      { fontSize: 7, headColor: DANGER_COLOR },
    );
  }

  // ---------------------------------------------------------------------
  // Redirects
  // ---------------------------------------------------------------------
  doc.addPage();
  y = 20;
  y = sectionTitle(doc, "Redirects", y);
  if (!redirects.length) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("No redirects were found in the crawl.", MARGIN, y);
    doc.setTextColor(0, 0, 0);
    y += 10;
  } else {
    y = subNote(
      doc,
      `${redirects.length} redirect(s) found. Showing the first ${Math.min(
        redirects.length,
        APPENDIX_ROW_CAP,
      )}.`,
      y,
    );
    y = dataTable(
      doc,
      y,
      [["Original URL", "Redirects To", "Type", "Status"]],
      // `url` on this record is already the *final* (post-redirect)
      // destination — the backend sets it to final_url and mirrors that same
      // value into `redirect_url`. The actual pre-redirect origin is kept
      // separately in `original_url`. Using `r.url` for "Original URL" here
      // previously showed the destination in both columns.
      redirects
        .slice(0, APPENDIX_ROW_CAP)
        .map((r) => [
          truncate(r.original_url || r.url || "", 55),
          truncate(r.redirect_url || r.url || "-", 55),
          r.redirection_type || "-",
          r.status_code ?? "-",
        ]),
      { fontSize: 7 },
    );
  }

  // ---------------------------------------------------------------------
  // Robots.txt
  // ---------------------------------------------------------------------
  doc.addPage();
  y = 20;
  y = sectionTitle(doc, "Robots.txt", y);
  if (!robotsTxt) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "No robots.txt was found (or fetched) for this domain.",
      MARGIN,
      y,
    );
    doc.setTextColor(0, 0, 0);
    y += 10;
  } else {
    y = subNote(
      doc,
      `Fetched from the crawled domain's /robots.txt.${
        robotsBlocked.length
          ? ` ${robotsBlocked.length} URL(s) were blocked by its rules during this crawl.`
          : ""
      }`,
      y,
    );

    const usableWidth = pageWidth - MARGIN * 2;
    let robotsLines = doc.splitTextToSize(robotsTxt, usableWidth);
    const truncated = robotsLines.length > ROBOTS_TXT_LINE_CAP;
    if (truncated) {
      robotsLines = robotsLines.slice(0, ROBOTS_TXT_LINE_CAP);
    }

    y = ensureSpace(doc, y, 12);
    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    const lineHeight = 3.4;
    for (const line of robotsLines) {
      if (y + lineHeight > pageHeight - 18) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, MARGIN, y);
      y += lineHeight;
    }
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    y += 4;

    if (truncated) {
      y = ensureSpace(doc, y, 10);
      y = subNote(doc, `…truncated after ${ROBOTS_TXT_LINE_CAP} lines.`, y);
    }
  }

  // ---------------------------------------------------------------------
  // Duplicate Content — exact duplicate H1-H3 structure, and near-duplicate
  // body content clustered by SimHash. Only populated when "Duplicated
  // Content Check" was enabled in Settings > Crawler at crawl time.
  // ---------------------------------------------------------------------
  doc.addPage();
  y = 20;
  y = sectionTitle(doc, "Duplicate Content", y);
  if (!duplicateContent.enabled) {
    y = subNote(
      doc,
      "Duplicate Content Check was not enabled for this crawl (Settings → Crawler), so no fingerprint data is available to analyze.",
      y,
    );
  } else if (!duplicateContent.groups.length) {
    doc.setFontSize(10);
    doc.setTextColor(21, 128, 61);
    doc.text(
      "No duplicate or near-duplicate content clusters were found.",
      MARGIN,
      y,
    );
    doc.setTextColor(0, 0, 0);
    y += 10;
  } else {
    const groups = duplicateContent.groups.slice(0, DUPLICATE_GROUP_CAP);
    y = subNote(
      doc,
      `${duplicateContent.groups.length} duplicate cluster(s) found (exact heading matches and near-duplicate body content).${
        duplicateContent.groups.length > DUPLICATE_GROUP_CAP
          ? ` Showing the first ${DUPLICATE_GROUP_CAP}.`
          : ""
      }`,
      y,
    );
    for (const group of groups) {
      y = ensureSpace(doc, y, 30);
      const kindLabel =
        group.kind === "headings"
          ? "Duplicate Headings"
          : "Near-Duplicate Content";
      y = sectionTitle(
        doc,
        `${kindLabel} — ${group.similarity}% similarity (${group.pages.length} pages)`,
        y,
      );
      y = dataTable(
        doc,
        y,
        [["URL", "Title", "Word Count"]],
        group.pages.map((p: any) => [
          truncate(p.url, 60),
          truncate(p.title || "-", 40),
          String(p.word_count ?? "-"),
        ]),
        { fontSize: 7.5 },
      );
    }
  }

  // ---------------------------------------------------------------------
  // Issues detected
  // ---------------------------------------------------------------------
  doc.addPage();
  y = 20;
  y = sectionTitle(doc, "Issues Detected", y);

  const priorityOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
  const issueResults = ISSUE_REGISTRY.map((def) => {
    let matches: any[] = [];
    try {
      matches = def.detect(crawlData, robotsBlocked) || [];
    } catch {
      matches = [];
    }
    return { ...def, matches };
  })
    .filter((r) => r.matches.length > 0)
    .sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.matches.length - a.matches.length;
    });

  if (!issueResults.length) {
    doc.setFontSize(10);
    doc.setTextColor(21, 128, 61);
    doc.text("No issues detected across the crawled pages.", MARGIN, y);
    doc.setTextColor(0, 0, 0);
    y += 10;
  } else {
    y = dataTable(
      doc,
      y,
      [["Issue", "Priority", "Affected Pages", "% of Crawl"]],
      issueResults.map((r) => [
        r.name,
        r.priority,
        r.matches.length,
        pct(r.matches.length, totalPages),
      ]),
      {
        headColor: DANGER_COLOR,
        extra: {
          columnStyles: {
            1: { cellWidth: 24 },
            2: { cellWidth: 30, halign: "right" },
            3: { cellWidth: 28, halign: "right" },
          },
          didParseCell: (data: any) => {
            if (data.section === "body" && data.column.index === 1) {
              const p = data.cell.raw;
              if (p === "High") data.cell.styles.textColor = [185, 28, 28];
              else if (p === "Medium")
                data.cell.styles.textColor = [161, 98, 7];
              else data.cell.styles.textColor = [21, 128, 61];
            }
          },
        },
      },
    );

    // Affected-URL appendix for high-priority issues only (kept separate from
    // the "Recommended Improvements" section below, which covers the how-to
    // guidance for every detected issue — nothing here duplicates that text).
    const highPriorityIssues = issueResults.filter(
      (r) => r.priority === "High",
    );
    for (const issue of highPriorityIssues) {
      y = ensureSpace(doc, y, 35);
      y = sectionTitle(doc, `${issue.name} (${issue.matches.length})`, y);
      y = dataTable(
        doc,
        y,
        [["Affected URL"]],
        issue.matches
          .slice(0, ISSUE_APPENDIX_ROW_CAP)
          .map((p: any) => [truncate(p.url, 110)]),
        { theme: "plain", fontSize: 7.5 },
      );
      if (issue.matches.length > ISSUE_APPENDIX_ROW_CAP) {
        y = subNote(
          doc,
          `…and ${issue.matches.length - ISSUE_APPENDIX_ROW_CAP} more.`,
          y,
        );
      }
    }

    // -------------------------------------------------------------------
    // Recommended Improvements — the "Understanding the issue" / "How to
    // improve" / "Learn more" guidance shown in the app's Issue Explorer
    // Fixes panel, for every issue actually detected in this crawl. This is
    // the detailed explanation text; it intentionally does not repeat the
    // affected-URL lists or the issue summary table above.
    // -------------------------------------------------------------------
    doc.addPage();
    y = 20;
    y = sectionTitle(doc, "Recommended Improvements", y);
    y = subNote(
      doc,
      "Guidance for every issue detected in this crawl, in the same order as the summary table above.",
      y,
    );

    for (const issue of issueResults) {
      const detail = FixesData.find((f) => f.title === issue.name);
      y = ensureSpace(doc, y, 45);
      y = sectionTitle(doc, `${issue.name} (${issue.matches.length} pages)`, y);

      if (detail) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...BRAND_COLOR);
        doc.text("UNDERSTANDING THE ISSUE", MARGIN, y);
        doc.setFont("helvetica", "normal");
        y += 4.5;
        y = subNote(doc, detail.description, y);

        y = ensureSpace(doc, y, 20);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(5, 150, 105);
        doc.text("HOW TO IMPROVE", MARGIN, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        y += 4.5;
        y = subNote(doc, detail.fixes, y);

        if (detail.links?.length) {
          doc.setFontSize(8);
          for (const link of detail.links) {
            y = ensureSpace(doc, y, 8);
            doc.setTextColor(37, 99, 235);
            doc.textWithLink(truncate(link, 95), MARGIN, y, { url: link });
            y += 4.5;
          }
          doc.setTextColor(0, 0, 0);
        }
        y += 4;
      } else {
        y = subNote(doc, `Recommended fix: ${issue.recommendedFix}`, y);
      }
    }
  }

  // ---------------------------------------------------------------------
  // Crawl Comparison — relies on the separate, opt-in Diff Checker feature's
  // saved current_crawl/previous_crawl snapshots. Most crawls won't have this
  // populated, which is expected and handled below, not an error state.
  // ---------------------------------------------------------------------
  doc.addPage();
  y = 20;
  y = sectionTitle(doc, "Crawl Comparison", y);
  if (!diffAnalysis) {
    y = subNote(
      doc,
      "No crawl comparison available. Use the app's Diff Checker tool to snapshot this crawl, then compare it against a future crawl to see what changed.",
      y,
    );
  } else {
    const added = (diffAnalysis as any).added;
    const removed = (diffAnalysis as any).removed;
    y = kvTable(doc, y, [
      ["New Pages", String(added?.number_of_pages ?? 0)],
      ["Removed Pages", String(removed?.number_of_pages ?? 0)],
    ]);
    if (added?.pages?.length) {
      y = ensureSpace(doc, y, 30);
      y = sectionTitle(doc, `New Pages (${added.pages.length})`, y);
      y = dataTable(
        doc,
        y,
        [["URL"]],
        added.pages
          .slice(0, APPENDIX_ROW_CAP)
          .map((u: string) => [truncate(u, 110)]),
        { theme: "plain", fontSize: 7.5 },
      );
      if (added.pages.length > APPENDIX_ROW_CAP) {
        y = subNote(
          doc,
          `…and ${added.pages.length - APPENDIX_ROW_CAP} more.`,
          y,
        );
      }
    }
    if (removed?.pages?.length) {
      y = ensureSpace(doc, y, 30);
      y = sectionTitle(doc, `Removed Pages (${removed.pages.length})`, y);
      y = dataTable(
        doc,
        y,
        [["URL"]],
        removed.pages
          .slice(0, APPENDIX_ROW_CAP)
          .map((u: string) => [truncate(u, 110)]),
        { theme: "plain", fontSize: 7.5 },
      );
      if (removed.pages.length > APPENDIX_ROW_CAP) {
        y = subNote(
          doc,
          `…and ${removed.pages.length - APPENDIX_ROW_CAP} more.`,
          y,
        );
      }
    }
    if (!added?.pages?.length && !removed?.pages?.length) {
      y = subNote(
        doc,
        "No differences detected between the current and previous crawl snapshots.",
        y,
      );
    }
  }

  // ---------------------------------------------------------------------
  // Full page inventory
  // ---------------------------------------------------------------------
  doc.addPage();
  y = 20;
  y = sectionTitle(
    doc,
    `Full Page Inventory (${pageInventory.length} pages)`,
    y,
  );
  if (pageInventory.length > FULL_INVENTORY_ROW_CAP) {
    y = subNote(
      doc,
      `This PDF lists the first ${FULL_INVENTORY_ROW_CAP} of ${pageInventory.length} crawled pages to keep the file readable. ` +
        `For the exhaustive list, export the individual tables from the app (Tables view — each column supports its own CSV/Excel export).`,
      y,
    );
  }
  // Handles two possible row shapes: the compact DB-sourced "page_inventory"
  // rows (title_len/desc_len/h1_count/has_canonical, already flattened) used
  // whenever available, or the in-memory crawlData (LightCrawlResult) shape
  // used only as a fallback if that fetch failed.
  const toInventoryRow = (p: any): (string | number)[] => {
    const isDbRow =
      typeof p?.title_len === "number" || typeof p?.has_canonical === "boolean";
    if (isDbRow) {
      return [
        truncate(p.url || "", 60),
        p.status_code ?? "-",
        String(p.title_len ?? 0),
        String(p.desc_len ?? 0),
        String(p.h1_count ?? 0),
        String(p.word_count ?? 0),
        (p.indexability ?? 0) >= 0.5 ? "Yes" : "No",
        p.has_canonical ? "Yes" : "No",
      ];
    }
    return [
      truncate(p.url || "", 60),
      p.status_code ?? "-",
      String(safeTitleLen(p)),
      String(p.description?.length ?? 0),
      String(p.headings?.h1?.length ?? 0),
      String(p.word_count ?? 0),
      (p.indexability?.indexability ?? 0) >= 0.5 ? "Yes" : "No",
      p.canonicals?.length ? "Yes" : "No",
    ];
  };
  dataTable(
    doc,
    y,
    [
      [
        "URL",
        "Status",
        "Title (chars)",
        "Desc (chars)",
        "H1s",
        "Words",
        "Indexable",
        "Canonical",
      ],
    ],
    pageInventory.slice(0, FULL_INVENTORY_ROW_CAP).map(toInventoryRow),
    { fontSize: 6.5 },
  );

  // ---------------------------------------------------------------------
  // Header + footer on every page except the cover
  // ---------------------------------------------------------------------
  const totalDocPages = doc.internal.getNumberOfPages();
  const headerIconH = 4.5;
  const headerIconW = logoIcon
    ? headerIconH * (logoIcon.width / logoIcon.height)
    : 0;
  const headerRowTopY = 5.5;
  // Center the icon and the text on the same row using jsPDF's "middle"
  // text baseline, instead of eyeballing a text y that lines up with a
  // top-anchored image — the two were drawn against different reference
  // points before (image top vs. text baseline), so they never lined up.
  const headerRowCenterY = headerRowTopY + headerIconH / 2;
  for (let i = 2; i <= totalDocPages; i++) {
    doc.setPage(i);
    if (logoIcon) {
      doc.addImage(
        logoIcon.dataUrl,
        "PNG",
        MARGIN,
        headerRowTopY,
        headerIconW,
        headerIconH,
      );
    }
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `SEO Crawl Report — ${domain}`,
      MARGIN + (logoIcon ? headerIconW + 2.5 : 0),
      headerRowCenterY,
      { baseline: "middle" },
    );
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, 12, pageWidth - MARGIN, 12);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(generatedAt.toLocaleDateString(), MARGIN, pageHeight - 10);
    doc.text(
      `Page ${i - 1} of ${totalDocPages - 1}`,
      pageWidth - MARGIN,
      pageHeight - 10,
      {
        align: "right",
      },
    );
  }

  const safeDomain = domain.replace(/[^a-z0-9.-]/gi, "_");
  const filename = `SEO-Crawl-Report-${safeDomain}-${generatedAt.toISOString().slice(0, 10)}.pdf`;

  try {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeFile } = await import("@tauri-apps/plugin-fs");
    const path = await save({
      defaultPath: filename,
      filters: [{ name: "PDF Files", extensions: ["pdf"] }],
    });
    if (!path) {
      return { success: false, message: "Export cancelled." };
    }
    const pdfBytes = doc.output("arraybuffer");
    await writeFile(path, new Uint8Array(pdfBytes));
    return { success: true, message: `Report saved to ${path}` };
  } catch (error) {
    console.error(
      "Failed to save PDF via Tauri dialog, falling back to browser download:",
      error,
    );
    doc.save(filename);
    return { success: true, message: "Report downloaded." };
  }
}
