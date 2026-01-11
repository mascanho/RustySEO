// @ts-nocheck
import { invoke } from "@tauri-apps/api/core";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Select, TextInput, Button, Group, Text, Anchor, Stack, Paper, ActionIcon, Tooltip } from "@mantine/core";
import {
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  Key,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const GeminiSelector = ({ closeGemini }: { closeGemini: () => void }) => {
  const [model, setModel] = useState("gemini-1.5-flash-latest");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const geminiModels = [
    { value: "gemini-1.5-flash-latest", label: "Gemini 1.5 Flash (Fast & Efficient)" },
    { value: "gemini-1.5-pro-latest", label: "Gemini 1.5 Pro (Advance Reasoning)" },
    { value: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash (Next Gen - Experimental)" },
    { value: "gemini-1.5-pro-002", label: "Gemini 1.5 Pro 002 (Latest Stable)" },
    { value: "gemini-1.5-flash-002", label: "Gemini 1.5 Flash 002 (Latest Stable)" },
    { value: "gemini-1.5-flash-8b", label: "Gemini 1.5 Flash-8B (Lightweight)" },
  ];

  // Load existing config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await invoke("get_gemini_config_command");
        if (config) {
          if (config.gemini_model) setModel(config.gemini_model);
          if (config.key) setApiKey(config.key);
        }
      } catch (error) {
        console.log("No existing Gemini configuration found.");
      } finally {
        setIsInitialLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSaveSettings = async () => {
    if (!apiKey) {
      toast.error("Please enter an API key");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Set global AI provider to Gemini
      await invoke("ai_model_selected", { model: "gemini" });

      // 2. Save Gemini specific configuration
      await invoke("set_gemini_api_key", {
        key: apiKey,
        apiType: "gemini",
        geminiModel: model,
      });

      toast.success("Gemini Settings Saved", {
        description: "Google Gemini is now your active AI provider.",
        icon: <Sparkles className="w-4 h-4 text-yellow-500" />
      });

      localStorage.setItem("AI-provider", "gemini");
      closeGemini();
    } catch (error) {
      console.error("Error saving Gemini settings:", error);
      toast.error("Failed to save settings", {
        description: error.toString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    if (!apiKey) {
      toast.error("Enter an API key first to test");
      return;
    }

    setIsTesting(true);
    try {
      // 1. Ensure global model is gemini for the test
      await invoke("ai_model_selected", { model: "gemini" });

      // 2. Briefly save it to test
      await invoke("set_gemini_api_key", {
        key: apiKey,
        apiType: "gemini",
        geminiModel: model,
      });

      // Simple test prompt
      const response = await invoke("get_genai", { query: "Keep your response to exactly one word: Success." });

      if (response) {
        toast.success("Connection Successful", {
          description: "Gemini responded correctly."
        });
      }
    } catch (error) {
      toast.error("Connection Failed", {
        description: error.toString()
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-bright" />
        <Text size="sm" color="dimmed">Loading configuration...</Text>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col space-y-6 p-6 w-full min-w-[480px] max-w-[500px] bg-white dark:bg-[#0f0f0f]"
    >
      <header className="flex items-center justify-between pb-4 border-b dark:border-white/5">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-brand-bright/10 dark:bg-brand-bright/20 rounded-lg">
            <Sparkles className="w-6 h-6 text-brand-bright" />
          </div>
          <div>
            <Text fw={700} size="lg" className="text-gray-900 dark:text-gray-100">Google Gemini</Text>
            <Text size="xs" className="text-gray-500 dark:text-gray-400">Configure your Google AI Studio integration</Text>
          </div>
        </div>
        <ActionIcon onClick={closeGemini} variant="subtle" color="gray" radius="xl" className="hover:bg-gray-100 dark:hover:bg-white/5">
          <X className="w-5 h-5" />
        </ActionIcon>
      </header>

      <Stack gap="md">
        <section>
          <Text size="sm" fw={600} mb={8} className="dark:text-gray-300">Choose Model</Text>
          <Select
            placeholder="Select a model"
            value={model}
            data={geminiModels}
            onChange={(val) => val && setModel(val)}
            transitionProps={{ transition: 'pop-top-left', duration: 80, timingFunction: 'ease' }}
            styles={(theme) => ({
              input: {
                backgroundColor: 'transparent',
                borderRadius: '8px',
                height: '42px',
                '&:focus': {
                  borderColor: '#2B6CC4'
                }
              }
            })}
          />
        </section>

        <section>
          <Group justify="space-between" mb={8} wrap="nowrap">
            <Text size="sm" fw={600} className="dark:text-gray-300">API Key</Text>
            <Anchor
              href="https://ai.google.dev/aistudio"
              target="_blank"
              size="xs"
              className="flex items-center space-x-1"
            >
              <span>Get Key</span> <ExternalLink className="w-3 h-3" />
            </Anchor>
          </Group>

          <TextInput
            placeholder="AIzaSy..."
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            icon={<Key className="w-4 h-4 opacity-50" />}
            rightSection={
              <Tooltip label={showApiKey ? "Hide Key" : "Show Key"}>
                <ActionIcon onClick={() => setShowApiKey(!showApiKey)} variant="transparent">
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </ActionIcon>
              </Tooltip>
            }
            styles={{
              input: {
                borderRadius: '8px',
                height: '42px',
                fontFamily: apiKey ? 'monospace' : 'inherit'
              }
            }}
          />
        </section>

        <Paper withBorder p="md" radius="md" className="bg-brand-bright/5 dark:bg-brand-bright/5 border-brand-bright/20 dark:border-brand-bright/10">
          <Group gap="sm" wrap="nowrap" align="flex-start">
            <ShieldCheck className="w-5 h-5 text-brand-bright mt-0.5" />
            <Text size="xs" className="text-brand-bright/80 dark:text-brand-bright/60 leading-relaxed">
              Your API key is stored securely on your local machine and never transmitted to our servers. Only sent directly to Google's API during requests.
            </Text>
          </Group>
        </Paper>
      </Stack>

      <footer className="flex space-x-3 pt-2">
        <Button
          variant="light"
          fullWidth
          height={40}
          radius="md"
          loading={isTesting}
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={testConnection}
        >
          Test
        </Button>
        <Button
          fullWidth
          height={40}
          radius="md"
          loading={isLoading}
          leftIcon={<Check className="w-4 h-4" />}
          onClick={handleSaveSettings}
          className="bg-brand-bright hover:opacity-90 transition-opacity"
        >
          Save & Activate
        </Button>
      </footer>
    </motion.div>
  );
};

export default GeminiSelector;
