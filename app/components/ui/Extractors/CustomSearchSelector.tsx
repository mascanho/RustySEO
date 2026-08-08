"use client";

import { useState } from "react";
import { Search, Plus, Pencil, Trash2, X } from "lucide-react";
import { ActionIcon, Text } from "@mantine/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleSwitch } from "../SettingsModal/fields/SettingFields";
import CustomSearchRuleEditor from "./CustomSearchRuleEditor";
import { useCustomSearchRules, CustomSearchRule } from "./useCustomSearchRules";

interface CustomSearchSelectorProps {
  close: () => void;
}

const modeLabel = (rule: CustomSearchRule) =>
  rule.mode === "css" ? "CSS" : "Regex";

export default function CustomSearchSelector({ close }: CustomSearchSelectorProps) {
  const { rules, loading, createRule, updateRule, deleteRule, setRuleEnabled } =
    useCustomSearchRules();
  const [editing, setEditing] = useState<CustomSearchRule | "new" | null>(null);

  const handleSave = async (rule: Omit<CustomSearchRule, "created_at"> & { id: number }) => {
    if (rule.id) {
      await updateRule(rule as CustomSearchRule);
    } else {
      const { id, ...rest } = rule;
      await createRule(rest);
    }
    setEditing(null);
  };

  const handleDelete = async (rule: CustomSearchRule) => {
    if (!window.confirm(`Delete rule "${rule.name}"?`)) return;
    await deleteRule(rule.id);
  };

  return (
    <div className="flex flex-col w-full bg-white dark:bg-[#0f0f0f] rounded-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-white/5">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-brand-bright/10 dark:bg-brand-bright/20 rounded-xl">
            <Search className="w-6 h-6 text-brand-bright" />
          </div>
          <div>
            <Text fw={800} size="lg" className="text-gray-900 dark:text-white tracking-tight">
              Custom Search
            </Text>
            <Text size="xs" className="text-gray-500 dark:text-gray-400 font-medium">
              {rules.length === 0
                ? "No rules configured yet"
                : `${rules.filter((r) => r.enabled).length} of ${rules.length} rule(s) active`}
            </Text>
          </div>
        </div>
        <ActionIcon
          onClick={close}
          variant="subtle"
          color="gray"
          radius="xl"
          size="lg"
          className="hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </ActionIcon>
      </header>

      {/* Body */}
      <div className="p-6 min-h-[220px] max-h-[480px] overflow-y-auto">
        {editing ? (
          <CustomSearchRuleEditor
            initialRule={editing === "new" ? null : editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" className="gap-1.5" onClick={() => setEditing("new")}>
                <Plus className="w-3.5 h-3.5" />
                Add Rule
              </Button>
            </div>

            {loading ? (
              <div className="py-10 text-center text-xs text-gray-400 dark:text-gray-500">
                Loading rules…
              </div>
            ) : rules.length === 0 ? (
              <div className="py-10 text-center space-y-1">
                <Text size="sm" fw={600} className="text-gray-600 dark:text-gray-300">
                  Nothing to search for yet
                </Text>
                <Text size="xs" className="text-gray-400 dark:text-gray-500">
                  Add a rule to start matching pages by CSS selector or regex during every crawl.
                </Text>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {rules.map((rule) => (
                  <li
                    key={rule.id}
                    className="group flex items-center justify-between gap-3 rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-800 dark:text-white truncate">
                          {rule.name}
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                          {modeLabel(rule)}
                        </Badge>
                      </div>
                      <p className="text-[11px] font-mono text-gray-400 dark:text-gray-500 truncate mt-0.5">
                        {rule.pattern}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <ToggleSwitch
                        checked={rule.enabled}
                        onChange={(v: boolean) => setRuleEnabled(rule.id, v)}
                      />
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={() => setEditing(rule)}
                        className="hover:bg-gray-100 dark:hover:bg-white/10"
                      >
                        <Pencil className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => handleDelete(rule)}
                        className="hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </ActionIcon>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
