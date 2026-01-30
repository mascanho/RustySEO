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

  // Define headers (must match tableLayout.ts headerTitles exactly)
  const headers = [
    "ID", // 0
    "URL", // 1
    "Page Title", // 2
    "Title Size", // 3
    "Description", // 4
    "Desc. Size", // 5
    "H1", // 6
    "H1 Size", // 7
    "H2", // 8
    "H2 Size", // 9
    "Status Code", // 10
    "Word Count", // 11
    "Text Ratio", // 12
    "Flesch Score", // 13
    "Flesch Grade", // 14
    "Mobile", // 15
    "Meta Robots", // 16
    "Content Type", // 17
    "Indexability", // 18
    "Language", // 19
    "Schema", // 20
    "Depth", // 21
    "Opengraph", // 22
    "Cookies", // 23
  ];

  // Debug: Log first item structure and check for depth
  console.log("First data item structure:", data[0]);
  console.log(
    "Does first item have url_depth?",
    data[0]?.hasOwnProperty("url_depth"),
  );
  console.log("url_depth value:", data[0]?.url_depth);

  // Process data into CSV rows
  const csvData = data.map((item: any, index: number) => {
    // Helper function to safely get nested values
    const getValue = (...path: string[]) => {
      return path.reduce(
        (obj, key) => (obj && obj[key] !== undefined ? obj[key] : null),
        item,
      );
    };

    return [
      // ID (0)
      (index + 1).toString(),

      // URL (1)
      `"${(item.url || "").replace(/"/g, '""')}"`,

      // Page Title (2)
      `"${(getValue("title", "0", "title") || "").replace(/"/g, '""')}"`,

      // Title Size (3)
      String((getValue("title", "0", "title") || "").length),

      // Description (4)
      `"${(item.description || "").replace(/"/g, '""')}"`,

      // Desc. Size (5)
      String(item.description?.length || ""),

      // H1 (6)
      `"${(getValue("headings", "h1", "0") || "").replace(/"/g, '""')}"`,

      // H1 Size (7)
      String((getValue("headings", "h1", "0") || "").length),

      // H2 (8)
      `"${(getValue("headings", "h2", "0") || "").replace(/"/g, '""')}"`,

      // H2 Size (9)
      String((getValue("headings", "h2", "0") || "").length),

      // Status Code (10)
      item.status_code?.toString() || "",

      // Word Count (11)
      item.word_count?.toString() || "",

      // Text Ratio (12)
      getValue("text_ratio", "0", "text_ratio")?.toFixed(1) || "",

      // Flesch Score (13)
      getValue("flesch", "Ok", "0")?.toFixed(1) || "",

      // Flesch Grade (14)
      `"${(getValue("flesch", "Ok", "1") || "").replace(/"/g, '""')}"`,

      // Mobile (15)
      item.mobile ? "Yes" : "No",

      // Meta Robots (16)
      `"${(
        getValue("meta_robots", "meta_robots")
          ?.filter((x) => typeof x === "string")
          ?.join(", ") || ""
      ).replace(/"/g, '""')}"`,

      // Content Type (17)
      `"${(item.content_type || "").replace(/"/g, '""')}"`,

      // Indexability (18)
      item.indexability?.indexability > 0.5 ? "Indexable" : "Not Indexable",

      // Language (19)
      `"${(item.language || "").replace(/"/g, '""')}"`,

      // Schema (20)
      item.schema ? "Yes" : "No",

      // Depth (21)
      item.url_depth?.toString() || "",

      // Opengraph (22)
      item.opengraph?.["og:image"] ? "Yes" : "No",

      // Cookies (23)
      (Array.isArray(item.cookies?.Ok) ? item.cookies.Ok.length : (Array.isArray(item.cookies) ? item.cookies.length : 0)).toString(),
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
