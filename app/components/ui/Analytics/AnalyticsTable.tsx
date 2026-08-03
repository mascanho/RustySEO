// @ts-nocheck
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { format, addDays, isValid, parse } from "date-fns";
import { Search, Calendar as CalendarIcon, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { UniversalKeywordTable } from "../Shared/UniversalKeywordTable";
import { ColumnDef } from "@tanstack/react-table";
import useGA4StatusStore from "@/store/GA4StatusStore";

const ROW_LIMIT_OPTIONS = [1000, 5000, 10000, 25000, 50000];

// Returns the immediately-preceding period of equal length, used for
// period-over-period comparison (e.g. "previous 7 days" before the selected range).
const getPreviousPeriod = (start: Date, end: Date) => {
  const durationMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000);
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  return { prevStart, prevEnd };
};

const humanizeHeader = (name: string) =>
  name.charAt(0).toUpperCase() +
  name
    .slice(1)
    .replace(/([A-Z])/g, " $1")
    .trim();

const formatMetricValue = (name: string, value: any) => {
  const numValue = parseFloat(value || "0");

  if (name === "bounceRate" || name === "engagementRate") {
    return `${(numValue * 100).toFixed(2)}%`;
  }
  if (name === "averageSessionDuration") {
    const totalSeconds = Math.round(numValue);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }
  return numValue.toLocaleString(undefined, { maximumFractionDigits: 1 });
};

