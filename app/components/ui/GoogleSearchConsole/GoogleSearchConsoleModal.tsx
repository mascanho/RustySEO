// @ts-nocheck
"use client";
import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import { useFetch } from "@mantine/hooks";
import { invoke } from "@tauri-apps/api/tauri";
import React, { useEffect, useId, useState } from "react";
import { FaExternalLinkAlt } from "react-icons/fa";

const GoogleSearchConsoleModal = ({ onSubmit, close }) => {
  const [formData, setFormData] = useState({
    clientId: "",
    projectId: "",
    clientSecret: "",
    url: "",
    propertyType: "",
    range: "",
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

  return (
    <section>
      {/* SECONDARY SCREEN GOES HERE */}
      <div
        className={`${!isNextScreen && "hidden"} max-w-md mx-auto  dark:bg-brand-darker dark:text-white rounded-lg `}
      >
        <h2 className="text-lg font-semibold mb-4">Open URL</h2>
        <div className="flex items-center  mb-4 flex-col">
          <input
            type="text"
            value={isSubmitedId}
            readOnly
            className="w-full flex-grow px-2 py-1 border rounded-lg dark:bg-brand-dark dark:border-white/30"
          />
          <button
            onClick={() => {
              openBrowserWindow(isSubmitedId);
            }}
            className="px-1 py-1 rounded-md mt-4 bg-brand-bright text-white w-full "
          >
            Verify Google Account
          </button>
        </div>
      </div>

      {/* MAIN SCREEN GOES HERE */}
      <div
        className={`${isNextScreen && "hidden"} max-w-md mx-auto -mt-3 p-2 px-4 pb-5 bg-white dark:bg-brand-darker dark:text-white rounded-lg text-xs`}
      >
        <h2 className="text-lg font-semibold mb-4 ml-1">Enter Credentials</h2>
        <form onSubmit={handleSubmit} className="dark:bg-brand-darker">
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
          <div className="mb-4 mt-8">
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
