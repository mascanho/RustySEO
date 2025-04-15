// @ts-nocheck
import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { FileText, Server, Bot, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { label: "Filetypes", icon: <FileText className="w-4 h-4" /> },
  { label: "Status Codes", icon: <Server className="w-4 h-4" /> },
  { label: "Crawler Type", icon: <Bot className="w-4 h-4" /> },
  { label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
];

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#6366f1",
  "#6b7280",
];

const mockData = {
  Filetypes: [
    { name: "HTML", value: 55 },
    { name: "JPG", value: 20 },
    { name: "JS", value: 15 },
    { name: "CSS", value: 10 },
  ],
  "Status Codes": [
    { name: "200 OK", value: 82 },
    { name: "301 Redirect", value: 10 },
    { name: "404 Not Found", value: 6 },
    { name: "500 Error", value: 2 },
  ],
  "Crawler Type": [
    { name: "Googlebot", value: 60 },
    { name: "Bingbot", value: 25 },
    { name: "Sistrix", value: 10 },
    { name: "Other", value: 5 },
  ],
  Analytics: [
    { name: "Top IP: 66.249.65.40", value: 30 },
    { name: "iPhone Safari", value: 25 },
    { name: "Desktop Chrome", value: 20 },
    { name: "Android Bot", value: 25 },
  ],
};

export default function WidgetLogs() {
  const [activeTab, setActiveTab] = useState("Filetypes");

  const chartData = mockData[activeTab];

  return (
    <div className="bg-white  shadow px-2 w-full max-w-4xl mx-auto dark:bg-brand-darker dark:text-white h-64">
      {/* Tabs */}
      <div className="flex space-x-2 pt-[20upx]  pb-0 w-full justify-center ">
        {tabs.map(({ label, icon }) => (
          <button
            key={label}
            onClick={() => setActiveTab(label)}
            className={`flex items-center space-x-2 px-4 py-1 text-xs rounded-b-md  font-medium transition ${
              activeTab === label
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Chart and Legend */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col md:flex-row dark:bg-brand-darker dark:text-white items-center justify-around "
      >
        <PieChart width={220} height={220}>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
          >
            {chartData.map((_, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md pr-10 dark:text-white">
          {chartData.map((entry, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center border border-gray-100 px-4 py-2 rounded-xl"
              style={{
                borderLeft: `4px solid ${COLORS[idx % COLORS.length]}`,
                backgroundColor: `${COLORS[idx % COLORS.length]}10`,
              }}
            >
              <span className="text-sm font-medium text-gray-700 dark:text-white">
                {entry.name}
              </span>
              <span
                className="text-sm font-semibold text-gray-900"
                style={{ color: COLORS[idx % COLORS.length] }}
              >
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
