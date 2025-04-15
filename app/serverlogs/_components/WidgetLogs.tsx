// @ts-nocheck
import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { FileText, Server, Bot, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useLogAnalysis, useLogAnalysisStore } from "@/store/ServerLogsStore";

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
  const {
    entries,
    overview,
    isLoading,
    error,
    filters,
    setLogData,
    setFilter,
    resetAll,
  } = useLogAnalysis();

  console.log(overview, "fucking entries");

  // Get chart data for active tab
  const getChartData = () => {
    const totalRequests = overview?.line_count || 1;
    const crawlerPercentage = overview?.crawler_count
      ? Math.round((overview.crawler_count / totalRequests) * 100)
      : 0;

    const data = {
      Filetypes: [
        { name: "HTML", value: 55 },
        { name: "JPG", value: 20 },
        { name: "JS", value: 15 },
        { name: "CSS", value: 10 },
      ],
      "Status Codes": [
        { name: "200 OK", value: overview?.success_rate || 82 },
        { name: "301 Redirect", value: 10 },
        { name: "404 Not Found", value: 6 },
        { name: "500 Error", value: 2 },
      ],
      Crawlers: [
        { name: "Google", value: overview?.totals?.google || 50 },
        { name: "Bing", value: overview?.totals?.bing || 0 },
        { name: "OpenAI", value: overview?.totals?.openai || 0 },
        { name: "Claude", value: overview?.totals?.claude || 0 },
        { name: "Moz", value: overview?.totals?.moz || 0 },
        { name: "Semrush", value: overview?.totals?.semrush || 0 },
      ],
      Analytics: [
        {
          name: `IPs: ${overview?.unique_ips || 0}`,
          value: overview?.unique_ips || 0,
        },
        {
          name: `User Agents: ${overview?.unique_user_agents || 0}`,
          value: overview?.unique_user_agents || 0,
        },
        {
          name: `Total: ${overview?.line_count || 0}`,
          value: overview?.line_count || 0,
        },
        { name: `Crawlers: ${crawlerPercentage}%`, value: crawlerPercentage },
      ],
    };

    return data[activeTab as keyof typeof data] || [];
  };

  const chartData = getChartData();

  if (!overview) {
    return (
      <div className="bg-white shadow rounded-lg p-4 w-full h-64 flex items-center justify-center dark:bg-brand-darker">
        <p className="text-gray-500 dark:text-gray-400">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-2 w-full max-w-4xl mx-auto dark:bg-brand-darker dark:text-white h-64">
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

      {/* Chart Area */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col md:flex-row items-center justify-center h-[calc(100%-32px)] p-2"
      >
        {chartData.length > 0 ? (
          <>
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
              <Tooltip formatter={(value) => [`${value}`, ""]} />
            </PieChart>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md pl-4 overflow-y-auto max-h-40">
              {chartData.map((entry, idx) => (
                <div
                  key={`${entry.name}-${idx}`}
                  className="flex justify-between items-center border border-gray-100 px-2 py-1 rounded-md text-xs"
                  style={{
                    borderLeft: `3px solid ${COLORS[idx % COLORS.length]}`,
                    backgroundColor: `${COLORS[idx % COLORS.length]}10`,
                  }}
                >
                  <span className="truncate dark:text-white">{entry.name}</span>
                  <span
                    className="font-medium ml-2"
                    style={{ color: COLORS[idx % COLORS.length] }}
                  >
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center p-4">
            <p className="text-gray-500 dark:text-gray-400">
              No data available
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
