"use client";
import React, { useRef, useEffect, useState } from "react";
import { useChat } from "ai/react";
import Markdown from "react-markdown";
import { FaRobot } from "react-icons/fa";
import { IoIosPerson } from "react-icons/io";
import { useOllamaStore } from "@/store/store";
import { invoke } from "@tauri-apps/api/tauri";
import useModelStore from "@/store/AIModels";
import { FaRegCopy } from "react-icons/fa6";
import { toast } from "sonner";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const AIcontainer = () => {
  const { handleInputChange } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const ollamaStatus = useOllamaStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedModel, setSelectedModel } = useModelStore();
  const bubbleRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Ensure scroll is at the bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // CHECK THE AI-PROVIDER
  useEffect(() => {
    const model = localStorage.getItem("AI-provider");
    if (model) {
      setSelectedModel(model);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");

    try {
      const response = await invoke("ask_rusty_command", {
        prompt: input,
      });

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: response as string,
      };

      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error("Error from Ollama:", error);
    }
  };

  const handlecopy = (content: string) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        toast("Copied to clipboard");
      })
      .catch((error) => {
        console.error("Error copying text to clipboard:", error);
      });
  };

  return (
    <div className="flex flex-col h-[70vh] max-w-8xl mx-auto bg-gray-100 dark:bg-brand-darker border border-gray-300 dark:border-brand-dark rounded-lg shadow-lg">
      <div ref={containerRef} className="flex-1 p-4 overflow-y-auto">
        {selectedModel === "ollama" || selectedModel === "gemini" ? (
          <>
            {messages.map((m) => (
              <div
                key={m.id}
                className="whitespace-pre-wrap dark:bg-brand-darker"
              >
                {m.role === "user" ? (
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
                    ref={bubbleRef}
                    className={`mb-3 mt-1 p-2 rounded-lg relative pr-2 text-black dark:text-white/90 ${
                      m.role === "user"
                        ? "bg-blue-100 dark:bg-blue-900  dark:text-white"
                        : "bg-brand-dark/10 dark:bg-purple-900"
                    }`}
                  >
                    {m.content}
                  </Markdown>
                  {m.role !== "user" && (
                    <FaRegCopy
                      onClick={() => handlecopy(m.content)}
                      className="absolute right-1.5 top-2.5 cursor-pointer active:scale-90 transition ease-linear duration-150"
                    />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-lg">
            <span>No AI model found.</span>
            <span className="block">
              Go to <strong>Menu</strong> &gt; <strong>Connectors</strong> &gt;{" "}
              <strong>Ollama</strong>
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center p-2 border-t border-gray-300 dark:border-brand-dark bg-white dark:bg-brand-darker">
        <form className="flex w-full" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as React.FormEvent<HTMLFormElement>);
              }
            }}
            placeholder="Type your message..."
            className="flex-1 p-2 border border-gray-300 dark:border-brand-dark rounded-lg mr-2 dark:bg-brand-darker"
          />
          <button
            type="submit"
            className="bg-blue-500 dark:bg-brand-dark text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIcontainer;
