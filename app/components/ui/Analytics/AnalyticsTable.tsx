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
import { ArrowUpDown, Search, X } from "lucide-react";
import { addDays, format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { invoke } from "@tauri-apps/api/tauri";

// This would typically come from an API or database
const getAnalyticsData = () =>
  Array.from({ length: 50 }, (_, index) => ({
    url: `https://www.algarvewonders.com/${["blog", "products", "about", "contact", "beaches", "jobs", "businesses", "locations"][Math.floor(Math.random() * 8)]}/${Math.random().toString(36).substring(7)}`,
    pageVisits: Math.floor(Math.random() * 50000) + 1000,
    impressions: Math.floor(Math.random() * 100000) + 5000,
    clickThroughRate: Number((Math.random() * 10).toFixed(1)),
    averageTimeOnPage: `${Math.floor(Math.random() * 5) + 1}m ${Math.floor(Math.random() * 60)}s`,
    bounceRate: Number((Math.random() * 70 + 20).toFixed(1)),
    country: ["US", "UK", "CA", "AU", "DE", "FR"][
      Math.floor(Math.random() * 6)
    ],
    source: ["organic", "paid", "social"][Math.floor(Math.random() * 3)],
    device: ["tablet", "mobile", "desktop"][Math.floor(Math.random() * 3)],
  }));

type SortKey = keyof ReturnType<typeof getAnalyticsData>[0];

export default function AnalyticsTable({
  handleGetGoogleAnalytics,
}: {
  handleGetGoogleAnalytics: () => void;
}) {
  const [analyticsData, setAnalyticsData] = useState<
    ReturnType<typeof getAnalyticsData>
  >([]);
  const [sortKey, setSortKey] = useState<SortKey>("pageVisits");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2024, 0, 1),
    to: addDays(new Date(2024, 0, 1), 20),
  });
  const [selectedDimension, setSelectedDimension] = useState("medium");
  const [analyticsDate, setAnalyticsDate] = useState<DateRange | undefined>(
    undefined,
  );

  useEffect(() => {
    setAnalyticsData(getAnalyticsData());
  }, []);

  useEffect(() => {
    if (date?.from && date?.to) {
      console.log("Selected date range:", {
        from: format(date.from, "yyyy-MM-dd"),
        to: format(date.to, "yyyy-MM-dd"),
      });
    }
  }, [date]);

  console.log("Analytics Date Func: ", analyticsDate);

  const sortedData = Array.isArray(analyticsData)
    ? [...analyticsData]
        .sort((a, b) => {
          if (a[sortKey] < b[sortKey]) return sortOrder === "asc" ? -1 : 1;
          if (a[sortKey] > b[sortKey]) return sortOrder === "asc" ? 1 : -1;
          return 0;
        })
        .filter(
          (item) =>
            item.url && item.url.toLowerCase().includes(search.toLowerCase()),
        )
    : [];

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const clearSearch = () => {
    setSearch("");
  };

  const handleFilteredAnalytics = async (value: string) => {
    setAnalyticsDate([
      {
        start_date: date.from,
        end_date: date.to,
      },
    ]);

    let type = [];

    let params = {
      organic: {
        dateRanges: [
          {
            startDate: "2024-01-01",
            endDate: "today",
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
    };

    switch (value) {
      case "organic":
        type.push(params.organic);
        break;
      case "newUsers":
        params.metrics = [{ name: "newUsers" }];
        break;
      case "totalUsers":
        params.metrics = [{ name: "totalUsers" }];
        break;
      case "bounceRate":
        params.metrics = [{ name: "bounceRate" }];
        break;
      case "scrolledUsers":
        params.metrics = [{ name: "scrolledUsers" }];
        break;
      default:
        console.error("Invalid metric type");
        return;
    }

    try {
      const result: any = await invoke("get_google_analytics_command", {
        searchType: type,
        dateRanges: analyticsDate,
      });
      console.log("Result: ", result);
      setAnalyticsData(result);
    } catch (error) {
      console.error("Error fetching Google Analytics data:", error);
    }
  };

  return (
    <div className="mx-auto py-1 z-10 text-xs overflow-y-hidden w-[calc(100vw-21rem)]">
      <div className="mb-2 flex items-center space-x-4 mt-1.5">
        <div className="relative flex-grow  rounded-md dark:border-brand-dark dark:bg-brand-darker">
          <Search className="absolute left-3 top-2.5 h-3 w-3 text-muted-foreground dark:text-white/50" />
          <Input
            placeholder="Search URLs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 h-8 text-xs dark:bg-brand-darker w-full dark:text-white "
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
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[300px] justify-start text-left font-normal dark:text-white/50 dark:bg-brand-darker border dark:border-brand-dark text-xs h-8",
                !date && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-3 w-3 dark:text-white/50" />
              {date?.from ? (
                date?.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 dark:text-white/50"
            align="start"
          >
            <Calendar
              className="dark:text-white/50"
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        <Select onValueChange={handleFilteredAnalytics}>
          <SelectTrigger className="w-[180px] text-xs h-8 dark:text-white/50">
            <SelectValue placeholder="Select dimension" />
          </SelectTrigger>
          <SelectContent className="dark:text-white text-xs ">
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="organic">Organic</SelectItem>
            <SelectItem value="browser">Browser</SelectItem>
            <SelectItem value="country">Country</SelectItem>
            <SelectItem value="city">City</SelectItem>
            <SelectItem value="language">Language</SelectItem>
            <SelectItem value="operatingSystem">Operating System</SelectItem>
            <SelectItem value="pageTitle">Page Title</SelectItem>
            <SelectItem value="pagePath">Page Path</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md w-full border dark:border-brand-dark  h-[calc(100vh-13rem)] overflow-y-hidden">
        <div className="h-full w-full overflow-auto">
          <Table className="relative w-full text-xs">
            <TableHeader className="sticky top-0 bg-white z-10 shadow">
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("fullPageUrl")}
                    className="text-xs"
                  >
                    Full Page URL
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                {analyticsData &&
                  analyticsData.response &&
                  analyticsData.response[0]?.metricHeaders.map(
                    (header, index) => (
                      <TableHead key={index}>
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
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                    ),
                  )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {analyticsData && analyticsData.response?.[0]?.rows
                ? analyticsData.response[0].rows.map((row, index) => (
                    <TableRow key={index} className="py-0">
                      <TableCell className="font-medium text-xs">
                        <div
                          className="truncate max-w-[300px] p-0 "
                          title={row.dimensionValues[0]?.value}
                        >
                          {row.dimensionValues[0]?.value || "N/A"}
                        </div>
                      </TableCell>
                      {row.metricValues.map((metric, metricIndex) => (
                        <TableCell key={metricIndex} className="text-xs">
                          {metric.value}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
