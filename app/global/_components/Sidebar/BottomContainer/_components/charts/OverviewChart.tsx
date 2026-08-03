// @ts-nocheck
"use client";
import { useEffect, useState, memo, createContext, useContext } from "react";
import useGlobalCrawlStore, { useFinalCrawlStats } from "@/store/GlobalCrawlDataStore";
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
  // Indexability is a score, not a boolean: < 0.5 means non-indexable — same
  // rule as the Indexing dropdown and the SQLite summary query. A missing
  // score defaults to 0.5 (indexable) to match the extractor's default.
  const ni = data.filter((p) => (p?.indexability?.indexability ?? 0.5) < 0.5).length;
  const totalLinks = data.reduce((sum, p) => sum + (p?.internal_links_count || 0) + (p?.external_links_count || 0), 0);

  return { c4, c5, ni, totalLinks };
}

// ─── Single digit cell ────────────────────────────────────────────────────────
// fontSize is computed by DigitRow and passed down — cells are purely presentational
const DigitCell = memo(({ char, paletteKey, fontSize }: {
  char: string;
  paletteKey: PaletteKey;
  fontSize: number;
}) => {
  const isDark = useContext(DarkCtx);
  const theme  = PALETTE[paletteKey][isDark ? "dark" : "light"];
  const w = Math.round(fontSize * 1.0);
  const h = Math.round(fontSize * 1.64);
  return (
    <span
      className="relative inline-flex items-center justify-center rounded-[2px] font-mono font-bold leading-none select-none overflow-hidden border"
      style={{
        width: w, height: h, fontSize,
        background: isDark ? "rgba(57,57,58,0.6)" : "rgba(229,231,235,0.7)",
        borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
      }}
    >
      <span
        className="absolute inset-0 flex items-center justify-center font-mono font-bold"
        aria-hidden="true"
        style={{ fontSize, color: `${theme.color}14` }}
      >8</span>
      <span className="relative z-10" style={{ fontSize, color: theme.color, textShadow: theme.shadow }}>{char}</span>
    </span>
  );
});
DigitCell.displayName = "DigitCell";

// ─── Row of digit cells — scales down automatically as digit count grows ──────
const DigitRow = memo(({ value, paletteKey, baseSize = 22 }: {
  value: number;
  paletteKey: PaletteKey;
  baseSize?: number;
}) => {
  const str    = String(Math.max(0, value)) || "0";
  const count  = str.length;
  // Start shrinking once digit count exceeds the threshold for this base size
  const threshold = baseSize >= 28 ? 7 : 5;
  const minSize   = baseSize >= 28 ? 14 : 9;
  const scale     = count > threshold ? threshold / count : 1;
  const fontSize  = Math.max(Math.round(baseSize * scale), minSize);
  const gap       = Math.max(2, Math.round(4 * scale));
  return (
    <div className="flex justify-center" style={{ gap }}>
      {str.split("").map((c, i) => (
        <DigitCell key={i} char={c} paletteKey={paletteKey} fontSize={fontSize} />
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
      <DigitRow value={value} paletteKey={paletteKey} baseSize={16} />
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
  // Authoritative post-crawl count from SQLite — shared with Summary/Footer so
  // "pages crawled" can't disagree between widgets. Falls back to the live
  // streamed counter while a crawl is still in progress.
  const finalCrawlStats         = useFinalCrawlStats();

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

  const crawled = finalCrawlStats?.pages ?? streamedCrawledPages ?? 0;

  // Post-crawl, prefer the authoritative SQLite counts over the live-derived
  // ones: crawlData is capped at maxUrlsStored (default 5000) rows, so on big
  // crawls the live counters only see a fraction of the pages.
  const display4xx = finalCrawlStats?.status_4xx ?? failed4xx;
  const display5xx = finalCrawlStats?.status_5xx ?? failed5xx;
  const displayNonIndexable = finalCrawlStats?.not_indexable_pages ?? nonIndexable;
  const displayTotalLinks = finalCrawlStats?.total_links ?? totalLinks;

  // Recompute derived stats whenever crawlData changes (covers mount + live updates).
  // Must also reset to 0 when crawlData empties out (e.g. clearDomainCrawlData()
  // on a new crawl start) — otherwise these tiles keep showing the previous
  // crawl's final 4xx/5xx/non-indexable/links counts until enough new results
  // land to overwrite them.
  useEffect(() => {
    const data = useGlobalCrawlStore.getState().crawlData || [];
    if (!data.length) {
      setFailed4xx(0);
      setFailed5xx(0);
      setNonIndexable(0);
      setTotalLinks(0);
      return;
    }
    const { c4, c5, ni, totalLinks } = computeStats(data);
    setFailed4xx(c4);
    setFailed5xx(c5);
    setNonIndexable(ni);
    setTotalLinks(totalLinks);
  }, [crawlDataLength]);

  // Also lock in final 4xx/5xx/indexability counts once the crawl_complete
  // flush has landed in crawlData (covers the case where the last batch
  // didn't bump crawlDataLength quite in time for the effect above).
  useEffect(() => {
    let dead = false;
    const p = listen("crawl_complete", () => {
      if (dead) return;
      const data = useGlobalCrawlStore.getState().crawlData || [];
      const { c4, c5, ni, totalLinks } = computeStats(data);
      setFailed4xx(c4);
      setFailed5xx(c5);
      setNonIndexable(ni);
      setTotalLinks(totalLinks);
    });
    return () => { dead = true; p.then((f) => f()); };
  }, []);

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
          <DigitRow value={crawled} paletteKey="cyan" baseSize={30} />
          <span
            className="mt-3 text-[11px] font-mono tracking-[0.35em] uppercase"
            style={{ color: isDark ? "rgba(0,169,255,0.25)" : "rgba(43,108,196,0.4)" }}
          >
            PAGES CRAWLED
          </span>
        </div>

        {/* 2×2 stat grid */}
        <div className="grid grid-cols-2 gap-4 mb-4 pb-6 shrink-0">
          <StatTile label="TOTAL LINKS"    value={displayTotalLinks}   paletteKey="green"  />
          <StatTile label="4XX"            value={display4xx}          paletteKey="orange" />
          <StatTile label="5XX"            value={display5xx}          paletteKey="red"    />
          <StatTile label="NON-INDEXABLE"  value={displayNonIndexable} paletteKey="violet" />
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
