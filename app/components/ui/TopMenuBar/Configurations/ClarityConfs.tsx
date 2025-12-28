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
    <Card className="w-full mt-8 mx-auto ml-0 dark:bg-brand-darker border-0 shadow-none">
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">API Endpoint</label>
          <div className="bg-gray-100 dark:bg-brand-dark p-4 rounded-md font-mono text-sm break-all">
            {apiEndpoint && apiEndpoint[0]}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">API Key</label>
          <div className="bg-gray-100 dark:bg-brand-dark p-4 rounded-md font-mono text-sm break-all overflow-hidden">
            {isVisible ? apiKey && apiKey[1] : maskApiKey(apiKey && apiKey[1])}
          </div>
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
