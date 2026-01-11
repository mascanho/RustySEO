// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { BsFiletypeJson, BsThreeDotsVertical } from "react-icons/bs";
import CodeBlock from "../CodeBlock";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import useStore from "@/store/Panes";
import { invoke } from "@tauri-apps/api/core";
import PageSchemaAI from "./PageSchemaAI";

const PageSchemaTable = ({
  pageSchema = "",
  googleSchemaTestUrl,
  sessionUrl,
  body,
}: {
  body: string[];
  pageSchema?: string;
  googleSchemaTestUrl?: string;
}) => {
  const { Visible } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [schema, setSchema] = useState("");
  const [newAISchema, setNewAISchema] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false); // State for custom dropdown
  const previousSchema = useRef<string | null>(null);
  const isMounted = useRef(true);

  // Function to format the schema to create a new line after each comma ","
  const formatSchema = (schema: any) => {
    const schemaStr = typeof schema === "string" ? schema : String(schema);
    return schemaStr.replace(/,/g, ",\n");
  };

  // Ensure pageSchema is properly formatted
  const newSchema = formatSchema(pageSchema);

  const convertToGoogleRichResultsURL = (sessionUrl: string) => {
    const encodedUrl = encodeURIComponent(sessionUrl);
    const baseUrl = "https://search.google.com/test/rich-results?url=";
    return baseUrl + encodedUrl;
  };

  const testURL = convertToGoogleRichResultsURL(googleSchemaTestUrl || "");

  // Invoke Tauri Function to send SCHEMA or BODY (only called when user clicks)
  const fetchAiJSONLD = async () => {
    try {
      const schemaToUse = newSchema.trim().length === 0 ? body[0] : newSchema;
      setSchema(schemaToUse);

      const response = await invoke("get_jsonld_command", {
        jsonld: schemaToUse,
      });

      if (!response || typeof response !== "string") {
        throw new Error("Invalid response from AI service");
      }

      if (isMounted.current) {
        setNewAISchema(response);
      }
      return response;
    } catch (error) {
      console.error("Failed to get AI-generated schema:", error);
      throw error;
    }
  };

  // Handle dialog close cleanly
  const handleOpenChange = (open: boolean) => {
    try {
      if (!open) {
        setTimeout(() => {
          if (isMounted.current) {
            setDialogOpen(false);
          }
        }, 100);
      } else {
        setDialogOpen(true);
      }
    } catch (error) {
      console.error("Error in handleOpenChange:", error);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const openDialog = async () => {
    setDialogOpen(true);
    setDropdownOpen(false); // Close dropdown when dialog opens

    // Trigger AI schema generation
    try {
      const response = await fetchAiJSONLD();
      if (isMounted.current) {
        setNewAISchema(response);
      }
    } catch (error) {
      console.error("Error fetching AI schema:", error);
      // Set a fallback message
      setNewAISchema("AI schema generation failed. Please try again.");
    }
  };

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.querySelector(".custom-dropdown");
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
          {/* Custom Dropdown Trigger */}
          <button onClick={toggleDropdown} className="focus:outline-none">
            <BsThreeDotsVertical className="dark:text-white mr-2 z-10" />
          </button>

          {/* Custom Dropdown Menu */}
          {dropdownOpen && (
            <div className="custom-dropdown absolute right-0 mt-2 w-[9rem] text-xs bg-white dark:bg-brand-darker border border-gray-300 dark:border-brand-dark shadow-sm">
              <div className="p-1">
                <p className="text-xs font-semibold text-gray-700 dark:text-white px-2 py-1">
                  Page Schema
                </p>
                <hr className="my-1 border-gray-300 dark:border-brand-dark" />
                <button
                  onClick={openDialog}
                  className="w-full text-left px-2 py-1 text-xs text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-brand-dark cursor-pointer"
                >
                  {newSchema.trim().length === 0
                    ? "Generate Schema"
                    : "Improve Schema"}
                </button>
                <button
                  onClick={() => openBrowserWindow(testURL)}
                  className="w-full text-left px-2 py-1 text-xs text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-brand-dark cursor-pointer"
                >
                  Schema Validator
                </button>
                <hr className="my-1 border-gray-300 dark:border-brand-dark" />
                <button
                  onClick={() => openBrowserWindow(testURL)}
                  className="w-full text-left px-2 py-1 text-xs text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-brand-dark cursor-pointer"
                >
                  Documentation
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Dialog */}
      {dialogOpen && (
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogContent
            className="z-[99999999999] overflow-hidden h-[740px] my-auto mr-2 w-[1100px] max-w-[1200px] px-0 rounded-md border-1 dark:bg-brand-darker py-10"
            onEscapeKeyDown={() => setDialogOpen(false)}
            onPointerDownOutside={() => setDialogOpen(false)}
          >
            {/* Add custom styles to the close button */}
            {/* <button */}
            {/*   onClick={() => setDialogOpen(false)} */}
            {/*   className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none" */}
            {/* > */}
            {/*   <svg */}
            {/*     xmlns="http://www.w3.org/2000/svg" */}
            {/*     className="h-6 w-6" */}
            {/*     fill="none" */}
            {/*     viewBox="0 0 24 24" */}
            {/*     stroke="currentColor" */}
            {/*   > */}
            {/*     <path */}
            {/*       strokeLinecap="round" */}
            {/*       strokeLinejoin="round" */}
            {/*       strokeWidth={2} */}
            {/*       d="M6 18L18 6M6 6l12 12" */}
            {/*     /> */}
            {/*   </svg> */}
            {/* </button> */}
            <PageSchemaAI AIschema={newAISchema} schema={newSchema} />
          </DialogContent>
        </Dialog>
      )}

      {/* Schema Display */}
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
