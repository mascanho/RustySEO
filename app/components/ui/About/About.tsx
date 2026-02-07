"use client";

import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ActionIcon, Text, Box, Group, Paper, Button } from "@mantine/core";
import {
  X,
  RefreshCw,
  Github,
  Mail,
  Info,
  Download,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const About: React.FC<{ close: () => void }> = ({ close }) => {
  const [localVersion, setLocalVersion] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const versions = await invoke<any>("version_check_command");
        setLocalVersion(versions.local);
      } catch (error) {
        const appVersion = localStorage?.getItem("app-version");
        setLocalVersion(appVersion || "1.0.0");
      }
    };
    fetchVersion();
  }, []);

  const checkForUpdates = async () => {
    setIsChecking(true);
    try {
      const versions = await invoke<any>("version_check_command");
      const latestVersion = versions.github;
      const currentLocalVersion = versions.local;
      setUpdateAvailable(latestVersion !== currentLocalVersion);
      setLocalVersion(currentLocalVersion);
    } catch (error) {
      console.error("Failed to check for updates:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col w-full bg-white dark:bg-[#0f0f0f] rounded-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-white/5"
    >
      {/* Header - Matching GeminiSelector */}
      <header className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-brand-bright/10 dark:bg-brand-bright/20 rounded-xl">
            <Info className="w-6 h-6 text-brand-bright" />
          </div>
          <div>
            <Text
              fw={800}
              size="lg"
              className="text-gray-900 dark:text-white tracking-tight"
            >
              About RustySEO
            </Text>
            <Text
              size="xs"
              className="text-gray-500 dark:text-gray-400 font-medium"
            >
              Application details and updates
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

      <div className="p-8 space-y-8">
        {/* App Identity Section */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-bright to-purple-500 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <img
              src="/icon.png"
              alt="RustySEO Logo"
              className="relative w-24 h-24 object-contain animate-pulse text-transparent"
              onError={(e) => {
                e.currentTarget.src = "/icon-light.png";
              }}
            />
          </div>

          <div className="text-center">
            <Group gap={8} justify="center" align="center">
              <Text
                size="sm"
                className="text-gray-500 dark:text-gray-400 font-medium"
              >
                Current Version
              </Text>
              <Paper
                px={10}
                py={2}
                radius="lg"
                className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10"
              >
                <Text
                  fw={800}
                  size="sm"
                  className="text-brand-bright font-mono"
                >
                  {localVersion}
                </Text>
              </Paper>
              <ActionIcon
                onClick={checkForUpdates}
                loading={isChecking}
                variant="subtle"
                color="brand-bright"
                radius="xl"
                size="sm"
                className="hover:bg-brand-bright/10"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </ActionIcon>
            </Group>
          </div>
        </div>

        {/* Update Notification */}
        <AnimatePresence>
          {updateAvailable && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <Paper
                withBorder
                p="md"
                radius="xl"
                className="bg-green-500/5 border-green-500/20 text-green-600 dark:text-green-400"
              >
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="sm" wrap="nowrap">
                    <Download className="w-5 h-5" />
                    <Text size="xs" fw={700}>
                      A new version of RustySEO is ready to harvest!
                    </Text>
                  </Group>
                  <Button
                    variant="filled"
                    size="compact-xs"
                    radius="xl"
                    color="green"
                    component="a"
                    href="https://github.com/mascanho/RustySEO/releases/latest"
                    target="_blank"
                  >
                    Download
                  </Button>
                </Group>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mission Statement */}
        <Paper
          withBorder
          p="lg"
          radius="2xl"
          className="bg-gray-50/50 dark:bg-white/[0.01] border-gray-100 dark:border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <AlertCircle className="w-24 h-24" />
          </div>
          <section className="space-y-4 relative z-10">
            <Text
              size="sm"
              className="text-gray-600 dark:text-gray-300 leading-relaxed italic"
            >
              "This software is experimental, expect it to break. It started as
              a passion project that has evolved into a functional SEO/Marketing
              toolkit. The goal is to keep improving it and to add more
              features."
            </Text>
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/5 to-transparent w-full" />
            <Text
              size="xs"
              fw={500}
              className="text-gray-500 dark:text-gray-400"
            >
              Your feedback is what keeps this project alive. Thank you for
              being part of the journey.
            </Text>
          </section>
        </Paper>

        {/* Links Section */}
        <footer className="flex justify-between items-center px-2">
          <Group gap="lg">
            <a
              href="https://github.com/mascanho/RustySEO"
              target="_blank"
              className="flex items-center space-x-2 text-gray-400 hover:text-brand-bright transition-colors group"
            >
              <Github className="w-4 h-4" />
              <Text
                size="xs"
                fw={700}
                className="group-hover:text-brand-bright transition-colors"
              >
                GitHub
              </Text>
            </a>
          </Group>
          <Text
            size="xs"
            className="text-gray-300 dark:text-gray-700 font-mono tracking-widest uppercase"
          >
            RustySEO © {new Date().getFullYear()}
          </Text>
        </footer>
      </div>
    </motion.div>
  );
};

export default About;
