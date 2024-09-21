// @ts-nocheck
"use client";
import { invoke } from "@tauri-apps/api/tauri";
import React, { useState } from "react";
import { toast } from "sonner";

const GoogleAnalyticsModal = ({ onSubmit, close }) => {
  const [number, setNumber] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setNumber(e.target.value);
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Call the Tauri command with the number parameter
    const result = await invoke("set_google_analytics_id", {
      id: number,
    });
    toast("GA4 ID has been added successfully");
    close();
  };

  return (
    <section>
      <div className="max-w-md mx-auto -mt-3 p-2 px-3 pb-5 bg-white dark:bg-brand-darker dark:text-white rounded-lg text-xs">
        <p>Enter your Google Analytics 4 Property ID</p>
        <div className="mb-4 relative mt-4">
          <label
            htmlFor="number"
            className="block text-gray-700 text-[10px] font-bold mb-2 absolute -top-[8px] px-1 bg-white left-[10px] dark:bg-brand-darker dark:text-white"
          >
            ID
          </label>
          <input
            type="text"
            id="number"
            name="number"
            value={number}
            onChange={handleChange}
            className={`w-full px-3 dark:bg-brand-darker dark:border-white/30 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              error
                ? "border-red-500 focus:ring-red-200"
                : "focus:ring-blue-200"
            }`}
            placeholder="XXXXXXXXX"
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
        <button
          onClick={handleSubmit}
          type="submit"
          className="w-full active:scale-95 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200"
        >
          Connect
        </button>
      </div>
    </section>
  );
};

export default GoogleAnalyticsModal;
