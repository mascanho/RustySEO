// @ts-nocheck
import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import {
  FileText,
  Server,
  Bot,
  PenBox,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IoLogoGoogle, IoLogoFacebook } from "react-icons/io5";
import { SiSemrush } from "react-icons/si";
import { Link2 } from "lucide-react";
import { TbBrandBing, TbDatabasePlus, TbSpider } from "react-icons/tb";
import { RiOpenaiFill, RiRobot2Fill, RiRobot3Line } from "react-icons/ri";
import { FaSpider } from "react-icons/fa6";
import { useLogAnalysis, useLogAnalysisStore } from "@/store/ServerLogsStore";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// Lazy load components
const WidgetTable = lazy(() =>
  import("./WidgetTables/WidgetCrawlersTable").then((module) => ({
    default: module.WidgetTable,
  })),
);
const WidgetTableBing = lazy(() =>
  import("./WidgetTables/WidgetCrawlersBingTable").then((module) => ({
    default: module.WidgetTableBing,
  })),
);
const WidgetTableOpenAi = lazy(() =>
  import("./WidgetTables/WidgetCrawlersOpenAITable").then((module) => ({
    default: module.WidgetTableOpenAi,
  })),
);
const WidgetTableClaude = lazy(() =>
  import("./WidgetTables/WidgetCrawlersClaudeTable").then((module) => ({
    default: module.WidgetTableClaude,
  })),
);
const WidgetContentTable = lazy(() =>
  import("./WidgetTables/WidgetContentTable").then((module) => ({
    default: module.WidgetContentTable,
  })),
);
const WidgetFileType = lazy(() =>
  import("./WidgetTables/WidgetFileType").then((module) => ({
    default: module.WidgetFileType,
  })),
);
const WidgetUserAgentsTable = lazy(() =>
  import("./WidgetTables/WidgetUserAgentsTable").then((module) => ({
    default: module.WidgetUserAgentsTable,
  })),
);
const WidgetReferrersTable = lazy(() =>
  import("./WidgetTables/WidgetReferrersTable").then((module) => ({
    default: module.WidgetReferrersTable,
  })),
);
const WidgetStatusCodesTable = lazy(() =>
  import("./WidgetTables/WidgetStatusCodesTable").then((module) => ({
    default: module.WidgetStatusCodesTable,
  })),
);

import { Tabs } from "@mantine/core";

import { FaInfoCircle } from "react-icons/fa";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import PopOverParsedLogs from "./PopOverParsedLogs";
import { useServerLogsStore } from "@/store/ServerLogsGlobalStore";

import { GiPoliceOfficerHead, GiRobotGolem, GiSpiderWeb } from "react-icons/gi";

import { GiHypersonicBolt } from "react-icons/gi";
import { categorizeUserAgent } from "./WidgetTables/helpers/useCategoriseUserAgents";
import { categorizeReferrer } from "./WidgetTables/helpers/useCategoriseReferrer";
import { GrDocumentStore } from "react-icons/gr";
import { WidgetIndexingCrawlersTable } from "./WidgetTables/WidgetIndexingCrawlersTable";

const tabs = [
  { label: "Filetypes", icon: <FileText className="w-4 h-4" /> },
  { label: "Content", icon: <PenBox className="w-4 h-4" /> },
  { label: "Status Codes", icon: <Server className="w-4 h-4" /> },
  { label: "Aggregated Crawlers", icon: <GiRobotGolem className="w-4 h-4" /> },
  { label: "User Agents", icon: <GiPoliceOfficerHead className="w-4 h-4" /> },
  { label: "Referrers", icon: <GiHypersonicBolt className="w-4 h-4" /> },
  {
    label: "Indexing Crawlers",
    icon: <TbSpider className="w-4 h-4" />,
  },
  { label: "Retrieval Agents", icon: <TbDatabasePlus className="w-4 h-4" /> },
  { label: "Agentic Bots", icon: <RiRobot3Line className="w-4 h-3" /> },
];

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#6366f1",
  "#6b7280",
  "#ec4899",
  "#14b8a6",
];

// Helper function to get status code text
const getStatusText = (code) => {
  const codes = {
    "200": "OK",
    "301": "Redirect",
    "404": "Not Found",
    "500": "Server Error",
  };
  return codes[code] || "";
};

