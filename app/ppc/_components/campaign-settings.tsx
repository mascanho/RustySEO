// @ts-nocheck
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
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
                    <Label>Daily Budget</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                        <Input
                            type="number"
                            value={ad.budget}
                            onChange={(e) => onChange({ budget: parseFloat(e.target.value) || 0 })}
                            className="pl-7 h-9 text-xs"
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground">The average amount you want to spend each day.</p>
                </div>

                <div className="space-y-2">
                    <Label>Bidding Strategy</Label>
                    <Select
                        value={ad.biddingStrategy}
                        onValueChange={(val) => onChange({ biddingStrategy: val as BiddingStrategy })}
                    >
                        <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select strategy" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="maximize_clicks">Maximize Clicks</SelectItem>
                            <SelectItem value="maximize_conversions">Maximize Conversions</SelectItem>
                            <SelectItem value="manual_cpc">Manual CPC</SelectItem>
                            <SelectItem value="target_roas">Target ROAS</SelectItem>
                            <SelectItem value="target_cpa">Target CPA</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t dark:border-white/5">
                <div className="space-y-2">
                    <Label>Location Targeting (comma separated)</Label>
                    <Input
                        value={(ad.locations || []).join(", ")}
                        onChange={(e) => onChange({ locations: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                        placeholder="e.g. United States, London, Tokyo"
                        className="h-9 text-xs"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Languages (comma separated)</Label>
                    <Input
                        value={(ad.languages || []).join(", ")}
                        onChange={(e) => onChange({ languages: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                        placeholder="e.g. English, Spanish, French"
                        className="h-9 text-xs"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-white/5">
                <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                        type="date"
                        value={ad.startDate || ""}
                        onChange={(e) => onChange({ startDate: e.target.value })}
                        className="h-9 text-xs"
                    />
                </div>
                <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                        type="date"
                        value={ad.endDate || ""}
                        onChange={(e) => onChange({ endDate: e.target.value })}
                        className="h-9 text-xs"
                    />
                </div>
            </div>
        </div>
    );
}
