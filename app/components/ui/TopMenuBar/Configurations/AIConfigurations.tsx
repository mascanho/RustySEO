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
    <Box className="w-full mt-4">
      <Stack gap="xl">
        <section>
          <Group justify="space-between" mb={8} wrap="nowrap">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-500" />
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
                '&:focus': { borderColor: '#3b82f6' }
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

        <Paper withBorder p="md" radius="md" className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-500/5 dark:to-blue-500/5 border-indigo-100 dark:border-indigo-500/10">
          <Group gap="sm" wrap="nowrap" align="flex-start">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
            <Text size="xs" className="text-indigo-700/70 dark:text-indigo-300/60 leading-relaxed">
              To switch models, use the dedicated "AI Connectors" menus in the top bar. You can choose between Google Gemini (Cloud) or Ollama (Local).
            </Text>
          </Group>
        </Paper>
      </Stack>
    </Box>
  );
}

export default AIConfigurations;
