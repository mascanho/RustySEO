"use client";

import { useMemo, useState } from "react";
import { Modal, ActionIcon, Text } from "@mantine/core";
import { X, Sparkles, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { changelogData } from "./ChangelogData";
import {
  getTypeColor,
  getTypeLabel,
  getChangeDotColor,
  parseChange,
  renderChangeText,
} from "./changelogUtils";

interface ChangelogModalProps {
  opened: boolean;
  onClose: () => void;
}

export default function ChangelogModal({
  opened,
  onClose,
}: ChangelogModalProps) {
  const latestVersion = changelogData[0]?.version;
  const [selectedVersion, setSelectedVersion] = useState(latestVersion);

  const entry = useMemo(
    () =>
      changelogData.find((e) => e.version === selectedVersion) ??
      changelogData[0],
    [selectedVersion],
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      closeOnEscape
      closeOnClickOutside
      size="520px"
      padding={0}
      radius="lg"
      withCloseButton={false}
      styles={{
        content: {
          background: "transparent",
          border: "none",
          boxShadow: "none",
        },
      }}
    >
      <div className="flex flex-col w-full bg-white dark:bg-[#0f0f0f] rounded-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-white/5">
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-brand-bright/10 dark:bg-brand-bright/20 rounded-xl">
              <Sparkles className="w-6 h-6 text-brand-bright" />
            </div>
            <div>
              <Text
                fw={800}
                size="lg"
                className="text-gray-900 dark:text-white tracking-tight"
              >
                What&apos;s New in RustySEO
              </Text>
              <Text
                size="xs"
                className="text-gray-500 dark:text-gray-400 font-medium"
              >
                {selectedVersion === latestVersion
                  ? "You're on the latest version"
                  : "Browsing a previous release"}
              </Text>
            </div>
          </div>
          <ActionIcon
            onClick={onClose}
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
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Select value={selectedVersion} onValueChange={setSelectedVersion}>
              <SelectTrigger className="w-[190px] dark:text-white h-8 text-xs bg-white dark:bg-brand-darker border-gray-200 dark:border-brand-dark focus:ring-1 focus:ring-offset-0 rounded-xl">
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent className="dark:text-white text-xs dark:bg-brand-darker dark:border-brand-dark">
                {changelogData.map((e) => (
                  <SelectItem
                    key={e.version}
                    value={e.version}
                    className="text-xs"
                  >
                    v{e.version}
                    {e.version === latestVersion ? " (latest)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {entry && (
              <Badge
                variant="secondary"
                className={`text-xs px-2 py-0.5 ${getTypeColor(entry.type)}`}
              >
                {getTypeLabel(entry.type)}
              </Badge>
            )}
          </div>

          {entry && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm text-gray-900 dark:text-white">
                  Released in:
                </span>
                <span className="text-xs text-brand-bright">
                  {new Date(entry.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <Separator />
              <ul className="space-y-1 h-[320px] overflow-y-auto pr-1">
                {entry.changes.map((change, i) => {
                  const { category, text } = parseChange(change);
                  return (
                    <li
                      key={i}
                      className="group flex items-start gap-2.5 rounded-lg px-2.5 py-2 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full ${getChangeDotColor(entry.type)}`}
                      >
                        <Check
                          className="h-2.5 w-2.5 text-white"
                          strokeWidth={3}
                        />
                      </span>
                      <span className="leading-relaxed text-xs text-gray-600 dark:text-white/70">
                        {category && (
                          <span className="mr-1.5 inline-block rounded-md bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-white/50">
                            {category}
                          </span>
                        )}
                        {renderChangeText(text)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex justify-between items-center px-6 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/mascanho/rustyseo/releases"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all releases →
          </a>
          <Text
            size="xs"
            className="text-gray-300 dark:text-gray-700 font-mono tracking-widest uppercase"
          >
            RustySEO
          </Text>
        </footer>
      </div>
    </Modal>
  );
}
