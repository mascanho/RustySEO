"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden border-border/50 bg-black p-0 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/50 p-6">
          <div className="flex-1">
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Search Console Performance
            </div>
            <h2 className="text-balance font-medium leading-tight text-white">
              {url}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Last 28 days</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-border/30 lg:grid-cols-4">
          <div className="bg-black p-6">
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Clicks
            </div>
            <div className="text-3xl font-semibold tabular-nums tracking-tight">
              {metrics.clicks.toLocaleString()}
            </div>
          </div>

          <div className="bg-black p-6">
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Impressions
            </div>
            <div className="text-3xl font-semibold tabular-nums tracking-tight">
              {metrics.impressions.toLocaleString()}
            </div>
          </div>

          <div className="bg-black p-6">
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              CTR
            </div>
            <div className="text-3xl font-semibold tabular-nums tracking-tight">
              {metrics.ctr}%
            </div>
          </div>

          <div className="bg-black p-6">
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Avg. Position
            </div>
            <div className="text-3xl font-semibold tabular-nums tracking-tight">
              {metrics.position}
            </div>
          </div>
        </div>

        <div className="p-6 overflow-auto">
          <h3 className="mb-4 text-sm font-medium text-white">Top Keywords</h3>

          <div className="rounded-lg border border-border/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-white/[0.02]">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Query
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Clicks
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Impressions
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    CTR
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Position
                  </th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((keyword, index) => (
                  <tr
                    key={index}
                    className="border-b border-border/30 transition-colors hover:bg-white/[0.02] last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-white">
                      {keyword.query}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {keyword.clicks.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {keyword.impressions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {keyword.ctr}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {keyword.position}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
