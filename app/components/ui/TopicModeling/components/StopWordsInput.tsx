import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface StopWordsInputProps {
  stopWords: string[];
  setStopWords: React.Dispatch<React.SetStateAction<string[]>>;
  setFileInfo: React.Dispatch<
    React.SetStateAction<{ name: string; type: string } | null>
  >;
}

export default function StopWordsInput({
  stopWords,
  setStopWords,
  setFileInfo,
}: StopWordsInputProps) {
  const [newStopWord, setNewStopWord] = useState("");

  const handleAddStopWord = () => {
    if (newStopWord && !stopWords.includes(newStopWord)) {
      setStopWords([...stopWords, newStopWord]);
      setNewStopWord("");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const newStopWords = content
          .split("\n")
          .filter((word) => word.trim() !== "");
        setStopWords([...new Set([...stopWords, ...newStopWords])]);
        setFileInfo({ name: file.name, type: file.type });
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="stop-word-input">Add Stop Words</Label>
      <div className="flex space-x-2 w-full">
        <div className="flex w-full">
          <Input
            id="stop-word-input"
            type="text"
            placeholder="Enter stop word"
            value={newStopWord}
            onChange={(e) => setNewStopWord(e.target.value)}
            className="w-1/2 mr-4"
          />
          <Button onClick={handleAddStopWord}>Add</Button>
        </div>
        <span className="pt-2 text-gray-400">OR</span>
        <div>
          <Input
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            className="w-[400px]"
          />
        </div>
      </div>
    </div>
  );
}
