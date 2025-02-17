// @ts-nocheck
import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { darcula } from "react-syntax-highlighter/dist/esm/styles/prism";

const SchemaSubTable = ({ height }) => {
  const { selectedTableURL } = useGlobalCrawlStore();

  // Extract the schema data from the selected URL
  const schemaData = selectedTableURL[0]?.schema;

  // Parse the schema data if it's a string, and format it
  let formattedSchema = "";
  try {
    // Parse the schema data if it's a string
    const schemaObject =
      typeof schemaData === "string" ? JSON.parse(schemaData) : schemaData;
    // Format the JSON object with 2-space indentation
    formattedSchema = schemaObject ? JSON.stringify(schemaObject, null, 2) : "";
  } catch (error) {
    console.error("Invalid JSON-LD data:", error);
    formattedSchema = "Invalid JSON-LD data";
  }

  return (
    <div
      className={`-mt-4 ${height ? `h-[${height}px]` : "h-screen"} overflow-y-auto crawlSchema`}
    >
      {schemaData ? (
        <SyntaxHighlighter
          language="json" // Specify the language as JSON
          style={darcula} // Use the dark theme (or choose another theme)
          showLineNumbers // Optional: Show line numbers
          wrapLines // Optional: Wrap long lines
          customStyle={{
            fontSize: "14px", // Adjust font size for clarity
            lineHeight: "1.5", // Adjust line height for better readability
            backgroundColor: "transparent", // Ensure background is transparent
          }}
        >
          {formattedSchema}
        </SyntaxHighlighter>
      ) : (
        <div
          className="w-full"
          style={{ height: `${height + 2}px`, display: "flex" }}
        >
          <p className="m-auto dark:text-white/50 text-black/50">
            No schema data available.
          </p>
        </div>
      )}
    </div>
  );
};

export default SchemaSubTable;
