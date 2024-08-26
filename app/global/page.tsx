// @ts-nocheck
"use client";

import { writeBinaryFile, BaseDirectory } from "@tauri-apps/api/fs";
import React, { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useDropzone } from "react-dropzone";
import { invoke } from "@tauri-apps/api/tauri";
import { UploadIcon } from "lucide-react";

export default function Page() {
  const [visitedUrls, setVisitedUrls] = useState([]);

  const handleDomainCrawl = () => {
    try {
      invoke("crawl_domain", {
        url: "https://markwarrior.dev",
      }).then((result) => {
        setVisitedUrls(result);
        console.log(result, "Global crawl");
      });
    } catch (error) {
      console.error("Error during crawl:", error);
    }
  };

  console.log(visitedUrls);

  return (
    <section className="w-full border-none rounded-none h-full p-10 dark:bg-brand-dark shadow-none ">
      <button onClick={handleDomainCrawl}>Crawl Domain</button>
      <section className="border text-white mt-10 h-96 overflow-auto p-2">
        {visitedUrls?.visited_urls?.map((url) => (
          <tr key={url}>
            <td>{url}</td>
          </tr>
        ))}
      </section>
    </section>
  );
}
