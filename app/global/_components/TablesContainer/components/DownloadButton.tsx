const DownloadButton = ({ download }: any) => {
  return (
    <div className="flex justify-center items-center w-fit h-full">
      <button
        onClick={() => download()}
        className="bg-white border dark:active:bg-brand-bright dark:active:text-white  flex items-center justify-center dark:border-white/20 h-6 dark:bg-brand-darker dark:text-white/50 text-black/50 rounded-md p-2 px-4  w-[5rem]"
      >
        Export
      </button>
    </div>
  );
};

export default DownloadButton;
