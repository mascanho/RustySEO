// @ts-nocheck
"use client";

import { useMemo, useRef, useState } from "react";
import {
  Search,
  ExternalLink,
  X,
  Compass,
  Globe,
  Layers,
  KeyRound,
  Wrench,
  Gauge,
  Link2,
  PenTool,
  LineChart,
  BarChart3,
  Braces,
  MapPin,
  Puzzle,
  Chrome,
  BookOpen,
  Users,
  Youtube,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import seoResources, { categories } from "./seo-resources";

const categoryIcons: { [key: string]: JSX.Element } = {
  "All-in-One Suites": <Layers size={11} />,
  "Keyword Research": <KeyRound size={11} />,
  "Technical SEO & Audits": <Wrench size={11} />,
  "Site Speed & Core Web Vitals": <Gauge size={11} />,
  "Backlinks & Authority": <Link2 size={11} />,
  "Content & AI Writing": <PenTool size={11} />,
  "Rank Tracking": <LineChart size={11} />,
  "Analytics & Webmaster Tools": <BarChart3 size={11} />,
  "Structured Data & Schema": <Braces size={11} />,
  "Local SEO": <MapPin size={11} />,
  "WordPress & CMS Plugins": <Puzzle size={11} />,
  "Browser Extensions": <Chrome size={11} />,
  "Learning, Blogs & News": <BookOpen size={11} />,
  "Community & Forums": <Users size={11} />,
  "Video & YouTube": <Youtube size={11} />,
};

const pricingStyles: { [key: string]: string } = {
  Free: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  Freemium: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  Paid: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
};

const pricingOptions = ["All", "Free", "Freemium", "Paid"];

function CategoryChip({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
        active
          ? "border-brand-bright bg-brand-bright/10 text-brand-bright"
          : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-white/10 dark:text-white/60 dark:hover:border-white/20"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function ResourceCard({ resource }) {
  const [faviconFailed, setFaviconFailed] = useState(false);
  const hostname = useMemo(() => {
    try {
      return new URL(resource.url).hostname;
    } catch {
      return "";
    }
  }, [resource.url]);

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 rounded-md border border-gray-200 bg-white p-2.5 transition-colors hover:border-brand-bright/50 hover:shadow-sm dark:border-white/10 dark:bg-brand-dark"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded bg-gray-100 dark:bg-brand-darker">
        {hostname && !faviconFailed ? (
          <img
            src={`https://www.google.com/s2/favicons?sz=32&domain=${hostname}`}
            alt=""
            className="h-5 w-5"
            onError={() => setFaviconFailed(true)}
          />
        ) : (
          <Globe size={16} className="text-gray-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-sm font-medium text-gray-800 dark:text-white">
            {resource.title}
          </h3>
          <ExternalLink
            size={12}
            className="shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100"
          />
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-gray-600 dark:text-white/60">
          {resource.description}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 dark:bg-brand-darker dark:text-white/70">
            {categoryIcons[resource.category]}
            {resource.category}
          </span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${pricingStyles[resource.pricing]}`}
          >
            {resource.pricing}
          </span>
        </div>
      </div>
    </a>
  );
}

export default function SeoToolkit({ showSeoToolkit, hideSeoToolkit }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    null,
  );
  const [selectedPricing, setSelectedPricing] = useState<string | null>(null);
  const chipsRef = useRef<HTMLDivElement>(null);

  const scrollChips = (direction: 1 | -1) => {
    chipsRef.current?.scrollBy({ left: direction * 180, behavior: "smooth" });
  };

  const filteredResources = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return seoResources.filter((resource) => {
      const matchesSearch =
        term === "" ||
        resource.title.toLowerCase().includes(term) ||
        resource.description.toLowerCase().includes(term) ||
        resource.category.toLowerCase().includes(term) ||
        resource.tags.some((tag) => tag.toLowerCase().includes(term));
      const matchesCategory = selectedCategory
        ? resource.category === selectedCategory
        : true;
      const matchesPricing = selectedPricing
        ? resource.pricing === selectedPricing
        : true;
      return matchesSearch && matchesCategory && matchesPricing;
    });
  }, [searchTerm, selectedCategory, selectedPricing]);

  const hasActiveFilters =
    searchTerm !== "" || selectedCategory !== null || selectedPricing !== null;

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory(null);
    setSelectedPricing(null);
  };

  return (
    <div className="fixed bottom-10 left-2 z-40 flex h-[calc(100vh-200px)] max-h-[42rem] w-[30rem] max-w-[92vw] origin-bottom-left animate-in flex-col rounded-lg border-2 border-brand-bright bg-gray-50 shadow-2xl fade-in zoom-in-95 duration-200 dark:bg-brand-darker">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-3 dark:border-white/10">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-bright/10 text-brand-bright">
            <Compass size={16} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-gray-800 dark:text-white">
              SEO Toolkit
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-white/50">
              {seoResources.length} curated resources
            </p>
          </div>
        </div>
        <button
          onClick={hideSeoToolkit}
          className="shrink-0 rounded p-1 text-gray-400 hover:bg-black/5 hover:text-red-500 dark:hover:bg-white/10"
        >
          <X size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={15}
          />
          <input
            type="text"
            placeholder="Search tools, blogs, plugins…"
            className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-8 pr-8 text-sm text-gray-800 focus:border-brand-bright focus:outline-none dark:border-white/10 dark:bg-brand-dark dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Category filter carousel */}
      <div className="flex items-center gap-1 px-3 py-2">
        <button
          onClick={() => scrollChips(-1)}
          className="shrink-0 rounded-full border border-gray-200 p-1 text-gray-500 hover:border-gray-300 hover:text-gray-800 dark:border-white/10 dark:text-white/60 dark:hover:border-white/20 dark:hover:text-white"
        >
          <ChevronLeft size={14} />
        </button>
        <div
          ref={chipsRef}
          className="flex flex-1 gap-1.5 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <CategoryChip
            active={selectedCategory === null}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </CategoryChip>
          {categories.map((cat) => (
            <CategoryChip
              key={cat}
              active={selectedCategory === cat}
              onClick={() =>
                setSelectedCategory(selectedCategory === cat ? null : cat)
              }
              icon={categoryIcons[cat]}
            >
              {cat}
            </CategoryChip>
          ))}
        </div>
        <button
          onClick={() => scrollChips(1)}
          className="shrink-0 rounded-full border border-gray-200 p-1 text-gray-500 hover:border-gray-300 hover:text-gray-800 dark:border-white/10 dark:text-white/60 dark:hover:border-white/20 dark:hover:text-white"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Pricing filter chips */}
      <div className="flex gap-1.5 px-3 pb-2">
        {pricingOptions.map((option) => {
          const value = option === "All" ? null : option;
          const active = selectedPricing === value;
          return (
            <button
              key={option}
              onClick={() => setSelectedPricing(active ? null : value)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                active
                  ? "border-brand-bright bg-brand-bright/10 text-brand-bright"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-white/10 dark:text-white/60 dark:hover:border-white/20"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between px-3 pb-2 text-[11px] text-gray-500 dark:text-white/50">
        <span>
          {filteredResources.length} result
          {filteredResources.length !== 1 ? "s" : ""}
        </span>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="font-medium text-brand-bright hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Resources list */}
      <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto px-3 pb-3">
        {filteredResources.length > 0 ? (
          filteredResources.map((resource) => (
            <ResourceCard key={resource.title} resource={resource} />
          ))
        ) : (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Search className="h-8 w-8 text-gray-300 dark:text-white/20" />
            <p className="text-sm text-gray-500 dark:text-white/50">
              No resources match your filters.
            </p>
            <button
              onClick={clearFilters}
              className="text-xs font-medium text-brand-bright hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
