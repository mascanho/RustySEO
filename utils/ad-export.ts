import type { Ad } from "@/types/ad";

export function exportAdsToCSV(ads: Ad[]) {
    // Google Ads Editor CSV Headers (simplified for this demo)
    const headers = [
        "Campaign",
        "Ad Group",
        "Ad Type",
        "Status",
        "Headline 1",
        "Headline 2",
        "Headline 3",
        "Description 1",
        "Description 2",
        "Final URL",
        "Display Path 1",
        "Business Name",
        "Budget",
        "Bidding Strategy",
        "Locations",
        "Keywords"
    ];

    const rows = ads.map(ad => [
        ad.name || "Default Campaign",
        "Ad Group 1",
        ad.type.toUpperCase(),
        ad.status?.toUpperCase() || "ENABLED",
        ad.headlines[0] || "",
        ad.headlines[1] || "",
        ad.headlines[2] || "",
        ad.descriptions[0] || "",
        ad.descriptions[1] || "",
        ad.finalUrl || "",
        ad.displayPath || "",
        ad.businessName || "",
        ad.budget || 0,
        ad.biddingStrategy || "MAXIMIZE_CLICKS",
        (ad.locations || []).join(";"),
        (ad.keywords || []).join(";")
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `google_ads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
