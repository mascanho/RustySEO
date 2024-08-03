import React from "react";
import { FaDesktop, FaMobileAlt } from "react-icons/fa";

// Define TypeScript types for better type safety
interface PerformanceData {
  date: string;
  strategy: string;
  url: string;
  performance: number;
  fcp: number;
  lcp: number;
  tti: number;
  cls: number;
  tbt: number;
  dom_size: number;
}

interface PerformanceSectionProps {
  dbdata: PerformanceData[];
}

const PerformanceSection: React.FC<PerformanceSectionProps> = ({ dbdata }) => {
  // Ensure dbdata is an array before calling sort
  const sortedData = Array.isArray(dbdata)
    ? dbdata.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
    : [];

  return (
    <section className="rounded-md mt-4 overflow-hidden shadow border">
      <div className="h-[48rem] overflow-scroll">
        <table className="table_history w-full shadow">
          <thead>
            <tr>
              <th>Date</th>
              <th>Device</th>
              <th align="left">URL</th>
              <th>Performance</th>
              <th>FCP</th>
              <th>LCP</th>
              <th>TTI</th>
              <th>CLS</th>
              <th>TBT</th>
              <th>DOM</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((data, index) => (
              <tr className="w-full border" key={index}>
                <td className="border">
                  {new Date(data.date).toLocaleDateString()}
                </td>
                <td align="center" className="border">
                  {data.strategy === "DESKTOP" ? (
                    <FaDesktop />
                  ) : (
                    <FaMobileAlt />
                  )}
                </td>
                <td align="left" className="py-[20px] border">
                  {data.url}
                </td>
                <td
                  className={`border ${data.performance <= 0.5 ? "text-red-600" : "text-green-600"}`}
                >
                  {data.performance}
                </td>
                <td
                  className={`border ${data.fcp <= 0.5 ? "text-red-600" : "text-green-600"}`}
                >
                  {data.fcp}
                </td>
                <td
                  className={`border ${data.lcp <= 0.5 ? "text-red-600" : "text-green-600"}`}
                >
                  {data.lcp}
                </td>
                <td
                  className={`border ${data.tti <= 0.5 ? "text-red-600" : "text-green-600"}`}
                >
                  {data.tti}
                </td>
                <td
                  className={`border ${data.cls <= 0.5 ? "text-red-600" : "text-green-600"}`}
                >
                  {data.cls}
                </td>
                <td
                  className={`border ${data.tbt <= 0.5 ? "text-red-600" : "text-green-600"}`}
                >
                  {data.tbt}
                </td>
                <td className="border">{data.dom_size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default PerformanceSection;
