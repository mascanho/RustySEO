// @ts-nocheck
"use client";
import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import { useFetch } from "@mantine/hooks";
import { invoke } from "@tauri-apps/api/tauri";
import React, { useCallback, useEffect, useId, useState } from "react";
import { FaExternalLinkAlt } from "react-icons/fa";

const GoogleSearchConsoleModal = ({ onSubmit, close }) => {
  const [formData, setFormData] = useState({
    clientId: "",
    projectId: "",
    clientSecret: "",
    url: "",
    propertyType: "",
    range: "",
    rows: "",
  });

  const [errors, setErrors] = useState({});
  const [isNextScreen, setNextScreen] = useState(false);
  const [isSubmitedId, setSubmitedId] = useState("");

  const searchTypes = [
    { value: "domain", label: "Domain" },
    { value: "site", label: "URL" },
  ];

  const durations = [
    { value: "1 month", label: "1 Month" },
    { value: "3 months", label: "3 Months" },
    { value: "6 months", label: "6 Months" },
    { value: "12 months", label: "12 Months" },
    { value: "24 months", label: "24 Months" },
  ];

  const rows = [
    { value: "1000", label: "1000" },
    { value: "5000", label: "5000" },
    { value: "10000", label: "10000" },
    { value: "20000", label: "20000" },
    { value: "50000", label: "50000" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    if (name === "clientId") {
      const submitedId = `https://accounts.google.com/o/oauth2/auth?scope=https://www.googleapis.com/auth/webmasters.readonly&access_type=offline&redirect_uri=http://127.0.0.1:63516&response_type=code&client_id=${value}`;
      setSubmitedId(submitedId);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.clientId.trim()) {
      newErrors.clientId = "Client ID is required";
    }
    if (!formData.projectId.trim()) {
      newErrors.projectId = "Project ID is required";
    }
    if (!formData.clientSecret.trim()) {
      newErrors.clientSecret = "Client Secret is required";
    }
    if (!formData.url.trim()) {
      newErrors.url = "URL is required";
    }
    if (!formData.propertyType) {
      newErrors.propertyType = "Search Type is required";
    }
    if (!formData.range) {
      newErrors.range = "Duration is required";
    }

    if (!formData.rows) {
      newErrors.rows = "Rows is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log(formData);
      try {
        invoke("set_google_search_console_credentials", {
          credentials: formData,
        }).then(() => {
          console.log("Credentials saved successfully");
          setNextScreen(true);
        });
      } catch (error) {
        console.error("Failed to save credentials:", error);
      }
    }
  };

  const handleClose = useCallback(async () => {
    const { appWindow } = await import("@tauri-apps/api/window");
    appWindow.close();
  }, []);

  return (
    <section>
      {/* SECONDARY SCREEN GOES HERE */}
      <div
        className={`${!isNextScreen && "hidden"} max-w-md mx-auto pl-4 pr-2  dark:bg-brand-darker dark:text-white rounded-lg `}
      >
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          How to Log In
        </h2>
        <ol className="list-decimal list-inside space-y-3">
          <li className="text-gray-700 dark:text-white">
            <strong>Step 1:</strong> Close RustySEO
          </li>
          <li className="text-gray-700 dark:text-white">
            <strong>Step 2:</strong> Open your system terminal
          </li>
          <li className="text-gray-700 dark:text-white">
            <strong>Step 3:</strong> Launch RustySEO from your terminal with by
            typping <strong>rustyseo</strong> in your terminal then{" "}
            <strong>press enter</strong>
          </li>
          <li className="text-gray-700 dark:text-white">
            <strong>Step 4:</strong> copy the link that appears in your terminal
            and open it in your browser
          </li>
          <li className="text-gray-700 dark:text-white">
            <strong>Step 5:</strong> After successful login, you will be
            redirected to your dashboard.
          </li>
        </ol>
        <div className="mt-6 text-sm text-gray-600 dark:text-white/50">
          <p>
            Need further assistance? Contact our support team at{" "}
            <a
              href="mailto:530rusty@gmail.com"
              className="text-blue-500 hover:underline"
            >
              530rusty@gmail.com
            </a>
            .
          </p>
        </div>

        <button
          onClick={handleClose}
          className="w-full mt-5 active:scale-95  bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200"
        >
          Close RustySEO
        </button>
      </div>

      {/* MAIN SCREEN GOES HERE */}
      <div
        className={`${isNextScreen && "hidden"} max-w-md mx-auto -mt-3 p-2 px-3 pb-5 bg-white dark:bg-brand-darker dark:text-white rounded-lg text-xs`}
      >
        <h2 className="text-lg font-semibold mb-4 ml-1">Enter Credentials</h2>
        <form onSubmit={handleSubmit} className="dark:bg-brand-darker">
          <div className="mb-4 relative">
            <label
              htmlFor="projectId"
              className="block text-gray-700 text-[10px] font-bold mb-2 absolute -top-[8px] px-1 bg-white left-[10px] dark:bg-brand-darker dark:text-white"
            >
              Project ID
            </label>
            <input
              type="text"
              id="projectId"
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              className={`w-full px-3 dark:bg-brand-darker dark:border-white/30 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.projectId
                  ? "border-red-500 focus:ring-red-200"
                  : "focus:ring-blue-200"
              }`}
              placeholder="Enter Project ID"
            />
            {errors.projectId && (
              <p className="text-red-500 text-sm mt-1">{errors.projectId}</p>
            )}
          </div>
          <div className="mb-4 relative">
            <label
              htmlFor="clientId"
              className="block text-gray-700 text-[10px] font-bold mb-2 absolute -top-[8px] px-1 bg-white left-[10px] dark:bg-brand-darker dark:text-white"
            >
              Client ID
            </label>
            <input
              type="text"
              id="clientId"
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border  rounded-lg dark:bg-brand-darker dark:border-white/30 focus:outline-none focus:ring-2 ${
                errors.clientId
                  ? "border-red-500 focus:ring-red-200"
                  : "focus:ring-blue-200"
              }`}
              placeholder="Enter Client ID"
            />
            {errors.clientId && (
              <p className="text-red-500 text-sm mt-1">{errors.clientId}</p>
            )}
          </div>
          <div className="mb-4 relative">
            <label
              htmlFor="clientSecret"
              className="block text-gray-700 text-[10px] font-bold mb-2 absolute -top-[8px] px-1 bg-white left-[10px] dark:bg-brand-darker dark:text-white"
            >
              Client Secret
            </label>
            <input
              type="password"
              id="clientSecret"
              name="clientSecret"
              value={formData.clientSecret}
              onChange={handleChange}
              className={`w-full px-3 dark:bg-brand-darker dark:border-white/30 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.clientSecret
                  ? "border-red-500 focus:ring-red-200"
                  : "focus:ring-blue-200"
              }`}
              placeholder="Enter Client Secret"
            />
            {errors.clientSecret && (
              <p className="text-red-500 text-sm mt-1">{errors.clientSecret}</p>
            )}
          </div>
          <div className="mb-4 relative">
            <label
              htmlFor="url"
              className="block text-gray-700 text-[10px] font-bold mb-2 absolute -top-[8px] px-1 bg-white left-[10px] dark:bg-brand-darker dark:text-white"
            >
              URL
            </label>
            <input
              type="text"
              id="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              className={`dark:bg-brand-darker dark:border-white/30 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.url
                  ? "border-red-500 focus:ring-red-200"
                  : "focus:ring-blue-200"
              }`}
              placeholder="Enter URL"
            />
            {errors.url && (
              <p className="text-red-500 text-sm mt-1">{errors.url}</p>
            )}
          </div>
          <div className="mb-4 mt-4">
            <label
              htmlFor="propertyType"
              className="block text-gray-700 font-bold mb-2 dark:text-white"
            >
              Property Type
            </label>
            <select
              id="propertyType"
              name="propertyType"
              value={formData.propertyType}
              onChange={handleChange}
              className={`gsc w-full px-3 dark:bg-brand-darker py-2 border rounded-lg focus:outline-none focus:ring-0 ${
                errors.propertyType
                  ? "border-red-500 focus:ring-red-200"
                  : "focus:ring-blue-200"
              }`}
            >
              <option value="">Select a property type</option>
              {searchTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.propertyType && (
              <p className=" text-sm mt-1">{errors.propertyType}</p>
            )}
          </div>
          <div className="mb-6">
            <label
              htmlFor="range"
              className="block text-gray-700 font-bold mb-2 dark:text-white"
            >
              Date Range
            </label>
            <select
              id="range"
              name="range"
              value={formData.range}
              onChange={handleChange}
              className={`dark:text-white dark:bg-brand-darker w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-0 ${
                errors.range
                  ? "border-red-500 focus:ring-red-200"
                  : "focus:ring-blue-200"
              }`}
            >
              <option value="">Select a range</option>
              {durations.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            {errors.range && (
              <p className="text-red-500 text-sm mt-1">{errors.range}</p>
            )}

            <div className="mb-4 mt-2">
              <label
                htmlFor="rows"
                className="block text-gray-700 font-bold mb-2 dark:text-white"
              >
                Rows
              </label>

              <select
                name="rows"
                id="rows"
                value={formData.rows}
                onChange={handleChange}
                className={`dark:text-white dark:bg-brand-darker w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-0 ${errors.rows ? "border-red-500 focus:ring-red-200" : "focus:ring-blue-200"}`}
              >
                <option value="">Select a rows</option>
                {rows.map((rows) => (
                  <option key={rows.value} value={rows.value}>
                    {rows.label}
                  </option>
                ))}
              </select>
              {errors.rows && (
                <p className="text-red-500 text-sm mt-1">{errors.rows}</p>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="w-full active:scale-95  bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200"
          >
            Submit
          </button>
        </form>
      </div>
    </section>
  );
};

export default GoogleSearchConsoleModal;
