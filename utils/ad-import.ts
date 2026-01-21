import type { Ad, AdType, BiddingStrategy } from "@/types/ad";

export async function importAdsFromCSV(file: File): Promise<Partial<Ad>[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split("\n");
                if (lines.length < 2) return resolve([]);

                const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ''));
                const ads: Partial<Ad>[] = [];

                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;

                    // Basic CSV parsing (handles quotes)
                    const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
                    const ad: any = {
                        id: Math.random().toString(36).substring(7),
                    };

                    headers.forEach((header, index) => {
                        const val = values[index]?.replace(/"/g, '') || "";

                        switch (header.toLowerCase()) {
                            case "campaign": ad.name = val; break;
                            case "ad type": ad.type = val.toLowerCase() as AdType; break;
                            case "status": ad.status = val.toLowerCase() as any; break;
                            case "headline 1":
                            case "headline 2":
                            case "headline 3":
                                if (!ad.headlines) ad.headlines = [];
                                if (val) ad.headlines.push(val);
                                break;
                            case "description 1":
                            case "description 2":
                                if (!ad.descriptions) ad.descriptions = [];
                                if (val) ad.descriptions.push(val);
                                break;
                            case "final url": ad.finalUrl = val; break;
                            case "display path 1": ad.displayPath = val; break;
                            case "business name": ad.businessName = val; break;
                            case "budget": ad.budget = parseFloat(val) || 0; break;
                            case "bidding strategy": ad.biddingStrategy = val.toLowerCase() as BiddingStrategy; break;
                            case "keywords": ad.keywords = val.split(";").filter(Boolean); break;
                            case "locations": ad.locations = val.split(";").filter(Boolean); break;
                        }
                    });

                    if (ad.name || ad.headlines?.length) {
                        ads.push(ad);
                    }
                }
                resolve(ads);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}
