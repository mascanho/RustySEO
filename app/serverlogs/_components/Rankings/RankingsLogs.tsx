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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, MousePointerClick, Percent, TrendingUp } from "lucide-react";

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
  const metrics = {
    clicks: 2847,
    impressions: 45123,
    ctr: 6.31,
    position: 12.4,
  };

  const keywords = [
    {
      query: "supply chain management",
      clicks: 412,
      impressions: 6234,
      ctr: 6.6,
      position: 7.9,
    },
    {
      query: "logistics optimization",
      clicks: 367,
      impressions: 5789,
      ctr: 6.3,
      position: 9.2,
    },
    {
      query: "inventory control techniques",
      clicks: 298,
      impressions: 4892,
      ctr: 6.1,
      position: 10.5,
    },
    {
      query: "demand forecasting methods",
      clicks: 245,
      impressions: 4120,
      ctr: 5.9,
      position: 11.7,
    },
    {
      query: "supplier relationship management",
      clicks: 192,
      impressions: 3567,
      ctr: 5.4,
      position: 13.3,
    },
    {
      query: "warehouse automation",
      clicks: 168,
      impressions: 3124,
      ctr: 5.4,
      position: 14.8,
    },
    {
      query: "transportation management systems",
      clicks: 143,
      impressions: 2789,
      ctr: 5.1,
      position: 16.1,
    },
    {
      query: "supply chain analytics",
      clicks: 121,
      impressions: 2432,
      ctr: 5.0,
      position: 17.5,
    },
    {
      query: "procurement strategies",
      clicks: 109,
      impressions: 2210,
      ctr: 4.9,
      position: 18.9,
    },
    {
      query: "risk management in supply chain",
      clicks: 97,
      impressions: 1987,
      ctr: 4.9,
      position: 19.7,
    },
    {
      query: "sustainable supply chain",
      clicks: 85,
      impressions: 1765,
      ctr: 4.8,
      position: 20.8,
    },
    {
      query: "reverse logistics",
      clicks: 74,
      impressions: 1543,
      ctr: 4.8,
      position: 21.9,
    },
    {
      query: "supply chain visibility",
      clicks: 68,
      impressions: 1421,
      ctr: 4.8,
      position: 22.7,
    },
    {
      query: "just in time inventory",
      clicks: 61,
      impressions: 1308,
      ctr: 4.7,
      position: 23.6,
    },
    {
      query: "supply chain software",
      clicks: 54,
      impressions: 1196,
      ctr: 4.5,
      position: 24.4,
    },
    {
      query: "cold chain logistics",
      clicks: 49,
      impressions: 1083,
      ctr: 4.5,
      position: 25.1,
    },
    {
      query: "global supply chain trends",
      clicks: 43,
      impressions: 972,
      ctr: 4.4,
      position: 26.0,
    },
    {
      query: "supply chain resilience",
      clicks: 39,
      impressions: 865,
      ctr: 4.5,
      position: 26.8,
    },
  ];

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[70vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b dark:border-zinc-700 flex">
          <DialogTitle className="text-base font-semibold dark:text-white">
            Search Console Performance ·{" "}
            <span className="text-xs">Last 28 days</span>
          </DialogTitle>
          <DialogDescription className="truncate">
            <span className="text-brand-bright font-bold">URL:</span> {url}{" "}
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
                  <TableHead>Query</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Position</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keywords.map((keyword, index) => (
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
                      {keyword.ctr}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {keyword.position}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
