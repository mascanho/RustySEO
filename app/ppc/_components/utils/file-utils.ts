// @ts-nocheck
import type { Ad, Sitelink } from "@/types/ad";

// Convert ads to JSON string
export function adsToJson(ads: Ad[]): string {
  return JSON.stringify(ads, null, 2);
}

// Parse JSON string to ads
export function jsonToAds(jsonString: string): Ad[] {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      throw new Error("Invalid JSON format: expected an array");
    }

    // Validate each ad
    return parsed.map((item) => {
      if (
        !item.id ||
        !item.name ||
        !Array.isArray(item.headlines) ||
        !Array.isArray(item.descriptions)
      ) {
        throw new Error("Invalid ad format in JSON");
      }
      return {
        id: item.id,
        name: item.name,
        type: item.type || "search", // Default to search if type is missing
        headlines: Array.isArray(item.headlines) ? item.headlines : [],
        descriptions: Array.isArray(item.descriptions) ? item.descriptions : [],
        keywords: Array.isArray(item.keywords) ? item.keywords : [],
        finalUrl: item.finalUrl || "",
        displayPath: item.displayPath || "",
        sitelinks: Array.isArray(item.sitelinks) ? item.sitelinks : [],
      };
    });
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${(error as Error).message}`);
  }
}

// Convert ads to CSV string
export function adsToCsv(ads: Ad[]): string {
  // Create CSV header
  const header =
    "id,name,type,headlines,descriptions,keywords,finalUrl,displayPath,sitelinks";

  // Create CSV rows
  const rows = ads.map((ad) => {
    const headlines = `"${ad.headlines.join("|")}"`; // Join with pipe and wrap in quotes
    const descriptions = `"${ad.descriptions.join("|")}"`;
    const keywords = `"${ad.keywords.join("|")}"`;

    // Format sitelinks as JSON string inside CSV
    const sitelinks =
      ad.sitelinks && ad.sitelinks.length > 0
        ? `"${JSON.stringify(ad.sitelinks).replace(/"/g, '""')}"`
        : '""';

    return [
      ad.id,
      `"${ad.name.replace(/"/g, '""')}"`, // Escape quotes in CSV
      ad.type || "search",
      headlines,
      descriptions,
      keywords,
      `"${ad.finalUrl}"`,
      `"${ad.displayPath}"`,
      sitelinks,
    ].join(",");
  });

  return [header, ...rows].join("\n");
}

// Parse CSV string to ads
export function csvToAds(csvString: string): Ad[] {
  const lines = csvString.split("\n");
  if (lines.length < 2) {
    throw new Error("Invalid CSV format: no data rows found");
  }

  const header = lines[0].toLowerCase();
  if (
    !header.includes("id") ||
    !header.includes("name") ||
    !header.includes("headlines")
  ) {
    throw new Error("Invalid CSV format: missing required columns");
  }

  const ads: Ad[] = [];

  // Process each data row
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines

    // Parse CSV row (handling quoted values with commas inside)
    const values: string[] = [];
    let currentValue = "";
    let insideQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        values.push(currentValue);
        currentValue = "";
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue); // Add the last value

    // Remove quotes from values
    const cleanValues = values.map((v) => {
      if (v.startsWith('"') && v.endsWith('"')) {
        return v.substring(1, v.length - 1).replace(/""/g, '"');
      }
      return v;
    });

    // Parse sitelinks if available
    let sitelinks: Sitelink[] = [];
    if (cleanValues.length > 8 && cleanValues[8]) {
      try {
        sitelinks = JSON.parse(cleanValues[8]);
      } catch (e) {
        // If sitelinks can't be parsed, use empty array
        console.error("Error parsing sitelinks:", e);
      }
    }

    // Create ad object
    try {
      const ad: Ad = {
        id: cleanValues[0] || String(Date.now()),
        name: cleanValues[1] || "Imported Ad",
        type: (cleanValues[2] as any) || "search", // Default to search if type is missing
        headlines: cleanValues[3] ? cleanValues[3].split("|") : [""],
        descriptions: cleanValues[4] ? cleanValues[4].split("|") : [""],
        keywords: cleanValues[5] ? cleanValues[5].split("|") : [],
        finalUrl: cleanValues[6] || "",
        displayPath: cleanValues[7] || "",
        sitelinks: sitelinks,
      };
      ads.push(ad);
    } catch (error) {
      console.error(`Error parsing row ${i}:`, error);
      // Continue with other rows
    }
  }

  if (ads.length === 0) {
    throw new Error("No valid ads found in CSV");
  }

  return ads;
}

// Download file helper
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
