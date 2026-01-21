// @ts-nocheck
"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  Users,
  MousePointer,
  ArrowDownUp,
  ScrollText,
  AlertCircle,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Zap,
  ShieldAlert,
  Ghost,
  MapPin,
  ExternalLink,
  ChevronRight,
  Activity,
  Layers,
  Layout,
} from "lucide-react";
import { BrowserChart } from "./Charts/BrowserChart";
import { DeviceDistributionChart } from "./Charts/DeviceDistributionChart";
import { GeographicalDistributionChart } from "./Charts/GeographicalDistributionChart";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useClarityStore } from "@/store/ClarityStore";

const GlassCard = ({ children, className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
    className={`
      relative group overflow-hidden rounded-3xl border border-slate-200 dark:border-brand-dark
      bg-white dark:bg-brand-darker/40 backdrop-blur-xl shadow-2xl shadow-black/5
      hover:shadow-brand-bright/10 hover:border-brand-bright/30 transition-all duration-500
      ${className}
    `}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative z-10 h-full">{children}</div>
  </motion.div>
);

const GlowBlob = ({ className = "", color = "bg-brand-bright" }) => (
  <motion.div
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.1, 0.2, 0.1],
      x: [0, 50, 0],
      y: [0, 30, 0],
    }}
    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
    className={`absolute rounded-full blur-[120px] pointer-events-none -z-10 ${color} ${className}`}
  />
);

