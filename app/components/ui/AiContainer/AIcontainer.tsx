"use client";
import React, { useState } from "react";
import { useChat } from "ai/react";
import Markdown from "react-markdown";
import { FaRobot } from "react-icons/fa";
import { IoIosPerson } from "react-icons/io";

const AIcontainer = () => {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div className="flex flex-col h-[70vh] max-w-8xl mx-auto bg-gray-100 dark:bg-brand-darker border border-gray-300 dark:border-brand-dark rounded-lg shadow-lg">
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((m) => (
          <div key={m.id} className="whitespace-pre-wrap dark:bg-brand-darker">
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
      </div>
      <div className="flex items-center p-2 border-t border-gray-300 dark:border-brand-dark bg-white dark:bg-brand-darker">
        <form className="flex w-full" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
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
