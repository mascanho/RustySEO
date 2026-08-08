import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

export type SearchMode = "css" | "regex";
export type SearchTarget = "text" | "html" | "attribute";

export interface CustomSearchRule {
  id: number;
  name: string;
  mode: SearchMode;
  pattern: string;
  search_text: string | null;
  target: SearchTarget;
  attribute_name: string | null;
  enabled: boolean;
  created_at: string;
}

export const emptyRule = (): Omit<CustomSearchRule, "id" | "created_at"> => ({
  name: "",
  mode: "css",
  pattern: "",
  search_text: "",
  target: "text",
  attribute_name: "",
  enabled: true,
});

export function useCustomSearchRules() {
  const [rules, setRules] = useState<CustomSearchRule[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRules = useCallback(async () => {
    try {
      setLoading(true);
      const result = await invoke<CustomSearchRule[]>("list_custom_search_rules");
      setRules(result || []);
    } catch (err) {
      console.error("Failed to load custom search rules:", err);
      toast.error("Failed to load custom search rules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const createRule = useCallback(
    async (rule: Omit<CustomSearchRule, "id" | "created_at">) => {
      try {
        const created = await invoke<CustomSearchRule>("create_custom_search_rule", {
          rule: { ...rule, id: 0, created_at: "" },
        });
        setRules((prev) => [...prev, created]);
        toast.success(`Rule "${rule.name}" created`);
        return created;
      } catch (err) {
        console.error("Failed to create custom search rule:", err);
        toast.error("Failed to create the rule");
        throw err;
      }
    },
    [],
  );

  const updateRule = useCallback(async (rule: CustomSearchRule) => {
    try {
      await invoke("update_custom_search_rule", { rule });
      setRules((prev) => prev.map((r) => (r.id === rule.id ? rule : r)));
      toast.success(`Rule "${rule.name}" updated`);
    } catch (err) {
      console.error("Failed to update custom search rule:", err);
      toast.error("Failed to update the rule");
      throw err;
    }
  }, []);

  const deleteRule = useCallback(async (id: number) => {
    const previous = rules;
    setRules((prev) => prev.filter((r) => r.id !== id));
    try {
      await invoke("delete_custom_search_rule", { id });
      toast.success("Rule deleted");
    } catch (err) {
      console.error("Failed to delete custom search rule:", err);
      toast.error("Failed to delete the rule");
      setRules(previous);
    }
  }, [rules]);

  const setRuleEnabled = useCallback(
    async (id: number, enabled: boolean) => {
      const previous = rules;
      setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled } : r)));
      try {
        await invoke("set_custom_search_rule_enabled", { id, enabled });
      } catch (err) {
        console.error("Failed to toggle custom search rule:", err);
        toast.error("Failed to toggle the rule");
        setRules(previous);
      }
    },
    [rules],
  );

  return {
    rules,
    loading,
    reloadRules: loadRules,
    createRule,
    updateRule,
    deleteRule,
    setRuleEnabled,
  };
}
