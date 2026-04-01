//@ts-nocheck
"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart,
  MousePointerClick,
  Percent,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  Bot,
  User,
  BadgeCheck,
} from "lucide-react";
import {
  IoLogoGoogle,
  IoLogoFacebook,
} from "react-icons/io5";
import { SiSemrush } from "react-icons/si";
import { Link2 } from "lucide-react";
import { TbBrandBing } from "react-icons/tb";
import { RiOpenaiFill, RiRobot2Fill } from "react-icons/ri";
import { FaSpider } from "react-icons/fa6";
import useGSCStatusStore from "@/store/GSCStatusStore";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { BsCalendar2 } from "react-icons/bs";

interface SearchConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  crawlerType?: string;
  verified?: boolean;
}

export function RankingsLogs({
  isOpen,
  onClose,
  url,
  crawlerType,
  verified,
}: SearchConsoleModalProps) {
  const { selectedURLDetails, startDate, endDate } = useGSCStatusStore();
  const [sortConfig, setSortConfig] = useState<{
    key: keyof GscMatch;
    direction: "ascending" | "descending";
  } | null>({ key: "clicks", direction: "descending" });

  const dateRangeText = useMemo(() => {
    if (startDate && endDate) {
      return `${format(startDate, "MMM d, yyyy")} - ${format(
        endDate,
        "MMM d, yyyy",
      )}`;
    }
    return "Last 28 days";
  }, [startDate, endDate]);

  const getCrawlerIcon = (type?: string) => {
    if (!type) return { icon: <Bot size={14} />, color: "text-gray-500 dark:text-gray-400" };
    const ct = type.toLowerCase();
    if (ct.includes("google")) {
      return { icon: <IoLogoGoogle size={14} />, color: "text-blue-600 dark:text-blue-400" };
    }
    if (ct.includes("bing")) {
      return { icon: <TbBrandBing size={14} />, color: "text-teal-600 dark:text-teal-400" };
    }
    if (ct.includes("semrush")) {
      return { icon: <SiSemrush size={12} />, color: "text-orange-600 dark:text-orange-400" };
    }
    if (ct.includes("ahrefs") || ct.includes("hrefs")) {
      return { icon: <Link2 size={14} />, color: "text-blue-700 dark:text-blue-300" };
    }
    if (ct.includes("moz")) {
      return { icon: <RiRobot2Fill size={14} />, color: "text-blue-500 dark:text-blue-400" };
    }
    if (ct.includes("openai") || ct.includes("gptbot") || ct.includes("chatgpt")) {
      return { icon: <RiOpenaiFill size={14} />, color: "text-emerald-600 dark:text-emerald-400" };
    }
    if (ct.includes("claude") || ct.includes("anthropic")) {
      return { icon: <RiOpenaiFill size={14} />, color: "text-amber-700 dark:text-amber-400" };
    }
    if (ct.includes("meta") || ct.includes("facebook")) {
      return { icon: <IoLogoFacebook size={14} />, color: "text-blue-600 dark:text-blue-400" };
    }
    if (ct === "human") {
      return { icon: <User size={14} />, color: "text-green-600 dark:text-green-400" };
    }
    if (ct.includes("bot") || ct.includes("crawler") || ct.includes("spider")) {
      return { icon: <FaSpider size={12} />, color: "text-purple-600 dark:text-purple-400" };
    }
    return { icon: <Bot size={14} />, color: "text-gray-500 dark:text-gray-400" };
  };

  const requestSort = (key: keyof GscMatch) => {
    let direction: "ascending" | "descending" = "descending";
    if (sortConfig && sortConfig.key === key) {
      direction =
        sortConfig.direction === "descending" ? "ascending" : "descending";
    }
    setSortConfig({ key, direction });
  };

  const sortedMatches = useMemo(() => {
    if (!selectedURLDetails?.matches) {
      return [];
    }

    let items = [...selectedURLDetails.matches];

    if (sortConfig !== null) {
      items.sort((a, b) => {
        const aVal = a[sortConfig.key as keyof GscMatch];
        const bVal = b[sortConfig.key as keyof GscMatch];

        if (aVal < bVal) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return items;
  }, [selectedURLDetails?.matches, sortConfig]);

  const metrics = useMemo(() => {
    if (!selectedURLDetails) {
      return {
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0,
      };
    }

    return {
      clicks: selectedURLDetails.total_clicks,
      impressions: selectedURLDetails.total_impressions,
      ctr: parseFloat(selectedURLDetails.avg_ctr.toFixed(2)),
      position: parseFloat(selectedURLDetails.avg_position.toFixed(1)),
    };
  }, [selectedURLDetails]);

  const metricItems = [
    {
      name: "Clicks",
      value: metrics.clicks.toLocaleString(),
      icon: MousePointerClick,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      name: "Impressions",
      value: metrics.impressions.toLocaleString(),
      icon: BarChart,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      name: "CTR",
      value: `${metrics.ctr}%`,
      icon: Percent,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/20",
    },
    {
      name: "Avg. Position",
      value: metrics.position,
      icon: TrendingUp,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/20",
    },
  ];

  const tableHeaders = [
    { key: "query", label: "Query", className: "text-left" },
    { key: "clicks", label: "Clicks", className: "text-right" },
    { key: "impressions", label: "Impressions", className: "text-right" },
    { key: "ctr", label: "CTR", className: "text-right" },
    { key: "position", label: "Position", className: "text-right" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[70vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b dark:border-zinc-700">
          <DialogTitle className="text-base font-semibold dark:text-white w-full">
            <div className="flex items-center space-x-2 justify-between">
              <h1 className="text-lg font-bold">
                Google Search Console Rankings
              </h1>
              <div className="flex items-center gap-3">
                {crawlerType && (
                  <div className={`flex items-center gap-1.5 py-1 px-2.5 text-xs rounded-md border ${crawlerType !== "Human"
                      ? "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200"
                      : "bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200"
                    }`}>
                    <span className={getCrawlerIcon(crawlerType).color}>
                      {getCrawlerIcon(crawlerType).icon}
                    </span>
                    <span className="font-medium">{crawlerType}</span>
                    {verified && (
                      <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-current/20">
                        <BadgeCheck size={14} className="text-blue-600 dark:text-blue-400" />
                        <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Verified</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <BsCalendar2 className="h-4 w-4" />
                  <span className="text-xs text-brand-bright">
                    {dateRangeText}
                  </span>
                </div>
              </div>
            </div>
          </DialogTitle>
          <div className="flex flex-col gap-1 mt-3">
            <DialogDescription className="truncate">
              <span className="text-brand-bright font-bold">Log URL:</span>{" "}
              {url}{" "}
            </DialogDescription>
            <DialogDescription className="truncate">
              <span className="text-brand-bright font-bold">
                Matched GSC URL:
              </span>{" "}
              {selectedURLDetails?.matches?.[0]?.source_url || "N/A"}{" "}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="border-b bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metricItems.map((item) => (
              <Card
                key={item.name}
                className="dark:border-zinc-800 dark:bg-zinc-900"
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${item.bgColor}`}
                  >
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{item.name}</p>
                    <p className="text-2xl font-bold">{item.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-y-hidden px-4 pt-3 pb-4">
          <p className="flex-shrink-0 pb-2 text-sm font-semibold dark:text-white">
            Top Keywords
          </p>
          <div className="flex-1 overflow-y-auto rounded-md border dark:border-zinc-700">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  {tableHeaders.map((header) => (
                    <TableHead
                      key={header.key}
                      onClick={() => requestSort(header.key)}
                      className={`${header.className} cursor-pointer`}
                    >
                      <div
                        className={`flex items-center ${
                          header.className === "text-right" ? "justify-end" : ""
                        }`}
                      >
                        {header.label}
                        {sortConfig?.key === header.key && (
                          <span className="ml-1">
                            {sortConfig.direction === "ascending" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMatches && sortedMatches.length > 0 ? (
                  sortedMatches.map((keyword, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {keyword.query}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {keyword.clicks.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {keyword.impressions.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {(keyword.ctr * 100).toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {keyword.position.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No data to display.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
