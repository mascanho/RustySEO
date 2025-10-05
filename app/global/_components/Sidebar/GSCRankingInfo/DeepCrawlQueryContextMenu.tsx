import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
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
import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";

interface DeepCrawlQueryContextMenuProps {
  children: React.ReactNode;
  url: string;
  query: string;
  credentials: any;
  position: number;
  impressions: number;
  clicks: number;
}

const DeepCrawlQueryContextMenu: React.FC<DeepCrawlQueryContextMenuProps> = ({
  children,
  url,
  query,
  credentials,
  position,
  impressions,
  clicks,
}) => {
  useEffect(() => {
    const unlisten = listen("keyword-tracked", (event) => {
      console.log("Keyword tracked event received:", event);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleCopy = useCallback((query: string) => {
    navigator?.clipboard.writeText(query);
    toast.success("Query copied to clipboard");
  }, []);

  const openSearchConsoleUrl = (query: string) => {
    if (!credentials) {
      toast.error("Search Console credentials not found");
      return;
    }

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
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="text-xs rounded-sm p-0 m-0 dark:bg-brand-darker dark:border-brand-dark w-44 z-[9999]">
        <ContextMenuItem
          onClick={() => handleCopy(query)}
          className="text-xs hover:bg-brand-bright hover:text-white"
        >
          <FiClipboard className="mr-2" /> Copy Query
        </ContextMenuItem>

        <ContextMenuSeparator className="p-0 m-0 dark:bg-brand-dark" />

        <ContextMenuItem
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
          className="text-xs hover:bg-brand-bright hover:text-white"
        >
          <IoKey className="mr-2" />
          Add to Tracking
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => openSearchConsoleUrl(query)}
          className="text-xs hover:bg-brand-bright hover:text-white"
        >
          <FiBarChart className="mr-2" />
          Open in Search Console
        </ContextMenuItem>

        <ContextMenuSeparator className="p-0 m-0 dark:bg-brand-dark" />

        <ContextMenuSub>
          <ContextMenuSubTrigger className="text-xs hover:bg-brand-bright hover:text-white">
            <FiCheckSquare className="mr-2" /> SERP Results
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 text-xs dark:bg-brand-darker dark:border-brand-dark">
            <ContextMenuItem
              onClick={() =>
                openBrowserWindow(`https://www.google.com/search?q=${query}`)
              }
              className="text-xs hover:bg-brand-bright hover:text-white"
            >
              <FaSearchengin className="mr-2" /> Google
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() =>
                openBrowserWindow(`https://www.bing.com/search?q=${query}`)
              }
              className="text-xs hover:bg-brand-bright hover:text-white"
            >
              <FaSearchengin className="mr-2" /> Bing
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() =>
                openBrowserWindow(`https://search.yahoo.com/search?p=${query}`)
              }
              className="text-xs hover:bg-brand-bright hover:text-white"
            >
              <FaSearchengin className="mr-2" /> Yahoo
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() =>
                openBrowserWindow(
                  `https://www.yandex.com/search/?text=${query}`,
                )
              }
              className="text-xs hover:bg-brand-bright hover:text-white"
            >
              <FaSearchengin className="mr-2" /> Yandex
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() =>
                openBrowserWindow(`https://duckduckgo.com/?q=${query}&ia=web`)
              }
              className="text-xs hover:bg-brand-bright hover:text-white"
            >
              <FaSearchengin className="mr-2" /> DuckDuckGo
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSub>
          <ContextMenuSubTrigger className="text-xs hover:bg-brand-bright hover:text-white">
            <FiLink className="mr-2" /> Backlinks
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 text-xs dark:bg-brand-darker dark:border-brand-dark">
            <ContextMenuItem className="text-xs hover:bg-brand-bright hover:text-white">
              <FiExternalLink className="mr-2" /> Ahrefs
            </ContextMenuItem>
            <ContextMenuItem className="text-xs hover:bg-brand-bright hover:text-white">
              <FiPlusSquare className="mr-2" /> Moz
            </ContextMenuItem>
            <ContextMenuItem className="text-xs hover:bg-brand-bright hover:text-white">
              <FiGlobe className="mr-2" /> Majestic
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default DeepCrawlQueryContextMenu;
