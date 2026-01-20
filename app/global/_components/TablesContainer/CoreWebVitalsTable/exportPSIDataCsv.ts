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

    const getAuditValue = (audit: any) => {
      if (!audit) return "n/a";
      return `"${(audit.displayValue || (audit.numericValue !== undefined ? audit.numericValue.toFixed(2) : "n/a")).replace(/"/g, '""')}"`;
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
      getAuditValue(mobile?.audits?.["speed-index"]),
      getAuditValue(desktop?.audits?.["speed-index"]),
      getAuditValue(mobile?.audits?.["largest-contentful-paint"]),
      getAuditValue(desktop?.audits?.["largest-contentful-paint"]),
      getAuditValue(mobile?.audits?.["cumulative-layout-shift"]),
      getAuditValue(desktop?.audits?.["cumulative-layout-shift"]),
      getAuditValue(mobile?.audits?.["first-contentful-paint"]),
      getAuditValue(desktop?.audits?.["first-contentful-paint"]),
      getAuditValue(mobile?.audits?.["interactive"]),
      getAuditValue(desktop?.audits?.["interactive"]),
      getAuditValue(mobile?.audits?.["total-blocking-time"]),
      getAuditValue(desktop?.audits?.["total-blocking-time"]),
      formatScore(mobile?.audits?.["redirects"]?.score),
      getAuditValue(mobile?.audits?.["server-response-time"]),
      getAuditValue(desktop?.audits?.["server-response-time"]),
      getAuditValue(mobile?.audits?.["dom-size-insight"] || mobile?.audits?.["dom-size"]),
      getAuditValue(mobile?.audits?.["total-byte-weight"]),
      getAuditValue(desktop?.audits?.["total-byte-weight"]),
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
