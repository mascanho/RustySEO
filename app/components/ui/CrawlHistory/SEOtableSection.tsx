// @ts-nocheck
import React, { useState, useCallback, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaDesktop, FaMobileAlt } from "react-icons/fa";
import { FiDownload, FiCheckCircle } from "react-icons/fi";
import { IoIosSearch } from "react-icons/io";
import { save } from "@tauri-apps/api/dialog";
import { writeTextFile } from "@tauri-apps/api/fs";
import { invoke } from "@tauri-apps/api/tauri";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define TypeScript types
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
  speed_index: number;
}

interface PerformanceSectionProps {
  dbdata: PerformanceData[];
}

const SEOtableSection: React.FC<PerformanceSectionProps> = ({
  dbdata,
}: any) => {
  // Component state and handlers
  const [download, setDownload] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [data, setData] = useState<PerformanceData[]>(dbdata);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [sortColumn, setSortColumn] = useState<keyof PerformanceData>("date");
  const [todoUrl, setTodoUrl] = useState<string | null>(null);

  // Effect to update data when dbdata changes
  useEffect(() => {
    if (Array.isArray(dbdata)) {
      setData(dbdata);
    }
  }, [dbdata]);

  // GET THE DATA FROM THE DB
  useEffect(() => {
    invoke("read_seo_data_from_db").then((result: any) => {
      console.log(result);
      setData(result);
    });
  }, [dbdata]);

  // Filter and sort data
  const filteredData = (Array.isArray(data) ? data : [])
    .filter((item) =>
      item.url.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .filter((item) => {
      const date = new Date(item.date);
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

  // Handle sorting
  const handleSort = (column: keyof PerformanceData) => {
    if (sortColumn === column) {
      setSortDirection((prevDirection) =>
        prevDirection === "asc" ? "desc" : "asc",
      );
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  // Refresh table function
  const refreshTable = useCallback(() => {
    if (Array.isArray(dbdata)) {
      setData(dbdata);
    }
    setSearchQuery("");
    setStartDate(null);
    setEndDate(null);
  }, [dbdata]);

  // Handle download
  const handleDownloadXLSX = async () => {
    let path;
    invoke("generate_seo_csv").then((result) => {
      console.log(result);
      setDownload(result);
    });

    path = await save({
      defaultPath: "seo.csv",
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

  // Handle adding to-do
  const handleAddTodo = (url: string) => {
    setTodoUrl(url);
    alert(`To-Do item created for URL: ${url}`);
  };

  return (
    <div className="relative w-full mx-auto text-xs -mt-8">
      {/* Toolbar and Options */}
      <div className=" -right-0 w-full flex space-x-3 justify-end pb-1 dark:border-b-brand-normal/10 -z-10">
        {/* Search Bar */}
        <div className="flex items-center space-x-2 relative z-0">
          <IoIosSearch className="w-4 h-4 absolute left-4 dark:text-white" />
          <input
            type="text"
            placeholder="Search by URL"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border dark:text-white rounded-md p-0.5 text-sm h-full pl-7 dark:border-brand-normal/20 dark:bg-brand-darker"
          />
        </div>

        {/* Dropdown Menus for Options */}
        <DropdownMenu>
          <DropdownMenuTrigger className="w-fit px-4 border border-gray-300 rounded-md justify-center active:scale-95 transition-all ease-linear flex items-center dark:text-white dark:border-brand-normal/20 dark:bg-brand-darker text-black text-xs">
            Options
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white dark:bg-brand-dark dark:text-white emr-12 mt-1 dark:border-brand-normal/20">
            <DropdownMenuLabel className="text-xs">
              Table options
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer hover:bg-gray-100 dark:hover:text-black text-xs"
              onClick={refreshTable}
            >
              Refresh Table
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-black/20 dark:bg-white/20 text-xs" />
            <DropdownMenuItem className="text-red-500 hover:bg-red-200 cursor-pointer text-xs">
              Match URL
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-500 hover:bg-red-200 cursor-pointer text-xs">
              Clear Table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export Menu */}
        <div className="w-[2px] h-8 bg-gray-300 dark:bg-gray-200/20" />
        <DropdownMenu>
          <DropdownMenuTrigger className="transition-all hover:bg-brand-bright ease-linear active:scale-75 w-fit px-4 rounded-md justify-center flex items-center bg-brand-bright text-white m-auto h-7">
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

      {/* Table Section */}
      <section className="rounded-md mt-2 overflow-x-auto shadow border dark:border-white/10 dark:bg-brand-darker">
        {/* Parent container for vertical scrolling */}
        <div className="h-full max-h-[38rem] custom-scrollbar">
          {/* Container for horizontal scrolling */}
          <table className="table_history w-full shadow relative">
            <thead className="bg-white dark:bg-brand-darker sticky top-0 z-20">
              <tr className="border-b shadow">
                {/* Fixed Header Cells with sticky position */}
                <th
                  className="cursor-pointer w-24 sticky top-0 bg-white dark:bg-brand-darker z-20"
                  onClick={() => handleSort("date")}
                >
                  Date{" "}
                  {sortColumn === "date" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th className="w-60 sticky top-0 bg-white dark:bg-brand-darker z-20">
                  URL
                </th>
                <th className="w-48 sticky top-0 bg-white dark:bg-brand-darker z-20">
                  Page Title
                </th>
                <th className="w-64 sticky top-0 bg-white dark:bg-brand-darker z-20">
                  Description
                </th>
                <th className="w-48 sticky top-0 bg-white dark:bg-brand-darker z-20">
                  Heading #1
                </th>
                <th className="w-48 sticky top-0 bg-white dark:bg-brand-darker z-20">
                  Heading #2
                </th>
                <th className="w-64 sticky top-0 bg-white dark:bg-brand-darker z-20">
                  Keywords
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((data, index) => {
                const kws = data?.keywords ? JSON.parse(data.keywords) : [];
                const headings = data?.headings
                  ? JSON.parse(data?.headings)
                  : [];
                const firstHeading = headings[0]?.replace(/^h1:\s*/, "") || "";
                const secondHeading = headings[1]?.replace(/^h2:\s*/, "") || "";

                return (
                  <tr className="w-full border" key={index}>
                    <td className="border p-2">
                      <div className="line-clamp-2">
                        {new Date(data.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td align="left" className="py-2 border relative group p-2">
                      <div className="line-clamp-2">
                        {data.url}
                        <span
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          onClick={() => handleAddTodo(data.url)}
                        >
                          <FiCheckCircle className="text-green-500" />
                        </span>
                      </div>
                    </td>
                    <td
                      className={`border p-2 ${data?.title?.length > 60 ? "text-red-500" : "text-green-700"}`}
                    >
                      <div className="line-clamp-2">{data.title}</div>
                    </td>
                    <td
                      className={`border p-2 ${data?.description?.length > 160 ? "text-red-500" : "text-green-700"}`}
                    >
                      <div className="line-clamp-2">{data.description}</div>
                    </td>
                    <td className="border p-2">
                      <div className="line-clamp-2">{firstHeading}</div>
                    </td>
                    <td className="border p-2">
                      <div className="line-clamp-2">{secondHeading}</div>
                    </td>
                    <td align="left" className="border p-2">
                      <div className="line-clamp-2">{kws.join(", ")}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default SEOtableSection;
