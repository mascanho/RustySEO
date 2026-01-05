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
      query: "next.js tutorial",
      clicks: 342,
      impressions: 5821,
      ctr: 5.9,
      position: 8.2,
    },
    {
      query: "react server components",
      clicks: 289,
      impressions: 4203,
      ctr: 6.9,
      position: 11.3,
    },
    {
      query: "app router guide",
      clicks: 256,
      impressions: 3842,
      ctr: 6.7,
      position: 9.8,
    },
    {
      query: "next.js best practices",
      clicks: 198,
      impressions: 3290,
      ctr: 6.0,
      position: 13.1,
    },
    {
      query: "server side rendering",
      clicks: 176,
      impressions: 2981,
      ctr: 5.9,
      position: 14.7,
    },
    {
      query: "next.js deployment",
      clicks: 134,
      impressions: 2456,
      ctr: 5.5,
      position: 16.2,
    },
    {
      query: "react framework",
      clicks: 112,
      impressions: 2198,
      ctr: 5.1,
      position: 18.4,
    },
    {
      query: "web performance optimization",
      clicks: 98,
      impressions: 1876,
      ctr: 5.2,
      position: 15.9,
    },
  ];

  const metricItems = [
    {
      name: "Clicks",
      value: metrics.clicks.toLocaleString(),
      icon: MousePointerClick,
    },
    {
      name: "Impressions",
      value: metrics.impressions.toLocaleString(),
      icon: BarChart,
    },
    { name: "CTR", value: `${metrics.ctr}%`, icon: Percent },
    { name: "Avg. Position", value: metrics.position, icon: TrendingUp },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b dark:border-zinc-700 flex">
          <DialogTitle className="text-base font-semibold dark:text-white">
            Search Console Performance ·{" "}
            <span className="text-xs">Last 28 days</span>
          </DialogTitle>
          <DialogDescription className="truncate">{url} </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 p-4">
          {metricItems.map((item) => (
            <Card key={item.name} className="dark:border-zinc-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {item.name}
                </CardTitle>
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="px-4 pb-4 flex-1 overflow-y-auto">
          <p className="text-sm font-semibold mb-2 dark:text-white">
            Top Keywords
          </p>
          <div className="rounded-md border dark:border-zinc-700">
            <Table>
              <TableHeader>
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
