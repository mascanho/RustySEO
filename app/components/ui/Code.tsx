import React from "react";
import { CodeBlock, dracula } from "react-code-blocks";

const Code = ({ code, language }) => (
  <CodeBlock
    text={code}
    language={language}
    showLineNumbers={true}
    theme={dracula}
  />
);

export default Code;
