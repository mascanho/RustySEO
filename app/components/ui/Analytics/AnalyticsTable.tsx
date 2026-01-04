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
import { ArrowUpDown, Search, X, ArrowUp, ArrowDown, Calendar as CalendarIcon } from "lucide-react";
import { addDays, format } from "date-fns";

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
  const [analyticsData, setAnalyticsData] = useState<any>([]);
  const [sortKey, setSortKey] = useState<string>("sessions");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");

  // Initialize dates
  const [startDate, setStartDate] = useState<Date | null>(new Date(2022, 0, 1));
  const [endDate, setEndDate] = useState<Date | null>(addDays(new Date(), 0)); // Default to today

  const [selectedDimension, setSelectedDimension] = useState("general");
  const [analyticsDate, setAnalyticsDate] = useState<any>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const rowsPerPage = 100;

  // Helper to format date for input value (yyyy-MM-dd)
  const formatDateForInput = (date: Date | null) => {
    if (!date) return "";
    return format(date, "yyyy-MM-dd");
  };

  // Handle manual date change
  const handleDateChange = (type: 'start' | 'end', value: string) => {
    if (!value) return;
    const date = new Date(value);
    // Adjust for timezone offset to ensure the date is correct
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

    if (type === 'start') {
      setStartDate(adjustedDate);
    } else {
      setEndDate(adjustedDate);
    }
  };

  // Handle the fetching of analytics data
  const handleFilteredAnalytics = async (value: string) => {
    if (!startDate || !endDate) return;

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
      (item: any) =>
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

  return (
    <div className="flex flex-col h-full w-full">
      <div className="mb-4 flex items-center space-x-3 px-1 pt-2">
        <div className="relative flex-grow max-w-sm rounded-md dark:border-brand-dark dark:bg-brand-darker">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground dark:text-white/50" />
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

        {/* Native Date Pickers */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="date"
              value={formatDateForInput(startDate)}
              onChange={(e) => handleDateChange('start', e.target.value)}
              className="h-8 text-xs border rounded-md px-2 bg-white dark:bg-brand-darker dark:text-white dark:border-brand-dark focus:outline-none focus:ring-2 focus:ring-orange-500/20 block w-[130px] dark:[color-scheme:dark]"
            />
          </div>
          <span className="text-gray-400 dark:text-gray-600">-</span>
          <div className="relative">
            <input
              type="date"
              value={formatDateForInput(endDate)}
              onChange={(e) => handleDateChange('end', e.target.value)}
              min={formatDateForInput(startDate)}
              className="h-8 text-xs border rounded-md px-2 bg-white dark:bg-brand-darker dark:text-white dark:border-brand-dark focus:outline-none focus:ring-2 focus:ring-orange-500/20 block w-[130px] dark:[color-scheme:dark]"
            />
          </div>
        </div>

        <Select
          onValueChange={handleFilteredAnalytics}
          value={selectedDimension}
        >
          <SelectTrigger className="w-[160px] text-xs h-8 dark:text-white/50">
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

        <div className="flex-1" /> {/* Spacer */}

        {totalPages > 1 && (
          <div className="flex justify-end items-center text-xs">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="mr-2 bg-brand-bright text-white p-1 rounded-md px-2 disabled:opacity-50"
            >
              <FaChevronLeft className="h-3 w-3" />
            </button>
            <span className="dark:text-white/50 px-2 min-w-[80px] text-center">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="ml-2 bg-brand-bright text-white p-1 rounded-md px-2 disabled:opacity-50"
            >
              <FaChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 rounded-md w-full overflow-hidden relative border-t dark:border-brand-dark">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-bright"></div>
          </div>
        ) : (
          <div className="h-full w-full overflow-auto">
            <Table className="relative w-full text-xs">
              <TableHeader className="sticky top-0 bg-white dark:bg-brand-darker z-10 shadow-sm">
                <TableRow className="hover:bg-transparent border-b dark:border-brand-dark">
                  {analyticsData?.response?.[0]?.dimensionHeaders?.map(
                    (header: any, index: number) => (
                      <TableHead key={index} className="text-left h-9">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort(header.name)}
                          className="text-xs font-bold hover:bg-transparent px-2 h-auto"
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
                    (header: any, index: number) => (
                      <TableHead key={index} className="text-center h-9">
                        <div
                          onClick={() => handleSort(header.name)}
                          className="text-xs font-bold cursor-pointer"
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
                {paginatedData.map((row: any, index: number) => (
                  <TableRow key={index} className="border-b dark:border-brand-dark/50 hover:bg-muted/50">
                    {row?.dimensionValues?.map((dimension: any, dimIndex: number) => (
                      <TableCell
                        key={dimIndex}
                        className="font-medium text-xs text-left py-2"
                      >
                        <div
                          className="truncate max-w-[400px] pl-2"
                          title={dimension?.value}
                        >
                          {dimension?.value || "N/A"}
                        </div>
                      </TableCell>
                    ))}
                    {row?.metricValues?.map((metric: any, metricIndex: number) => (
                      <TableCell
                        key={metricIndex}
                        className="text-xs text-center py-2"
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
    </div>
  );
}
