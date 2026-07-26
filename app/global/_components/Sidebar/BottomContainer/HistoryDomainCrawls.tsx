// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import React, { useEffect, useMemo, useState } from "react";
import { MdOutlineErrorOutline } from "react-icons/md";
import { RiPagesLine, RiCalendarLine } from "react-icons/ri";
import { FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Define the DeepCrawlHistory type outside the component
type DeepCrawlHistory = {
  id?: number; // Make `id` optional
  domain: string;
  date: string;
  pages: number;
  errors: number;
  status: string;
  total_links: number;
  total_internal_links: number;
  total_external_links: number;
  indexable_pages: number;
  not_indexable_pages: number;
  total_css?: number;
  total_javascript?: number;
  total_images?: number;
  total_redirects?: number;
  missing_title?: number;
  missing_description?: number;
  avg_response_time?: number;
  max_crawl_depth?: number;
  total_secure_pages?: number;
  total_schema_pages?: number;
  total_mobile_pages?: number;
};

type DeleteTarget = { type: "single"; id: number } | { type: "bulk" } | null;

const HistoryDomainCrawls = () => {
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [crawlHistory, setCrawlHistory] = useState<DeepCrawlHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const crawlSessionTotalArray = useGlobalCrawlStore((state) => state.crawlSessionTotalArray);
  const [crawlCompleted, setCrawlCompleted] = useState<boolean>(false);

  // Read streamed progress from the Zustand store (updated centrally by FooterLoader)
    const streamedCrawledPages = useGlobalCrawlStore((state) => state.streamedCrawledPages);
  const streamedTotalPages = useGlobalCrawlStore((state) => state.streamedTotalPages);

  // Derived values from the store — no duplicate listener needed
  const crawledPages = streamedCrawledPages || 0;
  const crawledPagesCount = streamedTotalPages || 1;
  const percentageCrawled = crawledPagesCount > 0
    ? Math.min(100, Math.max(0, (crawledPages / crawledPagesCount) * 100))
    : 0;

  useEffect(() => {
    const completeUnlisten = listen("crawl_complete", () => {
      setCrawlCompleted(true);
      // Small delay to ensure the backend has finished writing the history record
      setTimeout(fetchData, 1000);
    });

    return () => {
      completeUnlisten.then((f) => f());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sessionArr = crawlSessionTotalArray;

  // Fetch data from the database
  const fetchData = async () => {
    try {
      const result = await invoke("read_domain_results_history_table");
      setCrawlHistory(Array.isArray(result) ? result : []);
      setError(null);
    } catch (error) {
      setError("Failed to fetch crawl history. Check the console for details.");
    }
  };

  // Fetch initial data and create table when the component mounts
  useEffect(() => {
    const initialize = async () => {
      try {
        await invoke("create_domain_results_table");
        await fetchData();
      } catch (error) {
        setError(
          "Failed to initialize crawl history. Check the console for details.",
        );
      }
    };

    initialize();
  }, []);

  const handleRowClick = (index: number) => {
    setExpandedRows((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index],
    );
  };

  const sortedHistory = useMemo(
    () =>
      [...crawlHistory].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [crawlHistory],
  );

  const selectableIds = useMemo(
    () => sortedHistory.map((entry) => entry.id).filter((id): id is number => id !== undefined),
    [sortedHistory],
  );

  const allSelected = selectableIds.length > 0 && selectedIds.size === selectableIds.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected || someSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableIds));
    }
  };

  const toggleSelectRow = (id: number | undefined) => {
    if (id === undefined) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === "single") {
        await invoke("delete_domain_result_by_id", { id: deleteTarget.id });
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(deleteTarget.id);
          return next;
        });
        toast.success("Crawl removed from history");
      } else {
        const ids = Array.from(selectedIds);
        await invoke("delete_domain_results_by_ids", { ids });
        setSelectedIds(new Set());
        toast.success(`${ids.length} crawl${ids.length === 1 ? "" : "s"} removed from history`);
      }
      await fetchData();
    } catch (err) {
      toast.error("Failed to delete crawl history");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="text-xs h-full flex flex-col">
      {error && (
        <div className="text-red-500 p-2 bg-red-100 dark:bg-red-900 mb-2 flex-none">
          {error}
        </div>
      )}

      {crawlHistory.length > 0 && (
        <div className="flex-none flex items-center justify-between px-2 py-1.5 border-b dark:border-brand-dark/50 bg-gray-50 dark:bg-gray-900/60">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <Checkbox
              checked={allSelected ? true : someSelected ? "indeterminate" : false}
              onCheckedChange={toggleSelectAll}
              className="h-3.5 w-3.5"
            />
            <span className="text-gray-500 dark:text-gray-400">
              {selectedIds.size > 0
                ? `${selectedIds.size} selected`
                : `${sortedHistory.length} crawl${sortedHistory.length === 1 ? "" : "s"}`}
            </span>
          </label>

          {selectedIds.size > 0 && (
            <button
              onClick={() => setDeleteTarget({ type: "bulk" })}
              className="flex items-center gap-1 text-red-500 hover:text-red-600 dark:hover:text-red-400 px-1.5 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <FiTrash2 size={11} />
              Delete
            </button>
          )}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto text-center dark:bg-gray-900">
        <div>
          {crawlHistory.length === 0 && !error && (
            <div className="h-full flex items-center justify-center py-10">
              <p className="text-gray-500 m-auto">
                No crawl history available. <br />
                Crawl some websites to see your crawl history here.
              </p>
            </div>
          )}
          {sortedHistory.map((entry, index) => (
              <React.Fragment key={entry.id || index}>
                <div
                  className={`group px-2 flex items-center pr-2 py-1 gap-2 border-b dark:border-brand-dark/50 ${index % 2 === 0
                      ? "bg-gray-100 dark:bg-gray-800"
                      : "bg-gray-200 dark:bg-gray-900"
                    } ${selectedIds.has(entry.id) ? "!bg-blue-100 dark:!bg-blue-900/30" : ""}`}
                >
                  <Checkbox
                    checked={entry.id !== undefined && selectedIds.has(entry.id)}
                    onCheckedChange={() => toggleSelectRow(entry.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-3.5 w-3.5 flex-none"
                  />

                  <div
                    onClick={() => handleRowClick(index)}
                    className="cursor-pointer flex flex-1 justify-between min-w-0"
                  >
                    <div className="flex items-center space-x-1 flex-1">
                      <RiCalendarLine className="text-gray-500" />
                      <span>{entry.date.split("T")[0]}</span>
                    </div>
                    <div className="flex items-center space-x-1 justify-end flex-1">
                      <span className="text-right">{entry.pages}</span>
                      <RiPagesLine className="text-gray-500" />
                    </div>
                    <div className="flex items-center  flex-1 justify-end divide-y-2">
                      {entry.not_indexable_pages}
                      <span>
                        <MdOutlineErrorOutline className="ml-1 text-red-500" />
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (entry.id !== undefined) setDeleteTarget({ type: "single", id: entry.id });
                    }}
                    className="flex-none opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                    title="Delete this crawl"
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>
                {expandedRows.includes(index) && (
                  <div className="bg-brand-bright/20 text-black dark:text-white/50 px-2 py-2">
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-left bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded border dark:border-gray-800">
                        <div className="space-y-0.5">
                          <h4 className="font-semibold text-blue-600 dark:text-blue-400 border-b border-gray-200 dark:border-gray-800 pb-0.5 mb-1 text-[11px] uppercase tracking-wider">Crawl Summary</h4>
                          <p><strong>Domain:</strong> <span className="text-gray-800 dark:text-gray-200">{entry.domain}</span></p>
                          <p><strong>Pages Crawled:</strong> <span className="text-gray-800 dark:text-gray-200">{entry.pages}</span></p>
                          <p><strong>Max Crawl Depth:</strong> <span className="text-gray-800 dark:text-gray-200">{entry.max_crawl_depth ?? 0}</span></p>
                          <p><strong>Avg Response Time:</strong> <span className="text-gray-800 dark:text-gray-200">{entry.avg_response_time ?? 0} ms</span></p>
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-semibold text-blue-600 dark:text-blue-400 border-b border-gray-200 dark:border-gray-800 pb-0.5 mb-1 text-[11px] uppercase tracking-wider">Links & Indexability</h4>
                          <p><strong>Total Links:</strong> <span className="text-gray-800 dark:text-gray-200">{entry.total_links}</span></p>
                          <p><strong>Internal / External:</strong> <span className="text-gray-800 dark:text-gray-200">{entry.total_internal_links} / {entry.total_external_links}</span></p>
                          <p><strong>Indexable Pages:</strong> <span className="text-gray-800 dark:text-gray-200">{entry.indexable_pages}</span></p>
                          <p><strong>Not Indexable:</strong> <span className="text-gray-800 dark:text-gray-200 text-red-500 font-medium">{entry.not_indexable_pages}</span></p>
                        </div>
                        <div className="space-y-0.5 mt-1">
                          <h4 className="font-semibold text-blue-600 dark:text-blue-400 border-b border-gray-200 dark:border-gray-800 pb-0.5 mb-1 text-[11px] uppercase tracking-wider">Technical Assets</h4>
                          <p><strong>CSS Files:</strong> <span className="text-gray-800 dark:text-gray-200">{entry.total_css ?? 0}</span></p>
                          <p><strong>JavaScript Files:</strong> <span className="text-gray-800 dark:text-gray-200">{entry.total_javascript ?? 0}</span></p>
                          <p><strong>Images:</strong> <span className="text-gray-800 dark:text-gray-200">{entry.total_images ?? 0}</span></p>
                          <p><strong>Redirects:</strong> <span className="text-gray-800 dark:text-gray-200 font-medium text-orange-500">{entry.total_redirects ?? 0}</span></p>
                        </div>
                        <div className="space-y-0.5 mt-1">
                          <h4 className="font-semibold text-blue-600 dark:text-blue-400 border-b border-gray-200 dark:border-gray-800 pb-0.5 mb-1 text-[11px] uppercase tracking-wider">SEO & Quality</h4>
                          <p><strong>Missing Titles:</strong> <span className={entry.missing_title ? "text-red-500 font-medium" : "text-gray-800 dark:text-gray-200"}>{entry.missing_title ?? 0}</span></p>
                          <p><strong>Missing Descriptions:</strong> <span className={entry.missing_description ? "text-red-500 font-medium" : "text-gray-800 dark:text-gray-200"}>{entry.missing_description ?? 0}</span></p>
                          <p><strong>Schema / Structured Data:</strong> <span className="text-gray-800 dark:text-gray-200">{entry.total_schema_pages ?? 0}</span></p>
                          <p><strong>HTTPS (Secure):</strong> <span className="text-gray-800 dark:text-gray-200">{entry.total_secure_pages ?? 0} / {entry.pages}</span></p>
                          <p><strong>Mobile Friendly:</strong> <span className="text-gray-800 dark:text-gray-200">{entry.total_mobile_pages ?? 0} / {entry.pages}</span></p>
                        </div>
                      </div>
                  </div>
                )}
              </React.Fragment>
            ))}
        </div>
      </div>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="dark:bg-brand-darker dark:border-brand-dark">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">
              {deleteTarget?.type === "bulk" ? `Delete ${selectedIds.size} crawls?` : "Delete this crawl?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              This will permanently remove {deleteTarget?.type === "bulk" ? "these crawl records" : "this crawl record"} from your history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HistoryDomainCrawls;
