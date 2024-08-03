import React from "react";
import { FaDesktop, FaMobileAlt } from "react-icons/fa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FiDownload } from "react-icons/fi";
import { IoIosSearch } from "react-icons/io";

import { invoke } from "@tauri-apps/api/tauri";
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

  const handleDownloadXLSX = () => {
    //call the rust function
    invoke("write_to_excel").then((result) => {
      console.log(result);
    });
  };

  return (
    <div className="relative w-full">
      <div className=" -top-12 -right-0 w-full flex space-x-3 justify-end pb-3 border-b dark:border-b-brand-normal/20">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-12 border-r rounded-md justify-center active:scale-95 transition-all ease-linear flex items-center  dark:bg-white py-1 text-black ">
            <IoIosSearch className="w-4 h-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white mr-12 mt-1">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Team</DropdownMenuItem>
            <DropdownMenuItem>Subscription</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="w-[2px] h-8 bg-gray-200/20" />
        <DropdownMenu>
          <DropdownMenuTrigger className="w-32 rounded-md justify-center active:scale-95 transition-all ease-linear flex items-center  dark:bg-sky-600 py-1 text-white ">
            <FiDownload className="w-4 h-4 mr-2 mb-1" /> Export
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white mr-12 mt-1">
            <DropdownMenuSeparator />
            <DropdownMenuItem>XLSX</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Team</DropdownMenuItem>
            <DropdownMenuItem>Subscription</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <section className="rounded-md  mt-3 overflow-hidden shadow border dark:border-white/10 dark:bg-brand-darker">
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
    </div>
  );
};

export default PerformanceSection;