export default function AnalyticsTable() {
  const {
    analyticsData,
    setAnalyticsData,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedDimension,
    setSelectedDimension,
    rowLimit,
    setRowLimit,
    compareEnabled,
    setCompareEnabled,
  } = useGA4StatusStore();

  const [isLoading, setIsLoading] = useState(false);

  // Helper to format date for input value (yyyy-MM-dd)
  const formatDateForInput = (date: Date | null) => {
    if (!date || !isValid(date)) return "";
    return format(date, "yyyy-MM-dd");
  };

  // Handle manual date change
  const handleDateChange = (type: "start" | "end", value: string) => {
    if (!value) return;
    const date = new Date(value);
    // Adjust for timezone offset to ensure the date is correct
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

    if (type === "start") {
      setStartDate(adjustedDate);
    } else {
      setEndDate(adjustedDate);
    }
  };

  // Handle the fetching of analytics data
  const handleFilteredAnalytics = useCallback(
    async (dimensionVal: string = selectedDimension) => {
      if (!startDate || !endDate) return;

      setIsLoading(true);
      toast.info("Fetching latest data from Google Analytics 4...");

      // Update selected dimension if passed (e.g. from select change)
      if (dimensionVal !== selectedDimension) {
        setSelectedDimension(dimensionVal);
      }

      const analyticsDateRange = [
        {
          start_date: startDate,
          end_date: endDate.toISOString(),
        },
      ];

      const dateRanges = [
        {
          startDate: startDate?.toISOString()?.split("T")[0],
          endDate: endDate?.toISOString()?.split("T")[0],
        },
      ];

      if (compareEnabled && startDate && endDate) {
        const { prevStart, prevEnd } = getPreviousPeriod(startDate, endDate);
        dateRanges.push({
          startDate: prevStart.toISOString().split("T")[0],
          endDate: prevEnd.toISOString().split("T")[0],
        });
      }

      const presets: Record<string, any> = {
        general: {
          dateRanges,
          dimensions: [{ name: "fullPageUrl" }],
          metrics: [
            { name: "sessions" },
            { name: "newUsers" },
            { name: "totalUsers" },
            { name: "screenPageViews" },
            { name: "averageSessionDuration" },
            { name: "bounceRate" },
            { name: "conversions" },
          ],
        },
        landings: {
          dateRanges,
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
        pages: {
          dateRanges,
          dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
          metrics: [
            { name: "screenPageViews" },
            { name: "averageSessionDuration" },
            { name: "bounceRate" },
          ],
        },
        channels: {
          dateRanges,
          dimensions: [{ name: "sessionDefaultChannelGroup" }],
          metrics: [
            { name: "sessions" },
            { name: "totalUsers" },
            { name: "engagementRate" },
            { name: "conversions" },
          ],
        },
        country: {
          dateRanges,
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
          dateRanges,
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
          dateRanges,
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

      const type = [presets[dimensionVal] || presets.general];

      try {
        const result: any = await invoke("get_google_analytics_command", {
          searchType: type,
          dateRanges: analyticsDateRange,
          rowLimit,
        });

        if (result.response[0]?.error) {
          toast(result.response[0]?.error.message);
        }

        console.log("Result: ", result);
        setAnalyticsData(result);
        toast.success("Google Analytics 4 data updated");
        return result;
      } catch (error) {
        console.error("Error fetching Google Analytics data:", error);
        const updateError =
          error instanceof Error ? error.message : String(error);
        toast.error(`Failed to refresh Google Analytics data: ${updateError}`);
      } finally {
        setIsLoading(false);
      }
    },
    [startDate, endDate, selectedDimension, rowLimit, compareEnabled],
  );

  // Remove auto-fetch on mount - data will only load when user explicitly requests it

  // Only refetch when dates change if user has already fetched data
  // REMOVED: Auto-fetch logic causing data to reload on tab swap.
  // User must explicitly click refresh to update data after changing dates.

  // --- Data Transformation ---

  const dimensionHeaders = analyticsData?.response?.[0]?.dimensionHeaders || [];
  const metricHeaders = analyticsData?.response?.[0]?.metricHeaders || [];
  const hasComparison = dimensionHeaders.some((h: any) => h.name === "dateRange");

  const flattenData = useMemo(() => {
    if (!analyticsData?.response?.[0]?.rows) return [];

    return analyticsData.response[0].rows.map((row: any) => {
      const flatRow: any = {};

      row.dimensionValues?.forEach((dim: any, index: number) => {
        const headerName = dimensionHeaders[index]?.name || `dim_${index}`;
        flatRow[headerName] = dim.value;
      });

      row.metricValues?.forEach((met: any, index: number) => {
        const headerName = metricHeaders[index]?.name || `met_${index}`;
        flatRow[headerName] = met.value;
      });

      return flatRow;
    });
  }, [analyticsData, dimensionHeaders, metricHeaders]);

  // When comparison is on, GA4 returns one row per (dimension combo, date range) pair.
  // Pivot those into a single row per dimension combo with current/previous/delta columns.
  const tableData = useMemo(() => {
    if (!hasComparison) return flattenData;

    const groupKeys = dimensionHeaders
      .map((h: any) => h.name)
      .filter((name: string) => name !== "dateRange");

    const groups = new Map<string, any>();

    flattenData.forEach((row: any) => {
      const key = groupKeys.map((k: string) => row[k]).join("||");
      if (!groups.has(key)) {
        const base: any = {};
        groupKeys.forEach((k: string) => (base[k] = row[k]));
        groups.set(key, base);
      }
      const target = groups.get(key);
      const isCurrent = row.dateRange === "date_range_0";

      metricHeaders.forEach((h: any) => {
        const numValue = parseFloat(row[h.name] || "0");
        if (isCurrent) {
          target[h.name] = row[h.name];
          target[`__current_${h.name}`] = numValue;
        } else {
          target[`${h.name}_previous`] = row[h.name];
          target[`__previous_${h.name}`] = numValue;
        }
      });
    });

    return Array.from(groups.values()).map((group: any) => {
      metricHeaders.forEach((h: any) => {
        const current = group[`__current_${h.name}`] ?? 0;
        const previous = group[`__previous_${h.name}`] ?? 0;
        group[`${h.name}_delta`] =
          previous === 0 ? (current === 0 ? 0 : null) : ((current - previous) / previous) * 100;
        delete group[`__current_${h.name}`];
        delete group[`__previous_${h.name}`];
      });
      return group;
    });
  }, [flattenData, hasComparison, dimensionHeaders, metricHeaders]);

  const columns = useMemo<ColumnDef<any>[]>(() => {
    if (!analyticsData?.response?.[0]) return [];

    const cols: ColumnDef<any>[] = [];

    dimensionHeaders
      .filter((header: any) => header.name !== "dateRange")
      .forEach((header: any) => {
        cols.push({
          accessorKey: header.name,
          header: humanizeHeader(header.name),
          cell: ({ row }) => (
            <div
              className="truncate max-w-[400px]"
              title={row.getValue(header.name)}
            >
              {row.getValue(header.name) || "N/A"}
            </div>
          ),
        });
      });

    metricHeaders.forEach((header: any) => {
      cols.push({
        accessorKey: header.name,
        header: humanizeHeader(header.name),
        cell: ({ row }) => formatMetricValue(header.name, row.getValue(header.name)),
      });

      if (hasComparison) {
        cols.push({
          accessorKey: `${header.name}_previous`,
          header: `${humanizeHeader(header.name)} (Previous)`,
          cell: ({ row }) =>
            formatMetricValue(header.name, row.getValue(`${header.name}_previous`)),
        });
        cols.push({
          accessorKey: `${header.name}_delta`,
          header: `${humanizeHeader(header.name)} Δ%`,
          cell: ({ row }) => {
            const delta = row.getValue(`${header.name}_delta`);
            if (delta === null || delta === undefined) return "N/A";
            const num = Number(delta);
            const sign = num > 0 ? "+" : "";
            return (
              <span
                className={
                  num > 0
                    ? "text-green-600 dark:text-green-400"
                    : num < 0
                      ? "text-red-600 dark:text-red-400"
                      : ""
                }
              >
                {sign}
                {num.toFixed(1)}%
              </span>
            );
          },
        });
      }
    });

    return cols;
  }, [analyticsData, dimensionHeaders, metricHeaders, hasComparison]);

  return (
    <div className="px-0 h-full flex flex-col dark:text-white/50">
      <UniversalKeywordTable
        data={tableData}
        columns={columns}
        searchPlaceholder="Search data..."
        isLoading={isLoading}
        headerActions={
          <div className="flex items-center gap-2">
            {/* Dimension Select */}
            <Select
              onValueChange={(val) => handleFilteredAnalytics(val)}
              value={selectedDimension}
            >
              <SelectTrigger className="w-[150px] h-9 text-xs bg-white dark:bg-brand-darker border-gray-200 dark:border-brand-dark focus:ring-1 focus:ring-offset-0 rounded-xl mr-2">
                <SelectValue placeholder="Select dimension" />
              </SelectTrigger>
              <SelectContent className="dark:text-white text-xs dark:bg-brand-darker dark:border-brand-dark">
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="landings">Landings</SelectItem>
                <SelectItem value="pages">Pages</SelectItem>
                <SelectItem value="channels">Channels</SelectItem>
                <SelectItem value="country">Country</SelectItem>
                <SelectItem value="city">City</SelectItem>
                <SelectItem value="device">Device</SelectItem>
              </SelectContent>
            </Select>

            <Select
              onValueChange={(val) => setRowLimit(Number(val))}
              value={String(rowLimit)}
            >
              <SelectTrigger className="w-[110px] h-9 text-xs bg-white dark:bg-brand-darker border-gray-200 dark:border-brand-dark focus:ring-1 focus:ring-offset-0 rounded-xl">
                <SelectValue placeholder="Rows" />
              </SelectTrigger>
              <SelectContent className="dark:text-white text-xs dark:bg-brand-darker dark:border-brand-dark">
                {ROW_LIMIT_OPTIONS.map((limit) => (
                  <SelectItem key={limit} value={String(limit)}>
                    {limit.toLocaleString()} rows
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="w-px h-6 bg-gray-200 dark:bg-brand-dark mx-1"></div>

            {/* Date Picker Group */}
            <div className="flex items-center gap-1.5 h-9 px-2.5 border border-gray-200 dark:border-brand-dark rounded-xl bg-white dark:bg-brand-darker shadow-sm">
              <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0 mr-1" />
              <div className="relative">
                <input
                  type="date"
                  value={formatDateForInput(startDate)}
                  onChange={(e) => handleDateChange("start", e.target.value)}
                  className="h-full w-[75px] text-xs bg-transparent border-none p-0 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-0 dark:[color-scheme:dark] font-medium opacity-0 absolute inset-0 cursor-pointer"
                />
                <input
                  type="text"
                  value={startDate ? format(startDate, "dd/MM/yyyy") : ""}
                  readOnly
                  placeholder="dd/mm/yyyy"
                  className="h-full w-[75px] text-xs bg-transparent border-none p-0 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-0 font-medium pointer-events-none"
                />
              </div>
              <span className="text-gray-300 dark:text-gray-600 select-none">
                -
              </span>
              <div className="relative">
                <input
                  type="date"
                  value={formatDateForInput(endDate)}
                  onChange={(e) => handleDateChange("end", e.target.value)}
                  min={formatDateForInput(startDate)}
                  className="h-full w-[75px] text-xs bg-transparent border-none p-0 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-0 dark:[color-scheme:dark] font-medium opacity-0 absolute inset-0 cursor-pointer"
                />
                <input
                  type="text"
                  value={endDate ? format(endDate, "dd/MM/yyyy") : ""}
                  readOnly
                  placeholder="dd/mm/yyyy"
                  className="h-full w-[75px] text-xs bg-transparent border-none p-0 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-0 font-medium text-right pointer-events-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 h-9 px-2.5 border border-gray-200 dark:border-brand-dark rounded-xl bg-white dark:bg-brand-darker shadow-sm">
              <Switch
                checked={compareEnabled}
                onCheckedChange={(checked) => setCompareEnabled(checked)}
                className="scale-75"
              />
              <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                Compare to previous period
              </span>
            </div>

            <button
              onClick={() => handleFilteredAnalytics(selectedDimension)}
              className="h-9 w-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-brand-dark rounded-xl transition-all border border-transparent hover:border-gray-200 dark:hover:border-brand-dark text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Refresh data"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
            <div className="w-px h-6 bg-gray-200 dark:bg-brand-dark mx-1"></div>
          </div>
        }
      />
    </div>
  );
}
