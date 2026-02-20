// @ts-nocheck
"use client";

import React from "react";
import { AppSettings } from "../useSettings";
import {
    SettingField,
    NumberInput,
    SectionHeader,
} from "../fields/SettingFields";
import { Link2, Zap } from "lucide-react";

interface Props {
    settings: AppSettings;
    onUpdate: (key: string, value: any) => void;
}

const LinksSection = ({ settings, onUpdate }: Props) => (
    <div className="space-y-0.5">
        <SectionHeader
            title="Link Processor"
            icon={<Link2 className="w-3.5 h-3.5" />}
        />

        <SettingField
            label="Max Concurrent Checks"
            description="Parallel link status checks"
        >
            <NumberInput
                value={settings.links_max_concurrent_requests}
                onChange={(v) => onUpdate("links_max_concurrent_requests", v)}
                min={1}
                max={50}
            />
        </SettingField>

        <SettingField
            label="Initial Task Capacity"
            description="Pre-allocated task slots"
        >
            <NumberInput
                value={settings.links_initial_task_capacity}
                onChange={(v) => onUpdate("links_initial_task_capacity", v)}
                min={10}
                max={1000}
            />
        </SettingField>

        <SettingField
            label="Max Retries"
            description="Retry attempts for link checks"
        >
            <NumberInput
                value={settings.links_max_retries}
                onChange={(v) => onUpdate("links_max_retries", v)}
                min={0}
                max={10}
            />
        </SettingField>

        <SettingField
            label="Retry Delay"
            description="Delay between retries"
        >
            <NumberInput
                value={settings.links_retry_delay}
                onChange={(v) => onUpdate("links_retry_delay", v)}
                min={0}
                max={30000}
                unit="ms"
            />
        </SettingField>

        <SettingField
            label="Request Timeout"
            description="Per-link request timeout"
        >
            <NumberInput
                value={settings.links_request_timeout}
                onChange={(v) => onUpdate("links_request_timeout", v)}
                min={1}
                max={120}
                unit="s"
            />
        </SettingField>

        <SettingField
            label="Jitter Factor"
            description="Randomized delay factor (0.0-1.0)"
        >
            <NumberInput
                value={settings.links_jitter_factor}
                onChange={(v) => onUpdate("links_jitter_factor", v)}
                min={0}
                max={1}
                step={0.05}
                width="w-[80px]"
            />
        </SettingField>

        <SettingField
            label="Pool Idle Timeout"
            description="Connection pool idle timeout"
        >
            <NumberInput
                value={settings.links_pool_idle_timeout}
                onChange={(v) => onUpdate("links_pool_idle_timeout", v)}
                min={5}
                max={300}
                unit="s"
            />
        </SettingField>

        <SettingField
            label="Max Idle per Host"
            description="Max idle connections per host"
        >
            <NumberInput
                value={settings.links_max_idle_per_host}
                onChange={(v) => onUpdate("links_max_idle_per_host", v)}
                min={1}
                max={50}
            />
        </SettingField>
    </div>
);

export default LinksSection;
