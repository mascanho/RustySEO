// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { ActionIcon, Text, Box, ScrollArea, Loader } from "@mantine/core";
import { Settings, X, Bug, Globe, Link2, FileText, ScrollText, Plug } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useSettings } from "./useSettings";

// Section components
import CrawlerSection from "./sections/CrawlerSection";
import NetworkSection from "./sections/NetworkSection";
import LinksSection from "./sections/LinksSection";
import ExtractionSection from "./sections/ExtractionSection";
import LogsSection from "./sections/LogsSection";
import IntegrationsSection from "./sections/IntegrationsSection";

const tabs = [
    { id: "crawler", label: "Crawler", icon: Bug },
    { id: "network", label: "Network", icon: Globe },
    { id: "links", label: "Links", icon: Link2 },
    { id: "extraction", label: "Data", icon: FileText },
    { id: "logs", label: "Logs", icon: ScrollText },
    { id: "integrations", label: "Integrations", icon: Plug },
];

interface SettingsModalProps {
    close: () => void;
}

const SettingsModal = ({ close }: SettingsModalProps) => {
    const [activeTab, setActiveTab] = useState("crawler");
    const { settings, loading, error, saving, updateSetting, reloadSettings } = useSettings();
    const [localVersion, setLocalVersion] = useState<string | null>(null);

    useEffect(() => {
        const fetchVersion = async () => {
            try {
                const versions = await invoke<any>("version_check_command");
                setLocalVersion(versions.local);
            } catch {
                const appVersion = localStorage?.getItem("app-version");
                setLocalVersion(appVersion || "1.0.0");
            }
        };
        fetchVersion();
    }, []);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center h-[300px]">
                    <div className="flex flex-col items-center gap-3">
                        <Loader size="sm" color="var(--brand-bright, #6366f1)" />
                        <Text size="xs" className="text-gray-400 dark:text-gray-500">
                            Loading settings…
                        </Text>
                    </div>
                </div>
            );
        }

        if (error || !settings) {
            return (
                <div className="flex items-center justify-center h-[300px]">
                    <div className="flex flex-col items-center gap-3 text-center px-4">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                            <X className="w-5 h-5 text-red-400" />
                        </div>
                        <Text size="sm" className="text-red-400 font-medium">
                            Failed to load settings
                        </Text>
                        <Text size="xs" className="text-gray-400 max-w-[250px]">
                            {error || "Unknown error"}
                        </Text>
                        <button
                            onClick={reloadSettings}
                            className="mt-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-bright/10 text-brand-bright hover:bg-brand-bright/20 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            );
        }

        switch (activeTab) {
            case "crawler":
                return <CrawlerSection settings={settings} onUpdate={updateSetting} />;
            case "network":
                return <NetworkSection settings={settings} onUpdate={updateSetting} />;
            case "links":
                return <LinksSection settings={settings} onUpdate={updateSetting} />;
            case "extraction":
                return <ExtractionSection settings={settings} onUpdate={updateSetting} />;
            case "logs":
                return <LogsSection settings={settings} onUpdate={updateSetting} />;
            case "integrations":
                return <IntegrationsSection settings={settings} onUpdate={updateSetting} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col w-full bg-white dark:bg-[#0f0f0f] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5">
            {/* Header */}
            <header className="flex items-center justify-between p-5 pb-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-brand-bright/10 dark:bg-brand-bright/20 rounded-xl">
                        <Settings className="w-5 h-5 text-brand-bright" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <Text
                                fw={800}
                                size="md"
                                className="text-gray-900 dark:text-white tracking-tight"
                            >
                                Settings
                            </Text>
                            {saving && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-bright/10">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-bright animate-pulse" />
                                    <span className="text-[9px] font-bold text-brand-bright uppercase tracking-wider">
                                        Saving
                                    </span>
                                </div>
                            )}
                        </div>
                        <Text
                            size="xs"
                            className="text-gray-500 dark:text-gray-400 font-medium"
                        >
                            Configure crawler behavior and performance
                        </Text>
                    </div>
                </div>
                <ActionIcon
                    onClick={close}
                    variant="subtle"
                    color="gray"
                    radius="xl"
                    size="lg"
                    className="hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </ActionIcon>
            </header>

            {/* Body: Sidebar + Content */}
            <div className="flex flex-1 min-h-0">
                {/* Vertical Sidebar Navigation */}
                <nav className="w-[180px] shrink-0 border-r border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.015] py-3 px-2 flex flex-col gap-0.5">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex items-center gap-2.5 w-full py-2 px-3 rounded-lg text-[12px] font-semibold transition-all duration-150 text-left ${isActive
                                    ? "text-white"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/50 dark:hover:bg-white/5"
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute inset-0 bg-brand-bright rounded-lg z-0" />
                                )}
                                <Icon
                                    className={`relative z-10 w-4 h-4 shrink-0 ${isActive ? "text-white" : "opacity-70"}`}
                                />
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Content Area */}
                <Box className="relative flex-1 min-w-0">
                    <ScrollArea
                        h={520}
                        offsetScrollbars
                        scrollbarSize={5}
                        type="hover"
                        className="px-5 pb-4"
                    >
                        <div className="w-full pt-2">{renderContent()}</div>
                    </ScrollArea>
                </Box>
            </div>

            {/* Footer */}
            <div className="px-5 pb-4 pt-1 flex justify-between items-center border-t border-gray-100 dark:border-white/5">
                <div className="h-px flex-1 bg-gray-100 dark:bg-white/5 mr-4 opacity-40" />
                <Text
                    size="xs"
                    className="text-gray-400 dark:text-gray-600 font-mono italic opacity-60"
                >
                    RustySEO v{localVersion}
                </Text>
            </div>
        </div>
    );
};

export default SettingsModal;
