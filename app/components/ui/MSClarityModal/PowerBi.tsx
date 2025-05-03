// @ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";

const PowerBiEmbed = ({ close }) => {
  const [powerBiUrl, setPowerBiUrl] = useState("");
  const [error, setError] = useState("");
  const [savedUrl, setSavedUrl] = useState("");

  // Load saved URL on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUrl = localStorage.getItem("powerBiUrl");
      if (savedUrl) {
        setPowerBiUrl(savedUrl);
        setSavedUrl(savedUrl);
      }
    }
  }, []);

  const handleUrlChange = (e) => {
    setPowerBiUrl(e.target.value);
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic URL validation
    if (!powerBiUrl) {
      setError("Please enter a Power BI URL");
      return;
    }

    try {
      // Save to localStorage
      localStorage.setItem("powerBiUrl", powerBiUrl);
      toast.success("Power BI URL saved successfully, reloading RustySEO...");
      setSavedUrl(powerBiUrl); // Update savedUrl to reflect new URL
      setTimeout(() => {
        close();
        window.location.reload();
      }, 800); // Delay to ensure toast is displayed
    } catch (err) {
      setError("Failed to save URL");
      console.error("Error saving Power BI URL:", err);
    }
  };

  return (
    <section>
      <div className="max-w-md mx-auto p-2 px-4 bg-white dark:bg-brand-darker dark:text-white rounded-lg text-sm">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="powerbi-url"
              className="block text-sm font-medium mb-1"
            >
              Power BI Report URL
            </label>
            <input
              type="url"
              id="powerbi-url"
              name="powerbi-url"
              value={powerBiUrl}
              onChange={handleUrlChange}
              className={`w-full px-3 py-1 -ml-1 border rounded-sm focus:outline-none focus:ring-0 ${
                error
                  ? "border-red-500 focus:ring-red-200 dark:border-red-500"
                  : "border-gray-300 focus:ring-blue-200 dark:border-white/30 dark:bg-brand-darker"
              }`}
              placeholder="https://app.powerbi.com/reportEmbed?reportId=..."
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter the full Power BI embed URL
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            {savedUrl ? (
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("powerBiUrl");
                  setPowerBiUrl("");
                  setSavedUrl("");
                }}
                className="px-4 py-0 h-7 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition"
              >
                Clear
              </button>
            ) : (
              <button
                type="button"
                onClick={close}
                className="px-4 py-0 text-sm border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-0 h-7 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
            >
              Save & Embed
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default PowerBiEmbed;
