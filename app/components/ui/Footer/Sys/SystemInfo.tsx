"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Cpu,
  HardDrive,
  MemoryStickIcon as Memory,
  Network,
  Activity,
  Users,
} from "lucide-react";

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

  const formatBytes = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  const getUsagePercentage = (total: number, free: number): number => {
    return ((total - free) / total) * 100;
  };

  return (
    <Card className="w-full h-[500px] overflow-scroll border-0 m-0 mt-2">
      <ScrollArea className="h-96 w-full  m-0  px-4">
        <div className="space-y-3 text-xs">
          {/* CPU Section */}
          <div className="flex items-center border-b pb-2">
            <Cpu className="h-3 w-3 mr-2" />
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="font-medium">CPU Usage:</span>
                <span className="font-bold">
                  {formatPercentage(systemData.globalCpuUsage)}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Cores:</span>
                <span>{systemData.nbCpus}</span>
              </div>
            </div>
          </div>

          {/* Load Average */}
          <div className="flex items-center border-b pb-2">
            <Activity className="h-3 w-3 mr-2" />
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="font-medium">Load Average:</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                <div className="flex justify-between">
                  <span>1m:</span>
                  <span>{systemData.loadAverage.one.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>5m:</span>
                  <span>{systemData.loadAverage.five.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>15m:</span>
                  <span>{systemData.loadAverage.fifteen.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Memory */}
          <div className="flex items-start border-b pb-2">
            <Memory className="h-3 w-3 mr-2 mt-1" />
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="font-medium">Memory:</span>
                <span className="font-bold">
                  {formatPercentage(
                    getUsagePercentage(
                      systemData.totalMemory,
                      systemData.freeMemory,
                    ),
                  )}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <span> {formatBytes(systemData.totalMemory)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Used:</span>
                  <span>
                    {" "}
                    {formatBytes(
                      systemData.totalMemory - systemData.freeMemory,
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Free:</span>
                  <span> {formatBytes(systemData.freeMemory)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Swap */}
          <div className="flex items-start border-b pb-2">
            <HardDrive className="h-3 w-3 mr-2 mt-1" />
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="font-medium">Swap:</span>
                <span className="font-bold">
                  {formatPercentage(
                    getUsagePercentage(
                      systemData.totalSwap,
                      systemData.freeSwap,
                    ),
                  )}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <span> {formatBytes(systemData.totalSwap)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Used:</span>
                  <span>
                    {" "}
                    {formatBytes(systemData.totalSwap - systemData.freeSwap)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Free:</span>
                  <span> {formatBytes(systemData.freeSwap)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Counts */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex items-center">
              <Network className="h-3 w-3 mr-1" />
              <span className="text-muted-foreground mr-1">
                Network Interfaces:
              </span>
              <span className="font-bold">
                {systemData.nbNetworkInterfaces}
              </span>
            </div>
            <div className="flex items-center">
              <Users className="h-3 w-3 mr-1" />
              <span className="text-muted-foreground mr-1">Processes:</span>
              <span className="font-bold">{systemData.nbProcesses}</span>
            </div>
            <div className="flex items-center">
              <HardDrive className="h-3 w-3 mr-1" />
              <span className="text-muted-foreground mr-1">Disks:</span>
              <span className="font-bold">{systemData.nbDisks}</span>
            </div>
            <div className="flex items-center">
              <Cpu className="h-3 w-3 mr-1" />
              <span className="text-muted-foreground mr-1">Components:</span>
              <span className="font-bold">{systemData.nbComponents}</span>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span>CPU</span>
                <span>{formatPercentage(systemData.globalCpuUsage)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full"
                  style={{ width: `${systemData.globalCpuUsage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span>Memory</span>
                <span>
                  {formatPercentage(
                    getUsagePercentage(
                      systemData.totalMemory,
                      systemData.freeMemory,
                    ),
                  )}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-green-600 h-1.5 rounded-full"
                  style={{
                    width: `${getUsagePercentage(systemData.totalMemory, systemData.freeMemory)}%`,
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span>Swap</span>
                <span>
                  {formatPercentage(
                    getUsagePercentage(
                      systemData.totalSwap,
                      systemData.freeSwap,
                    ),
                  )}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-purple-600 h-1.5 rounded-full"
                  style={{
                    width: `${getUsagePercentage(systemData.totalSwap, systemData.freeSwap)}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}
