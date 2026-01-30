// @ts-nocheck
import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// Clone and override the theme background
const customTheme = {
  ...atomDark,
  'code[class*="language-"]': {
    ...atomDark['code[class*="language-"]'],
    background: "transparent",
    backgroundColor: "transparent",
    textShadow: "none",
  },
  'pre[class*="language-"]': {
    ...atomDark['pre[class*="language-"]'],
    background: "transparent",
    backgroundColor: "transparent",
    textShadow: "none",
  },
};

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
        <div style={{ minHeight: "100%", height: "fit-content", backgroundColor: "#0b0f19", width: "100%" }}>
          <SyntaxHighlighter
            language="json"
            className="schema-highlighter"
            style={customTheme}
            showLineNumbers={true}
            wrapLines={true}
            customStyle={{
              margin: 0,
              padding: "1rem",
              fontSize: "13px",
              lineHeight: "1.6",
              backgroundColor: "transparent",
              borderRadius: "0",
              overflow: "visible",
              wordBreak: "break-all",
              whiteSpace: "pre-wrap",
            }}
            codeTagProps={{
              style: { fontFamily: "'Fira Code', 'Consolas', monospace", backgroundColor: "transparent" }
            }}
            lineNumberStyle={{ minWidth: "2.5em", paddingRight: "1em", textAlign: "right", color: "#5c6370" }}
          >
            {formattedSchema}
          </SyntaxHighlighter>
        </div>
      ) : (
        <div
          className="w-full"
          style={{ height: "100%", display: "flex", backgroundColor: "#0b0f19" }}
        >
          <p className="m-auto dark:text-white/50 text-white/50 text-xs">
            No schema data available.
          </p>
        </div>
      )}
    </div>
  );
};

export default SchemaSubTable;
