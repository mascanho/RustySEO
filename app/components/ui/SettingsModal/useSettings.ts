import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface AppSettings {
    // System
    version: string;
    rustyid: string;

    // General Crawler
    user_agents: string[];
    concurrent_requests: number;
    batch_size: number;
    max_depth: number;
    max_urls_per_domain: number;

    // Timing & Throttling
    adaptive_crawling: boolean;
    base_delay: number;
    max_delay: number;
    min_crawl_delay: number;
    crawl_timeout: number;
    stall_check_interval: number;
    max_pending_time: number;

    // Request / Network
    client_timeout: number;
    client_connect_timeout: number;
    redirect_policy: number;
    max_retries: number;

    // JavaScript & Rendering
    html: boolean;
    javascript_rendering: boolean;
    javascript_concurrency: number;

    // Link Processor
    links_max_concurrent_requests: number;
    links_initial_task_capacity: number;
    links_max_retries: number;
    links_retry_delay: number;
    links_request_timeout: number;
    links_jitter_factor: number;
    links_pool_idle_timeout: number;
    links_max_idle_per_host: number;

    // Extraction & Content
    extract_ngrams: boolean;
    stop_words: string[];
    taxonomies: string[];

    // Database & Batching
    db_batch_size: number;
    db_chunk_size_domain_crawler: number;

    // Logs & File System
    log_batchsize: number;
    log_chunk_size: number;
    log_sleep_stream_duration: number;
    log_capacity: number;
    log_project_chunk_size: number;
    log_file_upload_size: number;

    // Integrations
    page_speed_bulk: boolean;
    page_speed_bulk_api_key?: string | null;
    gsc_row_limit: number;
}

export function useSettings() {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const loadSettings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await invoke<AppSettings>("get_settings_command");
            setSettings(result);
        } catch (err: any) {
            setError(err?.toString() || "Failed to load settings");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const updateSetting = useCallback(
        (key: string, value: any) => {
            if (!settings) return;

            // Optimistic local update
            setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));

            // Debounced backend save
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            debounceTimerRef.current = setTimeout(async () => {
                try {
                    setSaving(true);

                    // Build TOML string for the update
                    let tomlValue: string;
                    if (typeof value === "boolean") {
                        tomlValue = `${key} = ${value}`;
                    } else if (typeof value === "number") {
                        // For floats, ensure decimal point
                        tomlValue =
                            Number.isInteger(value) && key !== "links_jitter_factor"
                                ? `${key} = ${value}`
                                : `${key} = ${value.toFixed ? value.toFixed(2) : value}`;
                    } else if (typeof value === "string") {
                        tomlValue = `${key} = "${value}"`;
                    } else if (Array.isArray(value)) {
                        const items = value.map((v) => `"${v}"`).join(", ");
                        tomlValue = `${key} = [${items}]`;
                    } else {
                        tomlValue = `${key} = ${JSON.stringify(value)}`;
                    }

                    const updated = await invoke<AppSettings>(
                        "update_settings_command",
                        { updates: tomlValue },
                    );
                    setSettings(updated);
                } catch (err: any) {
                    console.error("Failed to save setting:", err);
                    // Revert on error
                    loadSettings();
                } finally {
                    setSaving(false);
                }
            }, 300);
        },
        [settings, loadSettings],
    );

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return { settings, loading, error, saving, updateSetting, reloadSettings: loadSettings };
}
