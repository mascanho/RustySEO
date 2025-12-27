import create from "zustand";

type LoaderState = {
  [key: string]: boolean;
};

interface LoaderStore {
  loaders: LoaderState;
  showLoader: (loaderName: string) => void;
  hideLoader: (loaderName: string) => void;
  toggleLoader: (loaderName: string) => void;
}

const useLoaderStore = create<LoaderStore>((set) => ({
  loaders: {
    links: false,
    seoLoader: false,
    httpChecker: false, // This tracks if HTTP checker is active
  },

  showLoader: (loaderName: string) =>
    set((state) => ({
      loaders: { ...state.loaders, [loaderName]: true },
    })),

  hideLoader: (loaderName: string) =>
    set((state) => ({
      loaders: { ...state.loaders, [loaderName]: false },
    })),

  toggleLoader: (loaderName: string) =>
    set((state) => ({
      loaders: {
        ...state.loaders,
        [loaderName]: !state.loaders[loaderName],
      },
    })),
}));

export default useLoaderStore;
