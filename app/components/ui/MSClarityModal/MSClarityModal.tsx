// @ts-nocheck
"use client";
import { invoke } from "@tauri-apps/api/core";
import { log } from "console";
import React, { useState } from "react";
import { toast } from "sonner";

const MSClarity = ({ onSubmit, close }) => {
  const defaultEndpoint =
    "www.clarity.ms/export-data/api/v1/project-live-insights";
  const [endpoint, setEndpoint] = useState(defaultEndpoint);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Load saved credentials on mount
  React.useEffect(() => {
    invoke<Vec<string>>("get_microsoft_clarity_command")
      .then((result) => {
        if (result && result.length >= 2) {
          setEndpoint(result[0]);
          setToken(result[1]);
        }
      })
      .catch((err) => {
        console.error("Failed to load Clarity config:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "endpoint") {
      setEndpoint(value);
    } else if (name === "token") {
      setToken(value);
    }
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // Validation: both fields required
    if (!endpoint.trim()) {
      setError("Endpoint is required");
      return;
    }
    if (!token.trim()) {
      setError("Token is required");
      return;
    }

    setError("");
    try {
      await invoke("set_microsoft_clarity_command", {
        endpoint: endpoint.trim(),
        token: token.trim(),
      });
      toast("Microsoft Clarity Credentials saved successfully");
      close();
    } catch (err: any) {
      setError(err || "Failed to save credentials");
    }
  };

  return (
    <section>
      <div className="max-w-md mx-auto -mt-3 p-2 px-3 pb-2 bg-white dark:bg-brand-darker dark:text-white rounded-lg text-xs">
        <p className="text-gray-600 dark:text-gray-400 text-[10px] font-medium mt-1">
          Clarity Settings:{" "}
          <a
            href="https://clarity.microsoft.com/projects/view"
            target="_blank"
            className="text-blue-500 hover:underline"
          >
            Microsoft Clarity
          </a>
          <span className="font-bold text-gray-700 dark:text-gray-200">
            {" "}
            &gt; Settings &gt; Data Export &gt; Generate new API Token
          </span>
        </p>
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
            disabled={loading}
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