export default function ClarityDashboard() {
  const { data, setData, lastRefreshed, setLastRefreshed } = useClarityStore();
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const result = await invoke<any>("get_microsoft_clarity_data_command");
      if (result && result[0]) {
        setData(result[0]);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      toast.error(`Failed to fetch Microsoft Clarity data: ${err}`);
      console.error("Clarity Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Process user behavior data
  const behaviorMetrics = useMemo(() => {
    return [
      {
        id: "RageClickCount",
        label: "Rage Clicks",
        description: "Frustrated rapid interaction",
        icon: Zap,
        color: "text-orange-500",
        glow: "shadow-orange-500/20",
      },
      {
        id: "DeadClickCount",
        label: "Dead Clicks",
        description: "No visual or logical feedback",
        icon: Ghost,
        color: "text-indigo-400",
        glow: "shadow-indigo-500/20",
      },
      {
        id: "ErrorClickCount",
        label: "Error Clicks",
        description: "JS errors on interaction",
        icon: ShieldAlert,
        color: "text-rose-500",
        glow: "shadow-rose-500/20",
      },
      {
        id: "ExcessiveScroll",
        label: "Excessive Scroll",
        description: "Lost users scrolling fast",
        icon: ArrowDownUp,
        color: "text-emerald-500",
        glow: "shadow-emerald-500/20",
      },
      {
        id: "QuickbackClick",
        label: "Quick Back",
        description: "Instant exit navigation",
        icon: TrendingDown,
        color: "text-purple-500",
        glow: "shadow-purple-500/20",
      },
      {
        id: "ScriptErrorCount",
        label: "Global Errors",
        description: "Backend or logic fatal errors",
        icon: AlertCircle,
        color: "text-red-600",
        glow: "shadow-red-500/20",
      },
    ].map((m) => {
      const metric = data.find((item: any) => item.metricName === m.id);
      const info = metric?.information?.[0] || {};
      return {
        ...m,
        sessions: info.sessionsCount || "0",
        percentage: info.sessionsWithMetricPercentage || 0,
      };
    });
  }, [data]);

  const trafficInfo = useMemo(
    () =>
      data.find((m: any) => m.metricName === "Traffic")?.information?.[0] || {},
    [data],
  );
  const engagementData = useMemo(
    () =>
      data.find((m: any) => m.metricName === "EngagementTime")
        ?.information?.[0] || {},
    [data],
  );
  const scrollData = useMemo(
    () =>
      data.find((m: any) => m.metricName === "ScrollDepth")?.information?.[0] ||
      {},
    [data],
  );

  const stats = [
    {
      label: "Daily Volume",
      value: trafficInfo.totalSessionCount || "0",
      sub: "Total Sessions",
      icon: Activity,
      color: "text-sky-500",
    },
    {
      label: "Unique Reach",
      value: trafficInfo.distinctUserCount || "0",
      sub: "Verified Users",
      icon: Users,
      color: "text-brand-bright",
    },
    {
      label: "Interaction",
      value: `${engagementData.activeTime || 0}s`,
      sub: "Avg. Active Time",
      icon: Zap,
      color: "text-amber-500",
    },
    {
      label: "Page Depth",
      value: `${scrollData.averageScrollDepth?.toFixed(1) || 0}%`,
      sub: "Avg. Vertical Scroll",
      icon: Layers,
      color: "text-emerald-500",
    },
  ];

  const popularPages = useMemo(
    () =>
      data
        .find((m: any) => m.metricName === "PopularPages")
        ?.information?.slice(0, 10) || [],
    [data],
  );
  const referrers = useMemo(
    () =>
      data
        .find((m: any) => m.metricName === "ReferrerUrl")
        ?.information?.slice(0, 5) || [],
    [data],
  );

  // Process chart data
  const browserData = useMemo(() => {
    const metric = data.find((m: any) => m.metricName === "Browser");
    return (
      metric?.information?.map((b: any) => ({
        name: b.name,
        sessions: parseInt(b.sessionsCount),
      })) || []
    );
  }, [data]);

  const deviceData = useMemo(() => {
    const metric = data.find((m: any) => m.metricName === "Device");
    return (
      metric?.information?.map((d: any) => ({
        name: d.name,
        sessions: parseInt(d.sessionsCount),
      })) || []
    );
  }, [data]);

  const geoData = useMemo(() => {
    const metric = data.find((m: any) => m.metricName === "Country");
    return (
      metric?.information?.map((g: any) => ({
        name: g.name,
        sessions: parseInt(g.sessionsCount),
      })) || []
    );
  }, [data]);

  return (
    <TooltipProvider>
      <div className="relative w-full bg-gradient-to-br from-white via-slate-50/30 to-blue-50/20 dark:bg-brand-darker px-4 pt-2  transition-colors duration-500 h-full overflow-y-auto overflow-x-hidden dark:bg-gradient-to-t dark:from-brand-darker dark:via-brand-darker dark:to-brand-darker pb-12">
        {/* Ambient Glows */}
        <GlowBlob
          className="top-0 -left-20 w-[600px] h-[600px] opacity-[0.05]"
          color="bg-blue-600"
        />
        <GlowBlob
          className="bottom-0 -right-20 w-[500px] h-[500px] opacity-[0.05]"
          color="bg-purple-600"
        />

        <div className="relative z-10 max-w-[1600px] mx-auto space-y-5 pb-4  ">
          {/* Top Bar */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1  border-slate-200 dark:border-brand-dark">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div>
                  <Layout className="w-5 h-5 text-brand-bright" />
                </div>
                <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
                  Clarity{" "}
                </h1>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  System Synced
                </div>
                <span>•</span>
                <div>
                  {lastRefreshed
                    ? `Updated ${lastRefreshed.toLocaleTimeString()}`
                    : "Waiting for pulse..."}
                </div>
              </div>
            </div>

            <button
              onClick={refreshData}
              disabled={isLoading}
              className="px-6 py-2 rounded-md bg-brand-bright dark:bg-white text-white dark:text-brand-darker font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`}
              />
              {isLoading ? "Syncing..." : "Refresh"}
            </button>
          </header>

          {/* Core Stats Bento */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <GlassCard key={i} delay={i * 0.1}>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
                      {stat.label}
                    </span>
                    <div
                      className={`p-2 rounded-xl bg-slate-100 dark:bg-brand-dark/50 ${stat.color}`}
                    >
                      <stat.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-4xl font-black tracking-tighter tabular-nums text-slate-900 dark:text-white">
                      {stat.value}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-300 mt-1 uppercase italic tracking-wider">
                      {stat.sub}
                    </p>
                  </div>
                </div>
                <div
                  className={`h-1 w-full bg-gradient-to-r from-transparent via-brand-bright to-transparent opacity-20`}
                />
              </GlassCard>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Friction Analysis */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <GlassCard className="h-full">
                <div className="p-8 border-b border-slate-200 dark:border-brand-dark flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black italic uppercase tracking-tighter dark:text-white">
                      Friction Intelligence
                    </h2>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest mt-1">
                      Behavioral Signal Matrix
                    </p>
                  </div>
                  <Activity className="w-5 h-5 text-brand-bright opacity-40" />
                </div>
                <div className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 dark:bg-brand-dark">
                    {behaviorMetrics.map((item, idx) => (
                      <motion.div
                        key={item.label}
                        whileHover={{
                          backgroundColor: "rgba(43, 108, 196, 0.08)",
                        }}
                        className="p-8 space-y-6 transition-colors bg-white dark:bg-brand-darker"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-3 rounded-2xl bg-white dark:bg-brand-darker shadow-xl ${item.glow} hover:scale-110 transition-transform ring-1 ring-black/5 dark:ring-white/10`}
                            >
                              <item.icon className={`w-5 h-5 ${item.color}`} />
                            </div>
                            <div>
                              <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-slate-100">
                                {item.label}
                              </h3>
                              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-wider">
                                {item.description}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-black rounded-xl py-0 px-3 h-6 tabular-nums bg-slate-50 dark:bg-brand-darker border-slate-200 dark:border-brand-dark text-slate-600 dark:text-slate-200"
                          >
                            {item.sessions} SESS
                          </Badge>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-end justify-between">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-[0.2em]">
                                Intensity
                              </span>
                              <span className="text-2xl font-black tabular-nums text-slate-900 dark:text-white">
                                {item.percentage}%
                              </span>
                            </div>
                            <div className="w-32 h-2.5 bg-slate-100 dark:bg-brand-dark rounded-full overflow-hidden p-[2px]">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.percentage}%` }}
                                transition={{
                                  duration: 1,
                                  delay: 0.5 + idx * 0.1,
                                }}
                                className={`h-full rounded-full  bg-gradient-to-r from-brand-bright to-blue-400 shadow-[0_0_12px_rgba(43,108,196,0.6)]`}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Distribution Charts Side */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <GlassCard className="flex-1">
                <div className="p-6 border-b border-slate-200 dark:border-brand-dark">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-300">
                    Browser Environment
                  </h3>
                </div>
                <div className="p-4 h-[250px] flex items-center justify-center">
                  <BrowserChart data={browserData} />
                </div>
              </GlassCard>

              <GlassCard className="flex-1">
                <div className="p-6 border-b border-slate-200 dark:border-brand-dark">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-300">
                    Device Distribution
                  </h3>
                </div>
                <div className="p-6">
                  <DeviceDistributionChart data={deviceData} />
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Bottom Section: Geo & Lists */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard>
              <div className="p-6 border-b border-slate-200 dark:border-brand-dark flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-300">
                  Source Intel
                </h3>
                <MapPin className="w-4 h-4 text-brand-bright opacity-30" />
              </div>
              <div className="p-6">
                <GeographicalDistributionChart data={geoData} />
              </div>
            </GlassCard>

            <GlassCard className="md:col-span-2">
              <div className="p-6 border-b border-slate-200 dark:border-brand-dark flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-300">
                  Top Acquisition & Content
                </h3>
                <ExternalLink className="w-4 h-4 text-brand-bright opacity-30" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-6 space-y-6 border-r border-slate-200 dark:border-brand-dark">
                  <p className="text-[10px] font-black text-brand-bright uppercase tracking-widest mb-2">
                    Prime Referrers
                  </p>
                  <div className="space-y-2">
                    {referrers.map((ref, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-white/[0.02] hover:bg-brand-bright/5 transition-colors border border-slate-100 dark:border-transparent hover:border-brand-bright/10 group"
                      >
                        <span className="text-xs font-bold break-all group-hover:text-brand-bright transition-colors  tracking-tight text-slate-800 dark:text-slate-200">
                          {ref.name || "Direct Path"}
                        </span>
                        <span className="text-xs font-black tabular-nums text-slate-900 dark:text-white shrink-0">
                          {ref.sessionsCount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">
                    High Volume Nodes
                  </p>
                  <ScrollArea className="h-[250px] pr-4">
                    <div className="space-y-2">
                      {popularPages.map((page, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-white dark:bg-white/[0.02] hover:bg-emerald-500/5 transition-colors border border-slate-100 dark:border-transparent group"
                        >
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-[10px] font-bold break-all group-hover:text-emerald-500 transition-colors lowercase tracking-tight text-slate-800 dark:text-slate-200">
                              {page.url}
                            </span>
                            <span className="text-[8px] font-black text-slate-400 dark:text-slate-300 uppercase">
                              Target Endpoint
                            </span>
                          </div>
                          <span className="text-xs font-black tabular-nums text-slate-900 dark:text-white shrink-0">
                            {page.visitsCount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
