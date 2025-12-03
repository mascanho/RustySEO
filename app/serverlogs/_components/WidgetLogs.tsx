// @ts-nocheck
import { useState, useEffect } from "react";
import { FileText, Server, Bot, PenBox } from "lucide-react";
import { motion } from "framer-motion";
import { useLogAnalysis } from "@/store/ServerLogsStore";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WidgetTable } from "./WidgetTables/WidgetCrawlersTable.tsx";
import { Tabs } from "@mantine/core";

import { useCurrentLogs } from "@/store/logFilterStore";
import { FaInfoCircle } from "react-icons/fa";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import PopOverParsedLogs from "./PopOverParsedLogs";
import { useServerLogsStore } from "@/store/ServerLogsGlobalStore";
import { WidgetTableBing } from "./WidgetTables/WidgetCrawlersBingTable.tsx";
import { WidgetTableOpenAi } from "./WidgetTables/WidgetCrawlersOpenAITable.tsx";
import { WidgetTableClaude } from "./WidgetTables/WidgetCrawlersClaudeTable.tsx";
import { WidgetContentTable } from "./WidgetTables/WidgetContentTable.tsx";
import { WidgetFileType } from "./WidgetTables/WidgetFileType.tsx";
import { GiPoliceOfficerHead } from "react-icons/gi";
import { WidgetUserAgentsTable } from "./WidgetTables/WidgetUserAgentsTable.tsx";
import { WidgetReferrersTable } from "./WidgetTables/WidgetReferrersTable.tsx";
import { GiHypersonicBolt } from "react-icons/gi";
import { categorizeUserAgent } from "./WidgetTables/helpers/useCategoriseUserAgents.ts";
import { categorizeReferrer } from "./WidgetTables/helpers/useCategoriseReferrer.ts";
import { WidgetStatusCodesTable } from "./WidgetTables/WidgetStatusCodesTable.tsx";

