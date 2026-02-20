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
import { Gauge, Layers, ArrowDownUp, TrendingUp } from "lucide-react";

interface Props {
    settings: AppSettings;
    onUpdate: (key: string, value: any) => void;
}

const CrawlerSection = ({ settings, onUpdate }: Props) => (
    <div className="space-y-0.5">
        <SectionHeader title="General" icon={<Gauge className="w-3.5 h-3.5" />} />
        <SettingField
            label="Concurrent Requests"
            description="Simultaneous HTTP connections"
        >
            <NumberInput
                value={settings.concurrent_requests}
                onChange={(v) => onUpdate("concurrent_requests", v)}
                min={1}
                max={50}
            />
        </SettingField>

        <SettingField
            label="Batch Size"
            description="URLs processed per cycle"
        >
            <NumberInput
                value={settings.batch_size}
                onChange={(v) => onUpdate("batch_size", v)}
                min={1}
                max={500}
            />
        </SettingField>

        <SettingField
            label="Max Crawl Depth"
            description="How deep to follow links"
        >
            <NumberInput
                value={settings.max_depth}
                onChange={(v) => onUpdate("max_depth", v)}
                min={1}
                max={200}
            />
        </SettingField>

        <SettingField
            label="Max URLs per Domain"
            description="URL limit per domain"
        >
            <NumberInput
                value={settings.max_urls_per_domain}
                onChange={(v) => onUpdate("max_urls_per_domain", v)}
                min={1}
                max={99999999}
            />
        </SettingField>

        <SectionHeader
            title="Timing & Throttling"
            icon={<TrendingUp className="w-3.5 h-3.5" />}
        />

        <SettingField
            label="Adaptive Crawling"
            description="Auto-adjust speed based on server"
        >
            <ToggleSwitch
                checked={settings.adaptive_crawling}
                onChange={(v) => onUpdate("adaptive_crawling", v)}
            />
        </SettingField>

        <SettingField label="Base Delay" description="Delay between requests">
            <NumberInput
                value={settings.base_delay}
                onChange={(v) => onUpdate("base_delay", v)}
                min={0}
                max={60000}
                unit="ms"
            />
        </SettingField>

        <SettingField label="Max Delay" description="Maximum adaptive delay">
            <NumberInput
                value={settings.max_delay}
                onChange={(v) => onUpdate("max_delay", v)}
                min={100}
                max={120000}
                unit="ms"
            />
        </SettingField>

        <SettingField label="Min Crawl Delay" description="Floor delay in adaptive mode">
            <NumberInput
                value={settings.min_crawl_delay}
                onChange={(v) => onUpdate("min_crawl_delay", v)}
                min={0}
                max={60000}
                unit="ms"
            />
        </SettingField>

        <SettingField label="Crawl Timeout" description="Total crawl job timeout">
            <NumberInput
                value={settings.crawl_timeout}
                onChange={(v) => onUpdate("crawl_timeout", v)}
                min={60}
                max={86400}
                unit="s"
            />
        </SettingField>

        <SettingField
            label="Stall Check Interval"
            description="How often to check for stalls"
        >
            <NumberInput
                value={settings.stall_check_interval}
                onChange={(v) => onUpdate("stall_check_interval", v)}
                min={5}
                max={300}
                unit="s"
            />
        </SettingField>

        <SettingField
            label="Max Pending Time"
            description="Stall threshold per URL"
        >
            <NumberInput
                value={settings.max_pending_time}
                onChange={(v) => onUpdate("max_pending_time", v)}
                min={30}
                max={3600}
                unit="s"
            />
        </SettingField>
    </div>
);

export default CrawlerSection;
