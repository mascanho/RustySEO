// @ts-nocheck
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ExternalLink,
  Book,
  PenTool as Tools,
  Newspaper,
  TrendingUp,
  FileText,
  BarChart,
  Video,
  Users,
  Key,
  FileCheck,
  Shield,
  Briefcase,
} from "lucide-react";
import { IoMdCloseCircleOutline } from "react-icons/io";
import seoResources from "./seo-resources";

type Resource = {
  title: string;
  description: string;
  url: string;
  tags: string[];
};

const tagIcons: { [key: string]: JSX.Element } = {
  Tools: <Tools size={14} />,
  Guides: <Book size={14} />,
  Blog: <FileText size={14} />,
  Official: <Shield size={14} />,
  Guidelines: <FileCheck size={14} />,
  Documentation: <FileText size={14} />,
  Tutorials: <Book size={14} />,
  "Case Studies": <Briefcase size={14} />,
  News: <Newspaper size={14} />,
  Trends: <TrendingUp size={14} />,
  "Best Practices": <FileCheck size={14} />,
  Strategies: <BarChart size={14} />,
  Tips: <FileText size={14} />,
  Analytics: <BarChart size={14} />,
  Keywords: <Key size={14} />,
  Community: <Users size={14} />,
  Videos: <Video size={14} />,
  Advanced: <BarChart size={14} />,
  Marketing: <Briefcase size={14} />,
  SEO: <Search size={14} />,
  Plugin: <Tools size={14} />,
  WordPress: <FileText size={14} />,
  "Rank Tracking": <TrendingUp size={14} />,
  Affordable: <FileText size={14} />,
  Content: <FileText size={14} />,
  Optimization: <BarChart size={14} />,
  Data: <BarChart size={14} />,
  Audits: <FileCheck size={14} />,
  Monitoring: <TrendingUp size={14} />,
  Competitors: <Users size={14} />,
  Free: <FileText size={14} />,
  Inbound: <FileText size={14} />,
  Automation: <Tools size={14} />,
  "Technical SEO": <Tools size={14} />,
};

export default function SeoToolkit({ showSeoToolkit, hideSeoToolkit }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    seoResources.forEach((resource) =>
      resource.tags.forEach((tag) => tags.add(tag)),
    );
    return Array.from(tags).sort();
  }, []);

  const filteredResources = useMemo(() => {
    return seoResources.filter((resource) => {
      const matchesSearch =
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      const matchesCategory = selectedCategory
        ? resource.tags.includes(selectedCategory)
        : true;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div
      className={`w-[24rem] h-[calc(100vh-250px)] bg-gray-100 dark:bg-brand-darker border-brand-bright border-2 fixed bottom-10 left-2 transform flex flex-col text-sm`}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-brand-dark">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white">
          SEO Resources
        </h2>
        <IoMdCloseCircleOutline
          onClick={hideSeoToolkit}
          className="text-black dark:text-white cursor-pointer hover:text-red-500"
          size={20}
        />
      </div>

      {/* Search & Filter */}
      <div className="flex items-center p-2 gap-2 bg-white dark:bg-brand-dark">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search..."
            className="w-full px-3 py-1 pl-8 text-sm border border-gray-300 dark:border-brand-dark bg-gray-50 dark:bg-brand-darker focus:outline-none focus:border-blue-500 text-gray-800 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search
            className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
        </div>
        <select
          value={selectedCategory || ""}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
          className="px-2 py-1 text-sm border border-gray-300 dark:border-brand-dark bg-gray-50 dark:bg-brand-darker focus:outline-none focus:border-blue-500 text-gray-800 dark:text-white max-w-[6rem]"
        >
          <option value="">All</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      {/* Resources List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-100 dark:bg-brand-darker">
        {filteredResources.length > 0 ? (
          filteredResources.map((resource, index) => (
            <div
              key={index}
              className="p-3 border-b border-gray-200 dark:border-brand-darker bg-white dark:bg-brand-dark"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-800 dark:text-white leading-tight">
                    {resource.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-white/70 mt-0.5 break-words">
                    {resource.description}
                  </p>
                </div>
                <Link
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-500 hover:text-blue-700 shrink-0"
                >
                  <ExternalLink size={16} />
                </Link>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {resource.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="bg-gray-200 dark:bg-brand-darker text-gray-700 dark:text-white/80 text-xs px-1.5 py-0.5 flex items-center gap-1 whitespace-nowrap"
                  >
                    {tagIcons[tag] || <FileText size={14} />}
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 dark:text-white/50 p-3 text-sm">
            No Resources
          </p>
        )}
      </div>
    </div>
  );
}
