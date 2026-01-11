import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

export interface CSVRow {
  [key: string]: any;
}

export const generateCSV = (data: CSVRow[]): string => {
  if (!data || data.length === 0) {
    throw new Error("No data available to export");
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(","),
    // Data rows
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle values that might contain commas or quotes
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? "";
        })
        .join(","),
    ),
  ].join("\n");

  return csvContent;
};

export const exportToCSV = async (
  data: CSVRow[],
  filename?: string,
): Promise<void> => {
  try {
    const csvContent = generateCSV(data);
    const timestamp = new Date().toISOString().split("T")[0];
    const defaultFileName = filename
      ? `${filename}_${timestamp}.csv`
      : `export_${timestamp}.csv`;

    // Use Tauri's save dialog
    const filePath = await save({
      filters: [
        {
          name: "CSV File",
          extensions: ["csv"],
        },
      ],
      defaultPath: defaultFileName,
    });

    if (filePath) {
      // Convert string to Uint8Array for Tauri's file system API
      const encoder = new TextEncoder();
      const uint8Array = encoder.encode(csvContent);
      await writeFile(filePath, uint8Array);
    } else {
      console.log("User canceled save dialog.");
      throw new Error("Save dialog was cancelled");
    }
  } catch (error) {
    console.error("Error exporting CSV:", error);
    throw error;
  }
};
