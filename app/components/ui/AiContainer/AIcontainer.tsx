// @ts-nocheck
"use client";
import React, { useRef, useEffect } from "react";
import { useChat } from "ai/react";
import Markdown from "react-markdown";
import { FaRobot } from "react-icons/fa";
import { IoIosPerson } from "react-icons/io";
import { useOllamaStore } from "@/store/store";

const AIcontainer = () => {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  const ollamaStatus = useOllamaStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-[70vh] max-w-8xl mx-auto bg-gray-100 dark:bg-brand-darker border border-gray-300 dark:border-brand-dark rounded-lg shadow-lg">
      <div ref={containerRef} className="flex-1 p-4 overflow-y-auto">
        {ollamaStatus.ollama === true ? (
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
                    <span>Oxide AI</span>
                  </div>
                )}
                <Markdown className="bg-brand-dark/10 mb-3 mt-1 text-black dark:bg-brand-dark p-2 dark:text-white/50 rounded-lg">
                  {m.content}
                </Markdown>
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
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit(e as React.FormEvent<HTMLFormElement>);
              }
            }}
            placeholder="Type your message..."
            className="flex-1 p-2 border border-gray-300 dark:border-brand-dark rounded-lg mr-2 dark:bg-brand-darker"
          />
          <button className="bg-blue-500 dark:bg-brand-dark text-white px-4 py-2 rounded-lg hover:bg-blue-600">
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIcontainer;
