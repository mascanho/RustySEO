// @ts-nocheck
import React, { useState, useCallback, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaDesktop, FaMobileAlt } from "react-icons/fa";
import { FiDownload, FiCheckCircle, FiMenu } from "react-icons/fi";
import { IoIosSearch } from "react-icons/io";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TableMenus from "./TableMenus";
import { toast } from "sonner";
import TableFloatMenus from "./_components/TableFloatMenus";
import { BsMenuDown } from "react-icons/bs";
import { MdOutlineInsertChart } from "react-icons/md";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import PopUpTable from "./PopUpTable";
import { IoIosClose } from "react-icons/io";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import WordCloud from "./WordCloud";
import WordCloudWidget from "./WordCloud/WordCloudWidget";

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
  crawl: any;
}

const SEOtableSection: React.FC<PerformanceSectionProps> = ({
  dbdata,
  crawl,
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
  const [matchedUrlData, setMatchedUrlData] = useState([]);
  const [openWordCloud, setOpenWordCloud] = useState(false);

  // Keywords chip colors
  const chipColors = [
    "bg-blue-100 text-blue-800",
    "bg-green-100 text-green-800",
    "bg-yellow-100 text-yellow-800",
    "bg-red-100 text-red-800",
    "bg-purple-100 text-purple-800",
    "bg-pink-100 text-pink-800",
    "bg-indigo-100 text-indigo-800",
    "bg-orange-100 text-orange-800",
    "bg-teal-100 text-teal-800",
    "bg-cyan-100 text-cyan-800",
  ];

  // Effect to update data when dbdata changes
  useEffect(() => {
    if (Array.isArray(dbdata)) {
      setData([...dbdata]);
    }
  }, [dbdata]);

  // GET THE DATA FROM THE DB
  const fetchData = useCallback(() => {
    invoke("read_seo_data_from_db").then((result: any) => {
      console.log(result);
      setData(result);
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [crawl, fetchData]);

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

  // Refresh table function
  const refreshTable = useCallback(() => {
    if (Array.isArray(dbdata)) {
      setData(dbdata);
    }
    setSearchQuery("");
    setStartDate(null);
    setEndDate(null);
  }, [dbdata]);

  const handleOpenWordCloud = () => {
    setOpenWordCloud(true);
  };

  // Handle download
  const handleDownloadXLSX = async () => {
    try {
      // Generate the SEO CSV content
      const result = await invoke("generate_seo_csv");

      // Prompt the user to select a save location
      const path = await save({
        defaultPath: "seo.csv",
        filters: [
          {
            name: "CSV Files",
            extensions: ["csv"],
          },
        ],
      });

      // If the user selected a path, write the file
      if (path) {
        await writeTextFile(path, result); // Use `result` directly instead of `download`
        console.log("File saved successfully at:", path);
        toast.success("CSV file saved successfully!");
      } else {
        console.log("File save canceled by the user.");
        toast.info("File save canceled by the user.");
      }
    } catch (error) {
      console.error("Error during download process:", error);
      toast.error("Error saving CSV file. Please try again.");
    }
  };

  // Handle adding to-do
  const handleAddTodo = (url: string) => {
    setTodoUrl(url);
    alert(`To-Do item created for URL: ${url}`);
  };

  // Clear Table
  const handleClearTable = async () => {
    try {
      await invoke("clear_table_command", { table: "technical_data" });
      toast("Tables have been cleared");
      fetchData(); // Fetch updated data after clearing the table
    } catch (error) {
      console.error("Error clearing tables:", error);
      toast("Error clearing tables");
    }
  };

  // Handle Matching URL
  const handleUrlMatch = (url: string) => {
    invoke("call_gsc_match_url", { url: url }).then((result: any) => {
      console.log(result);
      setMatchedUrlData(result);
    });
  };

  // Handle sorting
  const handleSort = (column: keyof PerformanceData) => {
    if (sortColumn === column) {
      setSortDirection((prevDirection) =>
        prevDirection === "asc" ? "desc" : "asc",
      );
    } else {
      setSortColumn(column);
      setSortDirection("desc"); // Default to descending when sorting by a new column
    }
  };

  return (
    <div className="relative w-full mx-auto text-xs -mt-7">
      {/* Toolbar and Options */}
      <div className=" -right-0 w-full flex space-x-3 justify-end pb-1 dark:border-b-brand-normal/10 -z-10">
        {/* Search Bar */}
        <div className="flex items-center space-x-2 relative w-2/3 z-0">
          <IoIosSearch className="w-3 h-3 absolute left-4 dark:text-white" />
          <input
            type="text"
            placeholder="Search by URL"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border dark:text-white rounded-md flex flex-1  text-xs h-6 pl-6 pr-3 dark:border-brand-normal/20 dark:bg-brand-darker"
          />
          <IoIosClose
            onClick={() => setSearchQuery("")}
            className={`${searchQuery.length > 0 ? "" : "hidden"} cursor-pointer absolute right-1 text-red-500 top-1/2 -translate-y-1/2 w-3 h-3 dark:text-red-500`}
          />
        </div>

        {/* Dropdown Menus for Options */}
        <DropdownMenu>
          <DropdownMenuTrigger className="w-fit px-4 border border-gray-300 rounded-md justify-center active:scale-95 transition-all ease-linear flex items-center dark:text-white dark:border-brand-normal/20 dark:bg-brand-darker text-black h-6 ">
            Options
          </DropdownMenuTrigger>
          <DropdownMenuContent
            id="table-dropdown"
            className="bg-white dark:bg-brand-darker dark:text-white emr-12 mt-1 dark:border-brand-normal/20"
          >
            <DropdownMenuLabel className="text-xs">
              Table options
            </DropdownMenuLabel>
            {/* <DropdownMenuItem
              className="cursor-pointer hover:bg-gray-100 hover:text-white dark:hover:bg-gray-700 dark:hover:text-white text-xs"
              onClick={handleOpenWordCloud}
            >
              Word Cloud
            </DropdownMenuItem>{" "} */}
            <DropdownMenuSeparator className="dark:bg-brand-dark" />
            <DropdownMenuItem
              className="cursor-pointer hover:bg-gray-100 hover:text-white dark:hover:bg-gray-700 dark:hover:text-white text-xs"
              onClick={refreshTable}
            >
              Refresh Table
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-black/20 dark:bg-white/20" />
            <DropdownMenuItem
              onClick={handleClearTable}
              className="text-red-500  hover:text-red-500 dark:hover:bg-red-700 dark:hover:text-white cursor-pointer text-xs focus:bg-red-500   focus:text-text-white focus:text-white"
            >
              Clear Table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-[2px] h-6 bg-gray-300 dark:bg-gray-200/20" />

        <DropdownMenu>
          <DropdownMenuTrigger className="transition-all hover:bg-brand-bright ease-linear active:scale-75 w-fit px-4 rounded-md justify-center flex items-center bg-brand-bright text-white h-6 m-auto">
            {/* <FiDownload className="w-4 h-4 mr-2" /> */}
            Export
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white dark:bg-brand-darker mr-12 dark:border-brand-normal/20 dark:text-white">
            <DropdownMenuItem
              className="cursor-pointer hover:bg-gray-100 hover:text-white dark:hover:bg-gray-700 dark:hover:text-white"
              onClick={handleDownloadXLSX}
            >
              CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={openWordCloud} onOpenChange={setOpenWordCloud}>
        <DialogContent className="sm:max-w-[800px] bg-white dark:bg-brand-darker">
          <DialogHeader>
            <DialogTitle>Word Cloud</DialogTitle>
            <DialogDescription>
              A visual representation of the most common words in the crawled
              data.
            </DialogDescription>
          </DialogHeader>
          <WordCloudWidget />
        </DialogContent>
      </Dialog>

      {/* Table Section */}
      <section className="rounded-md mt-1 overflow-x-auto shadow border dark:border-white/10 dark:bg-brand-darker">
        {/* Parent container for vertical scrolling */}
        <div className="h-full max-h-[calc(100vh-190px)] overflow-y-auto">
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
                      <div className="flex items-center justify-between">
                        <div className="line-clamp-2 cursor-pointer hover:text-brand-bright mr-2">
                          <TableMenus data={data} crawl={crawl}>
                            {data.url}
                          </TableMenus>
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <TableFloatMenus data={data} crawl={crawl}>
                            <BsMenuDown className="text-purple-500" />
                          </TableFloatMenus>
                          <Popover>
                            <PopoverTrigger>
                              <MdOutlineInsertChart
                                className="text-blue-500 text-base cursor-pointer"
                                onClick={() => handleUrlMatch(data.url)}
                              />
                            </PopoverTrigger>
                            <PopoverContent className="w-[600px] bg-white dark:bg-brand-darker">
                              <PopUpTable data={matchedUrlData} />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </td>
                    <td
                      align="left"
                      className={`border p-2 ${data?.title?.length > 60 ? "text-red-500" : "text-green-700"}`}
                    >
                      <div className="line-clamp-2">{data.title}</div>
                    </td>
                    <td
                      align="left"
                      className={`border p-2 ${data?.description?.length > 160 ? "text-red-500" : "text-green-700"}`}
                    >
                      <div className="line-clamp-2">{data.description}</div>
                    </td>
                    <td align="left" className="border p-2">
                      <div className="line-clamp-2">{firstHeading}</div>
                    </td>
                    <td align="left" className="border p-2">
                      <div className="line-clamp-2">{secondHeading}</div>
                    </td>
                    <td align="left" className="border p-2">
                      <div className="flex flex-wrap gap-1">
                        {kws.map((keyword: string, i: number) => (
                          <span
                            key={i}
                            className={`px-2 py-1 rounded-full text-xs ${
                              chipColors[i % chipColors.length]
                            }`}
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
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
