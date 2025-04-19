// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { Copy, Check, X, CloudCog } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { invoke } from "@tauri-apps/api/core";

interface IpDisplayProps {
  ip: string;
  close: () => void;
}

export function IpDisplay({ ip, close }: IpDisplayProps) {
  const [copiedIp, setCopiedIp] = useState(false);
  const [copiedHostname, setCopiedHostname] = useState(false);
  const [visible, setVisible] = useState(false);
  const { toast } = useToast();
  const [hostname, setHostname] = useState<string>("");

  // Simulate terminal typing effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const copyToClipboard = async (text: string, type: "ip" | "hostname") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "ip") {
        setCopiedIp(true);
      } else {
        setCopiedHostname(true);
      }

      toast({
        title: "COPIED",
        description: `${type.toUpperCase()} ${text} COPIED TO CLIPBOARD`,
        duration: 2000,
        className: "font-mono bg-black text-brand-bright border-brand-bright",
      });

      const timer = setTimeout(() => {
        type === "ip" ? setCopiedIp(false) : setCopiedHostname(false);
      }, 2000);

      return () => clearTimeout(timer);
    } catch (err) {
      toast({
        title: "ERROR",
        description: "COPY OPERATION FAILED",
        variant: "destructive",
        className: "font-mono bg-black text-red-500 border-red-500",
      });
    }
  };

  useEffect(() => {
    invoke("reverse_lookup", { ip })
      .then((result) => {
        setHostname(result || "");
      })
      .catch(console.error);
  }, [ip]);

  return (
    <Card className="w-fit max-w-xl border-2 border-brand-bright bg-white dark:bg-black p-0 font-mono shadow-sm transition-all">
      {/* Scan lines overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-20"></div>

      {/* Terminal header */}
      <div className="border-b border-brand-bright flex justify-between bg-brand-bright/10 pl-4 pr-2 py-1 text-xs text-brand-bright">
        <span>RUSTYSEO - TERMINAL</span>
        <X
          onClick={() => close(false)}
          className="ml-2 h-4 w-4 cursor-pointer"
        />
      </div>

      <div className="p-4">
        <div className="space-y-2 text-brand-bright">
          <div className="flex items-start">
            <div className="flex-1">
              <div
                className={`transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}
              >
                <div className="flex items-center">
                  <span className="mr-2">$</span>
                  <p className="text-xs font-bold">HOSTNAME:</p>
                </div>
                <p className="mb-3 text-lg tracking-wider text-brand-bright/80">
                  {hostname || "Not Found"}
                </p>

                <div className="flex items-center">
                  <span className="mr-2">$</span>
                  <p className="text-xs font-bold">IP ADDRESS:</p>
                </div>
                <div className="flex items-center">
                  <p className=" text-lg tracking-wider text-brand-bright/80">
                    {ip}
                  </p>

                  {/* Blinking cursor */}
                  <div className="h-4 w-2 ml-1 animate-[blink_1s_step-end_infinite] bg-brand-bright"></div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(ip, "ip")}
                    className="h-8 border border-brand-bright bg-white dark:bg-black px-2 text-xs text-brand-bright hover:bg-brand-bright/10 hover:text-brand-bright flex items-center justify-center"
                  >
                    {copiedIp ? (
                      <Check className="mr-1 h-3 w-3 flex-shrink-0" />
                    ) : (
                      <Copy className="mr-1 h-3 w-3 flex-shrink-0" />
                    )}
                    <span className="truncate">
                      {copiedIp ? "COPIED" : "COPY IP"}
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(hostname, "hostname")}
                    className="h-8 border border-brand-bright bg-white dark:bg-black px-2 text-xs text-brand-bright hover:bg-brand-bright/10 hover:text-brand-bright flex items-center justify-center"
                    disabled={!hostname}
                  >
                    {copiedHostname ? (
                      <Check className="mr-1 h-3 w-3 flex-shrink-0" />
                    ) : (
                      <Copy className="mr-1 h-3 w-3 flex-shrink-0" />
                    )}
                    <span className="truncate">
                      {copiedHostname ? "COPIED" : "COPY HOST"}
                    </span>
                  </Button>

                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://check-host.net/ip-info?host=${ip}`}
                    className="w-full"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border border-brand-bright bg-white dark:bg-black px-2 text-xs text-brand-bright hover:bg-brand-bright/10 hover:text-brand-bright w-full flex items-center justify-center"
                    >
                      <CloudCog className="mr-1 h-3 w-3 flex-shrink-0" />
                      <span className="truncate">MORE INFO</span>
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
