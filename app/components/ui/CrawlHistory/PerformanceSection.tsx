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
              <tr className="w-full" key={index}>
                <td>{new Date(data.date).toLocaleDateString()}</td>
                <td>
                  {data.strategy === "DESKTOP" ? (
                    <FaDesktop />
                  ) : (
                    <FaMobileAlt />
                  )}
                </td>
                <td align="left">{data.url}</td>
                <td
                  className={`${data.performance <= 0.5 ? "text-red-600" : "text-green-600"}`}
                >
                  {data.performance}
                </td>
                <td
                  className={`${data.fcp <= 0.5 ? "text-red-600" : "text-green-600"}`}
                >
                  {data.fcp}
                </td>
                <td
                  className={`${data.lcp <= 0.5 ? "text-red-600" : "text-green-600"}`}
                >
                  {data.lcp}
                </td>
                <td
                  className={`${data.tti <= 0.5 ? "text-red-600" : "text-green-600"}`}
                >
                  {data.tti}
                </td>
                <td
                  className={`${data.cls <= 0.5 ? "text-red-600" : "text-green-600"}`}
                >
                  {data.cls}
                </td>
                <td
                  className={`${data.tbt <= 0.5 ? "text-red-600" : "text-green-600"}`}
                >
                  {data.tbt}
                </td>
                <td>{data.dom_size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default PerformanceSection;
