import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCallback, useEffect } from "react";
import { FaSearchengin } from "react-icons/fa";
import { toast } from "sonner";

import {
  FiPlusSquare,
  FiLink,
  FiCheckSquare,
  FiGlobe,
  FiClipboard,
  FiExternalLink,
  FiBarChart,
} from "react-icons/fi";
import { IoKey } from "react-icons/io5";
import { invoke } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";

const RankingMenus = ({
  children,
  url,
  query,
  credentials,
  position,
  impressions,
  clicks,
}: any) => {
  useEffect(() => {
    const unlisten = listen("keyword-tracked", (event) => {
      console.log("Keyword tracked event received:", event);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleCopy = useCallback((url: string) => {
    navigator?.clipboard.writeText(url);
    toast.success("Copied to clipboard");
  }, []);

  const openSearchConsoleUrl = (query: string) => {
    if (credentials.search_type === "site") {
      const baseUrl =
        "https://search.google.com/search-console/performance/search-analytics";
      const params = new URLSearchParams({
        resource_id: credentials.url,
        num_of_months: "6",
        query: "*" + query,
      });
      const url = `${baseUrl}?${params.toString()}`;
      openBrowserWindow(url);
    } else {
      const baseUrl =
        "https://search.google.com/search-console/performance/search-analytics";
      const params = new URLSearchParams({
        resource_id: "sc-domain:" + credentials.url,
        num_of_months: "6",
        query: "*" + query,
      });
      const url = `${baseUrl}?${params.toString()}`;
      openBrowserWindow(url);
    }
  };

  // Handle the tracking of the keyword
  const handleTrackKeyword = useCallback(
    async (
      url: string,
      query: string,
      position: number,
      impressions: number,
      clicks: number,
      credentials: any,
    ) => {
      const data = {
        url,
        query,
        position,
        impressions,
        clicks,
      };

      try {
        const result = await invoke("add_gsc_data_to_kw_tracking_command", {
          data,
        });
        toast.success("Keyword added to Tracking Dashboard");
        await emit("keyword-tracked", { action: "add", data });
      } catch (error) {
        console.error("Error tracking keyword:", error);
        toast.error("Failed to add keyword to tracking");
      }
    },
    [],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-40 bg-white dark:bg-brand-darker dark:border-brand-dark dark:text-white/50 text-xs z-[9999999]">
        <DropdownMenuItem
          className="hover:bg-brand-bright hover:text-white"
          onClick={() => handleCopy(query)}
        >
          <FiClipboard className="mr-2 text-xs" /> Copy
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            handleTrackKeyword(
              url,
              query,
              position,
              impressions,
              clicks,
              credentials,
            )
          }
          className="hover:bg-brand-bright hover:text-white"
        >
          <IoKey className="mr-2" />
          {""} Track Keyword
        </DropdownMenuItem>
        <DropdownMenuItem
          className="hover:bg-brand-bright hover:text-white"
          onClick={() => openSearchConsoleUrl(query)}
        >
          <FiBarChart className="mr-2" />
          Open in Console
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="hover:bg-brand-bright hover:text-white text-xs">
            <FiCheckSquare className="mr-2" /> SERP results
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48 ml-1 bg-white dark:bg-brand-darker dark:border-brand-dark">
            <DropdownMenuItem
              className="hover:bg-brand-bright hover:text-white"
              onClick={() =>
                openBrowserWindow(`https://www.google.com/search?q=${query}`)
              }
            >
              <FaSearchengin className="mr-2" /> Google
            </DropdownMenuItem>
            <DropdownMenuItem
              className="hover:bg-brand-bright hover:text-white"
              onClick={() =>
                openBrowserWindow(`https://www.bing.com/search?q=${query}`)
              }
            >
              <FaSearchengin className="mr-2" /> Bing
            </DropdownMenuItem>
            <DropdownMenuItem
              className="hover:bg-brand-bright hover:text-white"
              onClick={() =>
                openBrowserWindow(`https://search.yahoo.com/search?p=${query}`)
              }
            >
              <FaSearchengin className="mr-2" /> Yahoo
            </DropdownMenuItem>
            <DropdownMenuItem
              className="hover:bg-brand-bright hover:text-white"
              onClick={() =>
                openBrowserWindow(
                  `https://www.yandex.com/search/?text=${query}`,
                )
              }
            >
              <FaSearchengin className="mr-2" /> Yandex
            </DropdownMenuItem>
            <DropdownMenuItem
              className="hover:bg-brand-bright hover:text-white"
              onClick={() =>
                openBrowserWindow(`https://duckduckgo.com/?q=${query}&ia=web`)
              }
            >
              <FaSearchengin className="mr-2" /> DuckDuckGo
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="hover:bg-brand-bright hover:text-white text-xs">
            <FiLink className="mr-2" /> Backlinks
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48 ml-1 bg-white dark:bg-brand-darker dark:border-brand-dark">
            <DropdownMenuItem className="hover:bg-brand-bright hover:text-white">
              <FiExternalLink className="mr-2" /> Ahrefs
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-brand-bright hover:text-white">
              <FiPlusSquare className="mr-2" /> Moz
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-brand-bright hover:text-white">
              <FiGlobe className="mr-2" /> Majestic
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RankingMenus;
