// @ts-nocheck
"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Code, Coffee, Zap, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useVisibilityStore } from "@/store/VisibilityStore";
import { usePathname } from "next/navigation";

type Participant = {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: "online" | "offline";
  color: string;
  lightColor: string;
};

type Message = {
  id: string;
  text: string;
  timestamp: Date;
  senderId: string;
};

const participants: Participant[] = [
  {
    id: "1",
    name: "Alex Johnson",
    icon: <Bot size={16} />,
    status: "online",
    color: "#3a86ff",
    lightColor: "#1a56c4",
  },
  {
    id: "2",
    name: "Taylor Smith",
    icon: <Code size={16} />,
    status: "online",
    color: "#38b000",
    lightColor: "#2a8c00",
  },
  {
    id: "3",
    name: "Jordan Lee",
    icon: <Coffee size={16} />,
    status: "offline",
    color: "#9d4edd",
    lightColor: "#7b2cbf",
  },
  {
    id: "4",
    name: "Casey Morgan",
    icon: <Zap size={16} />,
    status: "online",
    color: "#fb8500",
    lightColor: "#cc6a00",
  },
];

const initialMessages: Message[] = [
  {
    id: "m1",
    text: "Hey everyone! How's it going?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    senderId: "1",
  },
  {
    id: "m2",
    text: "Pretty good!",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    senderId: "2",
  },
  {
    id: "m3",
    text: "Just to let you know that a chat function is on the way.🔥",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    senderId: "1",
  },
  {
    id: "m4",
    text: "That would be cool. What kind of chat?",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    senderId: "2",
  },
  {
    id: "m5",
    text: "A chat where SEO professionals can be conneted to each other, ask questions and get cool feedback from other SEO peers. All while they analyse their websites.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    senderId: "1",
  },
  {
    id: "m6",
    text: "For now its just dummy text... RustySEO's developer is working on it. Stay tunned",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    senderId: "1",
  },
  {
    id: "m7",
    text: "Nice!! That could be interesting. Hope it comes out soon.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    senderId: "2",
  },
];

export function ChatBar() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const { theme } = useTheme();
  const pathname = usePathname();

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return;

    const message: Message = {
      id: `m${messages.length + 1}`,
      text: newMessage,
      timestamp: new Date(),
      senderId: "1", // Current user is Alex
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getParticipant = (id: string) => {
    return participants.find((p) => p.id === id) || participants[0];
  };

  const getParticipantColor = (participant: Participant) => {
    return theme === "dark" ? participant.color : participant.lightColor;
  };

  const { visibility, hideChatbar } = useVisibilityStore();

  return (
    <div
      className={`flex flex-col overflow-hidden border border-l-2 font-mono shadow-xl transition ease-in delay-75 z-[999999] absolute right-0
  ${visibility.chatbar ? "w-[20.4rem]" : "w-0"}
  border-gray-200 text-gray-800 dark:border-gray-800 dark:bg-[#1a1a1a] dark:text-gray-200
  ${pathname === "/" && "top-0 h-[calc(100vh-8.1rem)]"}
${pathname === "/global" && "top-[5.1rem] h-[calc(100vh-8.4rem)]"}
${pathname === "/serverlogs" && "top-[4.2rem] h-[calc(100vh-6.3rem)]"}
`}
    >
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-3 py-2 dark:border-[#333333] dark:bg-[#1a1a1a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h2 className="text-sm font-medium">SEO CHAT</h2>
            <X
              size={16}
              className="ml-2 text-purple-500 cursor-pointer"
              onClick={() => hideChatbar()}
            />
          </div>
          <div className="flex items-center space-x-2">
            {participants
              .filter((p) => p.status === "online")
              .map((participant) => (
                <div
                  key={participant.id}
                  className="flex h-5 w-5 items-center justify-center"
                  style={{ color: getParticipantColor(participant) }}
                >
                  {participant.icon}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 bg-white px-3 py-2 dark:bg-[#1a1a1a]">
        <div
          className={`space-y-3 ${visibility.chatbar ? "opacity-100" : "opacity-0 transition-opacity ease-in delay-75"}`}
        >
          {messages.map((message) => {
            const sender = getParticipant(message.senderId);
            const isCurrentUser = message.senderId === "1";

            return (
              <div
                key={message.id}
                className={`flex  ${isCurrentUser ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[85%]">
                  <div className="flex items-start space-x-2 ">
                    {!isCurrentUser && (
                      <div
                        className="mt-1 flex h-6 w-6 items-center justify-center rounded-sm"
                        style={{ color: getParticipantColor(sender) }}
                      >
                        <span className="mb-4">{sender.icon}</span>
                      </div>
                    )}
                    <div>
                      {!isCurrentUser && (
                        <div className="mb-1 flex items-baseline space-x-2">
                          <span
                            className="text-xs font-medium"
                            style={{ color: getParticipantColor(sender) }}
                          >
                            {sender.name.split(" ")[0]}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-end space-x-2">
                        <div
                          className={`rounded-md px-3 py-2 ${
                            isCurrentUser
                              ? "bg-blue-600 text-white dark:bg-[#2a4365]"
                              : "bg-gray-100 text-gray-800 dark:bg-[#2d2d2d] dark:text-gray-200"
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-xs">
                            {message.text}
                          </p>
                        </div>
                        {isCurrentUser && (
                          <div
                            className="flex h-6 w-6 items-center justify-center"
                            style={{ color: getParticipantColor(sender) }}
                          >
                            <span>{sender.icon}</span>
                          </div>
                        )}
                      </div>
                      {isCurrentUser && (
                        <div className="mt-1 flex justify-end">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-3 py-2 dark:border-[#333333] dark:bg-[#1a1a1a]">
        <div className="flex items-center space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message"
            className="h-8 flex-1 rounded-sm border-gray-300 bg-white text-sm text-gray-800 focus-visible:ring-blue-500 dark:border-[#444444] dark:bg-[#252525] dark:text-gray-200 dark:focus-visible:ring-blue-400"
          />
          <Button
            size="sm"
            onClick={handleSendMessage}
            disabled={newMessage.trim() === ""}
            className="h-8 w-8 rounded-sm bg-blue-600 p-0 hover:bg-blue-700 dark:bg-[#333333] dark:hover:bg-[#444444]"
          >
            <Send className="h-4 w-4 dark:text-sky-bright" />
          </Button>
        </div>
      </div>
    </div>
  );
}
