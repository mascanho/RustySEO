import React from "react";
import { BsFiletypeJson } from "react-icons/bs";

const PageSchemaTable = ({ pageSchema, googleSchemaTestUrl }: any) => {
  return (
    <section className="naked_table">
      <h2 className="flex items-center -ml-1 !important">
        <BsFiletypeJson className="mr-1.5" />
        Page Schema
      </h2>

      <section className="mx-auto  w-full rounded-md overflow-auto bg-white/40 dark:bg-brand-darker relative h-[30rem]">
        {pageSchema.length === 0 ? (
          <div className="flex items-center justify-center h-[78%]">
            <p className="text-center m-auto text-sm pt-2 dark:text-white/50">
              No Schema Found
            </p>
          </div>
        ) : (
          <pre className="bg-white w-full overflow-scroll">{pageSchema}</pre>
        )}
      </section>
    </section>
  );
};

export default PageSchemaTable;
