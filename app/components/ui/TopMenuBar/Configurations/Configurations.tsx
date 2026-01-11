"use client";

import React, { useState } from "react";
import { ActionIcon, Text, Box, Group, ScrollArea } from "@mantine/core";
import PagespeedInsightsApi from "./PagespeedInsigthsApi";
import GoogleAnalyticsConf from "./GoogleAnalyticsConf";
import SearchConsoleConfs from "./SearchConsoleConfs";
import AIConfigurations from "./AIConfigurations";
import ClarityConfs from "./ClarityConfs";
import { Settings, X, Cpu, BarChart3, Search, Activity, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const tabs = [
  { id: "pagespeed", label: "PageSpeed", icon: Zap },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "console", label: "Console", icon: Search },
  { id: "clarity", label: "Clarity", icon: Activity },
  { id: "ai", label: "AI Models", icon: Cpu },
];

const Configurations = ({ close }: { close: () => void }) => {
  const [activeTab, setActiveTab] = useState("pagespeed");
  const [localVersion, setLocalVersion] = useState<string | null>(null);

  React.useEffect(() => {
    const appVersion = localStorage?.getItem("app-version");
    setLocalVersion(appVersion || "1.0.0");
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "pagespeed": return <PagespeedInsightsApi />;
      case "analytics": return <GoogleAnalyticsConf />;
      case "console": return <SearchConsoleConfs />;
      case "clarity": return <ClarityConfs />;
      case "ai": return <AIConfigurations />;
      default: return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col w-full bg-white dark:bg-[#0f0f0f] rounded-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-white/5"
    >
      {/* Header - Matching GeminiSelector */}
      <header className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-brand-bright/10 dark:bg-brand-bright/20 rounded-xl">
            <Settings className="w-6 h-6 text-brand-bright" />
          </div>
          <div>
            <Text fw={800} size="lg" className="text-gray-900 dark:text-white tracking-tight">Connector Settings</Text>
            <Text size="xs" className="text-gray-500 dark:text-gray-400 font-medium">Manage your external API integrations</Text>
          </div>
        </div>
        <ActionIcon onClick={close} variant="subtle" color="gray" radius="xl" size="lg" className="hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </ActionIcon>
      </header>

      {/* Custom Navigation Bar - High Visibility Segmented Control */}
      <div className="px-6 pt-6 flex flex-col">
        <div className="flex p-1.5 bg-gray-100/80 dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/5 space-x-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center justify-center flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200
                  ${isActive
                    ? "text-white shadow-lg"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/50 dark:hover:bg-white/5"
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-brand-bright rounded-xl z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Group gap={6} wrap="nowrap" className="relative z-10">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "opacity-70"}`} />
                  <span>{tab.label}</span>
                </Group>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <Box className="relative">
        <ScrollArea h={480} offsetScrollbars scrollbarSize={6} type="hover" className="px-6 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="w-full pt-4"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>
      </Box>

      {/* Footer Branding - Consistent with About */}
      <div className="px-6 pb-6 pt-2 flex justify-between items-center">
        <div className="h-px flex-1 bg-gray-100 dark:bg-white/5 mr-4 opacity-40" />
        <Text size="xs" className="text-gray-400 dark:text-gray-600 font-mono italic opacity-60">RustySEO v{localVersion}</Text>
      </div>
    </motion.div>
  );
};

export default Configurations;
