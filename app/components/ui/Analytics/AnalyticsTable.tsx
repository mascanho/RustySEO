// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, Search, X, ArrowUp, ArrowDown } from "lucide-react";
import { addDays, format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function AnalyticsTable() {
  const [analyticsData, setAnalyticsData] = useState<
    ReturnType<typeof getAnalyticsData>
  >([]);
  const [sortKey, setSortKey] = useState<string>("sessions");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date(2022, 0, 1));
  const [endDate, setEndDate] = useState<Date>(
    addDays(new Date(2024, 12, 1), 20)
  );
  const [selectedDimension, setSelectedDimension] = useState("general");
  const [analyticsDate, setAnalyticsDate] = useState<DateRange | undefined>(
    undefined
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const rowsPerPage = 100;

  // Custom input component for the date picker
  const CustomInput = ({
    value,
    onClick,
  }: {
    value?: string;
    onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "w-[150px] justify-start text-left font-normal text-xs h-8 px-3 rounded-md border",
        "bg-white dark:bg-brand-darker border-gray-300 dark:border-brand-dark",
        "text-gray-900 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-brand-dark"
      )}
    >
      {value || "Select date"}
    </button>
  );

  // Handle the fetching of analytics data
  const handleFilteredAnalytics = async (value: string) => {
    setIsLoading(true);
    setSelectedDimension(value);
    setAnalyticsDate([
      {
        start_date: startDate,
        end_date: endDate.toISOString(),
      },
    ]);

    let type = [];

    let params = {
      landings: {
        dateRanges: [
          {
            startDate: startDate?.toISOString()?.split("T")[0],
            endDate: endDate?.toISOString()?.split("T")[0],
          },
        ],
        dimensions: [
          { name: "landingPagePlusQueryString" },
          { name: "country" },
        ],
        metrics: [
          { name: "sessions" },
          { name: "organicGoogleSearchAveragePosition" },
          { name: "engagementRate" },
          { name: "sessionsPerUser" },
        ],
      },

      general: {
        dateRanges: [
          {
            startDate: startDate?.toISOString()?.split("T")[0],
            endDate: endDate?.toISOString()?.split("T")[0],
          },
        ],
        dimensions: [{ name: "fullPageUrl" }],
        metrics: [
          { name: "sessions" },
          { name: "newUsers" },
          { name: "totalUsers" },
          { name: "bounceRate" },
          { name: "scrolledUsers" },
        ],
      },
      country: {
        dateRanges: [
          {
            startDate: startDate?.toISOString()?.split("T")[0],
            endDate: endDate?.toISOString()?.split("T")[0],
          },
        ],
        dimensions: [{ name: "country" }],
        metrics: [
          { name: "sessions" },
          { name: "newUsers" },
          { name: "totalUsers" },
          { name: "bounceRate" },
          { name: "scrolledUsers" },
          { name: "sessionsPerUser" },
        ],
      },
      city: {
        dateRanges: [
          {
            startDate: startDate?.toISOString()?.split("T")[0],
            endDate: endDate?.toISOString()?.split("T")[0],
          },
        ],
        dimensions: [{ name: "city" }],
        metrics: [
          { name: "sessions" },
          { name: "newUsers" },
          { name: "totalUsers" },
          { name: "sessionsPerUser" },
          { name: "scrolledUsers" },
          { name: "bounceRate" },
        ],
      },
      device: {
        dateRanges: [
          {
            startDate: startDate?.toISOString()?.split("T")[0],
            endDate: endDate?.toISOString()?.split("T")[0],
          },
        ],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [
          { name: "sessions" },
          { name: "newUsers" },
          { name: "totalUsers" },
          { name: "bounceRate" },
          { name: "scrolledUsers" },
          { name: "sessionsPerUser" },
        ],
      },
    };

    switch (value) {
      case "general":
        type.push(params.general);
        break;
      case "landings":
        type.push(params.landings);
        break;
      case "country":
        type.push(params.country);
        break;
      case "city":
        type.push(params.city);
        break;
      case "device":
        type.push(params.device);
        break;
      default:
        type.push(params.general);
        break;
    }

    try {
      const result: any = await invoke("get_google_analytics_command", {
        searchType: type,
        dateRanges: analyticsDate,
      });

      if (result.response[0]?.error) {
        toast(result.response[0]?.error.message);
      }

      console.log("Result: ", result);
      setAnalyticsData(result);
      setCurrentPage(1);
      return result;
    } catch (error) {
      console.error("Error fetching Google Analytics data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      console.log("Selected date range:", {
        from: format(startDate, "yyyy-MM-dd"),
        to: format(endDate, "yyyy-MM-dd"),
      });
      handleFilteredAnalytics(selectedDimension);
    }
  }, [startDate, endDate]);

  const sortData = (data: any[], key: string, order: "asc" | "desc") => {
    return [...data].sort((a, b) => {
      let aValue = null;
      let bValue = null;

      // Find the value in either dimensionValues or metricValues
      for (const values of ["dimensionValues", "metricValues"]) {
        const aItem = a[values]?.find((item: any) => item.name === key);
        const bItem = b[values]?.find((item: any) => item.name === key);
        if (aItem && bItem) {
          aValue = aItem.value;
          bValue = bItem.value;
          break;
        }
      }

      // If no values found, return 0 to maintain current order
      if (aValue === null || bValue === null) return 0;

      // Convert to numbers for numeric comparison
      const aNum = parseFloat(aValue);
      const bNum = parseFloat(bValue);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return order === "asc" ? aNum - bNum : bNum - aNum;
      }

      // String comparison for non-numeric values
      return order === "asc"
        ? aValue.toString().localeCompare(bValue.toString())
        : bValue.toString().localeCompare(aValue.toString());
    });
  };

  const sortedData = analyticsData?.response?.[0]?.rows
    ? sortData(analyticsData.response[0].rows, sortKey, sortOrder).filter(
        (item) =>
          item?.dimensionValues?.some((d: any) =>
            d?.value?.toLowerCase().includes(search.toLowerCase())
          )
      )
    : [];

  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const handleSort = (key: string) => {
    if (key === sortKey) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }

    // Immediately sort the data when header is clicked
    if (analyticsData?.response?.[0]?.rows) {
      const newSortedRows = sortData(
        analyticsData.response[0].rows,
        key,
        key === sortKey ? (sortOrder === "asc" ? "desc" : "asc") : "desc"
      );
      setAnalyticsData((prevData: any) => ({
        ...prevData,
        response: [{ ...prevData.response[0], rows: newSortedRows }],
      }));
    }
  };

  const clearSearch = () => {
    setSearch("");
  };

  useEffect(() => {
    const fetchData = async () => {
      await handleFilteredAnalytics("general");
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (analyticsData?.response?.[0]?.rows) {
      const sortedRows = sortData(
        analyticsData.response[0].rows,
        sortKey,
        sortOrder
      );
      setAnalyticsData((prevData: any) => ({
        ...prevData,
        response: [{ ...prevData.response[0], rows: sortedRows }],
      }));
    }
  }, [sortKey, sortOrder]);

  const getSortIcon = (headerName: string) => {
    if (headerName === sortKey) {
      return sortOrder === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ArrowDown className="ml-2 h-4 w-4" />
      );
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className="mx-auto py-1 z-10 text-xs overflow-y-hidden w-[calc(100vw-21rem)]">
      <div className="mb-2 flex items-center space-x-4 mt-1.5">
        <div className="relative flex-grow w-full rounded-md dark:border-brand-dark dark:bg-brand-darker">
          <Search className="absolute left-3 top-2.5 h-3 w-3 text-muted-foreground dark:text-white/50" />
          <Input
            placeholder="Search URLs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 h-8 text-xs dark:bg-brand-darker w-full dark:text-white"
          />
          {search && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center space-x-2 w-[400px] relative z-[1000]">
          <div>
            <DatePicker
              selected={startDate}
              onChange={(date: Date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              maxDate={endDate}
              customInput={<CustomInput />}
              className="react-datepicker z-[1000]"
              popperClassName="react-datepicker-popper z-[1000]"
              calendarClassName="react-datepicker-calendar z-[1000]"
              wrapperClassName="react-datepicker-wrapper z-[1000]"
              dateFormat="MMM d, yyyy"
            />
          </div>
          <span className="text-gray-500 dark:text-white/50">to</span>
          <div>
            <DatePicker
              selected={endDate}
              onChange={(date: Date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              customInput={<CustomInput />}
              className="react-datepicker z-[1000]"
              popperClassName="react-datepicker-popper z-[1000]"
              calendarClassName="react-datepicker-calendar z-[1000]"
              wrapperClassName="react-datepicker-wrapper z-[1000]"
              dateFormat="MMM d, yyyy"
            />
          </div>
        </div>
        <Select
          onValueChange={handleFilteredAnalytics}
          value={selectedDimension}
        >
          <SelectTrigger className="w-[180px] text-xs h-8 dark:text-white/50">
            <SelectValue placeholder="Select dimension" />
          </SelectTrigger>
          <SelectContent className="dark:text-white text-xs">
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="landings">Landings</SelectItem>
            <SelectItem value="country">Country</SelectItem>
            <SelectItem value="city">City</SelectItem>
            <SelectItem value="device">Device</SelectItem>
          </SelectContent>
        </Select>
        {totalPages > 1 && (
          <div className="flex justify-center items-center w-[230px]">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="mr-2 bg-brand-bright text-white p-1 rounded-md px-1"
            >
              <FaChevronLeft className="h-4 w-4" />
            </button>
            <span className="dark:text-white/50">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="ml-2 bg-brand-bright text-white p-1 rounded-md px-1"
            >
              <FaChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      <div className="rounded-md w-full border dark:border-brand-dark h-[calc(100vh-12.4rem)] overflow-y-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-bright"></div>
          </div>
        ) : (
          <div className="h-full w-full overflow-auto">
            <Table className="relative w-full text-xs">
              <TableHeader className="sticky top-0 bg-white dark:bg-gray-800 z-10 shadow">
                <TableRow>
                  {analyticsData?.response?.[0]?.dimensionHeaders?.map(
                    (header, index) => (
                      <TableHead key={index} className="text-left">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort(header.name)}
                          className="text-xs"
                        >
                          {header.name.charAt(0).toUpperCase() +
                            header.name
                              .slice(1)
                              .replace(/([A-Z])/g, " $1")
                              .trim()}
                        </Button>
                      </TableHead>
                    )
                  )}
                  {analyticsData?.response?.[0]?.metricHeaders?.map(
                    (header, index) => (
                      <TableHead key={index} className="text-center">
                        <div
                          onClick={() => handleSort(header.name)}
                          className="text-xs"
                        >
                          {header.name.charAt(0).toUpperCase() +
                            header.name
                              .slice(1)
                              .replace(/([A-Z])/g, " $1")
                              .trim()}
                        </div>
                      </TableHead>
                    )
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row, index) => (
                  <TableRow key={index} className="py-0">
                    {row?.dimensionValues?.map((dimension, dimIndex) => (
                      <TableCell
                        key={dimIndex}
                        className="font-medium text-xs text-left"
                      >
                        <div
                          className="truncate max-w-[400px] p-0 pl-4"
                          title={dimension?.value}
                        >
                          {dimension?.value || "N/A"}
                        </div>
                      </TableCell>
                    ))}
                    {row?.metricValues?.map((metric, metricIndex) => (
                      <TableCell
                        key={metricIndex}
                        className="text-xs text-center"
                      >
                        {metric?.name === "bounceRate"
                          ? `${(parseFloat(metric?.value || "0") * 100).toFixed(2)}%`
                          : parseFloat(metric?.value || "0").toFixed(1)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <style jsx global>{`
        .react-datepicker {
          font-family: inherit;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          z-index: 1000;
        }

        .react-datepicker__header {
          background-color: #f8fafc;
          color: white;
          border-bottom: 1px solid #e2e8f0;
        }

        .react-datepicker__current-month,
        .react-datepicker__day-name,
        .react-datepicker__day {
          color: #1e293b;
        }

        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background-color: #3b82f6;
          color: white;
        }

        .react-datepicker__day:hover {
          background-color: #f1f5f9;
          color: white;
        }

        .react-datepicker__day--selected:hover {
          background-color: #2563eb;
        }

        /* Dark mode styles */
        .dark .react-datepicker {
          background-color: #1e293b;
          border-color: #334155;
        }

        .dark .react-datepicker__header {
          background-color: #1e293b;
          border-bottom-color: #334155;
        }

        .dark .react-datepicker__current-month,
        .dark .react-datepicker__day-name,
        .dark .react-datepicker__day {
          color: #e2e8f0;
        }

        .dark .react-datepicker__day:hover {
          background-color: #334155;
        }

        .dark .react-datepicker__day--outside-month {
          color: #64748b;
        }

        .dark .react-datepicker__day--disabled {
          color: #475569;
        }

        .react-datepicker-popper {
          z-index: 1000 !important;
        }
      `}</style>
    </div>
  );
}
