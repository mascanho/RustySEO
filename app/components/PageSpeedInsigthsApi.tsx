import { invoke } from "@tauri-apps/api/tauri";
import React, { useState } from "react";
import { toast } from "sonner";

const PageSpeedInsigthsApi = ({ close }: any) => {
  const [userInput, setUserInput] = useState("");

  console.log(userInput);

  const handleAddApiKey: any = async (key: string) => {
    try {
      const result = await invoke<{ success: boolean }>("add_api_key", {
        key,
        apiType: "page_speed",
      });
      console.log(result, "This is the result");
      if (result) {
        console.log("API key added successfully");
        toast("API key added successfully");
        // Perform any additional actions on success
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
    <div className="flex flex-col space-y-3">
      <h2>
        Paste your{" "}
        <a
          href="https://developers.google.com/speed/docs/insights/v5/get-started"
          target="_blank"
          className="underline"
        >
          Google PageSpeed Insights API key
        </a>
      </h2>
      <input
        onChange={(e) => setUserInput(e.target.value)}
        type="text"
        name="pagespeed"
        className="border rounded-md py-1"
      />
      <button
        onClick={() => handleAddApiKey(userInput)}
        type="button"
        className="w-full flex items-center pt-1 h-9 justify-center font-semibold border bg-blue-500 text-white rounded-md"
      >
        Connect
      </button>
    </div>
  );
};

export default PageSpeedInsigthsApi;
