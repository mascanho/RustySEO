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
import { Globe, Timer, RotateCcw } from "lucide-react";

interface Props {
    settings: AppSettings;
    onUpdate: (key: string, value: any) => void;
}

const NetworkSection = ({ settings, onUpdate }: Props) => (
    <div className="space-y-0.5">
        <SectionHeader
            title="Request / Network"
            icon={<Globe className="w-3.5 h-3.5" />}
        />

        <SettingField
            label="Request Timeout"
            description="Individual HTTP request timeout"
        >
            <NumberInput
                value={settings.client_timeout}
                onChange={(v) => onUpdate("client_timeout", v)}
                min={5}
                max={300}
                unit="s"
            />
        </SettingField>

        <SettingField
            label="Connect Timeout"
            description="Connection establishment timeout"
        >
            <NumberInput
                value={settings.client_connect_timeout}
                onChange={(v) => onUpdate("client_connect_timeout", v)}
                min={1}
                max={120}
                unit="s"
            />
        </SettingField>

        <SettingField
            label="Max Redirects"
            description="Number of redirects to follow"
        >
            <NumberInput
                value={settings.redirect_policy}
                onChange={(v) => onUpdate("redirect_policy", v)}
                min={0}
                max={20}
            />
        </SettingField>

        <SettingField
            label="Max Retries"
            description="Retries for failed requests"
        >
            <NumberInput
                value={settings.max_retries}
                onChange={(v) => onUpdate("max_retries", v)}
                min={0}
                max={20}
            />
        </SettingField>

        <SectionHeader
            title="JavaScript & Rendering"
            icon={<Timer className="w-3.5 h-3.5" />}
        />

        <SettingField
            label="Expect HTML"
            description="Expect HTML content type"
        >
            <ToggleSwitch
                checked={settings.html}
                onChange={(v) => onUpdate("html", v)}
            />
        </SettingField>

        <SettingField
            label="JS Rendering"
            description="Use headless Chrome for JS pages"
        >
            <ToggleSwitch
                checked={settings.javascript_rendering}
                onChange={(v) => onUpdate("javascript_rendering", v)}
            />
        </SettingField>

        <SettingField
            label="JS Concurrency"
            description="Headless Chrome concurrency"
        >
            <NumberInput
                value={settings.javascript_concurrency}
                onChange={(v) => onUpdate("javascript_concurrency", v)}
                min={1}
                max={20}
            />
        </SettingField>
    </div>
);

export default NetworkSection;