const tabs = [
  { label: "Filetypes", icon: <FileText className="w-4 h-4" /> },
  { label: "Content", icon: <PenBox className="w-4 h-4" /> },
  { label: "Status Codes", icon: <Server className="w-4 h-4" /> },
  { label: "Crawlers", icon: <Bot className="w-4 h-4" /> },
  { label: "User Agents", icon: <GiPoliceOfficerHead className="w-4 h-4" /> },
  { label: "Referrers", icon: <GiHypersonicBolt className="w-3 h-3" /> },
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

export default function WidgetLogs() {
  const [activeTab, setActiveTab] = useState("Filetypes");
  const { overview, entries } = useLogAnalysis();
  const [openDialogs, setOpenDialogs] = useState({});
  const { currentLogs } = useCurrentLogs();
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
                // Ensure paths are in the format expected by PathConfig, accounting for old string format
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
          // If parsing fails, clear localStorage and current taxonomies
          localStorage.removeItem("taxonomies");
          setTaxonomyNameMap({});
          setSortedTaxonomyPaths([]);
        }
      } else {
        // If no stored taxonomies, clear current ones
        setTaxonomyNameMap({});
        setSortedTaxonomyPaths([]);
      }
    };

    // Load taxonomies initially and whenever the custom event fires
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
  const fileTypeData = currentLogs?.reduce((acc, entry) => {
    const type = entry.file_type || "Other";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Prepare content data from actual entries
  const contentData =
    currentLogs?.reduce((acc, entry) => {
      const taxonomy = entry.taxonomy;
      if (taxonomy && taxonomy !== "other") {
        acc[taxonomy] = (acc[taxonomy] || 0) + 1;
      } else {
        acc["other"] = (acc["other"] || 0) + 1;
      }
      return acc;
    }, {}) || {};

  // Prepare status code data from actual entries
  const statusCodeData = currentLogs?.reduce((acc, entry) => {
    const code = entry.status;
    acc[code] = (acc[code] || 0) + 1;
    return acc;
  }, {});

  // Prepare crawler data
  const crawlerData = overview?.totals
    ? Object.entries(overview.totals)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
        }))
        .sort((a, b) => b.value - a.value)
    : [];

  // Prepare User Agents Data
  const userAgentData = currentLogs?.reduce((acc, entry) => {
    const userAgent = entry.user_agent || "Unknown";

    // Categorize user agents to make the data more manageable
    const categorizedAgent = categorizeUserAgent(userAgent);

    if (!acc[categorizedAgent]) {
      acc[categorizedAgent] = { count: 0, examples: [] };
    }

    acc[categorizedAgent].count += 1;

    // Keep a few examples of user agents in this category (max 5)
    if (
      acc[categorizedAgent].examples.length < 5 &&
      !acc[categorizedAgent].examples.includes(userAgent)
    ) {
      acc[categorizedAgent].examples.push(userAgent);
    }

    return acc;
  }, {});

  // Prepare Referrers Data
  const referrerData = currentLogs?.reduce((acc, entry) => {
    const referrer = entry.referer || "Direct/None";

    // Categorize referrers to make the data more manageable
    const categorizedReferrer = categorizeReferrer(referrer);

    if (!acc[categorizedReferrer]) {
      acc[categorizedReferrer] = { count: 0, referrers: [] };
    }

    acc[categorizedReferrer].count += 1;

    // Keep a few examples of referrers in this category (max 5)
    if (
      acc[categorizedReferrer].referrers.length < 5 &&
      !acc[categorizedReferrer].referrers.includes(referrer)
    ) {
      acc[categorizedReferrer].referrers.push(referrer);
    }

    return acc;
  }, {});

  // Get chart data for active tab
  const getChartData = () => {
    if (activeTab === "Content") {
      const contentBySegment = Object.entries(contentData || {}).reduce(
        (acc, [path, value]) => {
          const name = taxonomyNameMap[path] || "Other";
          if (!acc[name]) {
            acc[name] = { value: 0, paths: {} };
          }
          acc[name].value += value;
          acc[name].paths[path] = value;
          return acc;
        },
        {},
      );

      return Object.entries(contentBySegment).map(([name, data]) => ({
        name: name,
        value: data.value,
        paths: data.paths,
      }));
    }

    if (activeTab === "User Agents") {
      // Convert userAgentData to chart format
      if (!userAgentData) return [];

      return Object.entries(userAgentData)
        .map(([name, data]) => ({
          name: name,
          value: data.count,
          examples: data.examples,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 20); // Limit to top 20 for readability
    }

    if (activeTab === "Referrers") {
      // Convert referrerData to chart format
      if (!referrerData) return [];

      return Object.entries(referrerData)
        .map(([name, data]) => ({
          name: name,
          value: data.count,
          referrers: data.referrers,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 20); // Limit to top 20 for readability
    }

    return (
      {
        Filetypes: Object.entries(fileTypeData || {})
          .map(([name, value]) => ({
            name: name.toUpperCase(),
            value,
          }))
          .sort((a, b) => b.value - a.value), // Add this sort
        "Status Codes": Object.entries(statusCodeData || {})
          .map(([name, value]) => ({
            name: `${name} ${getStatusText(name)}`,
            value,
          }))
          .sort((a, b) => b.value - a.value), // Add this sort too if you want
        Crawlers: crawlerData.length > 0 ? crawlerData : [],
      }[activeTab] || []
    );
  };

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

  const chartData = getChartData();

  if (!overview) {
    return (
      <div className="bg-white shadow rounded-lg p-4 w-full h-64 flex items-center justify-center dark:bg-brand-darker">
        <p className="text-gray-500 dark:text-gray-400">Loading data...</p>
      </div>
    );
  }

  // Format numbers with commas
  const formatNumber = (num: number) => num?.toLocaleString() || "0";

  const handleOpenChange = (name, isOpen) => {
    setOpenDialogs((prev) => ({ ...prev, [name]: isOpen }));
  };

  const totalLogsAnalysed = uploadedLogFiles
    .map((log) => log?.names?.length)
    .reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white border dark:border-brand-dark shadow rounded-none p-2 pr-1 w-1/2  mx-auto dark:bg-slate-950 dark:text-white h-64 relative">
      <Popover>
        <PopoverTrigger className="absolute top-3 font-bold text-black/20 dark:text-white/50 text-xl">
          <div className="flex flex-col items-start justify-start">
            <span className="hover:text-brand-bright">
              {formatNumber(currentLogs?.length)} entries
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="min-w-[300px] max-w-96  py-2 px-0 mt-2 relative z-20">
          <PopOverParsedLogs />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger className="absolute bottom-1 left-3 flex cursor-pointer">
          {uploadedLogFiles.length > 0 && (
            <>
              <FaInfoCircle className=" h-4 w-4 text-brand-bright" />

              <div className="flex items-center space-x-0.5 text-brand-bright/50 cursor-pointer -mt-1 ml-1.5">
                <span className="text-xs inline-block">
                  {totalLogsAnalysed || 0} logs
                </span>
                <span>/</span>
                <span className="text-xs inline-block">
                  {uploadedLogFiles ? uploadedLogFiles?.length : 0} batches
                </span>
              </div>
            </>
          )}
        </PopoverTrigger>
        <PopoverContent className="min-w-[300px] max-w-96 py-2 px-0 mt-2 relative z-20">
          <PopOverParsedLogs />
        </PopoverContent>
      </Popover>

      {/* Tabs */}
      <div className="flex space-x-2 pt-1 pb-0 w-full ml-20 justify-center">
        {tabs.map(({ label, icon }) => (
          <button
            key={label}
            onClick={() => setActiveTab(label)}
            className={`flex items-center space-x-1 px-4 py-1 text-xs rounded-sm font-medium transition-colors ${
              activeTab === label
                ? "bg-brand-bright text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="h-[calc(100%-32px)]"
      >
        <>
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
                  <Cell
                    key={`cell-${idx}`}
                    fill={COLORS[idx % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => {
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
              className={`grid gap-2 w-full max-w-2xl pl-4 ${
                activeTab === "User Agents" || activeTab === "Referrers"
                  ? "grid-cols-5 max-w-6xl"
                  : activeTab === "Status Codes"
                    ? "grid-cols-4 max-w-xl"
                    : "grid-cols-3"
              }`}
            >
              {chartData.map((entry, idx) => (
                <Dialog
                  key={`${entry.name}-${idx}`}
                  open={openDialogs[entry.name] || false}
                  onOpenChange={(isOpen) =>
                    handleOpenChange(entry.name, isOpen)
                  }
                >
                  <DialogTrigger
                    className={`cursor-pointer hover:scale-105 ease-in transition-all delay-75`}
                  >
                    <div
                      className="flex justify-between items-center border border-gray-100 px-2 py-1 rounded-md text-xs dark:border-brand-dark"
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

                  <DialogContent className="max-w-7xl dark:text-white dark:border-brand-bright dark:bg-brand-darker">
                    {activeTab === "Filetypes" ? (
                      <WidgetFileType
                        data={overview}
                        entries={entries}
                        chartData={chartData}
                        selectedFileType={entry?.name}
                      />
                    ) : (
                      activeTab === "Status Codes" && (
                        <WidgetStatusCodesTable
                          data={overview}
                          entries={currentLogs}
                          segment={entry?.name}
                        />
                      )
                    )}
                  </DialogContent>

                  {activeTab === "Referrers" ? (
                    <DialogContent className="max-w-[90%] min-h-96 overflow-hidden dark:bg-brand-darker dark:border-brand-bright">
                      <Tabs defaultValue="detailed">
                        <Tabs.List className="mb-2 mx-1">
                          {/* <Tabs.Tab value="overview">Summary</Tabs.Tab> */}
                          <Tabs.Tab value="detailed">
                            Detailed Analysis
                          </Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="overview">
                          <DialogHeader>
                            <DialogTitle>
                              Referrer Category: {entry.name}
                            </DialogTitle>
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
                            <div className="mt-4">
                              <h4 className="font-medium mb-2">
                                Example Referrers:
                              </h4>
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {entry.referrers &&
                                  entry.referrers.map((referrer, idx) => (
                                    <div
                                      key={idx}
                                      className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs font-mono break-all"
                                    >
                                      {referrer}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </Tabs.Panel>

                        <Tabs.Panel value="detailed">
                          <WidgetReferrersTable
                            data={overview}
                            entries={currentLogs}
                            segment={
                              entry?.name === "Other" ? "all" : entry?.name
                            }
                          />
                        </Tabs.Panel>
                      </Tabs>
                    </DialogContent>
                  ) : activeTab === "Content" ? (
                    <DialogContent className="max-w-7xl w-calc(100%) dark:text-white dark:border-brand-bright dark:bg-brand-darker">
                      <Tabs defaultValue="overview">
                        <Tabs.List>
                          <Tabs.Tab value="overview">Overview</Tabs.Tab>
                          <Tabs.Tab value="logs">URLs</Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="overview">
                          <section className="mt-5 h-[740px] flex flex-col justify-between">
                            <div>
                              <DialogHeader>
                                <DialogTitle className="mt-4">
                                  Segment Breakdown:
                                  <span className="text-brand-bright ml-1">
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
                            </div>{" "}
                          </section>
                        </Tabs.Panel>

                        <Tabs.Panel value="logs">
                          <WidgetContentTable
                            data={overview}
                            entries={entries}
                            segment={entry?.name}
                          />
                        </Tabs.Panel>
                      </Tabs>
                    </DialogContent>
                  ) : activeTab === "User Agents" ? (
                    <DialogContent className="max-w-[90%] min-h-96 overflow-hidden dark:bg-brand-darker dark:border-brand-bright">
                      <Tabs defaultValue="overview">
                        <Tabs.List className="mb-2 mx-1">
                          <Tabs.Tab value="overview">
                            User Agents Analysis
                          </Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="overview">
                          <WidgetUserAgentsTable
                            data={overview}
                            entries={currentLogs}
                            segment={
                              entry?.name === "Other" ? "all" : entry?.name
                            }
                          />
                        </Tabs.Panel>
                      </Tabs>
                    </DialogContent>
                  ) : entry?.name === "Google" ? (
                    <DialogContent className="max-w-[90%] min-h-96 overflow-hidden dark:bg-brand-darker dark:border-brand-bright">
                      <Tabs defaultValue="overview">
                        <Tabs.List className="mb-2 mx-1">
                          <Tabs.Tab value="overview">Frequency Table</Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="overview">
                          <WidgetTable data={overview} />
                        </Tabs.Panel>
                      </Tabs>
                    </DialogContent>
                  ) : (
                    <DialogContent className="max-w-7xl dark:text-white dark:border-brand-bright dark:bg-brand-darker">
                      {activeTab === "Filetypes" ? (
                        <WidgetFileType
                          data={overview}
                          entries={entries}
                          chartData={chartData}
                          selectedFileType={entry?.name}
                        />
                      ) : (
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
                      )}
                    </DialogContent>
                  )}

                  {/*DISPLAY THE DATA FROM BING*/}
                  {entry?.name === "Bing" && (
                    <DialogContent className="max-w-[90%] min-h-96 overflow-hidden dark:bg-brand-darker dark:border-brand-bright">
                      <Tabs defaultValue="overview">
                        <Tabs.List className="mb-2 mx-1">
                          <Tabs.Tab value="overview">Frequency Table</Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="overview">
                          <WidgetTableBing data={overview} />
                        </Tabs.Panel>
                      </Tabs>
                    </DialogContent>
                  )}

                  {/*DISPLAY THE DATA FROM OPENAI*/}
                  {entry?.name === "Openai" && (
                    <DialogContent className="max-w-[90%] min-h-96 overflow-hidden dark:bg-brand-darker dark:border-brand-bright">
                      <Tabs defaultValue="overview">
                        <Tabs.List className="mb-2 mx-1">
                          <Tabs.Tab value="overview">Frequency Table</Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="overview">
                          <WidgetTableOpenAi data={overview} />
                        </Tabs.Panel>
                      </Tabs>
                    </DialogContent>
                  )}
                  {/*DISPLAY THE DATA FROM Claude*/}
                  {entry?.name === "Claude" && (
                    <DialogContent className="max-w-[90%] min-h-96 overflow-hidden dark:bg-brand-darker dark:border-brand-bright">
                      <Tabs defaultValue="overview">
                        <Tabs.List className="mb-2 mx-1">
                          <Tabs.Tab value="overview">Frequency Table</Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="overview">
                          <WidgetTableClaude data={overview} />
                        </Tabs.Panel>
                      </Tabs>
                    </DialogContent>
                  )}
                </Dialog>
              ))}
            </div>
          </div>
        </>
      </motion.div>
    </div>
  );
}
