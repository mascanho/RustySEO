import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface URLInputProps {
  urls: string[];
  setUrls: React.Dispatch<React.SetStateAction<string[]>>;
  setFileInfo: React.Dispatch<
    React.SetStateAction<{ name: string; type: string } | null>
  >;
  pages: string[];
  setPages: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function URLInput({
  urls,
  setUrls,
  setFileInfo,
  pages,
  setPages,
}: URLInputProps) {
  const [newUrl, setNewUrl] = useState("");
  const [newPage, setNewPages] = useState("");

  const handleAddUrl = () => {
    if (newUrl && !urls.includes(newUrl)) {
      setUrls([...urls, newUrl]);
      setNewUrl("");
    }
  };

  const handleAddPage = () => {
    if (newPage && !pages.includes(newUrl)) {
      setPages([...pages, newPage]);
      setNewPages("");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const newUrls = content.split("\n").filter((url) => url.trim() !== "");
        setUrls([...new Set([...urls, ...newUrls])]);
        setPages([...new Set([...pages, ...newUrls])]);
        setFileInfo({ name: file.name, type: file.type });
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="url-input">Add URLs</Label>
      <div className="flex space-x-2">
        <Input
          id="url-input"
          type="url"
          placeholder="Enter URL"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
        />
        <Button onClick={handleAddUrl}>Add</Button>
        <Input
          id="page-input"
          type="page"
          placeholder="Enter pages"
          value={newPage}
          onChange={(e) => setNewPages(e.target.value)}
        />
        <Button onClick={handleAddPage}>Add</Button>
      </div>
      <div>
        <Input type="file" accept=".txt" onChange={handleFileUpload} />
      </div>
    </div>
  );
}
