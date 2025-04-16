// @ts-nocheck
import { useState } from "react";
import { FileText, Server, Bot, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useLogAnalysis } from "@/store/ServerLogsStore";
import { Cell, Pie, PieChart, Tooltip } from "recharts";

const tabs = [
  { label: "Filetypes", icon: <FileText className="w-4 h-4" /> },
  { label: "Status Codes", icon: <Server className="w-4 h-4" /> },
  { label: "Crawlers", icon: <Bot className="w-4 h-4" /> },
  { label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
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
  const [activeTab, setActiveTab] = useState("Crawlers");
  const { entries, overview } = useLogAnalysis();

  // Prepare filetype data from actual entries
  const fileTypeData = entries?.reduce((acc, entry) => {
    const type = entry.file_type || "Other";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Prepare status code data from actual entries
  const statusCodeData = entries?.reduce((acc, entry) => {
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
        "Status Codes": Object.entries(statusCodeData || {}).map(
          ([name, value]) => ({
            name: `${name} ${getStatusText(name)}`,
            value,
          }),
        ),
        Crawlers:
          crawlerData.length > 0
            ? crawlerData
            : [
                { name: "Google", value: overview?.totals?.google || 0 },
                { name: "Bing", value: overview?.totals?.bing || 0 },
                { name: "Other", value: 0 },
              ],
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

  return (
    <div className="bg-white shadow rounded-lg p-2 pr-1 w-full max-w-4xl mx-auto dark:bg-brand-darker dark:text-white h-64">
      {/* Tabs */}
      <div className="flex space-x-2 pt-1 pb-0 w-full justify-center">
        {tabs.map(({ label, icon }) => (
          <button
            key={label}
            onClick={() => setActiveTab(label)}
            className={`flex items-center space-x-1 px-3 py-1 text-xs rounded-md font-medium transition-colors ${
              activeTab === label
                ? "bg-blue-600 text-white"
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
            <div className="flex flex-col md:flex-row items-center justify-center">
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
                    color: "#f9fafb", // text-gray-50
                    fontSize: "0.75rem",
                  }}
                />
              </PieChart>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md pl-4">
                {chartData.map((entry, idx) => (
                  <div
                    key={`${entry.name}-${idx}`}
                    className="flex justify-between items-center border border-gray-100 px-2 py-1 rounded-md text-xs"
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
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-52 pb-2 mt-2 pt-3 overflow-auto">
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Traffic Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Requests</span>
                    <span className="font-medium">
                      {formatNumber(overview.line_count)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Successful Requests</span>
                    <span className="font-medium">
                      {overview.success_rate?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Crawler Traffic</span>
                    <span className="font-medium">
                      {formatNumber(overview.crawler_count)} (
                      {Math.round(
                        (overview.crawler_count / overview.line_count) * 100,
                      )}
                      %)
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Unique Values</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Unique IPs</span>
                    <span className="font-medium">
                      {formatNumber(overview.unique_ips)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>User Agents</span>
                    <span className="font-medium">
                      {formatNumber(overview.unique_user_agents)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Crawler Breakdown</h3>
              <div className="space-y-3">
                {crawlerData.map((crawler, index) => (
                  <div key={crawler.name} className="space-y-1">
                    <div className="flex justify-between">
                      <span>{crawler.name}</span>
                      <span className="font-medium">
                        {formatNumber(crawler.value)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${(crawler.value / overview.line_count) * 100}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
