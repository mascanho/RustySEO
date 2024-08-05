import React from "react";
import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";

const PageSchemaTable = ({ pageSchema, googleSchemaTestUrl }: any) => {
  return (
    <section className="naked_table">
      <h2>Page Schema</h2>

      <section className="mx-auto  w-full rounded-md overflow-auto bg-white/40 dark:bg-brand-darker relative h-[30rem]">
        {pageSchema.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-center m-auto text-sm pt-2">No Schema Found</p>
          </div>
        ) : (
          <pre className="bg-white w-full overflow-scroll">{pageSchema}</pre>
        )}
      </section>
    </section>
  );
};

export default PageSchemaTable;
