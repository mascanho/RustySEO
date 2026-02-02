// @ts-nocheck
import { message, save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

export const exportFilesDataCSV = async (data) => {
    if (!data?.length) {
        await message("No data to export", {
            title: "Export Error",
            type: "error",
        });
        return;
    }

    const headers = ["ID", "URL", "FileType", "Found At"];

    const csvData = data.map((item: any) => {
        return [
            item.id?.toString() || "",
            `"${(item.url || "").replace(/"/g, '""')}"`,
            `"${(item.filetype || "").replace(/"/g, '""')}"`,
            `"${(item.found_at || "").replace(/"/g, '""')}"`,
        ];
    });

    const csvContent = [
        headers.join(","),
        ...csvData.map((row) => row.join(",")),
    ].join("\n");

    try {
        const filePath = await save({
            defaultPath: `RustySEO - Files Export - ${new Date().toISOString().slice(0, 10)}.csv`,
            filters: [
                {
                    name: "CSV",
                    extensions: ["csv"],
                },
            ],
        });

        if (filePath) {
            await writeTextFile(filePath, csvContent);
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
