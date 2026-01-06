"use client";
// @ts-nocheck

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
} from "lucide-react";
import useGSCStatusStore from "@/store/GSCStatusStore";
import { useMemo, useState } from "react";

interface SearchConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

export function RankingsLogs({
  isOpen,
  onClose,
  url,
}: SearchConsoleModalProps) {
  const { selectedURLDetails } = useGSCStatusStore();
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>({ key: "clicks", direction: "descending" });

  const requestSort = (key: any) => {
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
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

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
        <DialogHeader className="p-4 border-b dark:border-zinc-700 flex">
          <DialogTitle className="text-base font-semibold dark:text-white">
            Search Console Performance ·{" "}
            <span className="text-xs">Last 28 days</span>
          </DialogTitle>
          <DialogDescription className="truncate">
            <span className="text-brand-bright font-bold">Log URL:</span>{" "}
            {url}{" "}
          </DialogDescription>
          <DialogDescription className="truncate">
            <span className="text-brand-bright font-bold">Matched GSC URL:</span>{" "}
            {selectedURLDetails?.matches?.[0]?.source_url || "N/A"}{" "}
          </DialogDescription>
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
