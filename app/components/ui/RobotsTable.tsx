import React from "react";
import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";

const RobotsTable = ({ robots }: any) => {
  return (
    <section className="mx-auto p-2 pb-3  w-full overflow-auto bg-white/40 dark:bg-brand-darker relative">
      {robots?.length === 0 ? (
        <div className="flex items-center justify-center">
          <p className="text-center m-auto text-sm pt-2">No Schema Found</p>
        </div>
      ) : (
        <pre className="bg-white w-full overflow-scroll h-full shadow-0 p-2 dark:bg-brand-darker dark:text-white/50">
          {robots?.Ok}
        </pre>
      )}
    </section>
  );
};

export default RobotsTable;
