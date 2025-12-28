// @ts-nocheck
import { message, save } from "@/lib/tauri-compat";
import { writeTextFile } from "@/lib/tauri-compat";

export const exportLinksCSV = async (data) => {
  if (!data?.length) {
    await message("No link data to export", {
      title: "Export Error",
      type: "error",
    });
    return;
  }

  // Define headers matching your table columns
  const headers = [
    "#",
    "Anchor Text",
    "Rel",
    "Link",
    "Title",
    "Target",
    "Status",
    "Page",
  ];

  // Helper function to safely prepare CSV values
  const prepareValue = (value: any) => {
    if (value === null || value === undefined) return "";
    const stringValue =
      typeof value === "number" ? value.toString() : String(value);
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  // Process data into CSV rows
  const csvData = data.map((row: any, index: number) => {
    return [
      // Index (0)
      index + 1,

      // Anchor Text (1)
      prepareValue(row?.anchor),

      // Rel (2)
      prepareValue(row?.rel),

      // Link (3)
      prepareValue(row?.link),

      // Title (4)
      prepareValue(row?.title),

      // Target (5)
      prepareValue(row?.target),

      // Status (6)
      prepareValue(row?.status),

      // Page (7)
      prepareValue(row?.page),
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
      defaultPath: `RustySEO - Links Export - ${new Date().toISOString().slice(0, 10)}.csv`,
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
      await message("Links data exported successfully!", {
        title: "Export Complete",
        type: "info",
      });
    }
  } catch (error) {
    console.error("Links export failed:", error);
    await message(`Failed to export links data: ${error}`, {
      title: "Export Error",
      type: "error",
    });
  }
};
