export interface CSVRow {
  [key: string]: any;
}

export const generateCSV = (data: CSVRow[], filename?: string): string => {
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

export const downloadCSV = (
  csvContent: string,
  filename: string = "data.csv",
): void => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    throw new Error("Your browser does not support downloading files");
  }
};

export const exportToCSV = (data: CSVRow[], filename?: string): void => {
  try {
    const csvContent = generateCSV(data);
    const timestamp = new Date().toISOString().split("T")[0];
    const finalFilename = filename
      ? `${filename}_${timestamp}.csv`
      : `export_${timestamp}.csv`;
    downloadCSV(csvContent, finalFilename);
  } catch (error) {
    console.error("Error exporting CSV:", error);
    throw error;
  }
};
