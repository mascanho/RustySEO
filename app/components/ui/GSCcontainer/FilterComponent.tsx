import React from "react";

interface FilterComponentProps {
  filter: number | null;
  setFilter: (filter: number | null) => void;
}

export default function FilterComponent({
  filter,
  setFilter,
}: FilterComponentProps) {
  return (
    <div className="mb-4">
      <label
        htmlFor="position-filter"
        className="block text-sm font-medium text-gray-700"
      >
        Filter by Position:
      </label>
      <select
        id="position-filter"
        value={filter || ""}
        onChange={(e) =>
          setFilter(e.target.value ? Number(e.target.value) : null)
        }
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      >
        <option value="">All</option>
        <option value="1">Top 1</option>
        <option value="3">Top 3</option>
        <option value="5">Top 5</option>
        <option value="10">Top 10</option>
      </select>
    </div>
  );
}
