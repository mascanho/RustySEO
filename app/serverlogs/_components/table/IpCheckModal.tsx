// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { Copy, Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { invoke } from "@tauri-apps/api/core";

interface IpDisplayProps {
  ip: string;
  hostname: string;
  close: () => void;
}

export function IpDisplay({ ip, close }: IpDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);
  const { toast } = useToast();
  const [hostname, setHostname] = useState<string[]>([]);

  // Simulate terminal typing effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(ip);
      setCopied(true);
      toast({
        title: "COPIED",
        description: `IP ADDRESS ${ip} COPIED TO BUFFER`,
        duration: 2000,
        className: "font-mono bg-black text-brand-bright border-brand-bright",
      });

      setTimeout(() => setCopied(false), 2000);
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
    console.log(ip);
  }, []);

  useEffect(() => {
    invoke("reverse_lookup", { ip }).then((hostname) => {
      setHostname(hostname);
      console.log(hostname, "Hostname");
    });
  }, []);

  return (
    <Card className="w-fit max-w-xl border-2 border-brand-bright bg-white dark:bg-black p-0 font-mono shadow-sm transition-all">
      {/* Scan lines overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-20"></div>

      {/* Terminal header */}
      <div className="border-b border-brand-bright flex justify-between bg-brand-bright/10 pl-4 pr-2 py-1 text-xs text-brand-bright">
        <span> SYSTEM://NETWORK_INFO.term</span>
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
                  <p className="text-xs">HOSTNAME:</p>
                </div>
                <p className="mb-3 text-lg tracking-wider text-brand-bright/80">
                  {hostname || "Not Found"}
                </p>
                <p className="mb-1 text-xs">IP_ADDRESS:</p>
                <p className="mb-2 text-lg tracking-wider text-brand-bright/80">
                  {ip}
                </p>
                <div className="mt-4 flex items-center">
                  <span className="mr-2 text-xs">CMD:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="h-8 border border-brand-bright bg-white dark:bg-black px-3 text-xs text-brand-bright hover:bg-brand-bright/10 hover:text-brand-bright"
                  >
                    {copied ? (
                      <Check className="mr-1 h-3 w-3" />
                    ) : (
                      <Copy className="mr-1 h-3 w-3" />
                    )}
                    {copied ? "COPIED" : "COPY_IP"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Blinking cursor */}
          <div className="h-4 w-2 animate-[blink_1s_step-end_infinite] bg-brand-bright"></div>
        </div>
      </div>
    </Card>
  );
}
