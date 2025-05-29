// @ts-nocheck
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { invoke } from "@tauri-apps/api/core";
import {
  Cpu,
  HardDrive,
  MemoryStickIcon as Memory,
  Network,
  Activity,
  Users,
} from "lucide-react";
import { useEffect } from "react";

interface LoadAvg {
  one: number;
  five: number;
  fifteen: number;
}
interface SystemInfo {
  globalCpuUsage: number;
  loadAverage: LoadAvg;
  totalMemory: number;
  freeMemory: number;
  totalSwap: number;
  freeSwap: number;
  nbCpus: number;
  nbNetworkInterfaces: number;
  nbProcesses: number;
  nbDisks: number;
  nbComponents: number;
}

export default function SystemInfo() {
  const systemData: SystemInfo = {
    globalCpuUsage: 14.181548,
    loadAverage: {
      one: 4.53515625,
      five: 10.8447265625,
      fifteen: 8.50341796875,
    },
    totalMemory: 8589934592,
    freeMemory: 65126400,
    totalSwap: 8589934592,
    freeSwap: 703856640,
    nbCpus: 8,
    nbNetworkInterfaces: 18,
    nbProcesses: 434,
    nbDisks: 4,
    nbComponents: 57,
  };

  useEffect(() => {
    async function handleClick() {
      const sys = await invoke("get_system", {});

      console.log(sys);
    }

    handleClick();
  }, []);

  const formatBytes = (bytes: number) => `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;
  const getUsagePercentage = (total: number, free: number) =>
    ((total - free) / total) * 100;

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
          <span className="font-medium">{title}:</span>
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

  return (
    <Card className="w-[320px] h-[510px] overflow-hidden border-0 m-0 p-0">
      <ScrollArea className="p-3 h-96 pb-10 pt-3 pr-6">
        <div className="space-y-3 text-xs flex flex-col">
          {renderSection(
            <Cpu size={14} className="text-xs -mb-2" />,
            "CPU Usage",
            formatPercentage(systemData.globalCpuUsage),
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Cores:</span>
              <span>{systemData.nbCpus}</span>
            </div>,
          )}

          {renderSection(
            <Activity size={14} />,
            "Load Average",
            null,
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              {Object.entries(systemData.loadAverage).map(([key, val]) => (
                <div key={key} className="flex justify-between">
                  <span>
                    {key === "one" ? "1m" : key === "five" ? "5m" : "15m"}:
                  </span>
                  <span>{val.toFixed(2)}</span>
                </div>
              ))}
            </div>,
          )}

          {["Memory", "Swap"].map((type) => {
            const total = systemData[
              `total${type}` as keyof SystemInfo
            ] as number;
            const free = systemData[
              `free${type}` as keyof SystemInfo
            ] as number;
            const used = total - free;
            const usage = getUsagePercentage(total, free);

            return renderSection(
              type === "Memory" ? (
                <Memory size={14} />
              ) : (
                <HardDrive size={14} />
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

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            {[
              {
                icon: <Network size={14} />,
                label: "Network Interfaces",
                value: systemData.nbNetworkInterfaces,
              },
              {
                icon: <Users size={14} />,
                label: "Processes",
                value: systemData.nbProcesses,
              },
              {
                icon: <HardDrive size={14} />,
                label: "Disks",
                value: systemData.nbDisks,
              },
              {
                icon: <Cpu size={14} />,
                label: "Components",
                value: systemData.nbComponents,
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center">
                {item.icon}
                <span className="text-muted-foreground mx-1">
                  {item.label}:
                </span>
                <span className="font-bold">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {renderProgressBar("CPU", systemData.globalCpuUsage, "bg-blue-600")}
            {renderProgressBar(
              "Memory",
              getUsagePercentage(systemData.totalMemory, systemData.freeMemory),
              "bg-green-600",
            )}
            {renderProgressBar(
              "Swap",
              getUsagePercentage(systemData.totalSwap, systemData.freeSwap),
              "bg-purple-600",
            )}
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}
