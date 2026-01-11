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
import { EyeIcon, EyeOffIcon, Zap, AlertCircle } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
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
    <Card className="w-full mx-auto border-0 shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg font-bold dark:text-gray-100 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          PageSpeed API Key
        </CardTitle>
        <CardDescription className="dark:text-gray-400">Your secure API key used for fetching PageSpeed Insights data.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="bg-gray-50 dark:bg-white/[0.03] p-4 rounded-xl border border-gray-100 dark:border-white/[0.05] font-mono text-sm break-all">
          {fetchedKey ? (
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">
                {isVisible ? fetchedKey : maskApiKey(fetchedKey)}
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-3 text-amber-600 dark:text-amber-400/80 bg-amber-50/50 dark:bg-amber-500/5 p-3 rounded-lg border border-amber-100 dark:border-amber-500/10">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span className="text-xs leading-relaxed">
                No custom API key found. Using shared public limits. For higher reliability, add your own key.
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="px-0 flex justify-end gap-3 mt-2">
        <Button
          onClick={toggleVisibility}
          variant="outline"
          className="flex items-center space-x-2 rounded-lg border-gray-200 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-200 transition-all"
        >
          {isVisible ? (
            <>
              <EyeOffIcon className="h-4 w-4" />
              <span>Hide Key</span>
            </>
          ) : (
            <>
              <EyeIcon className="h-4 w-4" />
              <span>Show Key</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
