"use client";

import React, { useMemo, useState } from "react";
import { Modal } from "@mantine/core";
import { BarChart4, Database } from "lucide-react";
import { VISUALISATIONS, CATEGORY_ORDER } from "./registry";
import { useVisualisationData } from "./shared/useVisualisationData";
import { useIsDarkMode } from "./shared/useIsDarkMode";
import { ChartCard } from "./shared/ChartCard";

interface VisualisationsModalProps {
  opened: boolean;
  onClose: () => void;
}

// The "Visualisations" hub — one modal, a category-grouped nav of every
// registered visualisation (see registry.tsx), and a single chart panel
// that swaps in whichever is selected. Keeping the shell generic like this
// is what makes each visualisation a self-contained, independently
// addable/removable unit instead of N bespoke modals.
export default function VisualisationsModal({ opened, onClose }: VisualisationsModalProps) {
  const [activeId, setActiveId] = useState(VISUALISATIONS[0].id);
  const { crawlData, aggregatedData, isEmpty } = useVisualisationData(opened);
  const isDark = useIsDarkMode();

  const active = useMemo(
    () => VISUALISATIONS.find((v) => v.id === activeId) || VISUALISATIONS[0],
    [activeId],
  );

  const grouped = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      items: VISUALISATIONS.filter((v) => v.category === category),
    })).filter((g) => g.items.length > 0);
  }, []);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title=""
      centered
      size="1200px"
      padding={0}
      radius="lg"
      withCloseButton={false}
      styles={{ content: { background: "transparent" } }}
    >
      <div className="w-full h-[720px] max-h-[85vh] flex flex-col bg-white dark:bg-brand-darker rounded-lg overflow-hidden border dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <BarChart4 className="w-4 h-4 text-sky-500" />
            <div>
              <h2 className="text-xs font-bold dark:text-white">Visualisations</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {isEmpty
                  ? "Run a Deep Crawl to populate these"
                  : `${crawlData.length.toLocaleString()} page${crawlData.length === 1 ? "" : "s"} in the current crawl`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>

        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Database className="w-10 h-10 text-slate-300 dark:text-slate-700" />
            <p className="text-xs text-slate-400 max-w-sm text-center">
              No crawl data in memory yet. Run a Deep Crawl on the Global tab, then
              reopen Visualisations to explore it.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex min-h-0">
            {/* Nav */}
            <nav className="w-[230px] shrink-0 border-r border-slate-200 dark:border-slate-800 overflow-y-auto py-2">
              {grouped.map((group) => (
                <div key={group.category} className="mb-2">
                  <p className="px-4 pt-2 pb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {group.category}
                  </p>
                  {group.items.map((viz) => {
                    const Icon = viz.icon;
                    const isActive = viz.id === activeId;
                    return (
                      <button
                        key={viz.id}
                        onClick={() => setActiveId(viz.id)}
                        className={`w-full flex items-start gap-2.5 px-4 py-2 text-left transition-colors ${
                          isActive
                            ? "bg-sky-50 dark:bg-sky-500/10 border-r-2 border-sky-500"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <Icon
                          className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                            isActive ? "text-sky-500" : "text-slate-400"
                          }`}
                        />
                        <span>
                          <span
                            className={`block text-[11px] font-semibold ${
                              isActive ? "text-sky-600 dark:text-sky-400" : "text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {viz.title}
                          </span>
                          <span className="block text-[9px] text-slate-400 leading-tight mt-0.5">
                            {viz.shortDescription}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Active chart */}
            <div className="flex-1 min-w-0 overflow-y-auto p-5">
              <ChartCard title={active.title} description={active.shortDescription} className="h-full">
                <active.Component crawlData={crawlData} aggregatedData={aggregatedData} isDark={isDark} />
              </ChartCard>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
