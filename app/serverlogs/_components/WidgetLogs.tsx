import { useState } from "react";
import { FileText, Image, Video, Music, FileArchive, File } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";

const tabs = ["Files", "Storage"];

const fileTypes = [
  {
    type: "Documents",
    icon: <FileText className="w-6 h-6 text-blue-500" />,
    count: 24,
    size: 320,
  },
  {
    type: "Images",
    icon: <Image className="w-6 h-6 text-pink-500" />,
    count: 58,
    size: 540,
  },
  {
    type: "Videos",
    icon: <Video className="w-6 h-6 text-purple-500" />,
    count: 12,
    size: 860,
  },
  {
    type: "Audio",
    icon: <Music className="w-6 h-6 text-green-500" />,
    count: 8,
    size: 120,
  },
  {
    type: "Archives",
    icon: <FileArchive className="w-6 h-6 text-yellow-500" />,
    count: 5,
    size: 90,
  },
  {
    type: "Other",
    icon: <File className="w-6 h-6 text-gray-500" />,
    count: 15,
    size: 210,
  },
];

const COLORS = [
  "#3b82f6",
  "#ec4899",
  "#8b5cf6",
  "#22c55e",
  "#facc15",
  "#6b7280",
];

export default function FileTypeWidgetWithChart() {
  const [activeTab, setActiveTab] = useState("Files");

  const chartData = fileTypes.map((f) => ({
    name: f.type,
    value: activeTab === "Files" ? f.count : f.size,
  }));

  return (
    <div className="bg-white rounded-2xl shadow p-6 w-full max-w-3xl mx-auto">
      {/* Tabs */}
      <div className="flex space-x-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Chart */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row gap-6 items-center justify-between"
      >
        <PieChart width={240} height={240}>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={4}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
        </PieChart>

        {/* File list */}
        <div className="grid grid-cols-2 gap-4 flex-1">
          {fileTypes.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-3 border border-gray-100 p-3 rounded-xl hover:shadow transition"
            >
              <div className="bg-gray-50 p-2 rounded-full">{file.icon}</div>
              <div>
                <p className="text-sm font-semibold">{file.type}</p>
                <p className="text-xs text-gray-500">
                  {activeTab === "Files"
                    ? `${file.count} files`
                    : `${file.size} MB`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
