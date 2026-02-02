import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";

const DownloadButton = ({ download, loading, setLoading }: any) => {
    const { isGeneratingExcel } = useGlobalCrawlStore();

    return (
        <div className="flex justify-center items-center w-fit h-full">
            <button
                onClick={() => download()}
                className="bg-white border dark:active:bg-brand-bright dark:active:text-white  flex items-center justify-center dark:border-white/20 h-6 dark:bg-brand-darker dark:text-white/50 text-black rounded-md p-2 px-4  w-[5rem] dark:hover:border dark:hover:border-brand-bright dark:hover:text-white hover:border hover:border-brand-bright hover:text-black active:bg-brand-bright active:text-white"
            >
                {isGeneratingExcel ? "Loading..." : "Export"}
            </button>
        </div>
    );
};

export default DownloadButton;
