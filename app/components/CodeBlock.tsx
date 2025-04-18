// @ts-nocheck
import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { solarizedlight } from "react-syntax-highlighter/dist/esm/styles/prism";

const CodeBlock = ({ code }) => {
  // Ensure pageSchema is a string

  // Format the code if necessary

  return (
    <SyntaxHighlighter language="javascript" style={solarizedlight}>
      {code}
    </SyntaxHighlighter>
  );
};

export default CodeBlock;
