// @ts-nocheck
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Globe,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Smartphone,
  Code2,
  Image as ImageIcon,
  ArrowLeftRight,
  Activity,
  Layers,
  ArrowRight,
  Database,
  BarChart4,
  RefreshCw
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

type DeepCrawlHistory = {
  id?: number;
  domain: string;
  date: string;
  pages: number;
  errors: number;
  status: string;
  total_links: number;
  total_internal_links: number;
  total_external_links: number;
  indexable_pages: number;
  not_indexable_pages: number;
  total_css?: number;
  total_javascript?: number;
  total_images?: number;
  total_redirects?: number;
  missing_title?: number;
  missing_description?: number;
  avg_response_time?: number;
  max_crawl_depth?: number;
  total_secure_pages?: number;
  total_schema_pages?: number;
  total_mobile_pages?: number;
};

export default function DashboardSEO() {
  const [history, setHistory] = useState<DeepCrawlHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "trends" | "comparison">("overview");

  // Comparison State
  const [compCrawl1Id, setCompCrawl1Id] = useState<string>("");
  const [compCrawl2Id, setCompCrawl2Id] = useState<string>("");

  // Fetch History from SQLite database
  const fetchHistoryData = async () => {
    setLoading(true);
    try {
      // First ensure the history table exists
      await invoke("create_domain_results_table");
      const result = await invoke("read_domain_results_history_table");
      const parsedHistory = Array.isArray(result) ? result : [];
      setHistory(parsedHistory);

      // Auto-select latest domain if available
      if (parsedHistory.length > 0 && selectedDomain === "all") {
        const uniqueDomains = Array.from(new Set(parsedHistory.map(h => h.domain)));
        if (uniqueDomains.length > 0) {
          setSelectedDomain(uniqueDomains[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load crawl history on dashboard:", e);
      toast.error("Failed to load historical analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, []);

  // Filter history based on selected domain
  const filteredHistory = useMemo(() => {
    if (selectedDomain === "all") return history;
    return history.filter(item => item.domain === selectedDomain);
  }, [history, selectedDomain]);

  // Unique domains list
  const domainsList = useMemo(() => {
    return Array.from(new Set(history.map(item => item.domain)));
  }, [history]);

  // Sort history chronologically (oldest first for charts)
  const chronologicalHistory = useMemo(() => {
    return [...filteredHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredHistory]);

  // Latest crawl metrics for selected domain
  const latestCrawl = useMemo(() => {
    if (filteredHistory.length === 0) return null;
    return [...filteredHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [filteredHistory]);

  // Previous crawl metrics to calculate differences
  const previousCrawl = useMemo(() => {
    if (filteredHistory.length < 2) return null;
    return [...filteredHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[1];
  }, [filteredHistory]);

  // Setup initial comparison crawls when domain changes
  useEffect(() => {
    if (filteredHistory.length >= 2) {
      const sorted = [...filteredHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setCompCrawl1Id(sorted[0].id?.toString() || "");
      setCompCrawl2Id(sorted[1].id?.toString() || "");
    } else {
      setCompCrawl1Id("");
      setCompCrawl2Id("");
    }
  }, [selectedDomain, filteredHistory]);

  // Selected comparison crawls
  const comparisonCrawl1 = useMemo(() => {
    return history.find(c => c.id?.toString() === compCrawl1Id) || null;
  }, [history, compCrawl1Id]);

  const comparisonCrawl2 = useMemo(() => {
    return history.find(c => c.id?.toString() === compCrawl2Id) || null;
  }, [history, compCrawl2Id]);

  // Compute Health Score dynamically out of 100
  const healthScore = useMemo(() => {
    if (!latestCrawl) return 100;
    const {
      pages,
      errors = 0,
      missing_title = 0,
      missing_description = 0,
      total_redirects = 0,
      not_indexable_pages = 0
    } = latestCrawl;

    if (pages === 0) return 100;

    let penalty = 0;
    penalty += (errors / pages) * 25; // Critical issues (errors) have high weight
    penalty += (missing_title / pages) * 15; // SEO crucial
    penalty += (missing_description / pages) * 8; // Secondary SEO
    penalty += (total_redirects / pages) * 5; // Internal links redirects penalty
    penalty += (not_indexable_pages / pages) * 5; // Indexability checks

    return Math.max(10, Math.round(100 - penalty));
  }, [latestCrawl]);

  // Tech Asset breakdown for Pie Chart
  const techAssetData = useMemo(() => {
    if (!latestCrawl) return [];
    return [
      { name: "Pages", value: latestCrawl.pages || 0, color: "#38bdf8" },
      { name: "CSS", value: latestCrawl.total_css || 0, color: "#a855f7" },
      { name: "JS", value: latestCrawl.total_javascript || 0, color: "#eab308" },
      { name: "Images", value: latestCrawl.total_images || 0, color: "#10b981" },
      { name: "Redirects", value: latestCrawl.total_redirects || 0, color: "#f97316" }
    ].filter(item => item.value > 0);
  }, [latestCrawl]);

  // Render score growth indicator helper
  const renderGrowth = (current: number, previous: number | undefined, lowerIsBetter = false) => {
    if (previous === undefined || previous === null || previous === current) return null;
    const diff = current - previous;
    const isImproved = lowerIsBetter ? diff < 0 : diff > 0;
    const absDiff = Math.abs(diff);

    return (
      <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
        isImproved ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
      }`}>
        {isImproved ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {absDiff > 0 ? absDiff.toLocaleString() : ""}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50 dark:bg-brand-darker gap-4">
        <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
        <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">Analyzing historical crawls...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-brand-darker text-slate-800 dark:text-slate-200 overflow-y-auto px-6 py-4 pb-20 select-none">
      {/* Top Filter Bar */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div>
          <h1 className="text-base font-bold dark:text-white flex items-center gap-2">
            <BarChart4 className="w-5 h-5 text-sky-500" />
            Historical SEO Dashboard
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Compare crawl timelines, technical errors, indexability coverage, and asset changes.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Domain Selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 shadow-sm">
            <Globe className="w-4 h-4 text-sky-500" />
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="bg-transparent border-0 outline-0 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer min-w-[150px]"
            >
              {domainsList.length === 0 && <option value="none">No domains available</option>}
              {domainsList.map(dom => (
                <option key={dom} value={dom}>{dom}</option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchHistoryData}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors text-slate-500 hover:text-sky-500"
            title="Refresh history data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-16 bg-white dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <Database className="w-12 h-12 text-slate-400 mb-3" />
          <h3 className="font-semibold text-sm">No Crawl History Available</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm text-center">
            Perform your first Deep Crawl in the primary tab to populate visual SEO insights and timelines.
          </p>
        </div>
      ) : (
        <>
          {/* Dashboard Sub-tabs Navigation */}
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800/60 pb-px">
            {[
              { id: "overview", label: "Crawl Audit Scorecard" },
              { id: "trends", label: "Historical Timeline Trends" },
              { id: "comparison", label: "Crawl-to-Crawl Comparison" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`text-xs px-4 py-2 border-b-2 font-semibold transition-all relative top-[1px] ${
                  activeSubTab === tab.id
                    ? "border-sky-500 text-sky-500 dark:text-sky-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sub-tab 1: Overview Scorecard */}
          {activeSubTab === "overview" && latestCrawl && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
              
              {/* Row 1: KPI Stats Grid */}
              <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Health Score Card */}
                <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Technical Health</span>
                    <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
                      <Activity className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="my-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight dark:text-white">{healthScore}%</span>
                    {previousCrawl && renderGrowth(healthScore, previousCrawl ? 88 : undefined)} 
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                    <div 
                      className={`h-full rounded-full ${
                        healthScore > 85 ? "bg-emerald-500" : healthScore > 65 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${healthScore}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Weighted dynamic score of site health</p>
                </div>

                {/* Total Pages Crawled Card */}
                <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pages Crawled</span>
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="my-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight dark:text-white">
                      {(latestCrawl.pages || 0).toLocaleString()}
                    </span>
                    {previousCrawl && renderGrowth(latestCrawl.pages, previousCrawl.pages)}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                    <span className="font-semibold text-emerald-500">
                      {Math.round(((latestCrawl.indexable_pages || 0) / (latestCrawl.pages || 1)) * 100)}%
                    </span>
                    indexable ratio coverage
                  </div>
                </div>

                {/* Crawl Response Performance Card */}
                <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Response Time</span>
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="my-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight dark:text-white">
                      {latestCrawl.avg_response_time ?? 0}
                      <span className="text-sm font-normal text-slate-400 ml-0.5">ms</span>
                    </span>
                    {previousCrawl && renderGrowth(latestCrawl.avg_response_time || 0, previousCrawl.avg_response_time || 0, true)}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    Max Depth reaches
                    <span className="font-bold text-sky-500">{latestCrawl.max_crawl_depth ?? 0}</span>
                  </div>
                </div>

                {/* Total Links Card */}
                <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Links Found</span>
                    <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="my-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight dark:text-white">
                      {(latestCrawl.total_links || 0).toLocaleString()}
                    </span>
                    {previousCrawl && renderGrowth(latestCrawl.total_links, previousCrawl.total_links)}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {(latestCrawl.total_internal_links || 0).toLocaleString()}
                    </span>
                    int /
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {(latestCrawl.total_external_links || 0).toLocaleString()}
                    </span>
                    ext links
                  </div>
                </div>

              </div>

              {/* Column 2: Tech Audit Breakdown List */}
              <div className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">On-Page SEO & Quality Audit</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  
                  {/* Left Column: Missing elements */}
                  <div className="space-y-3.5">
                    <h4 className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1.5">Missing & Critical Errors</h4>
                    
                    {/* Errors */}
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        Critical Page Errors
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${latestCrawl.errors ? "text-rose-500" : "text-emerald-500"}`}>
                          {latestCrawl.errors}
                        </span>
                        {previousCrawl && renderGrowth(latestCrawl.errors, previousCrawl.errors, true)}
                      </div>
                    </div>

                    {/* Missing Title */}
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        Missing Title Tags
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${latestCrawl.missing_title ? "text-amber-500" : "text-slate-400"}`}>
                          {latestCrawl.missing_title ?? 0}
                        </span>
                        {previousCrawl && renderGrowth(latestCrawl.missing_title || 0, previousCrawl.missing_title || 0, true)}
                      </div>
                    </div>

                    {/* Missing Description */}
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        Missing Meta Descriptions
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${latestCrawl.missing_description ? "text-amber-500" : "text-slate-400"}`}>
                          {latestCrawl.missing_description ?? 0}
                        </span>
                        {previousCrawl && renderGrowth(latestCrawl.missing_description || 0, previousCrawl.missing_description || 0, true)}
                      </div>
                    </div>

                    {/* Redirects */}
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs font-semibold flex items-center gap-2">
                        <ArrowLeftRight className="w-3.5 h-3.5 text-sky-500" />
                        Crawl Redirects (3xx)
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {latestCrawl.total_redirects ?? 0}
                        </span>
                        {previousCrawl && renderGrowth(latestCrawl.total_redirects || 0, previousCrawl.total_redirects || 0, true)}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Schema & Security */}
                  <div className="space-y-3.5">
                    <h4 className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1.5">Compliance & Signals</h4>
                    
                    {/* HTTPS Secure */}
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs font-semibold flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-emerald-500" />
                        HTTPS Security Coverage
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {latestCrawl.total_secure_pages ?? 0} / {latestCrawl.pages}
                        </span>
                        {previousCrawl && renderGrowth(latestCrawl.total_secure_pages || 0, previousCrawl.total_secure_pages || 0)}
                      </div>
                    </div>

                    {/* Schema Markup */}
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs font-semibold flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />
                        Structured Data / Schema
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {latestCrawl.total_schema_pages ?? 0}
                        </span>
                        {previousCrawl && renderGrowth(latestCrawl.total_schema_pages || 0, previousCrawl.total_schema_pages || 0)}
                      </div>
                    </div>

                    {/* Mobile Friendly */}
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs font-semibold flex items-center gap-2">
                        <Smartphone className="w-3.5 h-3.5 text-sky-500" />
                        Mobile Friendliness
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {latestCrawl.total_mobile_pages ?? 0} / {latestCrawl.pages}
                        </span>
                        {previousCrawl && renderGrowth(latestCrawl.total_mobile_pages || 0, previousCrawl.total_mobile_pages || 0)}
                      </div>
                    </div>

                    {/* Indexability */}
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs font-semibold flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-indigo-500" />
                        Indexable Page Count
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-500">
                          {latestCrawl.indexable_pages}
                        </span>
                        {previousCrawl && renderGrowth(latestCrawl.indexable_pages, previousCrawl.indexable_pages)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Insight Card */}
                <div className="mt-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-lg flex items-start gap-3">
                  <div className="p-1 rounded bg-amber-500/10 text-amber-500 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Automated SEO Auditing Insight</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {latestCrawl.errors > 0 ? (
                        `Warning: There are ${latestCrawl.errors} critical link or server errors detected on your domain. Resolve these issues immediately to restore search engines indexing throughput.`
                      ) : latestCrawl.missing_description && latestCrawl.missing_description > 0 ? (
                        `Insight: Found Z-index meta-issues. You have ${latestCrawl.missing_description} pages with missing meta-descriptions. Writing descriptions for these indexable pages will boost Click-Through-Rate (CTR).`
                      ) : (
                        "Superb! Your website indexation health is looking excellent. Keep scanning regularly to monitor code changes, redirect loops, or meta tag anomalies."
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Column 3: Tech Assets Composition */}
              <div className="col-span-12 lg:col-span-4 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm flex flex-col">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Technical Assets Distribution</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-6">Visual breakdown of web pages and secondary files in the crawl.</p>
                
                {techAssetData.length > 0 ? (
                  <div className="flex-1 flex flex-col justify-center items-center">
                    <div className="h-[150px] w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={techAssetData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {techAssetData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ background: "#0f172a", border: "none", borderRadius: "8px", fontSize: "11px", color: "#fff" }}
                            itemStyle={{ color: "#fff" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assets</span>
                        <span className="text-xl font-extrabold tracking-tight dark:text-white">
                          {techAssetData.reduce((a, b) => a + b.value, 0)}
                        </span>
                      </div>
                    </div>

                    {/* Legends */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full mt-6">
                      {techAssetData.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] border-b border-slate-100 dark:border-slate-800 pb-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="font-medium text-slate-600 dark:text-slate-400">{item.name}</span>
                          </div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center py-10">
                    <span className="text-xs text-slate-400">No asset compositions found.</span>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Sub-tab 2: Timeline Trends */}
          {activeSubTab === "trends" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
              
              {/* Chart 1: Crawl Growth Over Time */}
              <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Pages & Indexability Trends</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Monitoring crawled indexable pages compared to total files over time.</p>
                </div>
                <div className="h-[250px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chronologicalHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPages" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0}/>
                        </linearGradient>
                        <linearGradient id="colorIndexable" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(v) => v.split("T")[0]} 
                        style={{ fontSize: "9px" }} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <YAxis style={{ fontSize: "9px" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "8px", fontSize: "11px", color: "#fff" }} />
                      <Legend verticalAlign="top" height={36} iconType="circle" style={{ fontSize: "11px" }} />
                      <Area type="natural" dataKey="pages" name="Total Pages" stroke="#38bdf8" fillOpacity={1} fill="url(#colorPages)" strokeWidth={2} />
                      <Area type="natural" dataKey="indexable_pages" name="Indexable Pages" stroke="#10b981" fillOpacity={1} fill="url(#colorIndexable)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: SEO Audits / Anomalies */}
              <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">SEO Quality Tag Issues</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Monitoring pages missing titles or meta descriptions over time.</p>
                </div>
                <div className="h-[250px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chronologicalHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(v) => v.split("T")[0]} 
                        style={{ fontSize: "9px" }} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <YAxis style={{ fontSize: "9px" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "8px", fontSize: "11px", color: "#fff" }} />
                      <Legend verticalAlign="top" height={36} iconType="circle" style={{ fontSize: "11px" }} />
                      <Line type="monotone" dataKey="missing_title" name="Missing Title" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="missing_description" name="Missing Description" stroke="#eab308" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Response Speeds Timeline */}
              <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Site Performance Velocity</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Historical average load times inside the Deep Crawler parser.</p>
                </div>
                <div className="h-[250px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chronologicalHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(v) => v.split("T")[0]} 
                        style={{ fontSize: "9px" }} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <YAxis unit="ms" style={{ fontSize: "9px" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "8px", fontSize: "11px", color: "#fff" }} />
                      <Legend verticalAlign="top" height={36} iconType="circle" style={{ fontSize: "11px" }} />
                      <Area type="natural" dataKey="avg_response_time" name="Avg Response Time (ms)" stroke="#ec4899" fillOpacity={1} fill="url(#colorSpeed)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 4: Technical Error logs */}
              <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Broken Links & Redirects</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Timeline monitoring of page indexation failures (errors & redirects).</p>
                </div>
                <div className="h-[250px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chronologicalHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(v) => v.split("T")[0]} 
                        style={{ fontSize: "9px" }} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <YAxis style={{ fontSize: "9px" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "8px", fontSize: "11px", color: "#fff" }} />
                      <Legend verticalAlign="top" height={36} iconType="circle" style={{ fontSize: "11px" }} />
                      <Bar dataKey="errors" name="Errors" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="total_redirects" name="Redirects" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {/* Sub-tab 3: Crawl-to-Crawl Comparison */}
          {activeSubTab === "comparison" && (
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm animate-in fade-in duration-300">
              <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Crawl Side-by-Side Comparison</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Select two historical crawl dates to visualize improvements or regressions.</p>
                </div>

                {/* selectors */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Crawl A:</span>
                    <select 
                      value={compCrawl1Id} 
                      onChange={(e) => setCompCrawl1Id(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none text-xs font-semibold px-2 py-1 rounded cursor-pointer text-slate-700 dark:text-slate-300"
                    >
                      {filteredHistory.map(c => (
                        <option key={c.id} value={c.id}>{c.date.split("T")[0]} ({c.pages} pgs)</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Crawl B:</span>
                    <select 
                      value={compCrawl2Id} 
                      onChange={(e) => setCompCrawl2Id(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none text-xs font-semibold px-2 py-1 rounded cursor-pointer text-slate-700 dark:text-slate-300"
                    >
                      {filteredHistory.map(c => (
                        <option key={c.id} value={c.id}>{c.date.split("T")[0]} ({c.pages} pgs)</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Comparison Sheet */}
              {comparisonCrawl1 && comparisonCrawl2 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <th className="py-2.5 px-4 font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase">SEO Metric Category</th>
                        <th className="py-2.5 px-4 font-bold text-slate-700 dark:text-slate-300">Crawl A ({comparisonCrawl1.date.split("T")[0]})</th>
                        <th className="py-2.5 px-4 font-bold text-slate-700 dark:text-slate-300">Crawl B ({comparisonCrawl2.date.split("T")[0]})</th>
                        <th className="py-2.5 px-4 font-bold text-slate-700 dark:text-slate-300">Absolute Difference / Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {[
                        { label: "Pages Crawled", key: "pages", lowerIsBetter: false },
                        { label: "Page Auditing Errors", key: "errors", lowerIsBetter: true },
                        { label: "Total Backlinks/Links", key: "total_links", lowerIsBetter: false },
                        { label: "Internal Hyperlinks", key: "total_internal_links", lowerIsBetter: false },
                        { label: "External Hyperlinks", key: "total_external_links", lowerIsBetter: false },
                        { label: "Indexable URL Count", key: "indexable_pages", lowerIsBetter: false },
                        { label: "Not-Indexable Pages", key: "not_indexable_pages", lowerIsBetter: true },
                        { label: "CSS Files", key: "total_css", lowerIsBetter: false },
                        { label: "JavaScript Files", key: "total_javascript", lowerIsBetter: false },
                        { label: "Images Scanned", key: "total_images", lowerIsBetter: false },
                        { label: "3xx Redirect URLs", key: "total_redirects", lowerIsBetter: true },
                        { label: "Avg Response Speed (ms)", key: "avg_response_time", lowerIsBetter: true },
                        { label: "Max Crawl Depth Reach", key: "max_crawl_depth", lowerIsBetter: false },
                        { label: "Missing Meta Titles", key: "missing_title", lowerIsBetter: true },
                        { label: "Missing Meta Descriptions", key: "missing_description", lowerIsBetter: true },
                        { label: "Schema / Structured Data Pages", key: "total_schema_pages", lowerIsBetter: false },
                        { label: "Secure Pages (HTTPS)", key: "total_secure_pages", lowerIsBetter: false },
                        { label: "Mobile-Friendly Pages", key: "total_mobile_pages", lowerIsBetter: false }
                      ].map((row, idx) => {
                        const val1 = (comparisonCrawl1[row.key as keyof DeepCrawlHistory] ?? 0) as number;
                        const val2 = (comparisonCrawl2[row.key as keyof DeepCrawlHistory] ?? 0) as number;
                        const diff = val2 - val1;
                        const isImproved = row.lowerIsBetter ? diff < 0 : diff > 0;
                        const hasNoChange = diff === 0;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                            <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">{row.label}</td>
                            <td className="py-2.5 px-4 font-medium font-mono text-slate-600 dark:text-slate-400">{val1.toLocaleString()}</td>
                            <td className="py-2.5 px-4 font-medium font-mono text-slate-600 dark:text-slate-400">{val2.toLocaleString()}</td>
                            <td className="py-2.5 px-4">
                              {hasNoChange ? (
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">No Change</span>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className={`font-mono font-bold ${isImproved ? "text-emerald-500" : "text-rose-500"}`}>
                                    {diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()}
                                  </span>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                    isImproved ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                  }`}>
                                    {isImproved ? "Improved" : "Regressed"}
                                  </span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <span className="text-xs text-slate-400">At least 2 historical crawl records are required for comparison analytics.</span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
