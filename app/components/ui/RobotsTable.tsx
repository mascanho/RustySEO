import React from "react";
import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import CodeBlock from "../CodeBlock";

const RobotsTable = ({ robots }: any) => {
  return (
    <section className="robots mx-auto pb-3  w-full overflow-auto bg-white/40 dark:bg-brand-darker relative">
      {robots?.length === 0 ? (
        <div className="h-[20rem] flex items-center overflow-hidden ">
          <span className="text-black/50 darK:text-white/50 m-auto text-center translate-y-1/2 h-full">
            No page crawled
          </span>
        </div>
      ) : (
        <pre className="robots  bg-white  w-full overflow-scroll h-[27.5rem] shadow-0 p-2 dark:bg-brand-darker dark:text-white/50">
          {robots?.Ok}
        </pre>
      )}
    </section>
  );
};

export default RobotsTable;
