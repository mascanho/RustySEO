// @ts-nocheck
"use client";

import { useState } from "react";
import { Hash, Code, FileType2, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function ExtractorSelector({ close }) {
  const [activeTab, setActiveTab] = useState("css");
  const [isMinimized, setIsMinimized] = useState(false);
  const [extractorConfig, setExtractorConfig] = useState({
    css: { selector: "", attribute: "text", multiple: false },
    html: {
      tag: "div",
      attributeName: "",
      attributeValue: "",
      multiple: false,
    },
    regex: { pattern: "", flags: "g", group: 0 },
  });

  const handleChange = (tab, field, value) => {
    setExtractorConfig({
      ...extractorConfig,
      [tab]: { ...extractorConfig[tab], [field]: value },
    });
  };

  const validateFields = () => {
    switch (activeTab) {
      case "css":
        return extractorConfig.css.selector.trim() !== "";
      case "html":
        return (
          extractorConfig.html.tag.trim() !== "" &&
          extractorConfig.html.attributeName.trim() !== "" &&
          extractorConfig.html.attributeValue.trim() !== ""
        );
      case "regex":
        return extractorConfig.regex.pattern.trim() !== "";
      default:
        return false;
    }
  };

  const handleApply = () => {
    if (!validateFields()) return;
    const config = { type: activeTab, config: extractorConfig[activeTab] };
    console.log("Extractor configuration:", config);
    close();
    // Desktop apps might trigger a native action here (e.g., save to file)
  };

  return (
    <div className="w-[800px] h-[380px] mt-72  absolute z-50 inset-0 m-auto bg-gray-100 dark:bg-brand-darker  border border-gray-300 rounded-md shadow-lg font-sans flex flex-col">
      {/* Window-like Title Bar */}
      <div className="flex items-center justify-between px-2 py-1 bg-gray-200 border-b border-gray-300">
        <span className="text-sm font-medium">Data Extractor</span>
        <div className="flex gap-1">
          <Button
            onClick={close}
            variant="ghost"
            size="sm"
            className="p-1 h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content (Collapsible) */}
      {!isMinimized && (
        <div className="flex flex-col h-full dark:text-white">
          <div className="p-3 space-y-4 flex-grow overflow-auto">
            {/* Tab-like Toolbar */}
            <div className="flex gap-1 bg-gray-200 p-1 rounded dark:bg-brand-dark">
              {[
                { id: "css", icon: Hash, label: "CSS" },
                { id: "html", icon: FileType2, label: "HTML" },
                { id: "regex", icon: Code, label: "Regex" },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "outline"}
                  size="sm"
                  className="flex-1 flex items-center gap-1 text-xs"
                  style={{
                    background: activeTab === tab.id ? "#2B6CC4" : "#ccc",
                    color: activeTab === tab.id ? "white" : "black",
                  }}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon className="h-3 w-3" />
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* CSS Panel */}
            {activeTab === "css" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Selector</Label>
                  <Input
                    placeholder=".class, #id"
                    value={extractorConfig.css.selector}
                    onChange={(e) =>
                      handleChange("css", "selector", e.target.value)
                    }
                    className="text-sm h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Extract</Label>
                  <Select
                    value={extractorConfig.css.attribute}
                    onValueChange={(value) =>
                      handleChange("css", "attribute", value)
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["text", "html", "href", "src", "value", "data-*"].map(
                        (opt) => (
                          <SelectItem key={opt} value={opt} className="text-sm">
                            {opt}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="css-multi"
                    checked={extractorConfig.css.multiple}
                    onCheckedChange={(checked) =>
                      handleChange("css", "multiple", checked)
                    }
                  />
                  <Label htmlFor="css-multi" className="text-xs">
                    Multiple Elements
                  </Label>
                </div>
              </div>
            )}

            {/* HTML Panel */}
            {activeTab === "html" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Tag</Label>
                  <Select
                    value={extractorConfig.html.tag}
                    onValueChange={(value) =>
                      handleChange("html", "tag", value)
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["div", "span", "p", "a", "img", "h1", "h2", "h3"].map(
                        (tag) => (
                          <SelectItem key={tag} value={tag} className="text-sm">
                            {tag}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Attribute</Label>
                    <Input
                      placeholder="class"
                      value={extractorConfig.html.attributeName}
                      onChange={(e) =>
                        handleChange("html", "attributeName", e.target.value)
                      }
                      className="text-sm h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Value</Label>
                    <Input
                      placeholder="value"
                      value={extractorConfig.html.attributeValue}
                      onChange={(e) =>
                        handleChange("html", "attributeValue", e.target.value)
                      }
                      className="text-sm h-8"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="html-multi"
                    checked={extractorConfig.html.multiple}
                    onCheckedChange={(checked) =>
                      handleChange("html", "multiple", checked)
                    }
                  />
                  <Label htmlFor="html-multi" className="text-xs">
                    Multiple Elements
                  </Label>
                </div>
              </div>
            )}

            {/* Regex Panel */}
            {activeTab === "regex" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Pattern</Label>
                  <Input
                    placeholder="(\w+)"
                    value={extractorConfig.regex.pattern}
                    onChange={(e) =>
                      handleChange("regex", "pattern", e.target.value)
                    }
                    className="text-sm h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Flags</Label>
                  <div className="flex gap-2">
                    {["g", "i", "m"].map((flag) => (
                      <div key={flag} className="flex items-center gap-1">
                        <Checkbox
                          id={`flag-${flag}`}
                          checked={extractorConfig.regex.flags.includes(flag)}
                          onCheckedChange={(checked) => {
                            const flags = checked
                              ? extractorConfig.regex.flags + flag
                              : extractorConfig.regex.flags.replace(flag, "");
                            handleChange("regex", "flags", flags);
                          }}
                        />
                        <Label htmlFor={`flag-${flag}`} className="text-xs">
                          {flag}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Group</Label>
                  <RadioGroup
                    value={extractorConfig.regex.group.toString()}
                    onValueChange={(value) =>
                      handleChange("regex", "group", Number(value))
                    }
                    className="flex gap-2"
                  >
                    {[0, 1, 2].map((group) => (
                      <div key={group} className="flex items-center gap-1">
                        <RadioGroupItem
                          value={group.toString()}
                          id={`group-${group}`}
                        />
                        <Label htmlFor={`group-${group}`} className="text-xs">
                          {group}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Always at the bottom */}
          <div className="p-3 pt-0 border-t dark:border-0 mt-auto">
            <Button
              onClick={handleApply}
              disabled={!validateFields()}
              className="w-full h-8 text-sm bg-brand-bright   dark:text-white hover:bg-brand-bright dark:hover:bg-brand-bright hover:text-white dark:bg-brand-dark dark:hover:text-white"
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
