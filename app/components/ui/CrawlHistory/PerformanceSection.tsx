import React, { useState, useCallback, useEffect } from "react";
import { MdOutlineInsertChart } from "react-icons/md";
import { BsMenuDown } from "react-icons/bs";
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
} from "@/components/ui/dropdown-menu"; // Ensure this path is correct
import { CiViewList } from "react-icons/ci";
import { TechnicalChart } from "../ShadCharts/TechnicalChart";
import { toast } from "sonner";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import PopUpTable from "./PopUpTable";
import { Modal } from "@mantine/core";
import Todo from "../Todo";
import { useDisclosure } from "@mantine/hooks";

import TableMenus from "./TableMenus";
import TableFloatMenus from "./_components/TableFloatMenus";

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

const PerformanceSection: React.FC<PerformanceSectionProps> = ({
  dbdata,
  crawl,
}: any) => {
  // Component state and handlers
  const [download, setDownload] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [data, setData] = useState<PerformanceData[]>(dbdata);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc"); // Default to descending
  const [sortColumn, setSortColumn] = useState<keyof PerformanceData>("date");
  const [todoUrl, setTodoUrl] = useState<string | null>(null);
  const [matchedUrlData, setMatchedUrlData] = useState([]);
  const [todoStrategy, setTodoStrategy] = useState<string>("");

  // CONTEXT MENU SETTINGS
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showMenu, setShowMenu] = useState(false);

  const handleCloseMenu = () => {
    setShowMenu(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (showMenu) {
        handleCloseMenu();
      }
    };

    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [showMenu]);

  const menuItems = [
    { label: "Action 1", onClick: () => console.log("Action 1 clicked") },
    { label: "Action 2", onClick: () => console.log("Action 2 clicked") },
  ];

  const [openedModal, { open: openModal, close: closeModal }] =
    useDisclosure(false);

  // Effect to update data when dbdata changes
  useEffect(() => {
    if (Array.isArray(dbdata)) {
      setData(dbdata);
    }
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
    invoke("generate_csv_command").then((result) => {
      console.log(result);
      // @ts-ignore
      setDownload(result);
    });

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

  // Handle adding to-do
  const handleAddTodo = (url: string, strategy: string) => {
    setTodoStrategy(strategy);
    setTodoUrl(url);
    openModal();
  };

  // Clear Table
  const handleClearTable = async () => {
    try {
      await invoke("clear_table_command", { table: "results" });
      toast("Tables have been cleared");
    } catch (error) {
      console.error("Error clearing tables:", error);
      toast("Error clearing tables");
    }
  };

  // Get data into Google Sheets
  const handleSheetsData = async () => {
    try {
      await invoke("sheets_command");
      toast("Data has been uploaded to Google Sheets");
    } catch (error) {
      console.error("Error uploading data to Google Sheets:", error);
      toast("Error uploading data to Google Sheets");
    }
  };

  const handleExcel = () => {
    invoke("export_to_excel_command", {
      db_path: "data.db",
      excel_path: "data.xlsx",
    }).then((result) => {
      console.log(result);
      toast("Data has been exported to Excel");
    });
  };

  return (
    <section>
      {/* Todo Modal */}
      <Modal
        opened={openedModal}
        // overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
        closeOnEscape
        closeOnClickOutside
        onClose={closeModal}
        title=""
        centered
        // zIndex={"100000"}
      >
        {/* @ts-ignore */}
        <Todo url={todoUrl} close={closeModal} strategy={todoStrategy} />
      </Modal>
      <div className="relative mr-0 w-full mx-auto text-xs z-0">
        <div className=" -right-0  -z-10 flex space-x-3 justify-end pb-1 dark:border-b-brand-normal/10 -mt-7  w-full">
          <div className="flex items-center space-x-2 relative z-0">
            <IoIosSearch className="w-4 h-4 absolute left-4 dark:text-white" />
            <input
              type="text"
              placeholder="Search by URL"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border dark:text-white rounded-md  text-xs h-6 pl-7 dark:border-brand-normal/20 dark:bg-brand-darker"
            />
          </div>

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
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer hover:bg-gray-100 hover:text-white dark:hover:bg-gray-700 dark:hover:text-white text-xs"
                onClick={refreshTable}
              >
                Refresh Table
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-black/20 dark:bg-white/20" />
              <DropdownMenuItem
                onClick={handleClearTable}
                className="text-red-500  hover:text-red-500 dark:hover:bg-red-700 dark:hover:text-white cursor-pointer text-xs "
              >
                Clear Table
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-[2px] h-6 bg-gray-300 dark:bg-gray-200/20" />

          <DropdownMenu>
            <DropdownMenuTrigger className="transition-all hover:bg-brand-bright ease-linear active:scale-75 w-fit px-4 rounded-md justify-center flex items-center bg-brand-bright text-white h-6 m-auto">
              {/* <FiDownload className="w-4 h-4 mr-2 text-[10px]" /> */}
              Export
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white dark:bg-brand-darker mr-12 dark:border-brand-normal/20 dark:text-white">
              <DropdownMenuItem
                className="cursor-pointer hover:bg-gray-100 hover:text-white dark:hover:bg-gray-700 dark:hover:text-white"
                onClick={handleExcel}
              >
                Excel (xlsx)
              </DropdownMenuItem>{" "}
              <DropdownMenuItem
                className="cursor-pointer hover:bg-gray-100 hover:text-white dark:hover:bg-gray-700 dark:hover:text-white"
                onClick={handleSheetsData}
              >
                Google Sheets
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer hover:bg-gray-100 hover:text-white dark:hover:bg-gray-700 dark:hover:text-white"
                onClick={handleDownloadXLSX}
              >
                CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <section className="rounded-md mt-1 overflow-hidden shadow border dark:border-white/10 dark:bg-brand-darker w-full z-0">
          <div className="h-[calc(60.5rem-30rem)] custom-scrollbar overflow-auto bg-white dark:bg-brand-darker w-full">
            <table className="table_history w-full shadow text-xs">
              <thead className="bg-white dark:bg-brand-darker sticky top-0 z-10">
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
                  <th>Speed</th>
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
                        <FaDesktop className="text-blue-500" />
                      ) : (
                        <FaMobileAlt className="text-purple-500" />
                      )}
                    </td>
                    <td align="left" className="py-2 border relative group">
                      <div className="flex justify-between items-center">
                        <TableMenus data={data} crawl={crawl}>
                          <span className="hover:text-blue-500 cursor-pointer">
                            {data.url}
                          </span>
                        </TableMenus>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <TableFloatMenus data={data} crawl={crawl}>
                            <BsMenuDown className="text-purple-500" />
                          </TableFloatMenus>
                          <FiCheckCircle
                            className="text-green-500 cursor-pointer"
                            onClick={() =>
                              handleAddTodo(data.url, data.strategy)
                            }
                          />
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
                      className={`border ${
                        data.performance <= 0.5
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {data.performance}
                    </td>
                    <td
                      className={`border ${
                        data.speed_index <= 0.5
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {data.speed_index}
                    </td>
                    <td
                      className={`border ${
                        data.fcp <= 0.5 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {data.fcp}
                    </td>
                    <td
                      className={`border ${
                        data.lcp <= 0.5 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {data.lcp}
                    </td>
                    <td
                      className={`border ${
                        data.tti <= 0.5 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {data.tti}
                    </td>
                    <td
                      className={`border ${
                        data.cls <= 0.5 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {data.cls}
                    </td>
                    <td
                      className={`border ${
                        data.tbt <= 0.5 ? "text-red-600" : "text-green-600"
                      }`}
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
        <aside className="my-3">
          <TechnicalChart dbdata={sortedData} />
        </aside>
      </div>
    </section>
  );
};

export default PerformanceSection;
