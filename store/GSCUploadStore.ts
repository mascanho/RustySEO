import { create } from "zustand";

interface FileInfo {
    name: string;
    size: number;
    type: string;
    lastModified?: number;
}

interface UploadState {
    uploadedFile: FileInfo | null;
    // We cannot store the File object or Workbook in persistent state easily if local storage is used,
    // but for in-memory store it's fine. If the page reloads, these will be lost unless we reconstruct them.
    // For tab switching, in-memory is sufficient.
    // Storing the workbook might be heavy, so we might want to store just the sheets and cached data if possible,
    // or just accept it's in memory.
    workbook: any | null;
    sheets: string[];
    selectedSheet: string | null;
    filePreview: {
        fileName: string;
        data: any[];
        processedAt: string | null;
    } | null;

    // Actions
    setUploadedFile: (file: FileInfo | null) => void;
    setWorkbook: (wb: any | null) => void;
    setSheets: (sheets: string[]) => void;
    setSelectedSheet: (sheet: string | null) => void;
    setFilePreview: (preview: any | null) => void;
    reset: () => void;
}

const useGSCUploadStore = create<UploadState>((set) => ({
    uploadedFile: null,
    workbook: null,
    sheets: [],
    selectedSheet: null,
    filePreview: null,

    setUploadedFile: (uploadedFile) => set({ uploadedFile }),
    setWorkbook: (workbook) => set({ workbook }),
    setSheets: (sheets) => set({ sheets }),
    setSelectedSheet: (selectedSheet) => set({ selectedSheet }),
    setFilePreview: (filePreview) => set({ filePreview }),
    reset: () => set({
        uploadedFile: null,
        workbook: null,
        sheets: [],
        selectedSheet: null,
        filePreview: null,
    }),
}));

export default useGSCUploadStore;
