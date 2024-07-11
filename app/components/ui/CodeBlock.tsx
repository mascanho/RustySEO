import React, { useState, useEffect } from "react";
import Prism from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism.css";

const CodeHighlighter = ({ code, language }) => {
  const [highlightedCode, setHighlightedCode] = useState("");

  useEffect(() => {
    const highlight = async () => {
      if (language && !Prism.languages[language]) {
        try {
          await import(`prismjs/components/prism-${language}`);
        } catch (e) {
          console.warn(
            `Prism language '${language}' not found, falling back to plain text`,
          );
        }
      }

      const highlighted = Prism.highlight(
        code,
        Prism.languages[language] || Prism.languages.plain,
        language,
      );
      setHighlightedCode(highlighted);
    };

    highlight();
  }, [code, language]);

  return (
    <pre>
      <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
    </pre>
  );
};

export default CodeHighlighter;
