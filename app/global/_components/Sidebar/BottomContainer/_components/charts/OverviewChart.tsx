// @ts-nocheck
"use client";
import { useEffect, useState, memo, createContext, useContext } from "react";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { listen } from "@tauri-apps/api/event";

// ─── Brand-matched colour palette ────────────────────────────────────────────
const PALETTE = {
  // Primary — sky-bright (#00A9FF) dark / brand-bright (#2B6CC4) light
  cyan:   { dark: { color: "#00A9FF", shadow: "0 0 10px #00A9FF, 0 0 26px #00A9FF44" }, light: { color: "#2B6CC4", shadow: "none" } },
  green:  { dark: { color: "#4ade80", shadow: "0 0 8px #4ade80, 0 0 20px #4ade8044"  }, light: { color: "#16a34a", shadow: "none" } },
  orange: { dark: { color: "#f97316", shadow: "0 0 8px #f97316, 0 0 20px #f9731644"  }, light: { color: "#c2410c", shadow: "none" } },
  red:    { dark: { color: "#ef4444", shadow: "0 0 8px #ef4444, 0 0 20px #ef444444"  }, light: { color: "#b91c1c", shadow: "none" } },
  violet: { dark: { color: "#a78bfa", shadow: "0 0 8px #a78bfa, 0 0 20px #a78bfa44"  }, light: { color: "#7c3aed", shadow: "none" } },
} as const;

type PaletteKey = keyof typeof PALETTE;

const DarkCtx = createContext(true);

// ─── Derived stats from crawlData ─────────────────────────────────────────────
function computeStats(data: any[]) {
  const c4 = data.filter((p) => { const s = p?.status_code || 0; return s >= 400 && s < 500; }).length;
  const c5 = data.filter((p) => { const s = p?.status_code || 0; return s >= 500; }).length;
  const ni = data.filter((p) => p?.indexability?.noindex === true).length;
  const totalLinks = data.reduce((sum, p) => sum + (p?.internal_links_count || 0) + (p?.external_links_count || 0), 0);

  return { c4, c5, ni, totalLinks };
}

// ─── Single digit cell ────────────────────────────────────────────────────────
const DigitCell = memo(({ char, paletteKey, size }: {
  char: string;
  paletteKey: PaletteKey;
  size: "lg" | "md";
}) => {
  const isDark = useContext(DarkCtx);
  const theme  = PALETTE[paletteKey][isDark ? "dark" : "light"];
  const dims   = size === "lg" ? "w-[30px] h-[50px] text-[30px]" : "w-[22px] h-[38px] text-[22px]";
  return (
    <span className={`relative inline-flex items-center justify-center ${dims} bg-[#39393a]/60 dark:bg-[#39393a]/60 border border-white/[0.06] rounded-[3px] font-mono font-bold leading-none select-none overflow-hidden`}
      style={{ background: isDark ? "rgba(57,57,58,0.6)" : "rgba(229,231,235,0.7)" }}
    >
      <span
        className={`absolute inset-0 flex items-center justify-center font-mono ${dims.split(" ")[2]} font-bold`}
        aria-hidden="true"
        style={{ color: `${theme.color}14` }}
      >8</span>
      <span className="relative z-10" style={{ color: theme.color, textShadow: theme.shadow }}>{char}</span>
    </span>
  );
});
DigitCell.displayName = "DigitCell";

// ─── Row of digit cells ───────────────────────────────────────────────────────
const DigitRow = memo(({ value, paletteKey, size = "md" }: {
  value: number;
  paletteKey: PaletteKey;
  size?: "lg" | "md";
}) => {
  const str = String(Math.max(0, value)) || "0";
  return (
    <div className="flex gap-[4px]">
      {str.split("").map((c, i) => (
        <DigitCell key={i} char={c} paletteKey={paletteKey} size={size} />
      ))}
    </div>
  );
});
DigitRow.displayName = "DigitRow";

// ─── Stat tile ────────────────────────────────────────────────────────────────
const StatTile = memo(({ label, value, paletteKey }: {
  label: string;
  value: number;
  paletteKey: PaletteKey;
}) => {
  const isDark = useContext(DarkCtx);
  const theme  = PALETTE[paletteKey][isDark ? "dark" : "light"];
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 py-3 px-2 rounded flex-1"
      style={{
        background: isDark ? "rgba(57,57,58,0.35)" : "rgba(255,255,255,0.7)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`,
      }}
    >
      <span
        className="text-[9px] font-mono tracking-[0.18em] uppercase"
        style={{ color: isDark ? `${theme.color}60` : `${theme.color}99` }}
      >
        {label}
      </span>
      <DigitRow value={value} paletteKey={paletteKey} size="md" />
    </div>
  );
});
StatTile.displayName = "StatTile";

