import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";

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
    <div className="-mt-4 h-screen overflow-y-auto crawlSchema">
      {schemaData ? (
        <SyntaxHighlighter
          language="json" // Specify the language as JSON
          style={dark} // Use the dark theme (or choose another theme)
          showLineNumbers // Optional: Show line numbers
          wrapLines // Optional: Wrap long lines
        >
          {formattedSchema}
        </SyntaxHighlighter>
      ) : (
        <p>No schema data available.</p>
      )}
    </div>
  );
};

export default SchemaSubTable;
