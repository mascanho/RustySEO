// @ts-nocheck
import { invoke } from "@tauri-apps/api/core";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Apple,
  Chrome,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  Users,
  MousePointer,
  ArrowDownUp,
  Clock,
  ScrollText,
  AlertCircle,
} from "lucide-react";
import { BrowserChart } from "./Charts/BrowserChart";
import { DeviceDistributionChart } from "./Charts/DeviceDistributionChart";
import { GeographicalDistributionChart } from "./Charts/GeographicalDistributionChart";
import { useState } from "react";

interface TrafficMetric {
  name: string;
  value: string;
  icon: React.ElementType;
}

export default function ClarityDashboard() {
  const [data, setData] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Process user behavior data
  const behaviorMetrics = [
    "DeadClickCount",
    "ExcessiveScroll",
    "RageClickCount",
    "QuickbackClick",
    "ScriptErrorCount",
    "ErrorClickCount",
  ].map((metricName) => {
    const metric = data.find((m: any) => m.metricName === metricName);
    return {
      name: metricName,
      sessions: metric?.information[0].sessionsCount || "0",
      percentage: metric?.information[0].sessionsWithMetricPercentage || 0,
      pageViews: metric?.information[0].pagesViews || "0",
      subtotal: metric?.information[0].subTotal || "0",
    };
  });

  // Process traffic metrics
  const trafficInfo =
    data.find((m: any) => m.metricName === "Traffic")?.information[0] || {};
  const trafficMetrics = [
    {
      name: "Total Sessions",
      value: trafficInfo.totalSessionCount || "0",
      icon: Users,
    },
    {
      name: "Bot Sessions",
      value: trafficInfo.totalBotSessionCount || "0",
      icon: MousePointer,
    },
    {
      name: "Distinct Users",
      value: trafficInfo.distinctUserCount || "0",
      icon: Users,
    },
    {
      name: "Pages Per Session",
      value: trafficInfo.pagesPerSessionPercentage?.toFixed(2) || "0",
      icon: ArrowDownUp,
    },
  ];

  // Process browser data
  const browserMetric = data.find((m: any) => m.metricName === "Browser");
  const browserData =
    browserMetric?.information?.map((b: any) => ({
      name: b.name,
      sessions: parseInt(b.sessionsCount),
      icon: b.name.includes("Chrome")
        ? Chrome
        : b.name.includes("Safari")
          ? Apple
          : Globe,
    })) || [];

  // Process device data
  const deviceMetric = data.find((m: any) => m.metricName === "Device");
  const deviceData =
    deviceMetric?.information?.map((d: any) => ({
      name: d.name,
      sessions: parseInt(d.sessionsCount),
      icon:
        d.name === "Mobile" ? Smartphone : d.name === "PC" ? Monitor : Tablet,
    })) || [];

  // Process geographical data
  const geoMetric = data.find((m: any) => m.metricName === "Country");
  const geoData =
    geoMetric?.information?.map((g: any) => ({
      name: g.name,
      sessions: parseInt(g.sessionsCount),
    })) || [];

  // Process engagement metrics
  const engagementData =
    data.find((m: any) => m.metricName === "EngagementTime")?.information[0] ||
    {};
  const scrollData =
    data.find((m: any) => m.metricName === "ScrollDepth")?.information[0] || {};
  const engagementMetrics = [
    {
      name: "Total Time",
      value: `${engagementData.totalTime || 0}s`,
      icon: Clock,
    },
    {
      name: "Active Time",
      value: `${engagementData.activeTime || 0}s`,
      icon: Clock,
    },
    {
      name: "Average Scroll Depth",
      value: `${scrollData.averageScrollDepth?.toFixed(1) || 0}%`,
      icon: ScrollText,
    },
  ];

  // Process page titles
  const pageTitles =
    data
      .find((m: any) => m.metricName === "PageTitle")
      ?.information?.map((p: any) => ({
        title: p.name || "Unknown",
        sessions: p.sessionsCount,
      })) || [];

  // Process referrers
  const referrers =
    data
      .find((m: any) => m.metricName === "ReferrerUrl")
      ?.information?.map((r: any) => ({
        name: r.name || "Direct",
        sessions: r.sessionsCount,
      })) || [];

  // Process popular pages
  const popularPages =
    data
      .find((m: any) => m.metricName === "PopularPages")
      ?.information?.map((p: any) => ({
        url: p.url,
        visits: p.visitsCount,
      })) || [];

  const browsers = browserMetric?.information || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-dark">
      <div className="container mx-auto py-2 px-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xs font-bold text-gray-900 dark:text-white">
              User Behavior Dashboard
            </h1>
            <div className="relative group mt-1">
              <button className="text-gray-500 hover:text-gray-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
              <div className="absolute left-0 top-full mt-0 z-10 w-48 p-2 bg-white dark:bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  These metrics match your current clarity timeframe selection
                </p>
              </div>
            </div>
          </div>
          <button
            className="bg-brand-bright hover:bg-blue-700 text-white font-medium py-2 px-3 rounded text-xs flex items-center gap-2"
            onClick={() => {
              setIsLoading(true);
              invoke<any>("get_microsoft_clarity_data_command")
                .then((result: any) => {
                  setData(result[0]);
                  setIsLoading(false);
                })
                .catch((err: Error) => {
                  console.error(err);
                  setIsLoading(false);
                });
            }}
          >
            <RefreshCw className="w-3 h-3" />
            Refresh Data
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900/50" />
            <CardHeader className="space-y-0 pb-4 relative">
              <CardTitle className="text-xs font-medium">
                User Behavior Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Metric</TableHead>
                      <TableHead className="text-xs">Sessions</TableHead>
                      <TableHead className="text-xs">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {behaviorMetrics.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="text-xs">{item.name}</TableCell>
                        <TableCell className="text-xs">
                          {item.sessions}
                        </TableCell>
                        <TableCell className="text-xs">
                          {item.percentage}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900/50" />
            <CardHeader className="relative">
              <CardTitle className="text-xs font-semibold">
                Traffic Metrics
              </CardTitle>
              <CardDescription className="text-xs">
                Key traffic indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-6 relative">
              {trafficMetrics.map((metric) => (
                <div
                  key={metric.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <metric.icon className="h-6 w-6 text-blue-500" />
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {metric.name}
                    </p>
                  </div>
                  <p className="text-xs font-bold">{metric.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900/50" />
            <CardHeader className="space-y-0 pb-4 relative">
              <CardTitle className="text-xs font-medium">
                Engagement Time
              </CardTitle>
              <CardDescription className="text-xs">
                User interaction durations
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 relative">
              <ScrollArea className="h-[400px] pt-4">
                <div className="space-y-8">
                  {engagementMetrics.map((metric) => (
                    <div
                      key={metric.name}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3">
                        <metric.icon className="h-5 w-5 text-blue-500" />
                        <span className="text-xs font-medium">
                          {metric.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold">{metric.value}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="shadow-sm col-span-full lg:col-span-1 relative overflow-hidden">
            <CardContent className="relative">
              <ScrollArea className="h-[300px]">
                <ResponsiveContainer width="100%" height={350}>
                  <BrowserChart data={browserData} browsers={browsers} />
                </ResponsiveContainer>
              </ScrollArea>
            </CardContent>
          </Card>

          <DeviceDistributionChart data={deviceData} />

          <GeographicalDistributionChart data={geoData} />

          <Card className="shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900/50" />
            <CardHeader className="space-y-0 pb-4 relative">
              <CardTitle className="text-xs font-medium">
                Top Page Titles
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Title</TableHead>
                      <TableHead className="text-xs">Sessions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageTitles.map((page: any) => (
                      <TableRow key={page.title}>
                        <TableCell className="text-xs">{page.title}</TableCell>
                        <TableCell className="text-xs">
                          {page.sessions}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900/50" />
            <CardHeader className="space-y-0 pb-4 relative">
              <CardTitle className="text-xs font-medium">
                Top Referrer URLs
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Referrer</TableHead>
                      <TableHead className="text-xs">Sessions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrers.map((referrer: any) => (
                      <TableRow key={referrer.name}>
                        <TableCell className="text-xs">
                          {referrer.name}
                        </TableCell>
                        <TableCell className="text-xs">
                          {referrer.sessions}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900/50" />
            <CardHeader className="space-y-0 pb-4 relative">
              <CardTitle className="text-xs font-medium">
                Popular Pages
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Page</TableHead>
                      <TableHead className="text-xs">Visits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {popularPages.map((page: any) => (
                      <TableRow key={page.url}>
                        <TableCell className="text-xs">{page.url}</TableCell>
                        <TableCell className="text-xs">{page.visits}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
