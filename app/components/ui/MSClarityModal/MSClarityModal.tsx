// @ts-nocheck
"use client";
import { invoke } from "@/lib/invoke";
import { log } from "console";
import React, { useState } from "react";
import { toast } from "sonner";

const MSClarity = ({ onSubmit, close }) => {
  const [endpoint, setEndpoint] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "endpoint") {
      setEndpoint(value);
    } else if (name === "token") {
      setToken(value);
    }
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Call the Tauri command with the number parameter
    const result = await invoke("set_microsoft_clarity_command", {
      endpoint,
      token,
    });
    toast("Microsoft Clarity Credentials saved successfully");
    console.log(endpoint, token);
    close();
  };

  return (
    <section>
      <div className="max-w-md mx-auto -mt-3 p-2 px-3 pb-2 bg-white dark:bg-brand-darker dark:text-white rounded-lg text-xs">
        <a
          href=" https://clarity.microsoft.com/projects/view/klulsvnnbr/settings#apiTokens"
          target="_blank"
          className="text-blue-500 hover:underline pl-1"
        >
          Get your token here
        </a>
        <div className="mb-4 relative mt-2 space-y-4">
          <label
            htmlFor="number"
            className="block text-gray-700 text-[10px] font-bold mb-2 absolute top-[8px] px-1 bg-white left-[10px] dark:bg-brand-darker dark:text-white"
          >
            Endpoint
          </label>
          <input
            type="text"
            id="endpoint"
            name="endpoint"
            value={endpoint}
            onChange={handleChange}
            className={`w-full px-3 dark:bg-brand-darker dark:border-white/30 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              error
                ? "border-red-500 focus:ring-red-200"
                : "focus:ring-blue-200"
            }`}
            placeholder="www.clarity.ms/export-data/api/v1/project-live-insights"
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          <div>
            <label
              htmlFor="number"
              className="block text-gray-700 text-[10px] font-bold mb-2 absolute bottom-[17px] px-1 bg-white left-[10px] dark:bg-brand-darker dark:text-white"
            >
              Token
            </label>
            <input
              type="text"
              id="token"
              name="token"
              value={token}
              onChange={handleChange}
              className={`w-full px-3 dark:bg-brand-darker dark:border-white/30 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                error
                  ? "border-red-500 focus:ring-red-200"
                  : "focus:ring-blue-200"
              }`}
              placeholder="Your token here"
            />
          </div>

          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        <button
          onClick={handleSubmit}
          type="submit"
          className="w-full active:scale-95 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200 mt-4"
        >
          Connect
        </button>
      </div>
    </section>
  );
};

export default MSClarity;
