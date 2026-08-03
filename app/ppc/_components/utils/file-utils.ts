// @ts-nocheck
import type { Ad, Sitelink } from "@/types/ad";

// ---------------------------------------------------------------------------
// Ads import / export utilities
// ---------------------------------------------------------------------------
// A single, schema-complete source of truth for turning the full `Ad` model to
// and from JSON / CSV. Both formats round-trip losslessly and every importer
// normalises unknown / legacy input into a valid Ad so the editor never breaks.

// Fixed column order keeps CSV exports stable and re-importable.
const CSV_COLUMNS = [
  "id",
  "name",
  "status",
  "type",
  "headlines",
  "descriptions",
  "finalUrl",
  "displayPath",
  "businessName",
  "keywords",
  "locations",
  "languages",
  "sitelinks",
  "images",
  "logos",
  "extensions",
  "budget",
  "currency",
  "biddingStrategy",
  "targetCPA",
  "targetROAS",
  "startDate",
  "endDate",
] as const;

// Plain string-array columns are stored newline-separated inside the cell so
// they stay editable in a spreadsheet.
const STRING_ARRAY_FIELDS = [
  "headlines",
  "descriptions",
  "keywords",
  "locations",
  "languages",
];
// Object-array columns are JSON-encoded so they round-trip losslessly.
const JSON_FIELDS = ["sitelinks", "images", "logos", "extensions"];
const NUMBER_FIELDS = ["budget", "targetCPA", "targetROAS"];

let idCounter = 0;
const genId = () =>
  `ad-${Date.now().toString(36)}-${(idCounter++).toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;

// -------------------------- value coercion helpers -------------------------

const asStringArray = (value: unknown): string[] => {
  if (Array.isArray(value))
    return value.map((v) => String(v)).filter((v) => v.length > 0);
  if (typeof value === "string" && value.trim())
    return value
      .split(/\r?\n/)
      .map((v) => v.trim())
      .filter(Boolean);
  return [];
};

const asObjectArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
};

const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (!Number.isNaN(n)) return n;
  }
  return fallback;
};

const asOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const n = asNumber(value, NaN);
  return Number.isNaN(n) ? undefined : n;
};

// Coerce any partial / legacy record into a complete, valid Ad. Missing fields
// receive sensible defaults so an imported file can never leave the editor in a
// half-initialised state.
export function normalizeAd(raw: any): Ad {
  const src = raw && typeof raw === "object" ? raw : {};
  return {
    id: src.id ? String(src.id) : genId(),
    name: src.name ? String(src.name) : "Imported Ad",
    status: ["enabled", "paused", "removed"].includes(src.status)
      ? src.status
      : "enabled",
    type: ["search", "pmax", "display"].includes(src.type)
      ? src.type
      : "search",
    headlines: asStringArray(src.headlines),
    descriptions: asStringArray(src.descriptions),
    finalUrl: src.finalUrl ? String(src.finalUrl) : "",
    displayPath: src.displayPath ? String(src.displayPath) : "",
    businessName: src.businessName ? String(src.businessName) : "",
    keywords: asStringArray(src.keywords),
    locations: asStringArray(src.locations),
    languages: asStringArray(src.languages),
    sitelinks: asObjectArray<Sitelink>(src.sitelinks),
    images: asObjectArray(src.images),
    logos: asObjectArray(src.logos),
    extensions: asObjectArray(src.extensions),
    budget: asNumber(src.budget, 0),
    currency: src.currency ? String(src.currency) : "USD",
    biddingStrategy: src.biddingStrategy || "manual_cpc",
    targetCPA: asOptionalNumber(src.targetCPA),
    targetROAS: asOptionalNumber(src.targetROAS),
    startDate: src.startDate ? String(src.startDate) : undefined,
    endDate: src.endDate ? String(src.endDate) : undefined,
  };
}

// -------------------------------- JSON -------------------------------------

export interface AdsExport {
  app: string;
  kind: "rustyseo-ads";
  version: number;
  exportedAt: string;
  count: number;
  ads: Ad[];
}

export function adsToJson(ads: Ad[]): string {
  const payload: AdsExport = {
    app: "RustySEO PPC Simulator",
    kind: "rustyseo-ads",
    version: 1,
    exportedAt: new Date().toISOString(),
    count: ads.length,
    ads,
  };
  return JSON.stringify(payload, null, 2);
}

export function jsonToAds(jsonString: string): Ad[] {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    throw new Error(`File is not valid JSON: ${(e as Error).message}`);
  }

  // Accept a bare array (legacy exports) or the wrapped { ads: [...] } payload.
  const list = Array.isArray(parsed)
    ? parsed
    : parsed && Array.isArray(parsed.ads)
      ? parsed.ads
      : null;

  if (!list) {
    throw new Error(
      'Unrecognised JSON structure: expected an array of ads or an object with an "ads" array.',
    );
  }

  const ads = list
    .filter((item) => item && typeof item === "object")
    .map(normalizeAd);

  if (ads.length === 0) throw new Error("No ads found in the JSON file.");
  return ads;
}

// --------------------------------- CSV -------------------------------------

const escapeCsv = (value: string): string =>
  `"${String(value).replace(/"/g, '""')}"`;

