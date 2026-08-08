"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingField, ToggleSwitch } from "../SettingsModal/fields/SettingFields";
import { htmlElements } from "./HtmlElements";
import { CustomSearchRule, emptyRule } from "./useCustomSearchRules";

interface CustomSearchRuleEditorProps {
  initialRule: CustomSearchRule | null;
  onSave: (rule: Omit<CustomSearchRule, "created_at"> & { id: number }) => Promise<void>;
  onCancel: () => void;
}

export default function CustomSearchRuleEditor({
  initialRule,
  onSave,
  onCancel,
}: CustomSearchRuleEditorProps) {
  const [rule, setRule] = useState(() =>
    initialRule
      ? { ...initialRule }
      : { ...emptyRule(), id: 0, created_at: "" },
  );
  const [saving, setSaving] = useState(false);

  const update = (patch: Partial<typeof rule>) => setRule((prev) => ({ ...prev, ...patch }));

  const isValid =
    rule.name.trim().length > 0 &&
    rule.pattern.trim().length > 0 &&
    (rule.mode !== "css" || rule.target !== "attribute" || !!rule.attribute_name?.trim());

  const handleSave = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      await onSave(rule);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-1">
      <SettingField label="Rule Name" description="A label to identify this rule in results">
        <Input
          value={rule.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="e.g. Has cookie banner"
          className="w-[220px] h-8 text-xs dark:bg-brand-darker dark:border-brand-dark dark:text-white"
        />
      </SettingField>

      <SettingField label="Mode" description="How the pattern is matched against the page">
        <Select
          value={rule.mode}
          onValueChange={(value: "css" | "regex") =>
            update({
              mode: value,
              // Regex mode always targets visible text — reset target/attribute
              // when switching so a stale "attribute" target can't linger.
              target: value === "regex" ? "text" : rule.target,
              attribute_name: value === "regex" ? "" : rule.attribute_name,
            })
          }
        >
          <SelectTrigger className="w-[140px] h-8 text-xs dark:bg-brand-darker dark:border-brand-dark dark:text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="dark:bg-brand-darker dark:border-brand-dark dark:text-white">
            <SelectItem value="css" className="text-xs">CSS Selector</SelectItem>
            <SelectItem value="regex" className="text-xs">Regex</SelectItem>
          </SelectContent>
        </Select>
      </SettingField>

      <SettingField
        label={rule.mode === "css" ? "CSS Selector" : "Regex Pattern"}
        description={
          rule.mode === "css"
            ? "e.g. h1, .cookie-banner, a[rel=canonical]"
            : "e.g. \\bcopyright\\b — matched against the page's visible text"
        }
      >
        <Input
          list={rule.mode === "css" ? "html-tag-suggestions" : undefined}
          value={rule.pattern}
          onChange={(e) => update({ pattern: e.target.value })}
          placeholder={rule.mode === "css" ? "h1" : "\\bcopyright\\b"}
          className="w-[220px] h-8 text-xs font-mono dark:bg-brand-darker dark:border-brand-dark dark:text-white"
        />
        {rule.mode === "css" && (
          <datalist id="html-tag-suggestions">
            {htmlElements.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
        )}
      </SettingField>

      {rule.mode === "css" && (
        <>
          <SettingField
            label="Contains Text"
            description="Optional — leave blank to match on presence alone"
          >
            <Input
              value={rule.search_text ?? ""}
              onChange={(e) => update({ search_text: e.target.value })}
              placeholder="optional"
              className="w-[220px] h-8 text-xs dark:bg-brand-darker dark:border-brand-dark dark:text-white"
            />
          </SettingField>

          <SettingField label="Capture" description="What to record from the matched element">
            <Select
              value={rule.target}
              onValueChange={(value: "text" | "html" | "attribute") => update({ target: value })}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs dark:bg-brand-darker dark:border-brand-dark dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-brand-darker dark:border-brand-dark dark:text-white">
                <SelectItem value="text" className="text-xs">Text</SelectItem>
                <SelectItem value="html" className="text-xs">HTML</SelectItem>
                <SelectItem value="attribute" className="text-xs">Attribute</SelectItem>
              </SelectContent>
            </Select>
          </SettingField>

          {rule.target === "attribute" && (
            <SettingField label="Attribute Name" description="e.g. href, src, content">
              <Input
                value={rule.attribute_name ?? ""}
                onChange={(e) => update({ attribute_name: e.target.value })}
                placeholder="href"
                className="w-[220px] h-8 text-xs font-mono dark:bg-brand-darker dark:border-brand-dark dark:text-white"
              />
            </SettingField>
          )}
        </>
      )}

      <SettingField label="Enabled" description="Applies to every crawl while on">
        <ToggleSwitch checked={rule.enabled} onChange={(v: boolean) => update({ enabled: v })} />
      </SettingField>

      <div className="flex justify-end gap-2 pt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={saving}
          className="dark:text-white"
        >
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!isValid || saving}>
          {saving ? "Saving…" : initialRule ? "Save Changes" : "Add Rule"}
        </Button>
      </div>
    </div>
  );
}
