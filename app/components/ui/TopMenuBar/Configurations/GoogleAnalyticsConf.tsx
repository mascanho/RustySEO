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
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

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
    <Card className="w-full mt-8 mx-auto ml-0 dark:bg-brand-darker border-0 shadow-none">
      <CardHeader className="-ml-2">
        <CardTitle>Google Analytics ID</CardTitle>
        <CardDescription>Your secret GA ID. Keep it safe!</CardDescription>
      </CardHeader>
      <CardContent>
        {ga4ID === "" ? (
          <div className="bg-gray-100 dark:bg-brand-dark p-4 rounded-md font-mono text-sm break-all">
            <span className="text-gray-500 dark:text-gray-400">
              No GA4 ID found. Connect your Google Analytics account in the
              connectors menu.
            </span>
          </div>
        ) : (
          <div className="bg-gray-100 dark:bg-brand-dark p-4 rounded-md font-mono text-sm break-all">
            {isVisible ? ga4ID : maskApiKey(ga4ID)}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        {ga4ID !== "" && (
          <Button
            onClick={toggleVisibility}
            variant="outline"
            className="flex items-center space-x-2 dark:bg-brand-dark"
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
