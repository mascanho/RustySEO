import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const Code = ({ language, code }) => {
  return (
    <SyntaxHighlighter
      language={language}
      style={vscDarkPlus}
      customStyle={{
        margin: 0,
        padding: "1rem",
        fontSize: "14px",
        lineHeight: "1.5",
        borderRadius: "0.375rem",
      }}
      codeTagProps={{
        style: {
          fontFamily:
            'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
        },
      }}
      wrapLines={true}
      lineProps={(lineNumber) => ({
        style: {
          display: "block",
          paddingLeft: "1rem",
          paddingRight: "1rem",
          backgroundColor:
            lineNumber % 2 === 0 ? "rgba(0,0,0,0.05)" : "transparent",
        },
      })}
      showLineNumbers={true}
      lineNumberStyle={{
        minWidth: "2.5em",
        paddingRight: "1em",
        textAlign: "right",
        userSelect: "none",
        opacity: 0.5,
      }}
    >
      {Array.isArray(code) ? code.join("\n") : code}
    </SyntaxHighlighter>
  );
};

export default Code;
