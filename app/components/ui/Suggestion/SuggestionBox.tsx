"use client";

import { useState } from "react";
import { ActionIcon, Text } from "@mantine/core";
import { MessageSquareHeart, X, Send, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

// Keep in sync with the check constraints in supabase_improvements_schema.sql
const MAX_USERNAME_LENGTH = 40;
const MAX_MESSAGE_LENGTH = 1000;
const USERNAME_STORAGE_KEY = "rustyseo_suggestion_username";
const CHAT_NICKNAME_KEY = "rustyseo_chat_nickname";

interface SuggestionBoxProps {
  close: () => void;
}

const SuggestionBox: React.FC<SuggestionBoxProps> = ({ close }) => {
  const [username, setUsername] = useState(() => {
    if (typeof window === "undefined") return "";
    return (
      localStorage.getItem(USERNAME_STORAGE_KEY) ||
      localStorage.getItem(CHAT_NICKNAME_KEY) ||
      ""
    );
  });
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const canSubmit =
    username.trim().length > 0 && message.trim().length > 0 && !sending;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSending(true);
    try {
      const { error } = await supabase.from("improvements").insert({
        username: username.trim(),
        text: message.trim(),
      });
      if (error) {
        console.error("Failed to send suggestion:", error);
        if (error.message?.includes("RATE_LIMIT")) {
          toast.error("You're sending suggestions too fast — slow down a bit.");
        } else {
          toast.error("Failed to send your suggestion. Please try again.");
        }
        return;
      }
      localStorage.setItem(USERNAME_STORAGE_KEY, username.trim());
      setSent(true);
      setMessage("");
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col w-full bg-white dark:bg-[#0f0f0f] rounded-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-white/5"
    >
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-brand-bright/10 dark:bg-brand-bright/20 rounded-xl">
            <MessageSquareHeart className="w-6 h-6 text-brand-bright" />
          </div>
          <div>
            <Text
              fw={800}
              size="lg"
              className="text-gray-900 dark:text-white tracking-tight"
            >
              Send a Suggestion
            </Text>
            <Text
              size="xs"
              className="text-gray-500 dark:text-gray-400 font-medium"
            >
              Ideas, bugs, requests — it all reaches the team
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

      <div className="p-6">
        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center text-center py-8 space-y-3"
            >
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <Text
                fw={700}
                size="sm"
                className="text-gray-900 dark:text-white"
              >
                Thanks for the suggestion!
              </Text>
              <Text
                size="xs"
                className="text-gray-500 dark:text-gray-400 max-w-[280px]"
              >
                It&apos;s been sent through. Feel free to send another one
                anytime.
              </Text>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSent(false)}
                >
                  Send another
                </Button>
                <Button size="sm" onClick={close}>
                  Close
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Your name
                </label>
                <Input
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.slice(0, MAX_USERNAME_LENGTH))
                  }
                  placeholder="e.g. Marco"
                  maxLength={MAX_USERNAME_LENGTH}
                  className="dark:bg-brand-darker dark:border-brand-dark dark:text-white text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Your suggestion
                  </label>
                  <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono">
                    {message.length}/{MAX_MESSAGE_LENGTH}
                  </span>
                </div>
                <Textarea
                  value={message}
                  onChange={(e) =>
                    setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))
                  }
                  placeholder="What should we build, fix, or improve?"
                  maxLength={MAX_MESSAGE_LENGTH}
                  rows={5}
                  className="dark:bg-brand-darker dark:border-brand-dark dark:text-white text-sm resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  size="sm"
                  className="gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sending ? "Sending…" : "Send Suggestion"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default SuggestionBox;
