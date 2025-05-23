// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
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
  const { toast } = useToast();
  const [hostname, setHostname] = useState<string>("");
  const [displayedHostname, setDisplayedHostname] = useState<string>("");
  const [displayedIp, setDisplayedIp] = useState<string>("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const typingSpeed = 50; // milliseconds per character
  const ipRef = useRef<string>(ip);

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

  // Typewriter effect for hostname
  useEffect(() => {
    if (!hostname) return;

    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < hostname.length) {
        setDisplayedHostname(hostname.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
        // Start typing IP after hostname finishes
        typeIp();
      }
    }, typingSpeed);

    return () => clearInterval(typingInterval);
  }, [hostname]);

  // Typewriter effect for IP
  const typeIp = () => {
    let i = 0;
    const ipString = ipRef.current;
    const typingInterval = setInterval(() => {
      if (i < ipString.length) {
        setDisplayedIp(ipString.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
        setIsTypingComplete(true);
      }
    }, typingSpeed);
  };

  // Fetch hostname
  useEffect(() => {
    invoke("reverse_lookup", { ip: ipRef.current })
      .then((result) => {
        setHostname(result || "Not Found");
      })
      .catch(console.error);
  }, []);

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
              <div className="opacity-100">
                <div className="flex items-center">
                  <span className="mr-2">$</span>
                  <p className="text-xs font-bold">HOSTNAME:</p>
                </div>
                <div className="flex items-center mb-3">
                  <p className="text-sm tracking-wider text-brand-bright/80">
                    {displayedHostname}
                  </p>
                  {/* Persistent blinking cursor */}
                  {/* <span className="ml-1 h-6 w-2 bg-brand-bright animate-[blink_1s_step-end_infinite]"></span> */}
                </div>

                <div className="flex items-center">
                  <span className="mr-2">$</span>
                  <p className="text-xs font-bold">IP ADDRESS:</p>
                </div>
                <div className="flex items-center">
                  <p className="text-sm tracking-wider text-brand-bright/80">
                    {displayedIp}
                  </p>
                  {/* Persistent blinking cursor */}
                  <span className="ml-1 h-6 w-2 bg-brand-bright animate-[blink_1s_step-end_infinite]"></span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(ipRef.current, "ip")}
                    className="h-8 border border-brand-bright bg-white dark:bg-black px-2 text-xs text-brand-bright hover:bg-brand-bright/10 hover:text-brand-bright flex items-center justify-center"
                    disabled={!isTypingComplete}
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
                    disabled={
                      !hostname || !isTypingComplete || hostname === "Not Found"
                    }
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
                    href={`https://check-host.net/ip-info?host=${ipRef.current}`}
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
