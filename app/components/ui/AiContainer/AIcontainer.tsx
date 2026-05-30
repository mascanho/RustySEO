// @ts-nocheck
"use client";
import React, { useRef, useEffect, useState, memo } from "react";
import { useChat } from "ai/react";
import Markdown from "react-markdown";
import { FaRobot } from "react-icons/fa";
import { IoIosPerson } from "react-icons/io";
import { useOllamaStore } from "@/store/store";
import { invoke } from "@tauri-apps/api/core";
import useModelStore from "@/store/AIModels";
import { FaRegCopy } from "react-icons/fa6";
import { toast } from "sonner";
import usePageSpeedStore from "@/store/StorePerformance";
import useOnPageSeo from "@/store/storeOnPageSeo";
import ChatLoading from "./chatLoading";
import useContentStore from "@/store/storeContent";
import { usePathname } from "next/navigation";
import useCrawlStore from "@/store/GlobalCrawlDataStore";
import { useLogAnalysisStore } from "@/store/ServerLogsStore";
import { buildRustyAiContext } from "./libs/rustyAiPrompts";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const ChatInput = memo(({ onSend, isThinking }: { onSend: (text: string) => void, isThinking: boolean }) => {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isThinking) {
      onSend(input);
      setInput("");
    }
  };

  return (
    <div className="flex items-center p-2 border-t border-gray-300 dark:border-brand-dark bg-white dark:bg-brand-darker">
      <form className="flex w-full" onSubmit={handleSubmit}>
        <input
          type="text"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Type your message..."
          className="flex-1 p-2 border border-gray-300 dark:border-brand-dark rounded-lg mr-2 dark:bg-brand-darker"
        />
        <button
          type="submit"
          disabled={!input.trim() || isThinking}
          className="bg-blue-500 dark:bg-brand-dark text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
});

ChatInput.displayName = "ChatInput";

const MessageItem = memo(({ message, onCopy }: { message: Message, onCopy: (c: string) => void }) => {
  return (
    <div className="whitespace-pre-wrap dark:bg-brand-darker">
      {message.role === "user" ? (
        <div className="flex items-center space-x-1">
          <IoIosPerson className="text-xl" />
          <span>You</span>
        </div>
      ) : (
        <div className="flex items-center space-x-1">
          <FaRobot className="text-xl" />
          <span>Rusty</span>
        </div>
      )}

      <div className="relative">
        <Markdown
          className={`mb-3 mt-1 p-2 rounded-lg relative pr-2 text-black dark:text-white/90 ${message.role === "user"
            ? "bg-blue-100 dark:bg-blue-900 dark:text-white"
            : "bg-brand-dark/10 dark:bg-purple-900"
            }`}
        >
          {message.content}
        </Markdown>
        {message.role !== "user" && (
          <FaRegCopy
            onClick={() => onCopy(message.content)}
            className="absolute right-1.5 top-2.5 cursor-pointer active:scale-90 transition ease-linear duration-150"
          />
        )}
      </div>
    </div>
  );
});

MessageItem.displayName = "MessageItem";

const AIcontainer = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedModel = useModelStore((state) => state.selectedModel);
  const setSelectedModel = useModelStore((state) => state.setSelectedModel);
  
  const SESSION_STORAGE_KEY = "chat_messages";
  const [hasMounted, setHasMounted] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const pathname = usePathname();

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const loadMessages = () => {
      const storedMessages = sessionStorage?.getItem(SESSION_STORAGE_KEY);
      if (storedMessages) {
        try {
          const parsedMessages = JSON.parse(storedMessages);
          if (Array.isArray(parsedMessages)) {
            setMessages(parsedMessages);
          }
        } catch (e) {
          console.error("Failed to parse stored messages", e);
        }
      }
    };

    loadMessages();
    setHasMounted(true);
  }, []);

  const clearChatHistory = () => {
    sessionStorage?.removeItem(SESSION_STORAGE_KEY);
    setMessages([]);
    toast("Chat history cleared");
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  useEffect(() => {
    const model = localStorage?.getItem("AI-provider");
    if (model) {
      setSelectedModel(model);
    }
  }, [setSelectedModel]);

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: text,
    };

    let updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsThinking(true);

    // Get store states at call time to avoid re-renders on typing
    const pageSpeedStore = usePageSpeedStore.getState();
    const onPageSEO = useOnPageSeo.getState();
    const contentStore = useContentStore.getState();
    const crawlStore = useCrawlStore.getState();
    const logAnalysisStore = useLogAnalysisStore.getState();
    const issuesData = crawlStore.issuesData;

    const context = buildRustyAiContext(
      pathname,
      pageSpeedStore,
      onPageSEO,
      contentStore,
      crawlStore,
      logAnalysisStore,
      issuesData
    );

    try {
      const response = await invoke("ask_rusty_with_context_command", {
        prompt: text,
        context: context,
      });

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: response as string,
      };

      updatedMessages = [...updatedMessages, assistantMessage];
      setMessages(updatedMessages);
      sessionStorage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedMessages));
    } catch (error) {
      console.error("Error from AI:", error);
      const errorMessage: Message = {
        id: Date.now() + 2,
        role: "assistant",
        content: `Sorry, I encountered an error: ${typeof error === "string" ? error : "Failed to get response from AI."}`,
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      sessionStorage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(finalMessages));
      toast.error("Failed to get response from AI");
    } finally {
      setIsThinking(false);
    }
  };

  const handlecopy = (content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => toast("Copied to clipboard"))
      .catch((error) => console.error("Error copying text:", error));
  };

  const renderThinkingDots = () => {
    if (!isThinking) return null;
    return (
      <div className="flex items-center space-x-1">
        <FaRobot className="text-2xl animate-pulse text-brand-bright" />
        <span className="ml-1">Rusty</span>
        <span className="text-xl">
          <ChatLoading />
        </span>
      </div>
    );
  };

  if (!hasMounted) return null;

  if (selectedModel !== "ollama" && selectedModel !== "gemini") {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center text-lg bg-gray-100 dark:bg-brand-darker border border-gray-300 dark:border-brand-dark rounded-lg">
        <span>No AI model found.</span>
        <span className="block">
          Go to <strong>Menu</strong> &gt; <strong>Connectors</strong>
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[70vh] max-w-8xl mx-auto bg-gray-100 dark:bg-brand-darker border border-gray-300 dark:border-brand-dark rounded-lg shadow-lg">
      <div ref={containerRef} className="flex-1 p-4 overflow-y-auto">
        <div className="flex justify-end">
          {messages.length > 0 && (
            <button
              onClick={clearChatHistory}
              className="px-2 py-1 mb-4 text-xs text-gray-400 rounded hover:text-red-500"
            >
              Clear chat history
            </button>
          )}
        </div>
        {messages.map((m) => (
          <MessageItem key={m.id} message={m} onCopy={handlecopy} />
        ))}
        {renderThinkingDots()}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSend={handleSendMessage} isThinking={isThinking} />
    </div>
  );
};

export default AIcontainer;
