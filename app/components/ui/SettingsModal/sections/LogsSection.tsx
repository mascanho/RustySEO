// @ts-nocheck
"use client";

import React from "react";
import { AppSettings } from "../useSettings";
import {
    SettingField,
    NumberInput,
    SectionHeader,
} from "../fields/SettingFields";
import { ScrollText, Upload } from "lucide-react";

interface Props {
    settings: AppSettings;
    onUpdate: (key: string, value: any) => void;
}

const LogsSection = ({ settings, onUpdate }: Props) => (
    <div className="space-y-0.5">
        <SectionHeader
            title="Log Processing"
            icon={<ScrollText className="w-3.5 h-3.5" />}
        />

        <SettingField
            label="Log Batch Size"
            description="Logs processed per batch"
        >
            <NumberInput
                value={settings.log_batchsize}
                onChange={(v) => onUpdate("log_batchsize", v)}
                min={1}
                max={100}
            />
        </SettingField>

        <SettingField
            label="Log Chunk Size"
            description="Lines per log chunk"
        >
            <NumberInput
                value={settings.log_chunk_size}
                onChange={(v) => onUpdate("log_chunk_size", v)}
                min={1000}
                max={5000000}
            />
        </SettingField>

        <SettingField
            label="Stream Sleep"
            description="Duration between stream iterations"
        >
            <NumberInput
                value={settings.log_sleep_stream_duration}
                onChange={(v) => onUpdate("log_sleep_stream_duration", v)}
                min={0}
                max={60}
                unit="s"
            />
        </SettingField>

        <SettingField
            label="Log Capacity"
            description="Buffer capacity for logs"
        >
            <NumberInput
                value={settings.log_capacity}
                onChange={(v) => onUpdate("log_capacity", v)}
                min={1}
                max={100}
            />
        </SettingField>

        <SettingField
            label="Project Chunk Size"
            description="Chunk size for log projects"
        >
            <NumberInput
                value={settings.log_project_chunk_size}
                onChange={(v) => onUpdate("log_chunk_size_project", v)}
                min={1}
                max={100}
            />
        </SettingField>

        <SectionHeader
            title="File Upload"
            icon={<Upload className="w-3.5 h-3.5" />}
        />

        <SettingField
            label="Max Upload Size"
            description="Maximum log file upload size"
        >
            <NumberInput
                value={settings.log_file_upload_size}
                onChange={(v) => onUpdate("log_file_upload_size", v)}
                min={1}
                max={500}
                unit="MB"
            />
        </SettingField>
    </div>
);

export default LogsSection;
