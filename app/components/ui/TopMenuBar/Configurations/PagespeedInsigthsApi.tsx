"use client";

import { useState } from "react";
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

export default function PagespeedInsightsApi() {
  const [isVisible, setIsVisible] = useState(false);
  const apiKey =
    "sk_test_51ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return "*".repeat(key.length);
    return key.slice(0, 4) + "*".repeat(key.length - 8) + key.slice(-4);
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <Card className="w-full mt-8 mx-auto ml-0 dark:bg-brand-darker border-0">
      <CardHeader>
        <CardTitle>API Key</CardTitle>
        <CardDescription>Your secret API key. Keep it safe!</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 dark:bg-brand-dark p-4 rounded-md font-mono text-sm break-all">
          {isVisible ? apiKey : maskApiKey(apiKey)}
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
