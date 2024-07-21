import React from "react";
import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";

const RobotsTable = ({ robots }: any) => {
  console.log(robots);

  return (
    <section className="naked_table">
      <h2>Robots</h2>

      <section className="mx-auto p-2  w-full rounded-md overflow-auto bg-white/40 relative h-[38rem]">
        {robots?.length === 0 ? (
          <div className="flex items-center justify-center">
            <p className="text-center m-auto text-sm pt-2">No Schema Found</p>
          </div>
        ) : (
          <pre className="bg-white w-full overflow-scroll h-full">
            {robots?.Ok}
          </pre>
        )}
      </section>
    </section>
  );
};

export default RobotsTable;
