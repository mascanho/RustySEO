import React from "react";
import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";

const PageSchemaTable = ({ pageSchema, googleSchemaTestUrl }: any) => {
  return (
    <div>
      <h2
        onClick={() => {
          openBrowserWindow(googleSchemaTestUrl);
        }}
        className="bg-apple-spaceGray font-semibold text-white p-1 px-2 rounded-t-md w-full text-center cursor-pointer"
      >
        Page Schema
      </h2>

      <section className="mx-auto min-h-10  max-h-[30rem] w-full rounded-md overflow-auto bg-white/40 relative">
        {pageSchema.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-center m-auto text-sm pt-2">No Schema Found</p>
          </div>
        ) : (
          <pre className="bg-white w-full overflow-scroll">{pageSchema}</pre>
        )}
      </section>
    </div>
  );
};

export default PageSchemaTable;
