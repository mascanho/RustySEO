// @ts-nocheck
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Hash,
  Key,
  Link,
  Globe,
  FileText,
  Eye,
  EyeOff,
  Table,
  BarChart,
  Zap,
  User,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Group, Text } from "@mantine/core";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { invoke } from "@tauri-apps/api/core";

export default function SearchConsoleConfs() {
  const [date, setDate] = useState<{ from: Date; to: Date }>({
    from: new Date(),
    to: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  });
  const [showSecret, setShowSecret] = useState(false);
  const [confs, setConfs] = useState<any>([]);

  const toggleSecretVisibility = () => {
    setShowSecret(!showSecret);
  };

  useEffect(() => {
    invoke("read_credentials_file")
      .then((result) => {
        console.log(result, "result from confs");
        if (result) {
          setConfs(result);
        } else {
          console.error("No data returned from read_credentials_file");
        }
      })
      .catch((error) => {
        console.error("Error reading credentials file:", error);
      });
  }, []);

  if (confs === "" || confs === undefined || Object.keys(confs).length === 0) {
    return (
      <Card className="w-full p-8 h-[24rem] flex flex-col items-center justify-center shadow-none border-0 bg-transparent">
        <div className="p-4 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-dashed border-gray-200 dark:border-white/10 text-center max-w-sm">
          <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <Text fw={700} size="md" className="text-gray-900 dark:text-gray-100 mb-2">
            No Search Console Active
          </Text>
          <Text size="xs" className="text-gray-500 dark:text-gray-400 leading-relaxed">
            Go to <b>Menu &gt; Connectors &gt; Search Console</b> to authorize your Google account and select a property.
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full p-0 h-full shadow-none border-0 mt-0 mx-auto dark:bg-transparent">
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-0 mt-2">
        <div className="flex items-start space-x-4 p-4 rounded-xl bg-blue-50/30 dark:bg-blue-500/5 border border-blue-100/50 dark:border-blue-500/10">
          <Hash className="h-5 w-5 text-blue-500 mt-1" />
          <div>
            <Text fw={800} size="xs" className="text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Project ID</Text>
            <Text size="sm" className="text-gray-700 dark:text-gray-300 font-medium">{confs?.project_id}</Text>
          </div>
        </div>

        <div className="flex items-start space-x-4 p-4 rounded-xl bg-green-50/30 dark:bg-green-500/5 border border-green-100/50 dark:border-green-500/10">
          <User className="h-5 w-5 text-green-500 mt-1" />
          <div>
            <Text fw={800} size="xs" className="text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">Client ID</Text>
            <Text size="sm" className="text-gray-600 dark:text-gray-400 break-all font-mono text-[11px] leading-tight mt-1">{confs?.client_id}</Text>
          </div>
        </div>

        <div className="flex items-start space-x-4 p-4 rounded-xl bg-purple-50/30 dark:bg-purple-500/5 border border-purple-100/50 dark:border-purple-500/10 col-span-full">
          <Key className="h-5 w-5 text-purple-500 mt-1" />
          <div className="w-full">
            <Group justify="space-between" align="center" mb={4}>
              <Text fw={800} size="xs" className="text-purple-600 dark:text-purple-400 uppercase tracking-wider">Client Secret</Text>
              <Button
                variant="subtle"
                size="xs"
                onClick={toggleSecretVisibility}
                className="h-7 px-2 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-600 dark:text-purple-300"
              >
                {showSecret ? <EyeOff className="h-3.5 w-3.5 mr-1.5" /> : <Eye className="h-3.5 w-3.5 mr-1.5" />}
                {showSecret ? "Hide" : "Show"}
              </Button>
            </Group>
            <Text size="sm" className="text-gray-600 dark:text-gray-400 font-mono tracking-tighter">
              {showSecret ? confs?.client_secret : "••••••••••••••••••••••••••••••••••••••••"}
            </Text>
          </div>
        </div>

        <div className="flex items-start space-x-4 p-4 rounded-xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
          <Link className="h-5 w-5 text-red-500 mt-1" />
          <div>
            <Text fw={800} size="xs" className="text-red-500 dark:text-red-400 uppercase tracking-wider mb-1">Property URL</Text>
            <Text size="sm" className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[200px]">{confs?.url}</Text>
          </div>
        </div>

        <div className="flex items-start space-x-4 p-4 rounded-xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
          <Globe className="h-5 w-5 text-orange-500 mt-1" />
          <div>
            <Text fw={800} size="xs" className="text-orange-500 dark:text-orange-400 uppercase tracking-wider mb-1">Search Type</Text>
            <Text size="sm" className="text-gray-700 dark:text-gray-300 font-medium italic capitalize">{confs?.search_type}</Text>
          </div>
        </div>

        <div className="flex items-start space-x-4 p-4 rounded-xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
          <FileText className="h-5 w-5 text-teal-500 mt-1" />
          <div>
            <Text fw={800} size="xs" className="text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1">Default Range</Text>
            <Text size="sm" className="text-gray-700 dark:text-gray-300 font-medium">{confs?.range}</Text>
          </div>
        </div>

        <div className="flex items-start space-x-4 p-4 rounded-xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
          <Table className="h-5 w-5 text-indigo-500 mt-1" />
          <div>
            <Text fw={800} size="xs" className="text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Row Limit</Text>
            <Text size="sm" className="text-gray-700 dark:text-gray-300 font-medium">{confs?.rows} Rows</Text>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
