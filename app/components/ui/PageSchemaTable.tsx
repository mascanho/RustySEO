// @ts-nocheck
import React, { useEffect, useState } from "react";
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import useStore from "@/store/Panes";
import { invoke } from "@tauri-apps/api/core";
import { newDate } from "react-datepicker/dist/date_utils";
import PageSchemaAI from "./PageSchemaAI";

const PageSchemaTable = ({
  pageSchema = "",
  googleSchemaTestUrl,
  sessionUrl,
  body,
}: {
  body: string;
  pageSchema?: string;
  googleSchemaTestUrl?: string;
}) => {
  const { Visible } = useStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [schema, setSchema] = useState("");
  const [newAISchema, setNewAISchema] = useState("");

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

  // Invoke Tauri Function to send SCHEMA or BODY

  const fetchAiJSONLD = async () => {
    try {
      // Set schema based on availability
      const schemaToUse = newSchema.trim().length === 0 ? body[0] : newSchema;
      setSchema(schemaToUse);

      // Fetch AI-generated JSON-LD
      const response = await invoke("get_jsonld_command", {
        jsonld: schemaToUse,
      });

      if (!response) {
        throw new Error("No response received from AI service");
      }

      setNewAISchema(response);
      return response;
    } catch (error) {
      console.error("Failed to get AI-generated schema:", error);
      throw error; // Re-throw to allow handling by caller if needed
    }
  };

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
                onClick={() => setSheetOpen(true)}
                className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight cursor-pointer"
              >
                Improve Schema
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openBrowserWindow(testURL)}
                className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight cursor-pointer"
              >
                Documentation
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => fetchAiJSONLD()}
                className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight cursor-pointer"
              >
                Fetch AI JSON-LD
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetContent className="z-[99999999999] overflow-hidden h-[720px] my-auto mr-2 w-[1100px] max-w-[1200px] px-0 rounded-md border-1 dark:bg-brand-darker">
              {/* Schema improvement content would go here */}
              <PageSchemaAI AIschema={newAISchema} schema={newSchema} />
            </SheetContent>
          </Sheet>
        </div>
      </section>
      <section className="mx-auto w-full schema custom-scrollbar rounded-md overflow-auto bg-white/40 dark:bg-brand-darker relative h-[29.2rem]">
        {newSchema.trim().length === 0 ? (
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
