"use client";
import { invoke } from "@tauri-apps/api/core";
import React, { useState } from "react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

const PageSpeedInsigthsApi = ({ close }: any) => {
  const [userInput, setUserInput] = useState("");
  const pathname = usePathname();

  const handleAddApiKey: any = async (key: string) => {
    try {
      const result = await invoke<{ success: boolean }>("add_api_key", {
        key,
        apiType: "page_speed",
      });
      console.log(result, "This is the result");
      // Add the API key to the settings
      await invoke("read_page_speed_bulk_api_key");

      if (result && pathname === "/") {
        console.log("API key added successfully");

        toast.success("API key added successfully");
        // Perform any additional actions on success
      } else if (result && pathname !== "/") {
        toast.success("API key added, toggle to enable CWV analysis");
      } else {
        console.log("Failed to add API key");
        // Handle the failure case
      }
    } catch (error) {
      console.error("Error adding API key:", error);
      // Handle the error (e.g., show an error message to the user)
    }
    close();
  };

  return (
    <div className="flex flex-col space-y-3 px-4 pb-4">
      <h2 className="dark:text-white">
        Paste your{" "}
        <a
          href="https://developers.google.com/speed/docs/insights/v5/get-started"
          target="_blank"
          className="underline dark:text-white"
        >
          Google PageSpeed Insights API key
        </a>
      </h2>
      <input
        onChange={(e) => setUserInput(e.target.value)}
        type="password"
        name="pagespeed"
        className="border rounded-md py-1 dark:text-white px-2 dark:bg-brand-darker dark:border-white/30"
      />
      <button
        onClick={() => handleAddApiKey(userInput)}
        type="button"
        className="w-full flex items-center pt-1 h-9 justify-center font-semibold border bg-blue-500 text-white rounded-md dark:border-white/10"
      >
        Connect
      </button>
    </div>
  );
};

export default PageSpeedInsigthsApi;
