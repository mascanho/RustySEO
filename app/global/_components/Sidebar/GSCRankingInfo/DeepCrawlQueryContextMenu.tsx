// @ts-nocheck

import { Menu, Divider } from "@mantine/core";
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
  FiChevronRight,
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
  // Debug props received
  // console.log("🔧 DeepCrawlQueryContextMenu initialized with props:", {
  //   url,
  //   query,
  //   credentials: !!credentials,
  //   position,
  //   impressions,
  //   clicks,
  //   hasChildren: !!children,
  // });

  useEffect(() => {
    // console.log("🎯 Setting up keyword-tracked event listener");
    const unlisten = listen("keyword-tracked", (event) => {
      console.log("✅ Keyword tracked event received:", event);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleCopy = useCallback((query: string) => {
    console.log("🔥 Copy Query clicked! Query:", query);
    navigator?.clipboard.writeText(query);
    toast.success("Query copied to clipboard");
    console.log("✅ Copy operation completed");
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
      console.log("🚀 === DEEP CRAWL - Adding Keyword to Tracking ===");
      console.log("🔍 Raw parameters received:", {
        url,
        query,
        position,
        impressions,
        clicks,
        credentials: !!credentials,
      });

      // Validate required parameters
      if (!query || query.trim() === "") {
        toast.error("Cannot add keyword: Query is required");
        console.error("❌ Invalid query parameter:", query);
        return;
      }

      console.log("🔍 Step 1: Processing URL sources...");
      console.log("🔍 Step 1a: Initial URL check...");
      console.log("Initial URL parameter:", url);
      console.log("URL type:", typeof url);
      console.log("URL length:", url ? url.length : "null/undefined");

      // Try to get URL from available sources - handle both string and object URLs
      let finalUrl: string;

      console.log("🔍 Step 1b: Processing URL parameter...");
      if (typeof url === "object" && url !== null && "url" in url) {
        console.log("🔍 Step 1b1: URL is object, extracting url property...");
        finalUrl = String(url.url || "");
        console.log("Extracted URL from object:", finalUrl);
      } else if (typeof url === "string") {
        console.log("🔍 Step 1b2: URL is string, using directly...");
        finalUrl = url;
        console.log("Using string URL:", finalUrl);
      } else {
        console.log(
          "🔍 Step 1b3: URL is neither object nor string, setting empty...",
        );
        finalUrl = "";
        console.log("Set empty URL");
      }

      console.log("🔍 Step 1c: Final URL after processing:", finalUrl);

      console.log("🔍 Step 1d: Checking if URL is empty...");
      const isUrlEmpty = !finalUrl || finalUrl.trim() === "";
      console.log("Is URL empty?", isUrlEmpty);

      if (isUrlEmpty) {
        console.log("🔍 Step 1e: URL is empty, checking credentials...");
        console.log("Credentials object:", credentials);
        console.log("Credentials type:", typeof credentials);
        console.log("Credentials?.url:", credentials?.url);

        // Try to get URL from GSC credentials
        if (credentials?.url) {
          console.log("🔍 Step 1f: Using URL from GSC credentials...");
          finalUrl = String(credentials.url);
          console.log("URL from credentials:", finalUrl);
        } else {
          console.log("🔍 Step 1g: No credentials URL, using fallback...");
          console.warn(
            "No URL available from any source, using generic fallback",
          );
          finalUrl = "unknown-domain";
          console.log("Fallback URL set:", finalUrl);
        }
      } else {
        console.log("🔍 Step 1e: URL not empty, using processed URL");
      }

      console.log("✅ Step 1 completed. Final URL:", finalUrl);
      console.log("Final URL type:", typeof finalUrl);
      console.log("Final URL length:", finalUrl.length);
      console.log("🔍 Step 2: Processing data types...");

      // Ensure proper data types and handle missing values with better validation
      console.log("🔢 Converting data types for:", {
        position,
        impressions,
        clicks,
      });
      const data = {
        url: String(finalUrl || "unknown-domain").trim(),
        query: String(query || "").trim(),
        position: (() => {
          if (typeof position === "number" && !isNaN(position)) return position;
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

      console.log("✅ Step 2 completed. Data types processed");
      console.log("📊 Processed data being sent to backend:", data);

      console.log("🔍 Step 3: Validating processed data...");

      // Comprehensive data validation logging
      const validation = {
        urlValid: data.url.length > 0,
        queryValid: data.query.length > 0,
        positionValid:
          typeof data.position === "number" && !isNaN(data.position),
        impressionsValid:
          typeof data.impressions === "number" && !isNaN(data.impressions),
        clicksValid: typeof data.clicks === "number" && !isNaN(data.clicks),
        urlSource:
          finalUrl === url
            ? "parameter"
            : credentials?.url
              ? "credentials"
              : "fallback",
      };

      console.log("🔍 Data validation details:", validation);

      // Check if all validations pass
      const allValid = Object.values(validation).every(
        (v) => v === true || typeof v === "string",
      );
      console.log("✅ All validations passed:", allValid);

      if (!allValid) {
        console.error("❌ Data validation failed! Details:", validation);
        toast.error("Invalid data detected - check console for details");
        return;
      }

      console.log("✅ Step 3 completed. Data validation passed");
      console.log("🚀 Step 4: Sending data to backend...");

      try {
        console.log(
          "📡 Invoking Tauri command: add_gsc_data_to_kw_tracking_command",
        );
        console.log("📦 Command payload:", { data });

        // Create a timeout promise that rejects after 5 seconds for faster feedback
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Operation timed out after 5 seconds")),
            5000,
          ),
        );

        // Wrap the main operation in a timeout
        const mainOperation = async () => {
          console.log("🔍 Step 4: Invoking Tauri command...");
          console.log("📦 About to invoke add_gsc_data_to_kw_tracking_command");
          console.log(
            "📦 Command data payload:",
            JSON.stringify(data, null, 2),
          );

          // Add individual timeout for first command
          const dbSavePromise = invoke("add_gsc_data_to_kw_tracking_command", {
            data,
          });
          const dbSaveTimeout = new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Database save timed out")),
              3000,
            ),
          );

          console.log("⏱️ Starting database save with 3s timeout...");
          const result = await Promise.race([dbSavePromise, dbSaveTimeout]);

          console.log("✅ Backend result received:", result);
          console.log("✅ Database save completed successfully");
          console.log("🔍 Step 5: Syncing tracking tables...");

          // Add individual timeout for sync command
          console.log("📦 About to invoke match_tracked_with_gsc_command");
          const syncPromise = invoke("match_tracked_with_gsc_command");
          const syncTimeout = new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Sync operation timed out")),
              3000,
            ),
          );

          console.log("⏱️ Starting sync operation with 3s timeout...");
          await Promise.race([syncPromise, syncTimeout]);

          console.log("✅ Step 5 completed. Tables synced");
          console.log("🔍 Step 6: Emitting events...");

          toast.success("Keyword added to Tracking Dashboard");

          console.log("📡 Emitting keyword-tracked event...");
          await emit("keyword-tracked", { action: "add", data });
          console.log("✅ keyword-tracked event emitted successfully");

          console.log("📡 Emitting tracking-data-updated event...");
          await emit("tracking-data-updated", { action: "refresh" });
          console.log("✅ tracking-data-updated event emitted successfully");
          console.log("✅ Step 6 completed. Events emitted");
          console.log(
            "🎉 === DEEP CRAWL - Keyword Addition Completed Successfully ===",
          );
        };

        // Race between the main operation and timeout
        await Promise.race([mainOperation(), timeoutPromise]);
      } catch (error) {
        console.error("❌ === DEEP CRAWL - Keyword Addition Failed ===");
        console.error("🔥 Error details:", error);
        console.error("💥 Error type:", typeof error);
        console.error("📋 Failed data:", data);
        console.error("🔄 Original parameters:", {
          url,
          query,
          position,
          impressions,
          clicks,
        });
        console.error("🛠️ Credentials available:", !!credentials);

        // More specific error messages
        const errorMessage = String(error);
        if (errorMessage.includes("UNIQUE constraint")) {
          toast.error("Keyword already exists in tracking");
        } else if (errorMessage.includes("NOT NULL")) {
          toast.error("Missing required data for keyword tracking");
        } else if (errorMessage.includes("Database save timed out")) {
          toast.error("Database save operation timed out - check backend");
        } else if (errorMessage.includes("Sync operation timed out")) {
          toast.error("Table sync operation timed out - check backend");
        } else if (errorMessage.includes("timed out after 5 seconds")) {
          toast.error("Overall operation timed out - check backend connection");
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
    <Menu
      shadow="md"
      width={200}
      position="bottom-start"
      withArrow
      transitionProps={{ transition: "pop", duration: 150 }}
    >
      <Menu.Target>
        <div className="cursor-pointer">{children}</div>
      </Menu.Target>

      <Menu.Dropdown className="text-xs dark:bg-brand-darker dark:border-brand-dark p-1 z-[9999]">
        <Menu.Item
          leftSection={<FiClipboard size={14} />}
          onClick={() => handleCopy(query)}
          className="dark:text-gray-200 dark:hover:bg-brand-dark hover:bg-brand-bright hover:text-white text-xs py-1.5"
        >
          Copy Query
        </Menu.Item>

        <Divider className="my-1 dark:border-brand-dark" />

        <Menu.Item
          leftSection={<IoKey size={14} />}
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
          className="dark:text-gray-200 dark:hover:bg-brand-dark hover:bg-brand-bright hover:text-white text-xs py-1.5"
        >
          Add to Tracking
        </Menu.Item>

        <Menu.Item
          leftSection={<FiBarChart size={14} />}
          onClick={() => openSearchConsoleUrl(query)}
          className="dark:text-gray-200 dark:hover:bg-brand-dark hover:bg-brand-bright hover:text-white text-xs py-1.5"
        >
          Open in Search Console
        </Menu.Item>

        <Divider className="my-1 dark:border-brand-dark" />

        <Menu
          shadow="xs"
          width={190}
          trigger="hover"
          position="right-start"
          portalProps={{ className: "z-[9999]" }}
        >
          <Menu.Target>
            <Menu.Item
              leftSection={<FiCheckSquare size={14} />}
              rightSection={<FiChevronRight size={12} className="opacity-60" />}
              className="dark:text-gray-200 dark:hover:bg-brand-dark hover:bg-brand-bright hover:text-white text-xs py-1.5"
            >
              SERP Results
            </Menu.Item>
          </Menu.Target>
          <Menu.Dropdown className="dark:bg-brand-darker dark:border-brand-dark dark:text-gray-200 p-1">
            <Menu.Item
              leftSection={<FaSearchengin size={14} />}
              onClick={() =>
                openBrowserWindow(`https://www.google.com/search?q=${query}`)
              }
              className="dark:text-gray-200 dark:hover:bg-brand-dark hover:bg-brand-bright hover:text-white text-xs"
            >
              Google
            </Menu.Item>
            <Menu.Item
              leftSection={<FaSearchengin size={14} />}
              onClick={() =>
                openBrowserWindow(`https://www.bing.com/search?q=${query}`)
              }
              className="dark:text-gray-200 dark:hover:bg-brand-dark hover:bg-brand-bright hover:text-white text-xs"
            >
              Bing
            </Menu.Item>
            <Menu.Item
              leftSection={<FaSearchengin size={14} />}
              onClick={() =>
                openBrowserWindow(`https://search.yahoo.com/search?p=${query}`)
              }
              className="dark:text-gray-200 dark:hover:bg-brand-dark hover:bg-brand-bright hover:text-white text-xs"
            >
              Yahoo
            </Menu.Item>
            <Menu.Item
              leftSection={<FaSearchengin size={14} />}
              onClick={() =>
                openBrowserWindow(
                  `https://www.yandex.com/search/?text=${query}`,
                )
              }
              className="dark:text-gray-200 dark:hover:bg-brand-dark hover:bg-brand-bright hover:text-white text-xs"
            >
              Yandex
            </Menu.Item>
            <Menu.Item
              leftSection={<FaSearchengin size={14} />}
              onClick={() =>
                openBrowserWindow(`https://duckduckgo.com/?q=${query}&ia=web`)
              }
              className="dark:text-gray-200 dark:hover:bg-brand-dark hover:bg-brand-bright hover:text-white text-xs"
            >
              DuckDuckGo
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>

        <Menu
          shadow="xs"
          width={190}
          trigger="hover"
          position="right-start"
          portalProps={{ className: "z-[9999]" }}
        >
          <Menu.Target>
            <Menu.Item
              leftSection={<FiLink size={14} />}
              rightSection={<FiChevronRight size={12} className="opacity-60" />}
              className="dark:text-gray-200 dark:hover:bg-brand-dark hover:bg-brand-bright hover:text-white text-xs py-1.5"
            >
              Backlinks
            </Menu.Item>
          </Menu.Target>
          <Menu.Dropdown className="dark:bg-brand-darker dark:border-brand-dark dark:text-gray-200 p-1">
            <Menu.Item
              leftSection={<FiExternalLink size={14} />}
              className="dark:text-gray-200 dark:hover:bg-brand-dark hover:bg-brand-bright hover:text-white text-xs"
            >
              Ahrefs
            </Menu.Item>
            <Menu.Item
              leftSection={<FiPlusSquare size={14} />}
              className="dark:text-gray-200 dark:hover:bg-brand-dark hover:bg-brand-bright hover:text-white text-xs"
            >
              Moz
            </Menu.Item>
            <Menu.Item
              leftSection={<FiGlobe size={14} />}
              className="dark:text-gray-200 dark:hover:bg-brand-dark hover:bg-brand-bright hover:text-white text-xs"
            >
              Majestic
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Menu.Dropdown>
    </Menu>
  );
};

export default DeepCrawlQueryContextMenu;
