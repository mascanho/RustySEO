// @ts-nocheck
import { message, save } from "@/lib/tauri-compat";
import { writeTextFile } from "@/lib/tauri-compat";

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
    "Desktop Performance",
    "Mobile Performance",
    "Desktop Speed Index",
    "Mobile Speed Index",
    "Desktop LCP",
    "Mobile LCP",
    "Desktop CLS",
    "Mobile CLS",
    "Desktop FCP",
    "Mobile FCP",
    "Desktop Interactive",
    "Mobile Interactive",
    "Redirects",
    "Server Response Time",
    "Total Blocking Time",
    "DOM Size",
  ];

  // Process data into CSV rows
  const csvData = data.map((row: any, index: number) => {
    return [
      // Index (0)
      index + 1,

      // URL (1)
      `"${(row?.url || "").replace(/"/g, '""')}"`,

      // Desktop Performance (2)
      row?.psi_results?.Ok?.[0]?.categories?.performance?.score ?? "n/a",

      // Mobile Performance (3)
      row?.psi_results?.Ok?.[1]?.categories?.performance?.score ?? "n/a",

      // Desktop Speed Index (4)
      row?.psi_results?.Ok?.[0]?.audits?.["speed-index"]?.score ?? "n/a",

      // Mobile Speed Index (5)
      row?.psi_results?.Ok?.[1]?.audits?.["speed-index"]?.score ?? "n/a",

      // Desktop LCP (6)
      row?.psi_results?.Ok?.[0]?.audits?.["largest-contentful-paint"]?.score ??
        "n/a",

      // Mobile LCP (7)
      row?.psi_results?.Ok?.[1]?.audits?.["largest-contentful-paint"]?.score ??
        "n/a",

      // Desktop CLS (8)
      row?.psi_results?.Ok?.[0]?.audits?.["cumulative-layout-shift"]?.score ??
        "n/a",

      // Mobile CLS (9)
      row?.psi_results?.Ok?.[1]?.audits?.["cumulative-layout-shift"]?.score ??
        "n/a",

      // Desktop FCP (10)
      row?.psi_results?.Ok?.[0]?.audits?.["first-contentful-paint"]?.score ??
        "n/a",

      // Mobile FCP (11)
      row?.psi_results?.Ok?.[1]?.audits?.["first-contentful-paint"]?.score ??
        "n/a",

      // Desktop Interactive (12)
      row?.psi_results?.Ok?.[0]?.audits?.["interactive"]?.score ?? "n/a",

      // Mobile Interactive (13)
      row?.psi_results?.Ok?.[1]?.audits?.["interactive"]?.score ?? "n/a",

      // Redirects (14)
      row?.psi_results?.Ok?.[0]?.audits?.["redirects"]?.score ?? "n/a",

      // Server Response Time (15)
      row?.psi_results?.Ok?.[0]?.audits?.["server-response-time"]?.numericValue
        ? `${row.psi_results.Ok[0].audits["server-response-time"].numericValue} ms`
        : "n/a",

      // Total Blocking Time (16)
      row?.psi_results?.Ok?.[0]?.audits?.["total-blocking-time"]?.numericValue
        ? `${row.psi_results.Ok[0].audits["total-blocking-time"].numericValue.toFixed(0)} ms`
        : "n/a",

      // DOM Size (17)
      row?.psi_results?.Ok?.[0]?.audits?.["dom-size"]?.numericValue ?? "n/a",
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
