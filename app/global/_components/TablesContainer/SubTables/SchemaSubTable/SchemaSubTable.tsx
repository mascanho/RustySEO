// @ts-nocheck
import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

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
      className={`w-full overflow-y-scroll ${height ? "" : "h-screen"}`}
      style={{
        height: height ? `${height - 35}px` : "100%",
        backgroundColor: "#0b0f19" // Ensure container is dark
      }}
    >
      {schemaData ? (
        <SyntaxHighlighter
          language="json"
          style={atomDark}
          showLineNumbers={true}
          wrapLines={true}
          customStyle={{
            margin: 0,
            padding: "1rem",
            fontSize: "13px",
            lineHeight: "1.6",
            background: "#0b0f19",
            borderRadius: "0",
            minHeight: "100%",
            overflow: "visible", // Allow growth, disable internal scrollbar
            wordBreak: "break-all",
            whiteSpace: "pre-wrap", // Ensure text wraps and grows height
          }}
          codeTagProps={{
            style: { fontFamily: "'Fira Code', 'Consolas', monospace" }
          }}
        >
          {formattedSchema}
        </SyntaxHighlighter>
      ) : (
        <div
          className="w-full"
          style={{ height: "100%", display: "flex" }}
        >
          <p className="m-auto dark:text-white/50 text-black/50 text-xs">
            No schema data available.
          </p>
        </div>
      )}
    </div>
  );
};

export default SchemaSubTable;
