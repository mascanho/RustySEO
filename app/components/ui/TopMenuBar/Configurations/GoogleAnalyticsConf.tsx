"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EyeIcon, EyeOffIcon, BarChart3, AlertCircle } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { Text } from "@mantine/core";

interface APIkey {
  google_analytics_id: string;
}

export default function GoogleAnalyticsConf() {
  const [isVisible, setIsVisible] = useState(false);
  const [ga4ID, setGa4ID] = useState<string>("");

  const maskApiKey = (key: string) => {
    if (key?.length <= 8) return "*".repeat(key?.length);
    return key?.slice(0, 4) + "*".repeat(key?.length - 8) + key?.slice(-4);
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  // Call Backend to get the API key
  useEffect(() => {
    invoke<APIkey>("get_google_analytics_id")
      .then((result: any) => {
        console.log("GA4 ID: ", result);
        setGa4ID(result);
      })
      .catch((error) => {
        console.error("Error fetching GA4 ID:", error);
      });
  }, []);

  return (
    <Card className="w-full mt-4 mx-auto border-0 shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg font-bold dark:text-gray-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-green-500" />
          Google Analytics ID
        </CardTitle>
        <CardDescription className="dark:text-gray-400">Your GA4 Measurement ID used for tracking and metrics integration.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {ga4ID === "" ? (
          <div className="flex items-start gap-3 text-amber-600 dark:text-amber-400/80 bg-amber-50/50 dark:bg-amber-500/5 p-4 rounded-xl border border-amber-100 dark:border-amber-500/10 transition-all">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <Text size="xs" className="leading-relaxed">
              No GA4 Property ID found. Connect your Google Analytics account via the "Connectors" menu to enable property-specific insights.
            </Text>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-white/[0.03] p-4 rounded-xl border border-gray-100 dark:border-white/[0.05] font-mono text-sm break-all text-gray-700 dark:text-gray-300">
            {isVisible ? ga4ID : maskApiKey(ga4ID)}
          </div>
        )}
      </CardContent>
      <CardFooter className="px-0 flex justify-end mt-2">
        {ga4ID !== "" && (
          <Button
            onClick={toggleVisibility}
            variant="outline"
            className="flex items-center space-x-2 rounded-lg border-gray-200 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-200 transition-all"
          >
            {isVisible ? (
              <>
                <EyeOffIcon className="h-4 w-4" />
                <span>Hide ID</span>
              </>
            ) : (
              <>
                <EyeIcon className="h-4 w-4" />
                <span>Show ID</span>
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
