// @ts-nocheck
import { useState } from "react";
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

export default function SearchConsoleConfs() {
  const [date, setDate] = useState<{ from: Date; to: Date }>({
    from: new Date(),
    to: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  });
  const [showSecret, setShowSecret] = useState(false);

  const toggleSecretVisibility = () => {
    setShowSecret(!showSecret);
  };

  return (
    <Card className="w-full p-0 h-full shadow-none border-0 mt-4  mx-auto">
      <CardContent className="space-y-2 h-full">
        <div className="flex items-center space-x-4">
          <Hash className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Project ID</p>
            <p className="text-sm text-muted-foreground">PRJ-123456</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Key className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Client ID</p>
            <p className="text-sm text-muted-foreground">CLI-789012</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Key className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Client Secret</p>
            <div className="flex items-center bg-gray-100 w-[calc(50rem-7rem)] rounded-md p-2 text-sm text-black">
              <p className="text-sm text-muted-foreground w-full ">
                {showSecret ? "actual-client-secret" : "••••••••••••"}
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
            <p className="text-sm font-medium">URL</p>
            <p className="text-sm text-muted-foreground">https://example.com</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Domain Type</p>
            <p className="text-sm text-muted-foreground">Production</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Date Range</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Table className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Rows</p>
            <p className="text-sm text-muted-foreground">10,000</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <BarChart className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Analytics Status</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Zap className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Performance Score</p>
            <p className="text-sm text-muted-foreground">92/100</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
