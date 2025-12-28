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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { invoke } from "@/lib/invoke";

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
      <Card className="w-full p-0 h-[24rem] flex items-center justify-center shadow-none border-0 my-auto dark:bg-transparent">
        <CardContent className="text-center">
          <p className="text-lg text-muted-foreground mb-2">
            No configurations available
          </p>
          <p className="text-sm text-muted-foreground">
            Go to Menu &gt; Connectors and Search Console to connect to your
            Search Console
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full p-0 h-full shadow-none border-0 mt-0 mx-auto dark:bg-transparent">
      <CardContent className="space-y-4 h-full p-6">
        <div className="flex items-start space-x-6">
          <Hash className="h-5 w-5 text-muted-foreground mt-1" />
          <div>
            <p className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
              Project ID
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {confs?.project_id}
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-6">
          <User className="h-5 w-5 text-muted-foreground mt-1" />
          <div>
            <p className="text-sm font-extrabold text-green-600 dark:text-green-400">
              Client ID
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {confs?.client_id}
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-6">
          <Key className="h-5 w-5 text-muted-foreground mt-1" />
          <div className="w-full">
            <p className="text-sm font-extrabold text-purple-600 dark:text-purple-400">
              Client Secret
            </p>
            <div className="flex items-center w-full rounded-md text-sm mt-1">
              <p className="text-sm text-muted-foreground flex-1">
                {showSecret
                  ? confs?.client_secret
                  : "********************************************"}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSecretVisibility}
                className="ml-2"
              >
                {showSecret ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    <span className="ml-2">Hide secret</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    <span className="ml-2">Show secret</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-start space-x-6">
          <Link className="h-5 w-5 text-muted-foreground mt-1" />
          <div>
            <p className="text-sm font-extrabold text-red-600 dark:text-red-400">
              URL
            </p>
            <p className="text-sm text-muted-foreground mt-1">{confs?.url}</p>
          </div>
        </div>
        <div className="flex items-start space-x-6">
          <Globe className="h-5 w-5 text-muted-foreground mt-1" />
          <div>
            <p className="text-sm font-extrabold text-orange-600 dark:text-orange-400">
              Search Type
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {confs?.search_type}
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-6">
          <FileText className="h-5 w-5 text-muted-foreground mt-1" />
          <div>
            <p className="text-sm font-extrabold text-teal-600 dark:text-teal-400">
              Date Range
            </p>
            <p className="text-sm text-muted-foreground mt-1">{confs?.range}</p>
          </div>
        </div>
        <div className="flex items-start space-x-6">
          <Table className="h-5 w-5 text-muted-foreground mt-1" />
          <div>
            <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
              Rows
            </p>
            <p className="text-sm text-muted-foreground mt-1">{confs?.rows}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