const FallbackLoader = () => (
  <div className="flex flex-col items-center justify-center h-96 w-full">
    <Loader2 className="h-10 w-10 animate-spin text-brand-bright" />
    <p className="mt-4 text-sm text-gray-500 font-medium">
      Processing component...
    </p>
  </div>
);

export default function WidgetLogs() {
  const [activeTab, setActiveTab] = useState("Filetypes");
  const [selectedIndexingCrawler, setSelectedIndexingCrawler] = useState<string | null>(null);
  const [openDialogs, setOpenDialogs] = useState({});

  const getCrawlerIcon = (crawlerType: string) => {
    const ct = crawlerType.toLowerCase();
    if (ct.includes("google")) {
      return {
        icon: <IoLogoGoogle size={18} />,
        color: "text-blue-600 dark:text-blue-400",
      };
    }
    if (ct.includes("bing")) {
      return {
        icon: <TbBrandBing size={18} />,
        color: "text-teal-600 dark:text-teal-400",
      };
    }
    if (ct.includes("semrush")) {
      return {
        icon: <SiSemrush size={16} />,
        color: "text-orange-600 dark:text-orange-400",
      };
    }
    if (ct.includes("ahrefs") || ct.includes("hrefs")) {
      return {
        icon: <Link2 size={18} />,
        color: "text-blue-700 dark:text-blue-300",
      };
    }
    if (ct.includes("moz")) {
      return {
        icon: <RiRobot2Fill size={18} />,
        color: "text-blue-500 dark:text-blue-400",
      };
    }
    if (
      ct.includes("openai") ||
      ct.includes("gptbot") ||
      ct.includes("chatgpt")
    ) {
      return {
        icon: <RiOpenaiFill size={18} />,
        color: "text-emerald-600 dark:text-emerald-400",
      };
    }
    if (ct.includes("claude") || ct.includes("anthropic")) {
      return {
        icon: <RiOpenaiFill size={18} />,
        color: "text-amber-700 dark:text-amber-400",
      };
    }
    if (ct.includes("meta") || ct.includes("facebook")) {
      return {
        icon: <IoLogoFacebook size={18} />,
        color: "text-blue-600 dark:text-blue-400",
      };
    }
    // Generic bot
    if (ct.includes("bot") || ct.includes("crawler") || ct.includes("spider")) {
      return {
        icon: <FaSpider size={16} />,
        color: "text-purple-600 dark:text-purple-400",
      };
    }
    return {
      icon: <Bot size={18} />,
      color: "text-gray-500 dark:text-gray-400",
    };
  };
  const overview = useLogAnalysisStore((state) => state.overview);
  const totalCount = useLogAnalysisStore((state) => state.totalCount);
  const widgetAggs = useLogAnalysisStore((state) => state.widgetAggs);
  const { entries } = useLogAnalysisStore((state) => ({
    entries: state.entries,
  }));
  const pathAggregations = useLogAnalysisStore(
    (state) => state.pathAggregations,
  );
  const { uploadedLogFiles } = useServerLogsStore();
  const [taxonomyNameMap, setTaxonomyNameMap] = useState({});
  const [sortedTaxonomyPaths, setSortedTaxonomyPaths] = useState([]);

  useEffect(() => {
    const loadTaxonomies = () => {
      const storedTaxonomies = localStorage.getItem("taxonomies");
      if (storedTaxonomies) {
        try {
          const parsed = JSON.parse(storedTaxonomies);
          if (Array.isArray(parsed)) {
            const newMap = {};
            parsed.forEach((tax) => {
              if (tax.paths) {
                tax.paths.forEach((p) => {
                  const pathString = typeof p === "string" ? p : p.path;
                  if (pathString) {
                    newMap[pathString] = tax.name;
                  }
                });
              }
            });
            setTaxonomyNameMap(newMap);

            const sortedPaths = Object.entries(newMap).sort(
              (a, b) => b[0].length - a[0].length,
            );
            setSortedTaxonomyPaths(sortedPaths);
          }
        } catch (e) {
          console.error("Failed to parse taxonomies from localStorage", e);
          localStorage.removeItem("taxonomies");
          setTaxonomyNameMap({});
          setSortedTaxonomyPaths([]);
        }
      } else {
        setTaxonomyNameMap({});
        setSortedTaxonomyPaths([]);
      }
    };

    loadTaxonomies();

    const handleTaxonomiesUpdate = () => {
      loadTaxonomies();
    };

    window.addEventListener("taxonomiesUpdated", handleTaxonomiesUpdate);

    return () => {
      window.removeEventListener("taxonomiesUpdated", handleTaxonomiesUpdate);
    };
  }, []);

  // Prepare filetype data from actual entries
  const fileTypeData = useMemo(
    () => widgetAggs?.file_types || {},
    [widgetAggs],
  );

  // Prepare content data from actual entries
  const contentData = useMemo(() => widgetAggs?.content || {}, [widgetAggs]);

  // Prepare status code data from actual entries
  const statusCodeData = useMemo(
    () => widgetAggs?.status_codes || {},
    [widgetAggs],
  );

  // Prepare crawler data based on overview totals
  const crawlerData = useMemo(() => {
    if (!overview?.totals) return [];

    const counts = {
      Google: overview.totals.google || 0,
      Bing: overview.totals.bing || 0,
      Semrush: overview.totals.semrush || 0,
      Hrefs: overview.totals.hrefs || 0,
      Moz: overview.totals.moz || 0,
      Uptime: overview.totals.uptime || 0,
      Openai: overview.totals.openai || 0,
      Claude: overview.totals.claude || 0,
    };

    return Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [overview]);

  // Prepare Indexing Crawlers data - get all unique crawler types from entries
  const indexingCrawlersData = useMemo(() => {
    if (!entries || entries.length === 0) return [];

    const crawlerCounts: Record<string, number> = {};
    entries.forEach((entry) => {
      if (entry.crawler_type) {
        crawlerCounts[entry.crawler_type] = (crawlerCounts[entry.crawler_type] || 0) + (entry.frequency || 1);
      }
    });

    return Object.entries(crawlerCounts)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [entries]);

  // Prepare User Agents Data
  const userAgentData = useMemo(() => {
    if (!widgetAggs) return {};

    const acc: Record<string, { count: number; examples: string[] }> = {};

    if (widgetAggs.user_agent_categories) {
      Object.entries(widgetAggs.user_agent_categories).forEach(
        ([cat, count]) => {
          acc[cat] = { count, examples: [] };
        },
      );
    }

    if (widgetAggs.user_agents) {
      Object.entries(widgetAggs.user_agents).forEach(([ua, count]) => {
        const cat = categorizeUserAgent(ua);
        if (!acc[cat]) {
          acc[cat] = { count: 0, examples: [] };
        }

        if (!widgetAggs.user_agent_categories) {
          acc[cat].count += count;
        }

        if (acc[cat].examples.length < 5 && !acc[cat].examples.includes(ua)) {
          acc[cat].examples.push(ua);
        }
      });
    }

    return acc;
  }, [widgetAggs]);

  // Prepare Referrers Data
  const referrerData = useMemo(() => {
    if (!widgetAggs) return {};

    const acc: Record<string, { count: number; referrers: string[] }> = {};

    if (widgetAggs.referrer_categories) {
      Object.entries(widgetAggs.referrer_categories).forEach(([cat, count]) => {
        acc[cat] = { count, referrers: [] };
      });
    }

    if (widgetAggs.referrers) {
      Object.entries(widgetAggs.referrers).forEach(([referrer, count]) => {
        const cat = categorizeReferrer(referrer);
        if (!acc[cat]) {
          acc[cat] = { count: 0, referrers: [] };
        }

        if (!widgetAggs.referrer_categories) {
          acc[cat].count += count;
        }

        if (
          acc[cat].referrers.length < 5 &&
          !acc[cat].referrers.includes(referrer)
        ) {
          acc[cat].referrers.push(referrer);
        }
      });
    }

    return acc;
  }, [widgetAggs]);

  // Get chart data for active tab
  const chartData = useMemo(() => {
    if (activeTab === "Content") {
      const contentBySegment = Object.entries(contentData || {}).reduce(
        (acc, [pathOrName, value]) => {
          const name =
            pathOrName.toLowerCase() === "other"
              ? "Uncategorized"
              : taxonomyNameMap[pathOrName] || pathOrName;

          if (!acc[name]) {
            acc[name] = { value: 0 };
          }
          acc[name].value += value;
          return acc;
        },
        {},
      );

      return Object.entries(contentBySegment)
        .map(([name, data]) => ({
          name: name,
          value: data.value,
        }))
        .sort((a, b) => b.value - a.value);
    }

    if (activeTab === "User Agents") {
      if (!userAgentData) return [];

      return Object.entries(userAgentData)
        .map(([name, data]) => ({
          name: name,
          value: data.count,
          examples: data.examples,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 20);
    }

    if (activeTab === "Referrers") {
      if (!referrerData) return [];

      return Object.entries(referrerData)
        .map(([name, data]) => ({
          name: name,
          value: data.count,
          referrers: data.referrers,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 20);
    }

    // Indexing Crawlers
    if (activeTab === "Indexing Crawlers") {
      return indexingCrawlersData;
    }

    return (
      {
        Filetypes: Object.entries(fileTypeData || {})
          .map(([name, value]) => ({
            name: name.toUpperCase(),
            value,
          }))
          .sort((a, b) => b.value - a.value),
        "Status Codes": Object.entries(statusCodeData || {})
          .map(([name, value]) => ({
            name: `${name} ${getStatusText(name)}`,
            value,
          }))
          .sort((a, b) => b.value - a.value),
        "Aggregated Crawlers": crawlerData.length > 0 ? crawlerData : [],
        "Indexing Crawlers": indexingCrawlersData,
      }[activeTab] || []
    );
  }, [
    activeTab,
    contentData,
    taxonomyNameMap,
    userAgentData,
    referrerData,
    fileTypeData,
    statusCodeData,
    crawlerData,
    indexingCrawlersData,
  ]);

  const totalLogsAnalysed = useMemo(
    () =>
      uploadedLogFiles
        .map((log) => log?.names?.length || 0)
        .reduce((a, b) => a + b, 0),
    [uploadedLogFiles],
  );

  const formatNumber = (num: number) => num?.toLocaleString() || "0";

  const handleOpenChange = (name, isOpen) => {
    setOpenDialogs((prev) => ({ ...prev, [name]: isOpen }));
  };

  return (
    <div className="bg-white border dark:border-brand-dark shadow rounded-none p-2 pr-1 w-1/2 mx-auto dark:bg-slate-950 dark:text-white h-64 relative">
      {/* Top Info Popover */}
      <Popover>
        <PopoverTrigger className="absolute top-3 font-bold text-black/20 dark:text-white/50 text-xl">
          <div className="flex flex-col items-start justify-start">
            <span className="hover:text-brand-bright">
              {formatNumber(totalCount)} entries
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="min-w-[300px] max-w-96 py-2 px-0 mt-2 relative z-20">
          <PopOverParsedLogs />
        </PopoverContent>
      </Popover>

      {/* Bottom Info Popover */}
      {uploadedLogFiles.length > 0 && (
        <Popover>
          <PopoverTrigger className="absolute bottom-1 left-3 flex cursor-pointer items-center">
            <FaInfoCircle className="h-4 w-4 text-brand-bright" />
            <div className="flex items-center space-x-0.5 text-brand-bright/50 cursor-pointer ml-1.5">
              <span className="text-xs inline-block">
                {totalLogsAnalysed || 0} logs
              </span>
              <span>/</span>
              <span className="text-xs inline-block">
                {uploadedLogFiles?.length || 0} batches
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="min-w-[300px] max-w-96 py-2 px-0 mt-2 relative z-20">
            <PopOverParsedLogs />
          </PopoverContent>
        </Popover>
      )}

      {/* Tab Dropdown ON THE TOP RIGHT*/}
      <div className="absolute top-3 right-3 z-30">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-full border dark:border-brand-dark transition-all hover:bg-gray-200 dark:hover:bg-slate-700 shadow-sm group">
              <div className="flex items-center space-x-1.5">
                {tabs.find((t) => t.label === activeTab)?.icon}
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-700 dark:text-gray-200">
                  {activeTab}
                </span>
              </div>
              <div className="w-[1px] h-3 bg-gray-300 dark:bg-gray-600 mx-1" />
              <MoreHorizontal className="w-3.5 h-3.5 text-gray-500 group-hover:text-brand-bright transition-colors" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 dark:bg-slate-900 dark:border-brand-dark rounded-xl shadow-2xl border-gray-200 p-1 bg-white"
          >
            {tabs.map((tab) => (
              <DropdownMenuItem
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={`flex items-center space-x-2 px-3 py-2 text-[9px] uppercase tracking-wider font-bold cursor-pointer rounded-lg transition-colors ${
                  activeTab === tab.label
                    ? "bg-brand-bright text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-brand-bright dark:hover:text-white hover:text-white "
                }`}
              >
                <div
                  className={
                    activeTab === tab.label
                      ? "text-white"
                      : "text-brand-bright dark:hover:text-white hover:text-white"
                  }
                >
                  <span className="dark:text-red-500 hover:text-white text-red-500 ">
                    {tab.icon}
                  </span>
                </div>
                <span>{tab.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content Area */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="h-[calc(100%-32px)] mt-6"
      >
        <div className="flex flex-col md:flex-row items-center justify-center relative">
          <PieChart width={200} height={200} className="relative">
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
            >
              {chartData.map((_, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => {
                const total = chartData.reduce(
                  (sum, item) => sum + item.value,
                  0,
                );
                const percentage =
                  total > 0 ? Math.round((Number(value) / total) * 100) : 0;
                return [
                  `${name}: ${value.toLocaleString()} (${percentage}%)`,
                  null,
                ];
              }}
              contentStyle={{
                backgroundColor: "#1f2937",
                borderColor: "#374151",
                borderRadius: "0.375rem",
                color: "#f9fafb",
                height: "30px",
                display: "flex",
                alignItems: "center",
              }}
              itemStyle={{
                color: "#f9fafb",
                fontSize: "0.75rem",
              }}
            />
          </PieChart>

          <div
            className={`grid gap-2 w-full max-w-2xl pl-4  ${
              activeTab === "User Agents" || activeTab === "Referrers"
                ? "grid-cols-5 max-w-2xl mr-6"
                : activeTab === "Status Codes"
                  ? "grid-cols-4 mr-6"
                  : "grid-cols-4 mr-6"
            }`}
          >
            {chartData.map((entry, idx) => (
              <Dialog
                key={`${entry.name}-${idx}`}
                open={openDialogs[entry.name] || false}
                onOpenChange={(isOpen) => handleOpenChange(entry.name, isOpen)}
              >
                <DialogTrigger className="cursor-pointer hover:scale-105 ease-in transition-all delay-75">
                  <div
                    className="flex justify-between items-center border border-gray-100 px-2 py-1 rounded-md text-xs dark:border-brand-dark overflow-auto"
                    style={{
                      borderLeft: `3px solid ${COLORS[idx % COLORS.length]}`,
                      backgroundColor: `${COLORS[idx % COLORS.length]}10`,
                    }}
                  >
                    <span className="truncate dark:text-white">
                      {entry.name}
                    </span>
                    <span
                      className="font-medium ml-2"
                      style={{ color: COLORS[idx % COLORS.length] }}
                    >
                      {entry.value.toLocaleString()}
                    </span>
                  </div>
                </DialogTrigger>

                {/* SINGLE DialogContent with conditional rendering */}
                <DialogContent className="max-w-11/12 w-11/12  dark:text-white dark:border-brand-bright dark:bg-brand-darker max-h-[90vh] overflow-hidden">
                  {activeTab === "Filetypes" ? (
                    <WidgetFileType
                      data={overview}
                      entries={entries}
                      chartData={chartData}
                      segment={entry?.name}
                      selectedFileType={entry?.name}
                    />
                  ) : activeTab === "Status Codes" ? (
                    <WidgetStatusCodesTable
                      data={overview}
                      entries={entries}
                      segment={entry?.name}
                    />
                  ) : activeTab === "Referrers" ? (
                    <WidgetReferrersTable
                      data={overview}
                      entries={entries}
                      segment={entry?.name}
                    />
                  ) : activeTab === "Content" ? (
                    <Tabs defaultValue="logs" className="h-full">
                      <Tabs.List>
                        <Tabs.Tab value="overview">Overview</Tabs.Tab>
                        <Tabs.Tab value="logs">URLs</Tabs.Tab>
                      </Tabs.List>
                      <Tabs.Panel value="overview" className="h-full">
                        <section className="h-[740px] flex flex-col justify-between">
                          <div>
                            <DialogHeader>
                              <DialogTitle className="mt-4">
                                Segment Breakdown:{" "}
                                <span className="text-brand-bright">
                                  {entry.name}
                                </span>
                              </DialogTitle>
                            </DialogHeader>
                            <div className="pt-8 space-y-1">
                              <h3 className="font-medium dark:text-white/50 text-black/50">
                                Paths in this segment:
                              </h3>
                              <div className="max-h-60 overflow-y-auto space-y-1">
                                {entry.paths &&
                                  Object.entries(entry.paths).map(
                                    ([path, count]) => (
                                      <div
                                        key={path}
                                        className="flex pt-2 justify-between text-sm p-1 rounded-md bg-brand-bright/10 dark:bg-slate-800/50 px-2"
                                      >
                                        <span className="font-mono text-xs text-brand-bright">
                                          {path}
                                        </span>
                                        <span className="font-medium text-brand-bright">
                                          {count.toLocaleString()}
                                        </span>
                                      </div>
                                    ),
                                  )}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between font-bold pt-4">
                            <span className="text-black/50 dark:text-white/50">
                              Total Entries:
                            </span>
                            <span className="text-brand-bright pr-1">
                              {entry.value.toLocaleString()}
                            </span>
                          </div>
                        </section>
                      </Tabs.Panel>
                      <Tabs.Panel value="logs" className="h-full">
                        <WidgetContentTable
                          data={overview}
                          entries={entries}
                          segment={entry?.name}
                        />
                      </Tabs.Panel>
                    </Tabs>
                  ) : // USER AGENTS TABLE
                  activeTab === "User Agents" ? (
                    <WidgetUserAgentsTable
                      data={overview}
                      entries={entries}
                      segment={entry?.name}
                    />
                  ) : activeTab === "Indexing Crawlers" ? (
                    <WidgetIndexingCrawlersTable
                      data={overview}
                      entries={entries}
                      segment={entry?.name}
                    />
                  ) : ["Google", "Bing", "Openai", "Claude"].includes(
                      entry?.name,
                    ) ? (
                    <div className="flex flex-col h-full">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-2 shrink-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span
                              className={`p-2 rounded-md border bg-white dark:bg-zinc-800/80 dark:border-zinc-700 shadow-sm ${getCrawlerIcon(entry.name).color}`}
                            >
                              {getCrawlerIcon(entry.name).icon}
                            </span>
                            <div>
                              <h3 className="font-semibold text-blue-800 dark:text-blue-300">
                                Viewing: {entry.name} Bot
                              </h3>
                              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                                Showing request activity and analysis for{" "}
                                {entry.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 whitespace-nowrap text-sm px-3 py-1"
                            >
                              {pathAggregations.total_unique_paths.toLocaleString()}{" "}
                              unique paths
                            </Badge>
                            <Badge
                              variant="outline"
                              className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 whitespace-nowrap text-sm px-3 py-1"
                            >
                              {pathAggregations.total_hits.toLocaleString()}{" "}
                              hits
                            </Badge>
                            <Badge
                              variant="outline"
                              className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 whitespace-nowrap text-sm px-3 py-1"
                            >
                              {entry.value.toLocaleString()} requests
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Tabs
                        defaultValue="overview"
                        className="h-full mt-4 flex-1 flex flex-col min-h-0"
                      >
                        <Tabs.List>
                          <Tabs.Tab value="overview">Frequency Table</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panel value="overview" className="h-full">
                          {entry?.name === "Google" && (
                            <WidgetTable data={overview} entries={entries} />
                          )}
                          {entry?.name === "Bing" && (
                            <WidgetTableBing
                              data={overview}
                              entries={entries}
                            />
                          )}
                          {entry?.name === "Openai" && (
                            <WidgetTableOpenAi
                              data={overview}
                              entries={entries}
                            />
                          )}
                          {entry?.name === "Claude" && (
                            <WidgetTableClaude
                              data={overview}
                              entries={entries}
                            />
                          )}
                        </Tabs.Panel>
                      </Tabs>
                    </div>
                  ) : activeTab === "Aggregated Crawlers" ? (
                    <>
                      <DialogHeader>
                        <DialogTitle>{entry.name} Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Total Requests:</span>
                          <span className="font-medium">
                            {entry.value.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Percentage:</span>
                          <span className="font-medium">
                            {Math.round(
                              (entry.value /
                                chartData.reduce(
                                  (sum, item) => sum + item.value,
                                  0,
                                )) *
                                100,
                            )}
                            %
                          </span>
                        </div>
                      </div>
                    </>
                  ) : null}
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}