// @ts-nocheck
import React from "react";
import { BsFiletypeJson } from "react-icons/bs";
import CodeBlock from "../CodeBlock";

const PageSchemaTable = ({
  pageSchema = "",
  googleSchemaTestUrl,
}: {
  pageSchema?: string;
  googleSchemaTestUrl?: string;
}) => {
  // Function to format the schema to create a new line after each comma ","
  function formatSchema(schema: any) {
    // Convert schema to string if it's not already
    const schemaStr = typeof schema === "string" ? schema : String(schema);

    // Format the schema to insert new lines after commas
    return schemaStr.replace(/,/g, ",\n");
  }

  // Ensure pageSchema is properly formatted
  const newSchema = formatSchema(pageSchema);

  return (
    <section className="naked_table">
      <h2 className="flex items-center -ml-1 !important">
        <BsFiletypeJson className="mr-1.5" />
        Page Schema
      </h2>

      <section className="mx-auto w-full rounded-md overflow-auto bg-white/40 dark:bg-brand-darker relative h-[29.2rem]">
        {newSchema.trim().length === 0 ? ( // Use newSchema for checking empty state
          <div className="flex items-center justify-center h-[78%]">
            <p className="text-center m-auto text-sm pt-2 dark:text-white/50">
              No Schema Found
            </p>
          </div>
        ) : (
          <CodeBlock code={newSchema} />
        )}
      </section>
    </section>
  );
};

export default PageSchemaTable;
