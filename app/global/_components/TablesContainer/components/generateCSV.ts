// @ts-nocheck
import { message, save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

export const exportSEODataCSV = async (data) => {
  if (!data?.length) {
    await message("No data to export", {
      title: "Export Error",
      type: "error",
    });
    return;
  }

  // Define headers (same as your Excel version)
  const headers = [
    "URL",
    "Page Title",
    "Page Title Length",
    "Description",
    "Description Length",
    "H1",
    "H1 Length",
    "H2",
    "H2 Length",
    "Status Code",
    "Word Count",
    "Indexability",
    "Schema",
    "Canonicals",
    "Flesch Score",
    "Flesch Readability",
    "Keywords",
    "Language",
    "Meta Robots",
    "Mobile",
    "Page Size (KB)",
    "Response Time (s)",
    "Text Ratio (%)",
  ];

  // Process data into CSV rows
  const csvData = data.map((item: any) => {
    // Helper function to safely get nested values
    const getValue = (...path: string[]) => {
      return path.reduce(
        (obj, key) => (obj && obj[key] !== undefined ? obj[key] : null),
        item,
      );
    };

    return [
      // URL (0)
      `"${(item.url || "").replace(/"/g, '""')}"`,

      // Page Title (1)
      `"${(getValue("title", "0", "title") || "").replace(/"/g, '""')}"`,

      // Page Title Length (2)
      String((getValue("title", "0", "title") || "").length),

      // Description (3)
      `"${(item.description || "").replace(/"/g, '""')}"`,

      // Description Length (4)
      String(item.description?.length || ""),

      // H1 (5)
      `"${(getValue("headings", "h1", "0") || "").replace(/"/g, '""')}"`,

      // H1 Length (6)
      String((getValue("headings", "h1", "0") || "").length),

      // H2 (7)
      `"${(getValue("headings", "h2", "0") || "").replace(/"/g, '""')}"`,

      // H2 Length (8)
      String((getValue("headings", "h2", "0") || "").length),

      // Status Code (9)
      item.status_code?.toString() || "",

      // Word Count (10)
      item.word_count?.toString() || "",

      // Indexability (11)
      `"${(getValue("indexability", "indexability_reason") || "Unknown").replace(/"/g, '""')}"`,

      // Schema (12)
      item.schema === null ? "no" : item.schema ? "yes" : "no",

      // Canonicals (13)
      `"${(Array.isArray(item.canonicals)
        ? item.canonicals.filter((x) => typeof x === "string").join(", ")
        : ""
      ).replace(/"/g, '""')}"`,

      // Flesch Score (14)
      getValue("flesch", "Ok", "0")?.toString() || "",

      // Flesch Readability (15)
      `"${(getValue("flesch", "Ok", "1") || "").replace(/"/g, '""')}"`,

      // Keywords (16)
      `"${(Array.isArray(item.keywords)
        ? item.keywords
            .filter((kw) => Array.isArray(kw) && kw[0])
            .map((kw) => kw[0])
            .join(", ")
        : ""
      ).replace(/"/g, '""')}"`,

      // Language (17)
      `"${(item.language || "").replace(/"/g, '""')}"`,

      // Meta Robots (18)
      `"${(
        getValue("meta_robots", "meta_robots")
          ?.filter((x) => typeof x === "string")
          ?.join(", ") || ""
      ).replace(/"/g, '""')}"`,

      // Mobile (19)
      typeof item.mobile === "boolean" ? String(item.mobile) : "",

      // Page Size (KB) (20)
      getValue("page_size", "0", "kb")?.toString() || "",

      // Response Time (21)
      item.response_time?.toString() || "",

      // Text Ratio (22)
      getValue("text_ratio", "0", "text_ratio")?.toString() || "",
    ];
  });

  // Create CSV content
  const csvContent = [
    headers.join(","),
    ...csvData.map((row) => row.join(",")),
  ].join("\n");

  try {
    // Ask user for save location
    const filePath = await save({
      defaultPath: `RustySEO - Full Export - ${new Date().toISOString().slice(0, 10)}.csv`,
      filters: [
        {
          name: "CSV",
          extensions: ["csv"],
        },
      ],
    });

    if (filePath) {
      await writeTextFile(filePath, csvContent);

      // Show success message
      await message("CSV file saved successfully!", {
        title: "Export Complete",
        type: "info",
      });
    }
  } catch (error) {
    console.error("Export failed:", error);
    await message(`Failed to export CSV: ${error}`, {
      title: "Export Error",
      type: "error",
    });
  }
};
