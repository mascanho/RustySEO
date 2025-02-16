import type React from "react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange }) => {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search..."
      className="px-4 text-xs h-6 w-full dark:bg-brand-darker dark:text-white/50 dark:border-brand-dark border   focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
};

export default SearchInput;
