const DownloadButton = ({ data, filename }: any) => {
  return (
    <div className="flex justify-center items-center w-fit h-full">
      <button
        onClick={() => console.log("Exporting")}
        className="bg-white border  flex items-center justify-center dark:border-white/20 h-6 dark:bg-brand-darker dark:text-white/50 text-black/50 rounded-md p-2 px-4  w-[5rem]"
      >
        Export
      </button>
    </div>
  );
};

export default DownloadButton;
