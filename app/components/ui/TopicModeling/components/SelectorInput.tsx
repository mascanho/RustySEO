import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface SelectorInputProps {
  selectorType: string;
  selectors: string[];
  setSelectors: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function SelectorInput({
  selectorType,
  selectors = [],
  setSelectors,
}: SelectorInputProps) {
  const [newSelector, setNewSelector] = useState("");

  const handleAddSelector = () => {
    if (newSelector && !selectors.includes(newSelector)) {
      setSelectors([newSelector]);
      setNewSelector("");
    }
  };

  const renderInput = () => (
    <div className="flex space-x-2">
      <Input
        type="text"
        placeholder={`Enter ${selectorType === "class" ? "CSS class" : selectorType === "id" ? "ID" : "HTML tag"}`}
        value={newSelector}
        onChange={(e) => setNewSelector(e.target.value)}
      />
      <Button onClick={handleAddSelector}>Add</Button>
    </div>
  );

  return (
    <div>
      <Label>
        {selectorType === "class"
          ? "CSS Classes"
          : selectorType === "id"
            ? "IDs"
            : "HTML Tags"}
      </Label>
      {renderInput()}
    </div>
  );
}