const serializeCell = (ad: Ad, col: string): string => {
  const value = (ad as any)[col];
  if (STRING_ARRAY_FIELDS.includes(col)) {
    return escapeCsv(Array.isArray(value) ? value.join("\n") : "");
  }
  if (JSON_FIELDS.includes(col)) {
    return escapeCsv(
      Array.isArray(value) && value.length ? JSON.stringify(value) : "",
    );
  }
  if (NUMBER_FIELDS.includes(col)) {
    return value === undefined || value === null ? "" : String(value);
  }
  return escapeCsv(value === undefined || value === null ? "" : String(value));
};

export function adsToCsv(ads: Ad[]): string {
  const header = CSV_COLUMNS.join(",");
  const rows = ads.map((ad) =>
    CSV_COLUMNS.map((col) => serializeCell(ad, col)).join(","),
  );
  return [header, ...rows].join("\n");
}

// RFC-4180-style parser: handles quoted fields, escaped quotes ("") and
// newlines embedded inside quoted cells.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const char = src[i];
    if (inQuotes) {
      if (char === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  // Flush any trailing field / row.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function csvToAds(csvString: string): Ad[] {
  const rows = parseCsv(csvString).filter(
    (r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ""),
  );
  if (rows.length < 2) throw new Error("CSV has no data rows.");

  const headers = rows[0].map((h) => h.trim());
  const idx = (name: string) => headers.indexOf(name);

  // Require the essential columns.
  if (idx("name") === -1 || idx("headlines") === -1) {
    throw new Error(
      'CSV is missing required columns (at least "name" and "headlines").',
    );
  }

  const get = (row: string[], name: string) => {
    const i = idx(name);
    return i === -1 ? "" : (row[i] ?? "");
  };

  const ads: Ad[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const record: any = {};
    for (const col of CSV_COLUMNS) {
      if (idx(col) === -1) continue;
      const cell = get(row, col);
      if (STRING_ARRAY_FIELDS.includes(col)) {
        record[col] = cell
          ? cell
              .split(/\n/)
              .map((v) => v.trim())
              .filter(Boolean)
          : [];
      } else {
        // JSON_FIELDS and scalars are passed through; normalizeAd coerces them.
        record[col] = cell;
      }
    }
    ads.push(normalizeAd(record));
  }

  if (ads.length === 0) throw new Error("No valid ads found in CSV.");
  return ads;
}

// Browser download helper (web fallback when the Tauri fs API is unavailable).
export function downloadFile(
  content: string,
  filename: string,
  contentType: string,
) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
