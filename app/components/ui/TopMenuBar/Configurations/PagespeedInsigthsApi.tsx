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
import { invoke } from "@/lib/invoke";
import useSettingsStore from "@/store/SettingsStore";

interface Settings {
  page_speed_bulk_api_key: string | null;
}

export default function PagespeedInsightsApi() {
  const [isVisible, setIsVisible] = useState(false);
  const { pageSpeedKey, refreshSettings } = useSettingsStore();
  const [fetchedKey, setFetchedKey] = useState<string | null>(null);

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return "*".repeat(key.length);
    return key.slice(0, 4) + "*".repeat(key.length - 8) + key.slice(-4);
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  // Load initial API key from backend via store
  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  function fetchApiKey() {
    invoke<Settings>("get_settings_command").then((response) => {
      console.log("Fetched API Key:", response);
      if (response.page_speed_bulk_api_key) {
        setFetchedKey(response.page_speed_bulk_api_key);
      }
    });
  }

  useEffect(() => {
    fetchApiKey();
  }, []);

  return (
    <Card className="w-full mt-8 mx-auto ml-0 dark:bg-brand-darker border-0 shadow-none">
      <CardHeader className="-ml-2">
        <CardTitle>API Key</CardTitle>
        <CardDescription>Your secret API key. Keep it safe!</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 dark:bg-brand-dark p-4 rounded-md font-mono text-sm break-all">
          {fetchedKey ? (
            isVisible ? (
              fetchedKey
            ) : (
              maskApiKey(fetchedKey)
            )
          ) : (
            <span className="text-gray-500 dark:text-gray-400 text-xs">
              No API key found, falling back to default one. Generate one and
              add it in the connectors menu.
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={toggleVisibility}
          variant="outline"
          className="flex items-center space-x-2 dark:bg-brand-dark"
        >
          {isVisible ? (
            <>
              <EyeOffIcon className="h-4 w-4" />
              <span>Hide API Key</span>
            </>
          ) : (
            <>
              <EyeIcon className="h-4 w-4" />
              <span>Show API Key</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
