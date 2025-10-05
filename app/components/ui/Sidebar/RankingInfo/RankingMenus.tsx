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
  // Debug component initialization
  console.log("🔧 RankingMenus component initialized with props:", {
    url,
    query,
    credentials: !!credentials,
    position,
    impressions,
    clicks,
    hasChildren: !!children,
    propsReceived: { url, query, position, impressions, clicks },
  });

  // Validate critical props
  if (!query) {
    console.warn("⚠️ RankingMenus: No query provided!");
  }
  if (!children) {
    console.warn("⚠️ RankingMenus: No children provided!");
  }
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
      try {
        console.log("🚀 === RANKING MENUS - Adding Keyword to Tracking ===");
        console.log("🟢 handleTrackKeyword function called successfully");
        console.log("🔍 Raw parameters received:", {
          url,
          query,
          position,
          impressions,
          clicks,
          credentials: !!credentials,
        });

        // Immediate validation and feedback
        toast.loading("Processing keyword...");

        // Validate required parameters
        if (!query || query.trim() === "") {
          toast.error("Cannot add keyword: Query is required");
          console.error("❌ Invalid query parameter:", query);
          return;
        }

        console.log("✅ Query validation passed");
        console.log("🔍 Step 1: Processing data...");

        // Ensure proper data types and handle missing values
        const data = {
          url: String(url || "unknown-domain").trim(),
          query: String(query || "").trim(),
          position: (() => {
            if (typeof position === "number" && !isNaN(position))
              return position;
            const parsed = parseFloat(String(position));
            return !isNaN(parsed) ? parsed : 0.0;
          })(),
          impressions: (() => {
            if (typeof impressions === "number" && !isNaN(impressions))
              return impressions;
            const parsed = parseInt(String(impressions));
            return !isNaN(parsed) && parsed >= 0 ? parsed : 0;
          })(),
          clicks: (() => {
            if (typeof clicks === "number" && !isNaN(clicks)) return clicks;
            const parsed = parseInt(String(clicks));
            return !isNaN(parsed) && parsed >= 0 ? parsed : 0;
          })(),
        };

        console.log("📊 Processed data:", data);
        console.log("✅ Step 1 completed");

        // Create timeout protection
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Operation timed out after 10 seconds")),
            10000,
          ),
        );

        const mainOperation = async () => {
          console.log("🔍 Step 2: Invoking Tauri command...");
          toast.loading("Saving to database...");

          const result = await invoke("add_gsc_data_to_kw_tracking_command", {
            data,
          });

          console.log("✅ Backend result:", result);
          console.log("🔍 Step 3: Syncing tracking tables...");
          toast.loading("Syncing data...");

          // Trigger data refresh to sync tracking tables
          await invoke("match_tracked_with_gsc_command");

          console.log("✅ Step 3 completed. Tables synced");
          console.log("🔍 Step 4: Emitting events...");

          toast.success("Keyword added to Tracking Dashboard");
          await emit("keyword-tracked", { action: "add", data });

          console.log("✅ Step 4 completed");
          console.log("🎉 === RANKING MENUS - Completed Successfully ===");
        };

        await Promise.race([mainOperation(), timeoutPromise]);
      } catch (error) {
        console.error("❌ === RANKING MENUS - Keyword Addition Failed ===");
        console.error("🔥 Error details:", error);
        console.error("💥 Error type:", typeof error);

        if (error && typeof error === "object" && "url" in error) {
          console.error("📋 Failed data:", error);
        }

        console.error("🔄 Original parameters:", {
          url,
          query,
          position,
          impressions,
          clicks,
        });

        // More specific error messages
        const errorMessage = String(error);
        if (errorMessage.includes("UNIQUE constraint")) {
          toast.error("Keyword already exists in tracking");
        } else if (errorMessage.includes("NOT NULL")) {
          toast.error("Missing required data for keyword tracking");
        } else if (errorMessage.includes("timed out")) {
          toast.error("Request timed out - please try again");
        } else {
          toast.error(
            "Failed to add keyword to tracking: " +
              (error instanceof Error ? error.message : errorMessage),
          );
        }
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
          onClick={() => {
            try {
              console.log("🔥 Track Keyword clicked in RankingMenus!");
              console.log("🔍 Click params:", {
                url,
                query,
                position,
                impressions,
                clicks,
                credentials: !!credentials,
              });
              toast.info("Click registered - starting process...");

              handleTrackKeyword(
                url,
                query,
                position,
                impressions,
                clicks,
                credentials,
              );
            } catch (error) {
              console.error("❌ Error in click handler:", error);
              toast.error("Click handler failed: " + error.message);
            }
          }}
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
