// @ts-nocheck
"use client";

import type { Ad, BiddingStrategy } from "@/types/ad";

interface CampaignSettingsProps {
    ad: Ad;
    onChange: (updates: Partial<Ad>) => void;
}

export function CampaignSettings({ ad, onChange }: CampaignSettingsProps) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-200">Daily Budget</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                        <input
                            type="number"
                            value={ad.budget}
                            onChange={(e) => onChange({ budget: parseFloat(e.target.value) || 0 })}
                            className="w-full pl-7 pr-3 h-9 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-brand-darker focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                        />
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">The average amount you want to spend each day.</p>
                </div>

                <div className="space-y-2 flex flex-col">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-200">Bidding Strategy</label>
                    <select
                        value={ad.biddingStrategy}
                        onChange={(e) => onChange({ biddingStrategy: e.target.value as BiddingStrategy })}
                        className="w-full px-3 h-9 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-brand-darker focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium appearance-none cursor-pointer text-gray-900 dark:text-gray-100"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 12px center',
                            backgroundSize: '16px'
                        }}
                    >
                        <option value="maximize_clicks">Maximize Clicks</option>
                        <option value="maximize_conversions">Maximize Conversions</option>
                        <option value="manual_cpc">Manual CPC</option>
                        <option value="target_roas">Target ROAS</option>
                        <option value="target_cpa">Target CPA</option>
                    </select>
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-200">Location Targeting</label>
                    <input
                        value={(ad.locations || []).join(", ")}
                        onChange={(e) => onChange({ locations: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                        placeholder="e.g. United States, London, Tokyo"
                        className="w-full px-3 h-9 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-brand-darker focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium placeholder:text-gray-400 text-gray-900 dark:text-gray-100"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-200">Languages</label>
                    <input
                        value={(ad.languages || []).join(", ")}
                        onChange={(e) => onChange({ languages: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                        placeholder="e.g. English, Spanish, French"
                        className="w-full px-3 h-9 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-brand-darker focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium placeholder:text-gray-400 text-gray-900 dark:text-gray-100"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-200">Start Date</label>
                    <input
                        type="date"
                        value={ad.startDate || ""}
                        onChange={(e) => onChange({ startDate: e.target.value })}
                        className="w-full px-3 h-9 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-brand-darker focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-gray-900 dark:text-gray-100"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-200">End Date</label>
                    <input
                        type="date"
                        value={ad.endDate || ""}
                        onChange={(e) => onChange({ endDate: e.target.value })}
                        className="w-full px-3 h-9 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-brand-darker focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-gray-900 dark:text-gray-100"
                    />
                </div>
            </div>
        </div>
    );
}
