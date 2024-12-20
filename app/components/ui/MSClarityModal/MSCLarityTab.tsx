import { invoke } from "@tauri-apps/api/tauri";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";

export default function ClarityDashboard() {
  const userBehaviorData = [
    {
      name: "Dead Clicks",
      sessions: 294,
      percentage: 10.4,
      pageViews: 347,
      subtotal: 1156,
    },
    {
      name: "Excessive Scrolling",
      sessions: 0,
      percentage: 0,
      pageViews: 0,
      subtotal: 0,
    },
    {
      name: "Rage Clicks",
      sessions: 10,
      percentage: 0.35,
      pageViews: 10,
      subtotal: 29,
    },
    {
      name: "Quick Back Clicks",
      sessions: 76,
      percentage: 2.69,
      pageViews: 154,
      subtotal: 0,
    },
    {
      name: "Script Errors",
      sessions: 44,
      percentage: 1.56,
      pageViews: 45,
      subtotal: 0,
    },
    {
      name: "Error Clicks",
      sessions: 1,
      percentage: 0.04,
      pageViews: 1,
      subtotal: 0,
    },
  ];

  const browserData = [
    { name: "Chrome", sessions: 1341, icon: <Chrome className="w-4 h-4" /> },
    {
      name: "Mobile Safari",
      sessions: 568,
      icon: <Apple className="w-4 h-4" />,
    },
    { name: "Edge", sessions: 416, icon: <Globe className="w-4 h-4" /> },
    { name: "Others", sessions: 504, icon: <Globe className="w-4 h-4" /> },
  ];

  const deviceData = [
    { name: "PC", sessions: 1874, icon: <Monitor className="w-4 h-4" /> },
    { name: "Mobile", sessions: 779, icon: <Smartphone className="w-4 h-4" /> },
    { name: "Tablet", sessions: 175, icon: <Tablet className="w-4 h-4" /> },
  ];

  const geoData = [
    { name: "United States", sessions: 709 },
    { name: "Netherlands", sessions: 512 },
    { name: "Germany", sessions: 188 },
    { name: "Others", sessions: 1420 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-2 px-4 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Behavior Dashboard
          </h1>
          <button
            className="bg-brand-bright hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-sm flex items-center gap-2"
            onClick={() => {
              invoke<any>("get_microsoft_clarity_data_command")
                .then((result: any) => {
                  console.log(result);
                })
                .catch((err: Error) => {
                  console.error(err);
                });
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-sm">
            <CardHeader className="space-y-0 pb-4">
              <CardTitle className="text-lg font-medium">
                User Behavior Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userBehaviorData.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.sessions}</TableCell>
                        <TableCell>{item.percentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="space-y-0 pb-4">
              <CardTitle className="text-lg font-medium">
                Traffic Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg">
                <div className="bg-white/80 dark:bg-gray-800/80 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Total Sessions
                  </p>
                  <p className="text-3xl font-bold">2,829</p>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Bot Sessions
                  </p>
                  <p className="text-3xl font-bold">210</p>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Distinct Users
                  </p>
                  <p className="text-3xl font-bold">2,908</p>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Pages Per Session
                  </p>
                  <p className="text-3xl font-bold">1.39</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="space-y-0 pb-4">
              <CardTitle className="text-lg font-medium">
                Engagement Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-lg">
                <div className="bg-white/80 dark:bg-gray-800/80 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Total Time
                  </p>
                  <p className="text-3xl font-bold">244s</p>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Active Time
                  </p>
                  <p className="text-3xl font-bold">69s</p>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Average Scroll Depth
                  </p>
                  <p className="text-3xl font-bold">41.43%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm col-span-full lg:col-span-2">
            <CardHeader className="space-y-0 pb-4">
              <CardTitle className="text-lg font-medium">
                Browser Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={browserData}
                      dataKey="sessions"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={125}
                      fill="#8884d8"
                      label
                    />
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="space-y-0 pb-4">
              <CardTitle className="text-lg font-medium">
                Device Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={deviceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="sessions"
                      fill="#8884d8"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="shadow-sm col-span-full lg:col-span-2">
            <CardHeader className="space-y-0 pb-4">
              <CardTitle className="text-lg font-medium">
                Geographical Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={geoData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="sessions"
                      fill="#8884d8"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="space-y-0 pb-4">
              <CardTitle className="text-lg font-medium">
                Top Page Titles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Sessions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Optimize your ERP with Slimstock</TableCell>
                      <TableCell>575</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        Slimstock: AI-Powered Supply Chain Planning
                      </TableCell>
                      <TableCell>161</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="space-y-0 pb-4">
              <CardTitle className="text-lg font-medium">
                Top Referrer URLs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referrer</TableHead>
                      <TableHead>Sessions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Google</TableCell>
                      <TableCell>995</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Direct Traffic (Null)</TableCell>
                      <TableCell>998</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="space-y-0 pb-4">
              <CardTitle className="text-lg font-medium">
                Popular Pages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page</TableHead>
                      <TableHead>Visits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Optimize your ERP with Slimstock</TableCell>
                      <TableCell>581</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Slimstock Homepage</TableCell>
                      <TableCell>186</TableCell>
                    </TableRow>
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
