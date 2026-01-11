"use client";
import useGlobalConsoleStore from "@/store/GlobalConsoleLog";
import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";
import { Cpu, Sparkles, BrainCircuit } from "lucide-react";
import { Text, TextInput, Stack, Paper, Group, Box } from "@mantine/core";

const AIConfigurations = () => {
  const [aiModel, setAiModel] = useState("Ollama");
  const [llamaModel, setLlamaModel] = useState("llama3.1");

  useEffect(() => {
    invoke("get_ai_model").then((result: any) => {
      setAiModel(result);
    });
    invoke("check_ai_model").then((result: any) => {
      setAiModel(result);
    });
  }, []);

  return (
    <Box className="w-full">
      <Stack gap="xl">
        <section>
          <Group justify="space-between" mb={8} wrap="nowrap">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-brand-bright" />
              <Text fw={700} size="md" className="dark:text-gray-100">Active AI Model</Text>
            </div>
          </Group>
          <Text size="xs" className="text-gray-500 dark:text-gray-400 mb-4">
            The primary AI provider currently used for content generation and analysis throughout the application.
          </Text>
          <TextInput
            placeholder="No model detected"
            value={aiModel}
            readOnly
            styles={{
              input: {
                backgroundColor: 'transparent',
                borderRadius: '10px',
                height: '42px',
                fontSize: '14px',
                fontWeight: 600,
                border: '1px solid #e2e8f0',
                '&:focus': { borderColor: 'var(--brand-bright, #3b82f6)' }
              }
            }}
            className="dark:border-white/10 dark:text-gray-200"
          />
        </section>

        {aiModel === "Ollama" && (
          <section>
            <Group justify="space-between" mb={8} wrap="nowrap">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-purple-500" />
                <Text fw={700} size="md" className="dark:text-gray-100">Ollama Instance</Text>
              </div>
            </Group>
            <Text size="xs" className="text-gray-500 dark:text-gray-400 mb-4">
              Local LLM instance currently serving requests. Make sure Ollama is running on your machine.
            </Text>
            <TextInput
              placeholder="Local model name"
              value={llamaModel}
              readOnly
              styles={{
                input: {
                  backgroundColor: 'transparent',
                  borderRadius: '10px',
                  height: '42px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  border: '1px solid #e2e8f0'
                }
              }}
              className="dark:border-white/10 dark:text-gray-400 bg-gray-50/50"
            />
          </section>
        )}

        <Paper withBorder p="md" radius="md" className="bg-gradient-to-br from-brand-bright/5 to-brand-bright/10 dark:from-brand-bright/10 dark:to-brand-bright/5 border-brand-bright/20 dark:border-brand-bright/10">
          <Group gap="sm" wrap="nowrap" align="flex-start">
            <Sparkles className="w-5 h-5 text-brand-bright mt-0.5" />
            <Text size="xs" className="text-brand-bright/80 dark:text-brand-bright/60 leading-relaxed">
              To switch models, use the dedicated "AI Connectors" menus in the top bar. You can choose between Google Gemini (Cloud) or Ollama (Local).
            </Text>
          </Group>
        </Paper>
      </Stack>
    </Box>
  );
}

export default AIConfigurations;
