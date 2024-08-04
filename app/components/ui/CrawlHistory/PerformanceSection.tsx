import React, { useState, useCallback, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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
import { save } from "@tauri-apps/api/dialog";
import { writeTextFile } from "@tauri-apps/api/fs";
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
  const [download, setDownload] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [data, setData] = useState<PerformanceData[]>(dbdata);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [sortColumn, setSortColumn] = useState<keyof PerformanceData>("date");

  // Effect to update data when dbdata changes
  useEffect(() => {
    setData(dbdata);
  }, [dbdata]);

  // Filter and sort data based on the search query, date range, and sort options
  const filteredData = data
    .filter((data) =>
      data.url.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .filter((data) => {
      const date = new Date(data.date);
      return (!startDate || date >= startDate) && (!endDate || date <= endDate);
    });

  const sortedData = Array.isArray(filteredData)
    ? filteredData.sort((a, b) => {
        const aValue =
          sortColumn === "date"
            ? new Date(a[sortColumn]).getTime()
            : a[sortColumn];
        const bValue =
          sortColumn === "date"
            ? new Date(b[sortColumn]).getTime()
            : b[sortColumn];
        return sortDirection === "asc"
          ? aValue < bValue
            ? -1
            : 1
          : aValue > bValue
            ? -1
            : 1;
      })
    : [];

  // Handle column header click for sorting
  const handleSort = (column: keyof PerformanceData) => {
    if (sortColumn === column) {
      // Toggle sort direction
      setSortDirection((prevDirection) =>
        prevDirection === "asc" ? "desc" : "asc",
      );
    } else {
      // Set new column and default to ascending direction
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Refresh the table data
  const refreshTable = useCallback(() => {
    setData(dbdata);
    setSearchQuery("");
    setStartDate(null);
    setEndDate(null);
  }, [dbdata]);

  const handleDownloadXLSX = async () => {
    let path;
    // Call the Rust function
    invoke("generate_csv_command").then((result) => {
      console.log(result);
      // @ts-ignore
      setDownload(result);
    });

    // Save the file
    path = await save({
      defaultPath: "performance.csv",
      filters: [
        {
          name: "CSV Files",
          extensions: ["csv"],
        },
      ],
    });
    if (path) {
      await writeTextFile(path, download);
      console.log("File saved successfully");
    }
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto">
      <div className=" -top-12 -right-0 w-full flex space-x-3 justify-end pb-3 border-b dark:border-b-brand-normal/10">
        <div className="flex items-center space-x-2 relative">
          <IoIosSearch className="w-4 h-4 absolute left-4" />
          <input
            type="text"
            placeholder="Search by URL"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border rounded-md p-1 text-sm h-full pl-7"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="w-fit px-3 border rounded-md justify-center active:scale-95 transition-all ease-linear flex items-center dark:bg-white py-1 text-black">
            Options
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white dark:bg-brand-dark dark:text-white emr-12 mt-1 dark:border-brand-normal/20">
            <DropdownMenuLabel>Table options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer hover:bg-gray-100 dark:hover:text-black"
              onClick={refreshTable}
            >
              Refresh Table
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-black/20 dark:bg-white/20" />
            <DropdownMenuItem className="text-red-500 hover:bg-red-200 cursor-pointer">
              Clear Table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-[2px] h-8 bg-gray-100 dark:bg-gray-200/20" />

        <DropdownMenu>
          <DropdownMenuTrigger className="transition-all hover:bg-sky-500 ease-linear active:scale-75 w-32 rounded-md justify-center flex items-center bg-sky-600 text-white">
            <FiDownload className="w-4 h-4 mr-2 mb-1" />
            Export
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white mr-12 dark:border-brand-normal/20 dark:bg-brand-dark dark:text-white">
            <DropdownMenuItem
              className="cursor-pointer hover:bg-gray-100 dark:border:brand-normal/20 dark:text-white dark:hover:text-black"
              onClick={handleDownloadXLSX}
            >
              CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <section className="rounded-md mt-3 overflow-hidden shadow border dark:border-white/10 dark:bg-brand-darker">
        <div className="h-[48rem] overflow-scroll">
          <table className="table_history w-full shadow">
            <thead>
              <tr>
                <th
                  className="cursor-pointer"
                  onClick={() => handleSort("date")}
                >
                  Date{" "}
                  {sortColumn === "date" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="cursor-pointer"
                  onClick={() => handleSort("strategy")}
                >
                  Device{" "}
                  {sortColumn === "strategy" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
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
