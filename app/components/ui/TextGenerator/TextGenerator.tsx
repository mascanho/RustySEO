"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw } from "lucide-react";

const MAX_CHARS = 280; // Maximum character limit, e.g., for a tweet

export default function TextGenerator() {
  const [text, setText] = useState("");

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const generateText = () => {
    // This is a placeholder function to simulate text generation
    // In a real application, you would call an API or use a more sophisticated method
    const placeholderText =
      "This is a generated text placeholder. In a real application, this would be created by an AI model or fetched from an API.";
    setText(placeholderText.slice(0, MAX_CHARS));
  };

  const charsRemaining = MAX_CHARS - text.length;

  return (
    <div className="max-w-md mx-auto p-4 bg-background rounded-lg shadow-sm">
      <Textarea
        value={text}
        onChange={handleTextChange}
        placeholder="Enter or generate text here..."
        className="min-h-[100px] mb-2"
        maxLength={MAX_CHARS}
      />
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-muted-foreground">
          {charsRemaining} characters remaining
        </span>
        <Button onClick={generateText} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Generate
        </Button>
      </div>
    </div>
  );
}
