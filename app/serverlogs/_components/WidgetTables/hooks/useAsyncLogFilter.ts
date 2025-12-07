
import { useState, useEffect, useRef } from "react";

interface SortConfig {
    key: string;
    direction: "asc" | "desc";
}

interface UseAsyncLogFilterResult<T> {
    filteredData: T[];
    isProcessing: boolean;
    progress: number;
}

/**
 * Hook to filter and sort large arrays asynchronously to prevent blocking the main thread.
 * 
 * @param data The large array to process
 * @param filterFn A callback to filter items. MUST BE MEMOIZED (useCallback).
 * @param sortConfig Sorting configuration (key and direction).
 * @param sortFn Optional custom sort function. MUST BE MEMOIZED.
 * @param chunkSize Number of items to process per tick. Default 2000.
 */
export function useAsyncLogFilter<T>(
    data: T[],
    filterFn: (item: T) => boolean,
    sortConfig: SortConfig | null,
    sortFn?: (a: T, b: T) => number,
    chunkSize: number = 2000
): UseAsyncLogFilterResult<T> {
    const [filteredData, setFilteredData] = useState<T[]>([]);
    const [isProcessing, setIsProcessing] = useState(true);
    const [progress, setProgress] = useState(0);

    // Ref to track the current processing job
    const processingRef = useRef<{
        idx: number;
        results: T[];
        active: boolean;
    }>({ idx: 0, results: [], active: false });

    useEffect(() => {
        // Cancel previous job
        processingRef.current.active = false;

        // Reset state
        setIsProcessing(true);
        setProgress(0);

        // Start new job
        const job = { idx: 0, results: [] as T[], active: true };
        processingRef.current = job;

        const processChunk = () => {
            if (!job.active) return;

            const { idx, results } = job;
            const total = data.length;

            // If no data, finish immediately
            if (total === 0) {
                setFilteredData([]);
                setIsProcessing(false);
                return;
            }

            const endIndex = Math.min(idx + chunkSize, total);

            // Filter the current chunk
            for (let i = idx; i < endIndex; i++) {
                if (filterFn(data[i])) {
                    results.push(data[i]);
                }
            }

            // Update progress
            job.idx = endIndex;
            // Only update state occasionally to avoid too many re-renders during processing
            // or just update it if needed for a progress bar. 
            // Ideally we don't spam state updates too much.
            // setProgress((endIndex / total) * 100); 

            if (endIndex < total) {
                // Yield to main thread
                setTimeout(processChunk, 0);
            } else {
                // Finished filtering, now sort
                // Sorting is usually faster on the reduced dataset, but if it's still large
                // we might block briefly. For now we assume filtered set is manageably smaller.
                try {
                    if (sortFn) {
                        results.sort(sortFn);
                    } else if (sortConfig) {
                        results.sort((a: any, b: any) => {
                            const aVal = a[sortConfig.key];
                            const bVal = b[sortConfig.key];

                            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                            return 0;
                        });
                    }
                } catch (e) {
                    console.error("Sorting error", e);
                }

                if (job.active) {
                    setFilteredData(results);
                    setIsProcessing(false);
                    processingRef.current.active = false;
                }
            }
        };

        // Kick off processing
        // Use timeout to ensure we don't block the very first render cycle 
        // and allow the UI (loader) to paint first.
        setTimeout(processChunk, 0);

        return () => {
            job.active = false;
        };
    }, [data, filterFn, sortConfig, sortFn, chunkSize]);

    return { filteredData, isProcessing, progress };
}
