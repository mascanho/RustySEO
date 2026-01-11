import { useEffect, useState } from "react";
import { Text } from "@mantine/core";
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

interface APIConfig {
  endpoint: string;
  key: string;
}

export default function ClarityConfs() {
  const [isVisible, setIsVisible] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");

  const maskApiKey = (key: string) => {
    if (key?.length <= 8) return "*".repeat(key?.length);
    return key?.slice(0, 4) + "*".repeat(key?.length - 8) + key?.slice(-4);
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  useEffect(() => {
    invoke<APIConfig>("get_microsoft_clarity_command")
      .then((result: any) => {
        setApiEndpoint(result);
        setApiKey(result);
      })
      .catch((error) => {
        console.error("Error fetching API config:", error);
      });
  }, []);

  console.log(apiEndpoint, apiKey, "Clkarity stuff");

  return (
    <Card className="w-full mt-4 mx-auto border-0 shadow-none bg-transparent">
      <CardContent className="space-y-6 px-0">
        <section>
          <Text fw={600} size="sm" className="mb-2 text-gray-700 dark:text-gray-300">API Endpoint</Text>
          <div className="bg-gray-50 dark:bg-white/[0.03] p-4 rounded-xl border border-gray-100 dark:border-white/[0.05] font-mono text-xs break-all text-gray-600 dark:text-gray-400">
            {apiEndpoint && apiEndpoint[0]}
          </div>
        </section>

        <section>
          <Text fw={600} size="sm" className="mb-2 text-gray-700 dark:text-gray-300">API Key</Text>
          <div className="bg-gray-50 dark:bg-white/[0.03] p-4 rounded-xl border border-gray-100 dark:border-white/[0.05] font-mono text-sm break-all overflow-hidden text-gray-700 dark:text-gray-300">
            {isVisible ? apiKey && apiKey[1] : maskApiKey(apiKey && apiKey[1])}
          </div>
        </section>
      </CardContent>
      <CardFooter className="flex justify-end px-0 mt-4">
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
