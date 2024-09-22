// @ts-nocheck
import React from "react";
import { BsFiletypeJson, BsThreeDotsVertical } from "react-icons/bs";
import CodeBlock from "../CodeBlock";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import useStore from "@/store/Panes";

const PageSchemaTable = ({
  pageSchema = "",
  googleSchemaTestUrl,
  sessionUrl,
}: {
  pageSchema?: string;
  googleSchemaTestUrl?: string;
}) => {
  const { Visible } = useStore();

  // Function to format the schema to create a new line after each comma ","
  function formatSchema(schema: any) {
    // Convert schema to string if it's not already
    const schemaStr = typeof schema === "string" ? schema : String(schema);

    // Format the schema to insert new lines after commas
    return schemaStr.replace(/,/g, ",\n");
  }

  // Ensure pageSchema is properly formatted
  const newSchema = formatSchema(pageSchema);

  function convertToGoogleRichResultsURL(sessionUrl) {
    // Encode the URL component
    const encodedUrl = encodeURIComponent(sessionUrl);

    // Base URL for Google Rich Results Test
    const baseUrl = "https://search.google.com/test/rich-results?url=";

    // Construct and return the final URL
    return baseUrl + encodedUrl;
  }

  const testURL = convertToGoogleRichResultsURL(googleSchemaTestUrl);

  return (
    <section
      className={`schema naked_table ${Visible.schema ? "block" : "hidden"}`}
    >
      <section className="flex justify-between items-center">
        <h2 className="flex items-center -ml-1 !important">
          <BsFiletypeJson className="mr-1.5" />
          Page Schema
        </h2>

        <div className="relative z-10">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <BsThreeDotsVertical className="dark:text-white mr-2 z-10" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-brand-darker border bg-white dark:bg-brand-darker  dark:border-brand-dark dark:text-white mr-36">
              <DropdownMenuLabel>Schema Validator</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => openBrowserWindow(testURL)}
                className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight cursor-pointer"
              >
                Schema Validator
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-100 dark:bg-brand-dark" />

              <DropdownMenuItem
                onClick={() => openBrowserWindow(testURL)}
                className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight cursor-pointer"
              >
                Documentation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </section>
      <section className="mx-auto w-full schema custom-scrollbar rounded-md overflow-auto bg-white/40 dark:bg-brand-darker relative h-[29.2rem]">
        {newSchema.trim().length === 0 ? ( // Use newSchema for checking empty state
          <div className="flex items-center justify-center h-[78%]">
            <p className="text-center m-auto text-sm text-black/50 pt-2 dark:text-white/50">
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
