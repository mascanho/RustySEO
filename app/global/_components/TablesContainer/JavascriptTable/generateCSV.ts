// @ts-nocheck
import { message, save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

export const exportJsDataCSV = async (data) => {
    if (!data?.length) {
        await message("No data to export", {
            title: "Export Error",
            type: "error",
        });
        return;
    }

    // Define headers matching the Javascript table (ID, URL)
    const headers = ["ID", "URL"];

    // Process data into CSV rows
    const csvData = data.map((item: any, index: number) => {
        return [
            (index + 1).toString(),
            `"${(item.url || "").replace(/"/g, '""')}"`,
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
            defaultPath: `RustySEO - Javascript Export - ${new Date().toISOString().slice(0, 10)}.csv`,
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
