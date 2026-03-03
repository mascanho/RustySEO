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
import { FileText, Hash } from "lucide-react";

interface Props {
    settings: AppSettings;
    onUpdate: (key: string, value: any) => void;
}

const ExtractionSection = ({ settings, onUpdate }: Props) => (
    <div className="space-y-0.5">
        <SectionHeader
            title="Content Extraction"
            icon={<FileText className="w-3.5 h-3.5" />}
        />

        <SettingField
            label="Extract N-grams"
            description="Enable N-gram extraction during crawl"
        >
            <ToggleSwitch
                checked={settings.extract_ngrams}
                onChange={(v) => onUpdate("extract_ngrams", v)}
            />
        </SettingField>

        <SectionHeader
            title="Database & Batching"
            icon={<Hash className="w-3.5 h-3.5" />}
        />

        <SettingField
            label="DB Batch Size"
            description="Records per database insert"
        >
            <NumberInput
                value={settings.db_batch_size}
                onChange={(v) => onUpdate("db_batch_size", v)}
                min={10}
                max={5000}
            />
        </SettingField>

        <SettingField
            label="DB Chunk Size"
            description="Chunk size for domain crawler results"
        >
            <NumberInput
                value={settings.db_chunk_size_domain_crawler}
                onChange={(v) => onUpdate("db_chunk_size_domain_crawler", v)}
                min={50}
                max={10000}
            />
        </SettingField>
    </div>
);

export default ExtractionSection;
