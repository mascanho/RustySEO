import React from "react";
import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";

const RobotsTable = ({ robots }: any) => {
  console.log(robots);

  return (
    <div className="shadow rounded-md h-[29rem] bg-white">
      <h2
        // onClick={() => {
        //   openBrowserWindow(googleSchemaTestUrl);
        // }}
        className="bg-apple-spaceGray font-semibold text-white pt-1 rounded-t-md w-full  text-center cursor-pointer"
      >
        Robots
      </h2>

      <section className="mx-auto min-h-10  max-h-[28rem] w-full rounded-md overflow-auto bg-white/40 relative">
        {robots === "" ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-center m-auto text-sm pt-2">Not robots found</p>
          </div>
        ) : (
          <pre className="bg-white w-full overflow-scroll p-2">
            {robots?.Ok}
          </pre>
        )}
      </section>
    </div>
  );
};

export default RobotsTable;
