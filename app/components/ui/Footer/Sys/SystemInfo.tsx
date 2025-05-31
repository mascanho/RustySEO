import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { invoke } from "@tauri-apps/api/core";
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStickIcon,
  Network,
  Users,
} from "lucide-react";

interface SystemInfo {
  totalMemory: number;
  usedMemory: number;
  totalSwap: number;
  usedSwap: number;
  cpus: number;
  hostName: string;
  systemName: string;
  osVersion: string;
  kernelVersion: string;
}

export default function SystemInfo() {
  const [systemData, setSystemData] = useState<SystemInfo>({
    totalMemory: 0,
    usedMemory: 0,
    totalSwap: 0,
    usedSwap: 0,
    cpus: 0,
    hostName: "",
    systemName: "",
    osVersion: "",
    kernelVersion: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSystemData() {
      try {
        setIsLoading(true);
        const sys: SystemInfo = await invoke("get_system", {});
        setSystemData(sys);
        setError(null);
        console.log(systemData);
      } catch (err) {
        console.error("Failed to fetch system data:", err);
        setError("Failed to load system information");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSystemData();

    // Set up polling every 5 seconds
    const interval = setInterval(fetchSystemData, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;
  const getUsagePercentage = (total: number, used: number) =>
    (used / total) * 100;

  const renderSection = (
    icon: React.ReactNode,
    title: string,
    value: React.ReactNode,
    children?: React.ReactNode,
  ) => (
    <div className="flex items-start border-b pb-2">
      <div className="h-3 w-3 mr-2 mt-1">{icon}</div>
      <div className="flex-1">
        <div className="flex justify-between">
          <span className="font-medium text-brand-bright">{title}:</span>
          <span className="font-bold">{value}</span>
        </div>
        {children}
      </div>
    </div>
  );

  const renderProgressBar = (label: string, value: number, color: string) => (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span>{label}</span>
        <span>{formatPercentage(value)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`${color} h-1.5 rounded-full`}
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card className="w-[320px] h-[510px] flex items-center justify-center">
        <div>Loading system information...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-[320px] h-[510px] flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </Card>
    );
  }

  return (
    <Card className="w-[320px] h-[510px] overflow-hidden border-0 m-0 p-0 bg-brand-dark">
      <ScrollArea className="p-3 h-96 pb-10 pt-3 pr-6 dark:bg-brand-darker">
        <div className="mb-4">
          <div className="font-bold text-sm">
            {systemData.hostName || "System"}
          </div>
          <div className="text-xs text-muted-foreground">
            {systemData.systemName} {systemData.osVersion} (Kernel:{" "}
            {systemData.kernelVersion})
          </div>
        </div>

        <div className="space-y-3 text-xs flex flex-col">
          {renderSection(
            <Cpu size={14} className="text-xs -mb-2 text-brand-bright" />,
            "CPU",
            null,
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Cores:</span>
              <span>{systemData.cpus}</span>
            </div>,
          )}

          {["Memory", "Swap"].map((type) => {
            const total = systemData[
              `total${type}` as keyof SystemInfo
            ] as number;
            const used = systemData[
              `used${type}` as keyof SystemInfo
            ] as number;
            const free = total - used;
            const usage = getUsagePercentage(total, used);

            return renderSection(
              type === "Memory" ? (
                <MemoryStickIcon className="text-brand-bright" size={14} />
              ) : (
                <HardDrive className="text-brand-bright" size={14} />
              ),
              type,
              formatPercentage(usage),
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                {["Total", "Used", "Free"].map((label) => (
                  <div key={label}>
                    <span className="text-muted-foreground">{label}:</span>
                    <span>
                      {" "}
                      {formatBytes(
                        label === "Total"
                          ? total
                          : label === "Used"
                            ? used
                            : free,
                      )}
                    </span>
                  </div>
                ))}
              </div>,
            );
          })}

          <div className="space-y-2">
            {renderProgressBar(
              "Memory",
              getUsagePercentage(systemData.totalMemory, systemData.usedMemory),
              "bg-green-600",
            )}
            {systemData.totalSwap > 0 &&
              renderProgressBar(
                "Swap",
                getUsagePercentage(systemData.totalSwap, systemData.usedSwap),
                "bg-purple-600",
              )}
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}
