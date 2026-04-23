const DownloadButton = ({ download, loading, setLoading }: any) => {
  return (
    <div className="flex justify-center items-center w-fit h-full">
      <button
        onClick={() => download()}
        disabled={loading}
        className="bg-white border dark:active:bg-brand-bright dark:active:text-white flex items-center justify-center dark:border-white/20 h-6 dark:bg-brand-darker dark:text-white/50 text-black rounded-md p-2 px-4 w-[5rem] ease-in-out duration-100 transition-all dark:hover:border-brand-bright active:bg-brand-bright active:text-white hover:border-brand-bright disabled:opacity-50"
      >
        {loading ? "Exporting..." : "Export"}
      </button>
    </div>
  );
};

export default DownloadButton;
