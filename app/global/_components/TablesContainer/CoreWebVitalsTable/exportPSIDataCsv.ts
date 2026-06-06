// @ts-nocheck
import { message, save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

export const exportPSIDataCSV = async (data) => {
  if (!data?.length) {
    await message("No PageSpeed Insights data to export", {
      title: "Export Error",
      type: "error",
    });
    return;
  }

  // Define headers matching your table columns
  const headers = [
    "#",
    "URL",
    "Perf (M)",
    "Perf (D)",
    "Acc (M)",
    "Acc (D)",
    "BP (M)",
    "BP (D)",
    "SEO (M)",
    "SEO (D)",
    "Speed Index (M)",
    "Speed Index (D)",
    "LCP (M)",
    "LCP (D)",
    "CLS (M)",
    "CLS (D)",
    "FCP (M)",
    "FCP (D)",
    "Interactive (M)",
    "Interactive (D)",
    "TBT (M)",
    "TBT (D)",
    "Redirects",
    "TTFB (M)",
    "TTFB (D)",
    "DOM Nodes",
    "Byte Weight (M)",
    "Byte Weight (D)",
  ];

  // Process data into CSV rows
  const csvData = data.map((row: any, index: number) => {
    const mobile = row?.psi_results?.Ok?.[0];
    const desktop = row?.psi_results?.Ok?.[1];

    const formatScore = (score: any) => {
      if (score === null || score === undefined) return "n/a";
      return (Math.round(score * 100)).toString();
    };

    const formatAudit = (audit: any) => {
      if (!audit) return "n/a";
      const numVal = Number(audit.numericValue);
      const valStr = audit.displayValue || (!isNaN(numVal) ? numVal.toFixed(2) : "n/a");
      return `"${valStr.replace(/"/g, '""')}"`;
    };

    return [
      index + 1,
      `"${(row?.url || "").replace(/"/g, '""')}"`,
      formatScore(mobile?.categories?.performance?.score),
      formatScore(desktop?.categories?.performance?.score),
      formatScore(mobile?.categories?.accessibility?.score),
      formatScore(desktop?.categories?.accessibility?.score),
      formatScore(mobile?.categories?.["best-practices"]?.score),
      formatScore(desktop?.categories?.["best-practices"]?.score),
      formatScore(mobile?.categories?.seo?.score),
      formatScore(desktop?.categories?.seo?.score),
      formatAudit(mobile?.audits?.["speed-index"]),
      formatAudit(desktop?.audits?.["speed-index"]),
      formatAudit(mobile?.audits?.["largest-contentful-paint"]),
      formatAudit(desktop?.audits?.["largest-contentful-paint"]),
      formatAudit(mobile?.audits?.["cumulative-layout-shift"]),
      formatAudit(desktop?.audits?.["cumulative-layout-shift"]),
      formatAudit(mobile?.audits?.["first-contentful-paint"]),
      formatAudit(desktop?.audits?.["first-contentful-paint"]),
      formatAudit(mobile?.audits?.["interactive"]),
      formatAudit(desktop?.audits?.["interactive"]),
      formatAudit(mobile?.audits?.["total-blocking-time"]),
      formatAudit(desktop?.audits?.["total-blocking-time"]),
      formatScore(mobile?.audits?.["redirects"]?.score),
      formatAudit(mobile?.audits?.["server-response-time"]),
      formatAudit(desktop?.audits?.["server-response-time"]),
      formatAudit(mobile?.audits?.["dom-size-insight"] || mobile?.audits?.["dom-size"]),
      formatAudit(mobile?.audits?.["total-byte-weight"]),
      formatAudit(desktop?.audits?.["total-byte-weight"]),
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
      defaultPath: `RustySEO - PSI Export - ${new Date().toISOString().slice(0, 10)}.csv`,
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
      await message("PageSpeed Insights data exported successfully!", {
        title: "Export Complete",
        type: "info",
      });
    }
  } catch (error) {
    console.error("PSI Export failed:", error);
    await message(`Failed to export PSI data: ${error}`, {
      title: "Export Error",
      type: "error",
    });
  }
};
