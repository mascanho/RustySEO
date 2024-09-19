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
import { ArrowUpDown, Search } from "lucide-react";
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
// This would typically come from an API or database
const getAnalyticsData = () =>
  Array.from({ length: 50 }, (_, index) => ({
    url: `https://www/algarvewonders.com/${["blog", "products", "about", "contact", "beaches", "jobs", "businesses", "locations"][Math.floor(Math.random() * 4)]}/${Math.random().toString(36).substring(7)}`,
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

export default function AnalyticsTable({ handleGetGoogleAnalytics }: any) {
  const [analyticsData, setAnalyticsData] = useState<
    ReturnType<typeof getAnalyticsData>
  >([]);
  const [sortKey, setSortKey] = useState<SortKey>("pageVisits");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2022, 0, 20),
    to: addDays(new Date(2022, 0, 20), 20),
  });

  useEffect(() => {
    setAnalyticsData(getAnalyticsData());
  }, []);

  const sortedData = [...analyticsData]
    .sort((a, b) => {
      if (a[sortKey] < b[sortKey]) return sortOrder === "asc" ? -1 : 1;
      if (a[sortKey] > b[sortKey]) return sortOrder === "asc" ? 1 : -1;
      return 0;
    })
    .filter((item) => item.url.toLowerCase().includes(search.toLowerCase()));

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  return (
    <div className="mx-auto py-1 px-1  z-10 text-xs overflow-y-hidden ">
      <h1
        onClick={handleGetGoogleAnalytics}
        className="text-xs font-bold mb-2 dark:text-white/50"
      >
        Google Analytics Dashboard
      </h1>
      <div className="mb-2 flex items-center space-x-4">
        <div className="relative flex-grow  rounded-md dark:border-brand-dark dark:bg-brand-darker">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground dark:text-white" />
          <Input
            placeholder="Search URLs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs dark:bg-brand-darker w-full "
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[300px] justify-start text-left font-normal dark:text-white dark:bg-brand-darker border dark:border-brand-dark",
                !date && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 dark:text-white" />
              {date?.from ? (
                date.to ? (
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
          <PopoverContent className="w-auto p-0 dark:text-white" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="rounded-md w-full border dark:border-brand-dark  h-[calc(100vh-15rem)] overflow-y-hidden">
        <div className="h-full w-full overflow-auto">
          <Table className="relative w-full text-xs">
            <TableHeader className="sticky top-0 bg-white z-10 shadow">
              <TableRow>
                <TableHead className="w-[300px] text-xs">URL</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("pageVisits")}
                    className="text-xs"
                  >
                    Page Visits
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("impressions")}
                    className="text-xs"
                  >
                    Impressions
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("clickThroughRate")}
                    className="text-xs"
                  >
                    CTR
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("averageTimeOnPage")}
                    className="text-xs"
                  >
                    Avg. Time
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("bounceRate")}
                    className="text-xs"
                  >
                    Bounce Rate
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("country")}
                    className="text-xs"
                  >
                    Country
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("source")}
                    className="text-xs"
                  >
                    Source
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("device")}
                    className="text-xs"
                  >
                    Device
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item) => (
                <TableRow key={item.url} className="py-0">
                  <TableCell className="font-medium text-xs">
                    <div
                      className="truncate max-w-[300px] p-0 "
                      title={item.url}
                    >
                      {item.url}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.pageVisits.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.impressions.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.clickThroughRate.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.averageTimeOnPage}
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.bounceRate.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-xs">{item.country}</TableCell>
                  <TableCell className="text-xs">{item.source}</TableCell>
                  <TableCell className="text-xs">{item.device}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
