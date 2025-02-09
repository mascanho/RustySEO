const DownloadButton = ({ data, filename }: any) => {
  return (
    <div className="flex justify-center items-center">
      <button
        onClick={() => console.log("Exporting")}
        className="bg-white border dark:border-white/20 dark:bg-brand-darker dark:text-white/50 text-black/50 rounded-md p-2 px-4 h-8 w-[6rem]"
      >
        Export
      </button>
    </div>
  );
};

export default DownloadButton;
