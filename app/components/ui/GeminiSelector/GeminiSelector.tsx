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
  const [model, setModel] = useState("gemini-2.0-flash-exp");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [availableModels, setAvailableModels] = useState([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  // Default fallback models (latest as of Jan 2026)
  const defaultGeminiModels = [
    { value: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash (Experimental - Latest)" },
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash (Fast & Efficient)" },
    { value: "gemini-1.5-flash-8b", label: "Gemini 1.5 Flash-8B (Lightweight)" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro (Advanced Reasoning)" },
    { value: "gemini-pro", label: "Gemini Pro (Stable)" },
  ];

  // Load existing config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await invoke("get_gemini_config_command");
        if (config) {
          if (config.gemini_model) setModel(config.gemini_model);
          if (config.key) {
            setApiKey(config.key);
            // Fetch available models if we have an API key
            fetchAvailableModels(config.key);
          }
        }
      } catch (error) {
        console.log("No existing Gemini configuration found.");
      } finally {
        setIsInitialLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const fetchAvailableModels = async (key?: string) => {
    const keyToUse = key || apiKey;
    if (!keyToUse) {
      setAvailableModels(defaultGeminiModels);
      return;
    }

    setIsFetchingModels(true);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${keyToUse}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.models && Array.isArray(data.models)) {
        // Filter for generateContent capable models and sort by name
        const models = data.models
          .filter((m: any) =>
            m.supportedGenerationMethods?.includes("generateContent") &&
            m.name.includes("gemini")
          )
          .map((m: any) => {
            const modelName = m.name.replace("models/", "");
            // Create friendly labels
            let label = modelName;
            if (modelName.includes("2.0")) {
              label = modelName.includes("flash")
                ? "Gemini 2.0 Flash (Latest - Experimental)"
                : "Gemini 2.0 (Latest)";
            } else if (modelName.includes("1.5-flash-8b")) {
              label = "Gemini 1.5 Flash-8B (Lightweight)";
            } else if (modelName.includes("1.5-flash")) {
              label = "Gemini 1.5 Flash (Fast & Efficient)";
            } else if (modelName.includes("1.5-pro")) {
              label = "Gemini 1.5 Pro (Advanced Reasoning)";
            } else if (modelName.includes("pro")) {
              label = "Gemini Pro (Stable)";
            }

            return {
              value: modelName,
              label: label,
            };
          })
          .sort((a, b) => {
            // Sort: 2.0 models first, then 1.5, then others
            if (a.value.includes("2.0") && !b.value.includes("2.0")) return -1;
            if (!a.value.includes("2.0") && b.value.includes("2.0")) return 1;
            return a.value.localeCompare(b.value);
          });

        if (models.length > 0) {
          setAvailableModels(models);
          // Set the first model as default if current model is not in the list
          if (!models.find((m: any) => m.value === model)) {
            setModel(models[0].value);
          }
        } else {
          setAvailableModels(defaultGeminiModels);
        }
      } else {
        setAvailableModels(defaultGeminiModels);
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      toast.error("Could not fetch models", {
        description: "Using default model list. Check your API key."
      });
      setAvailableModels(defaultGeminiModels);
    } finally {
      setIsFetchingModels(false);
    }
  };

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
      // Test with a simple API call directly to Google
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: "Say 'Success' in one word."
              }]
            }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.candidates && data.candidates.length > 0) {
        toast.success("Connection Successful", {
          description: `${model} responded correctly.`
        });

        // Now fetch available models since the key works
        await fetchAvailableModels(apiKey);
      } else {
        throw new Error("No response from model");
      }
    } catch (error) {
      console.error("Test error:", error);
      toast.error("Connection Failed", {
        description: error.message || error.toString()
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

  const modelsToDisplay = availableModels.length > 0 ? availableModels : defaultGeminiModels;

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
          <Group justify="space-between" mb={8} wrap="nowrap">
            <Text size="sm" fw={600} className="dark:text-gray-300">API Key</Text>
            <Anchor
              href="https://aistudio.google.com/app/apikey"
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

        <section>
          <Group justify="space-between" mb={8} wrap="nowrap">
            <Text size="sm" fw={600} className="dark:text-gray-300">Choose Model</Text>
            {apiKey && (
              <Button
                size="xs"
                variant="subtle"
                compact
                loading={isFetchingModels}
                leftIcon={<RefreshCw className="w-3 h-3" />}
                onClick={() => fetchAvailableModels()}
              >
                Refresh Models
              </Button>
            )}
          </Group>
          <Select
            placeholder="Select a model"
            value={model}
            data={modelsToDisplay}
            onChange={(val) => val && setModel(val)}
            disabled={isFetchingModels}
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
          {availableModels.length === 0 && (
            <Text size="xs" color="dimmed" mt={4}>
              Using default models. Enter API key and click "Refresh Models" to see all available options.
            </Text>
          )}
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
