// @ts-nocheck
import { useState } from "react";
import { FileText, Server, Bot, BarChart3, PenBox } from "lucide-react";
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

const tabs = [
  { label: "Filetypes", icon: <FileText className="w-4 h-4" /> },
  { label: "Content", icon: <PenBox className="w-4 h-4" /> },
  { label: "Status Codes", icon: <Server className="w-4 h-4" /> },
  { label: "Crawlers", icon: <Bot className="w-4 h-4" /> },
  // { label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
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
  const { entries, overview } = useLogAnalysis();
  const [openDialogs, setOpenDialogs] = useState({});
  const { currentLogs } = useCurrentLogs();

  // Prepare filetype data from actual entries
  const fileTypeData = currentLogs?.reduce((acc, entry) => {
    const type = entry.file_type || "Other";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Prepare content data from actual entries or use dummy data
  const contentData = currentLogs?.reduce((acc, entry) => {
    const content = entry.taxonomy;
    acc[content] = (acc[content] || 0) + 1;
    return acc;
  }, {}) || {
    Home: 1200,
    Blog: 850,
    Events: 420,
    Solutions: 680,
    Customers: 320,
    Industries: 540,
    Products: 610,
    About: 290,
  };

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

  // Get chart data for active tab
  const getChartData = () => {
    const totalRequests = overview?.line_count || 1;
    const crawlerPercentage = overview?.crawler_count
      ? Math.round((overview.crawler_count / totalRequests) * 100)
      : 0;

    return (
      {
        Filetypes: Object.entries(fileTypeData || {}).map(([name, value]) => ({
          name: name.toUpperCase(),
          value,
        })),
        Content: Object.entries(contentData || {}).map(([name, value]) => ({
          name: name,
          value,
        })),
        "Status Codes": Object.entries(statusCodeData || {}).map(
          ([name, value]) => ({
            name: `${name} ${getStatusText(name)}`,
            value,
          }),
        ),
        Crawlers: crawlerData.length > 0 ? crawlerData : "",
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

  return (
    <div className="bg-white border dark:border-brand-dark shadow rounded-none p-2 pr-1 w-1/2  mx-auto dark:bg-slate-950 dark:text-white h-64 relative">
      <Popover>
        <PopoverTrigger className="absolute bottom-3 left-3">
          <FaInfoCircle className=" h-4 w-4 text-brand-bright" />
        </PopoverTrigger>
        <PopoverContent className="min-w-70 max-w-96 py-2 px-0 mt-2 relative z-20">
          {/* <div className="h-5 w-5 absolute -top-2 right-32 bg-white rotate-45 border -z-10" /> */}
          <PopOverParsedLogs />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger className="absolute top-2 font-bold text-black/20 dark:text-white/50 text-xl">
          {/* <span className="absolute top-2 font-bold text-black/20 dark:text-white/50 text-xl"> */}
          {currentLogs.length} Entries
          {/* </span> */}
        </PopoverTrigger>
        <PopoverContent className="min-w-70 max-w-96 py-2 px-0 mt-2 relative z-20">
          {/* <div className="h-5 w-5 absolute -top-2 right-32 bg-white rotate-45 border -z-10" /> */}
          <PopOverParsedLogs />
        </PopoverContent>
      </Popover>

      {/* Information about the uploaded logs */}

      {/* Tabs */}
      <div className="flex space-x-2 pt-1 pb-0 w-full justify-center">
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
        {activeTab !== "Analytics" ? (
          <>
            <div className="flex flex-col md:flex-row items-center justify-center relative">
              <PieChart width={200} height={200}>
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
                  style={{ backgroundColor: "#1f2937", color: "#f9fafb" }}
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
                className={`grid grid-cols-1 ${activeTab === "Status Codes" ? "grid-cols-4 max-w-xl" : "grid-cols-2"} gap-2 w-full max-w-md pl-4`}
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
                      className={`${entry.name === "Google" ? "cursor-pointer" : "cursor-default"}`}
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

                    {entry?.name === "Google" ? (
                      <DialogContent className="max-w-[90%] min-h-96 overflow-hidden dark:bg-brand-darker dark:border-brand-bright">
                        <Tabs defaultValue="overview">
                          <Tabs.List className="mb-2 mx-1">
                            <Tabs.Tab value="overview">
                              Frequency Table
                            </Tabs.Tab>
                            {/* <Tabs.Tab value="charts">Charts</Tabs.Tab> */}
                          </Tabs.List>

                          <Tabs.Panel value="overview">
                            <WidgetTable data={overview} />
                          </Tabs.Panel>

                          <Tabs.Panel value="charts">
                            <div className="h-96" />
                          </Tabs.Panel>
                        </Tabs>
                      </DialogContent>
                    ) : (
                      <DialogContent className="max-w-md dark:text-white dark:border-brand-bright dark:bg-brand-darker">
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
                      </DialogContent>
                    )}
                  </Dialog>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 overflow-auto"
            style={{ height: "calc(100% - 8px)", marginTop: "0.2em" }}
          >
            {/* Left Column - Stats */}
            <div className="space-y-2">
              <div className="bg-white/50 dark:bg-gray-800/80 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-2">
                  TRAFFIC OVERVIEW
                </h3>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total</span>
                    <span className="font-medium text-sm tabular-nums">
                      {formatNumber(overview.line_count)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Success Rate</span>
                    <span className="font-medium text-sm tabular-nums">
                      {overview.success_rate?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Crawlers</span>
                    <span className="font-medium text-sm tabular-nums">
                      {formatNumber(overview.crawler_count)} (
                      {Math.round(
                        (overview.crawler_count / overview.line_count) * 100,
                      )}
                      %)
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/50 dark:bg-gray-800/80 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-2">
                  UNIQUE VALUES
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      IPs
                    </div>
                    <div className="font-medium text-sm tabular-nums">
                      {formatNumber(overview.unique_ips)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      User Agents
                    </div>
                    <div className="font-medium text-sm tabular-nums">
                      {formatNumber(overview.unique_user_agents)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Crawlers */}
            <div className="bg-white/50 dark:bg-gray-800/80 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400">
                  CRAWLER BREAKDOWN
                </h3>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {formatNumber(overview.crawler_count)} total
                </span>
              </div>
              <div className="space-y-2">
                {crawlerData.map((crawler, index) => {
                  const percentage = Math.round(
                    (crawler.value / overview.line_count) * 100,
                  );
                  return (
                    <div key={crawler.name} className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="truncate pr-2">{crawler.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium tabular-nums">
                            {formatNumber(crawler.value)}
                          </span>
                          <span className="text-xs text-gray-500 tabular-nums w-8 text-right">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
