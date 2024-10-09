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
import { invoke } from "@tauri-apps/api/tauri";

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

  // Get the confs from the BE
  useEffect(() => {
    invoke("read_credentials_file")
      .then((result) => {
        console.log(result, "result from confs");
        if (result) {
          setConfs(result);
        } else {
          console.error("No data returned from read_credentials_file");
        }
        console.log("The useEffect from Confs");
      })
      .catch((error) => {
        console.error("Error reading credentials file:", error);
      });
  }, []);

  console.log(confs, "confs from confs");

  if (confs === "" || confs === undefined || Object.keys(confs).length === 0) {
    return (
      <Card className="w-full p-0 h-[24rem] flex items-center justify-center shadow-none border-0  my-auto dark:bg-transparent">
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
    <Card className="w-full p-0 h-full shadow-none border-0 mt-4  mx-auto">
      <CardContent className="space-y-2 h-full">
        <div className="flex items-center space-x-4">
          <Hash className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-bold">Project ID</p>
            <p className="text-sm text-muted-foreground">{confs?.project_id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <User className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-bold">Client ID</p>
            <p className="text-sm text-muted-foreground">{confs?.client_id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Key className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-bold">Client Secret</p>
            <div className="flex items-center bg-gray-100 w-[calc(50rem-7rem)] rounded-md p-2 text-sm text-black">
              <p className="text-sm text-muted-foreground w-full ">
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
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Link className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-bold">URL</p>
            <p className="text-sm text-muted-foreground">{confs?.url}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-bold">Search Type</p>
            <p className="text-sm text-muted-foreground">
              {confs?.search_type}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-bold">Date Range</p>
            <p className="text-sm">{confs?.range}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Table className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-bold">Rows</p>
            <p className="text-sm text-muted-foreground">{confs?.rows}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
