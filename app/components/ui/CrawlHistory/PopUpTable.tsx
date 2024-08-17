// @ts-nocheck
import React, { useState, useMemo } from "react";

const PopUpTable = ({ data }: any) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Function to remove duplicates based on a unique key
  const removeDuplicates = (array: any[], key: string) => {
    const unique = {};
    return array.filter((item) => {
      if (!unique[item[key]]) {
        unique[item[key]] = true;
        return true;
      }
      return false;
    });
  };

  // Remove duplicates from the data array
  const uniqueData = useMemo(() => removeDuplicates(data, "query"), [data]);

  // Filter the data based on the search query
  const filteredData = useMemo(() => {
    return uniqueData.filter((row: any) =>
      row.query.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, uniqueData]);

  // Sort the data based on the sort configuration
  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    if (sortConfig.key) {
      sorted.sort((a: any, b: any) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sorted;
  }, [sortConfig, filteredData]);

  // Function to request sort
  const requestSort = (key: string) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <section className="overflow-auto bg-white dark:bg-brand-darker p-0 rounded-lg text-xs h-96 w-full">
      <div className="p-3">
        <div className="text-xs space-x-1 mb-2">
          <span className="font-bold dark:text-white/50">URL:</span>
          <span className="text-brand-highlight">
            {(data && data[0]?.url) || "No Data"}
          </span>
        </div>
        <input
          type="text"
          placeholder="Search queries"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border dark:border-brand-dark rounded p-2 w-full dark:bg-brand-darker dark:text-white/50"
        />
      </div>
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-700">
            <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">
              Query
            </th>
            <th
              className="px-4 py-2 text-left text-gray-600 dark:text-gray-300 cursor-pointer"
              onClick={() => requestSort("clicks")}
            >
              Clicks{" "}
              {sortConfig.key === "clicks" && (
                <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
              )}
            </th>
            <th
              className="px-4 py-2 text-left text-gray-600 dark:text-gray-300 cursor-pointer"
              onClick={() => requestSort("impressions")}
            >
              Impressions{" "}
              {sortConfig.key === "impressions" && (
                <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
              )}
            </th>
            <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">
              CTR
            </th>
            <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">
              Position
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row: any, index: any) => (
            <tr
              key={index}
              className="border-b border-gray-200   dark:border-b-red-500"
            >
              <td className="px-4 py-2 text-gray-800 dark:text-gray-300">
                {row?.query}
              </td>
              <td className="px-4 py-2 text-gray-800 dark:text-gray-300">
                {row?.clicks}
              </td>
              <td
                align="center"
                className="px-4 py-2 text-gray-800 dark:text-gray-300"
              >
                {row?.impressions}
              </td>
              <td className="px-4 py-2 text-gray-800 dark:text-gray-300">
                {row?.ctr}%
              </td>
              <td className="px-4 py-2 text-gray-800 dark:text-gray-300">
                {row?.position.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default PopUpTable;
