// @ts-nocheck
import React, { useState } from "react";

const GoogleSearchConsoleModal = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    clientId: "",
    projectId: "",
    clientSecret: "",
    url: "",
    searchType: "",
    duration: "",
  });

  const [errors, setErrors] = useState({});

  const searchTypes = [
    { value: "domain", label: "Domain" },
    { value: "url", label: "URL" },
  ];

  const durations = [
    { value: "1month", label: "1 Month" },
    { value: "3months", label: "3 Months" },
    { value: "6months", label: "6 Months" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
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
    if (!formData.searchType) {
      newErrors.searchType = "Search Type is required";
    }
    if (!formData.duration) {
      newErrors.duration = "Duration is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log(formData);
    }
  };

  return (
    <div className="max-w-md mx-auto -mt-3 p-2 bg-white rounded-lg text-xs">
      <h2 className="text-lg font-semibold mb-4">Enter Credentials</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4 relative">
          <label
            htmlFor="clientId"
            className="block text-gray-700 text-[10px] font-bold mb-2 absolute -top-[8px] px-1 bg-white left-[10px]"
          >
            Client ID
          </label>
          <input
            type="text"
            id="clientId"
            name="clientId"
            value={formData.clientId}
            onChange={handleChange}
            className={`w-full px-3 py-2 border  rounded-lg focus:outline-none focus:ring-2 ${
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
            className="block text-gray-700 text-[10px] font-bold mb-2 absolute -top-[8px] px-1 bg-white left-[10px]"
          >
            Project ID
          </label>
          <input
            type="text"
            id="projectId"
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
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
            className="block text-gray-700 text-[10px] font-bold mb-2 absolute -top-[8px] px-1 bg-white left-[10px]"
          >
            Client Secret
          </label>
          <input
            type="password"
            id="clientSecret"
            name="clientSecret"
            value={formData.clientSecret}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
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
            className="block text-gray-700 text-[10px] font-bold mb-2 absolute -top-[8px] px-1 bg-white left-[10px]"
          >
            URL
          </label>
          <input
            type="text"
            id="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
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

        <div className="mb-4">
          <label
            htmlFor="searchType"
            className="block text-gray-700 font-bold mb-2"
          >
            Search Type
          </label>
          <select
            id="searchType"
            name="searchType"
            value={formData.searchType}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-0 ${
              errors.searchType
                ? "border-red-500 focus:ring-red-200"
                : "focus:ring-blue-200"
            }`}
          >
            <option value="">Select a search type</option>
            {searchTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.searchType && (
            <p className="text-red-500 text-sm mt-1">{errors.searchType}</p>
          )}
        </div>

        <div className="mb-6">
          <label
            htmlFor="duration"
            className="block text-gray-700 font-bold mb-2"
          >
            Duration
          </label>
          <select
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-0 ${
              errors.duration
                ? "border-red-500 focus:ring-red-200"
                : "focus:ring-blue-200"
            }`}
          >
            <option value="">Select a duration</option>
            {durations.map((duration) => (
              <option key={duration.value} value={duration.value}>
                {duration.label}
              </option>
            ))}
          </select>
          {errors.duration && (
            <p className="text-red-500 text-sm mt-1">{errors.duration}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default GoogleSearchConsoleModal;