// ─── Main component ───────────────────────────────────────────────────────────
function OverviewChart() {
  const domainCrawlLoading      = useGlobalCrawlStore((s) => s.domainCrawlLoading);
  const streamedCrawledPages    = useGlobalCrawlStore((s) => s.streamedCrawledPages);
  const streamedTotalPages      = useGlobalCrawlStore((s) => s.streamedTotalPages);
  const crawlDataLength         = useGlobalCrawlStore((s) => s.crawlData.length);
  const setStreamedCrawledPages = useGlobalCrawlStore((s) => s.setStreamedCrawledPages);
  const setStreamedTotalPages   = useGlobalCrawlStore((s) => s.setStreamedTotalPages);

  const [failed4xx, setFailed4xx]             = useState(0);
  const [failed5xx, setFailed5xx]             = useState(0);
  const [nonIndexable, setNonIndexable]       = useState(0);
  const [totalLinks, setTotalLinks] = useState(0);
  const [sessionCrawls, setSessionCrawls]     = useState(0);
  const [isDark, setIsDark]                   = useState(true);

  // Track dark class on <html>
  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const crawled = streamedCrawledPages || 0;

  // Recompute derived stats whenever crawlData changes (covers mount + live updates)
  useEffect(() => {
    const data = useGlobalCrawlStore.getState().crawlData || [];
    if (!data.length) return;
    const { c4, c5, ni, totalLinks } = computeStats(data);
    setFailed4xx(c4);
    setFailed5xx(c5);
    setNonIndexable(ni);
    setTotalLinks(totalLinks);
  }, [crawlDataLength]);

  // Also lock in final counts when crawl_complete fires
  useEffect(() => {
    let dead = false;
    const p = listen("crawl_complete", () => {
      if (dead) return;
      const s    = useGlobalCrawlStore.getState();
      const data = s.crawlData || [];
      const { c4, c5, ni, totalLinks } = computeStats(data);
      const raw  = s.streamedCrawledPages || data.length;
      setStreamedCrawledPages(Math.max(0, raw - c4 - c5));
      setStreamedTotalPages(raw);
      setFailed4xx(c4);
      setFailed5xx(c5);
      setNonIndexable(ni);
      setTotalLinks(totalLinks);
    });
    return () => { dead = true; p.then((f) => f()); };
  }, [setStreamedCrawledPages, setStreamedTotalPages]);

  // Session crawl count
  useEffect(() => {
    try {
      const n = sessionStorage.getItem("crawlNumber");
      setSessionCrawls(n ? parseInt(n, 10) : 0);
    } catch {
      setSessionCrawls(0);
    }
  }, [domainCrawlLoading, crawlDataLength]);

  const totalDiscovered = (streamedTotalPages || 0).toLocaleString();

  const cardStyle: React.CSSProperties = {
    background: isDark ? "#171717" : "#F5F5F5",
    backgroundImage: isDark
      ? `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 4px),
         linear-gradient(rgba(0,169,255,0.012) 1px, transparent 1px),
         linear-gradient(90deg, rgba(0,169,255,0.012) 1px, transparent 1px)`
      : `linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px),
         linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)`,
    backgroundSize: isDark ? "100% 4px, 18px 18px, 18px 18px" : "18px 18px, 18px 18px",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)"}`,
  };

  const mainPanelStyle: React.CSSProperties = {
    background: isDark ? "rgba(57,57,58,0.25)" : "rgba(255,255,255,0.65)",
    border: `1px solid ${isDark ? "rgba(0,169,255,0.1)" : "rgba(43,108,196,0.15)"}`,
    boxShadow: isDark
      ? "inset 0 0 40px rgba(0,169,255,0.03), 0 0 1px rgba(0,169,255,0.15)"
      : "inset 0 2px 8px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.05)",
  };

  return (
    <DarkCtx.Provider value={isDark}>
      <div className="flex flex-col h-full px-4 py-4 overflow-hidden" style={cardStyle}>

        {/* Primary counter */}
        <div
          className="flex flex-col items-center justify-center flex-1 mb-4 rounded shrink-0 min-h-[100px]"
          style={mainPanelStyle}
        >
          <DigitRow value={streamedTotalPages || 0} paletteKey="cyan" size="lg" />
          <span
            className="mt-3 text-[9px] font-mono tracking-[0.4em] uppercase"
            style={{ color: isDark ? "rgba(0,169,255,0.25)" : "rgba(43,108,196,0.4)" }}
          >
            PAGES FOUND
          </span>
        </div>

        {/* 2×2 stat grid */}
        <div className="grid grid-cols-2 gap-4 mb-4 pb-6 shrink-0">
          <StatTile label="TOTAL LINKS"    value={totalLinks} paletteKey="green"  />
          <StatTile label="4XX"            value={failed4xx}       paletteKey="orange" />
          <StatTile label="5XX"            value={failed5xx}       paletteKey="red"    />
          <StatTile label="NON-INDEXABLE"  value={nonIndexable}    paletteKey="violet" />
        </div>

        {/* Footer */}
        <div
          className="shrink-0 pt-2.5 flex items-center justify-between"
          style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)"}` }}
        >
          <span className="text-[9px] font-mono" style={{ color: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.3)" }}>
            {sessionCrawls} crawl{sessionCrawls !== 1 ? "s" : ""} this session
          </span>
          <span className="text-[9px] font-mono" style={{ color: isDark ? "rgba(0,169,255,0.2)" : "rgba(43,108,196,0.4)" }}>
            {totalDiscovered} found
          </span>
        </div>
      </div>
    </DarkCtx.Provider>
  );
}

export default OverviewChart;
