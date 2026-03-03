// @ts-nocheck
"use client";

import React from "react";
import { AppSettings } from "../useSettings";
import {
    SettingField,
    NumberInput,
    ToggleSwitch,
    SectionHeader,
} from "../fields/SettingFields";
import { Plug, BarChart3 } from "lucide-react";

interface Props {
    settings: AppSettings;
    onUpdate: (key: string, value: any) => void;
}

const IntegrationsSection = ({ settings, onUpdate }: Props) => (
    <div className="space-y-0.5">
        <SectionHeader
            title="PageSpeed Insights"
            icon={<Plug className="w-3.5 h-3.5" />}
        />

        <SettingField
            label="Bulk PageSpeed"
            description="Fetch PSI data for all crawled pages"
        >
            <ToggleSwitch
                checked={settings.page_speed_bulk}
                onChange={(v) => onUpdate("page_speed_bulk", v)}
            />
        </SettingField>

        <SectionHeader
            title="Google Search Console"
            icon={<BarChart3 className="w-3.5 h-3.5" />}
        />

        <SettingField
            label="GSC Row Limit"
            description="Max rows fetched from Search Console"
        >
            <NumberInput
                value={settings.gsc_row_limit}
                onChange={(v) => onUpdate("gsc_row_limit", v)}
                min={100}
                max={100000}
            />
        </SettingField>
    </div>
);

export default IntegrationsSection;
