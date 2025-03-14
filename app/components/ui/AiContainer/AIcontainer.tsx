// @ts-nocheck
"use client";
import React, { useRef, useEffect, useState } from "react";
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
  const SESSION_STORAGE_KEY = "chat_messages";
  const [hasMounted, setHasMounted] = useState(false);
  const pageSpeedStore = usePageSpeedStore();
  const onPageSEO = useOnPageSeo();
  const contentStore = useContentStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const [isThinking, setIsThinking] = useState(false);

  // PAGE SPEED PERFORMANCE
  const performance = pageSpeedStore.performance || "No page crawled yet";
  const fcp = pageSpeedStore.fcp || "No page crawled yet";
  const lcp = pageSpeedStore.lcp || "No page crawled yet";
  const tti = pageSpeedStore.tti || "No page crawled yet";
  const cls = pageSpeedStore.cls || "No page crawled yet";
  const speedIndex = pageSpeedStore.speedIndex || "No page crawled yet";
  const serverResponse = pageSpeedStore.serverResponse || "No page crawled yet";
  const largePayloads = pageSpeedStore.largePayloads || "No page crawled yet";
  const domSize = pageSpeedStore.domSize || "No page crawled yet";
  const urlRedirects = pageSpeedStore.urlRedirects || "No page crawled yet";
  const longTasks = pageSpeedStore.longTasks || "No page crawled yet";
  const renderBlocking = pageSpeedStore.renderBlocking || "No page crawled yet";
  const netowrkRequests =
    pageSpeedStore.netowrkRequests || "No page crawled yet";
  const passedChecks = pageSpeedStore.passedChecks || "No page crawled yet";
  const failedChecks = pageSpeedStore.failedChecks || "No page crawled yet";
  const GlobalPerformanceScore =
    pageSpeedStore.GlobalPerformanceScore || "No page crawled yet";

  // ON PAGE SEO
  const seoLoading = onPageSEO.seoLoading || "No page crawled yet";
  const favicon = onPageSEO.favicon || "No page crawled yet";
  const seopagetitle = onPageSEO.seopagetitle || "No page crawled yet";
  const seodescription = onPageSEO.seodescription || "No page crawled yet";
  const seocanonical = onPageSEO.seocanonical || "No page crawled yet";
  const seohreflangs = onPageSEO.seohreflangs || "No page crawled yet";
  const seoopengraph = onPageSEO.seoopengraph || "No page crawled yet";
  const seoschema = onPageSEO.seoschema || "No page crawled yet";
  const seocharset = onPageSEO.seocharset || "No page crawled yet";
  const seoindexability = onPageSEO.seoindexability || "No page crawled yet";
  const seoalttags = onPageSEO.seoalttags || "No page crawled yet";
  const seostatusCodes = onPageSEO.seostatusCodes || "No page crawled yet";
  const seoheadings = onPageSEO.seoheadings || "No page crawled yet";
  const seoImages = onPageSEO.seoImages || "No page crawled yet";
  const seoOpenGraph = onPageSEO.seoOpenGraph || "No page crawled yet";
  const seoRenderBlocking =
    onPageSEO.seoRenderBlocking || "No page crawled yet";
  const seoContentQuality =
    onPageSEO.seoContentQuality || "No page crawled yet";
  const seoMedia = onPageSEO.seoMedia || "No page crawled yet";
  const seoUrlLength = onPageSEO.seoUrlLength || "No page crawled yet";

  // CONTENT STORE
  const readingTime = contentStore.readingTime || "No page crawled yet";
  const wordCount = contentStore.wordCount || "No page crawled yet";
  const readingLevel = contentStore.readingLevel || "No page crawled yet";
  const textRatio = contentStore.textRatio || "No page crawled yet";
  const contentKeywords = contentStore.keywords || "No page crawled yet";
  const contentVideo = contentStore.video || "No page crawled yet";

  // MANAGE PATHS AND RUSTY CHAT MESSAGES ACCORDINGLY
  const [myMessage, setMyMessage] = useState<string>("");

  const pathname = usePathname();

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Load messages from local storage on component mount
  useEffect(() => {
    const loadMessages = () => {
      const storedMessages = sessionStorage?.getItem(SESSION_STORAGE_KEY);
      if (storedMessages) {
        try {
          const parsedMessages = JSON.parse(storedMessages);
          if (Array.isArray(parsedMessages)) {
            setMessages(parsedMessages);
          } else {
            console.error("Stored messages is not an array", parsedMessages);
          }
        } catch (e) {
          console.error("Failed to parse stored messages", e);
        }
      }
    };

    loadMessages();
    if (inputRef.current) {
      inputRef.current.focus();
    }
    setHasMounted(true);
  }, []);

  // Clear chat history function
  const clearChatHistory = () => {
    try {
      sessionStorage?.removeItem(SESSION_STORAGE_KEY);
      setMessages([]);
      toast("Chat history cleared");
    } catch (e) {
      console.error("Failed to clear chat history", e);
      toast.error("Failed to clear chat history");
    }
  };

  // Ensure scroll is at the bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // CHECK THE AI-PROVIDER
  useEffect(() => {
    const model = localStorage?.getItem("AI-provider");
    if (model) {
      setSelectedModel(model);
    }
  }, [setSelectedModel]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input,
    };

    let updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsThinking(true);

    const shallowRusty = `You are RustySEO, a SEO and GEO marketing toolkit. Besides my prompt, here is a report of how a page I crawled is performing.

    **Performance Metrics:**
    - **Overall Page Performance:** ${performance}. This is a general score indicating how well the page performs.
    - **First Contentful Paint (FCP):** ${fcp}. This measures the time it takes for the first text or image to appear on the screen.
    - **Largest Contentful Paint (LCP):** ${lcp}. This measures the time it takes for the largest content element to become visible.
    - **Time To Interactive (TTI):** ${tti}. This measures how long it takes for the page to become fully interactive.
    - **Cumulative Layout Shift (CLS):** ${cls}. This measures the visual stability of the page, quantifying how much elements move around unexpectedly.
    - **Speed Index:** ${speedIndex}. This measures how quickly the content of a page is visually populated.
    - **Server Response Time:** ${serverResponse}. This measures how long it takes for the server to respond to the initial request.
    - **Large Payloads:** ${largePayloads}. Indicates if there are large files that are slowing down the page.
    - **DOM Size:** ${domSize} nodes. The number of nodes in the Document Object Model, too many can affect performance.
    - **URL Redirects:** ${urlRedirects}. Number of redirects that the page performs
    - **Long Tasks:** ${longTasks}. Indicates tasks that take a long time to complete, blocking the main thread.
    - **Render Blocking Resources:** ${renderBlocking}. Resources that prevent the page from rendering quickly.
    - **Network Requests:** ${netowrkRequests}. The amount of network requests the page performs
    - **Passed Checks:** ${passedChecks}. Number of performance checks that passed.
    - **Failed Checks:** ${failedChecks}. Number of performance checks that failed.
    - **Global Performance Score:** ${GlobalPerformanceScore}. Overall score of the website performance.

    **SEO Information:**
    - **SEO Loading:** ${seoLoading}. Indicates if the SEO data is loading correctly.
    - **Favicon:** ${favicon}.  Indicates if the page has a favicon.
    - **Page Title:** ${seopagetitle}. The title of the page, important for SEO.
    - **Description:** ${seodescription}. The meta description, a brief summary of the page content.
    - **Canonical URL:** ${seocanonical}. The preferred URL for the page, used to avoid duplicate content issues.
    - **Hreflangs:** ${seohreflangs}. Used to indicate the language and geographic targeting of the page.
    - **Open Graph:** ${seoopengraph}.  Data used by social media platforms to display shared content.
    -  **Schema:** ${seoschema}. Indicates if the page has schema markup.
    - **Charset:** ${seocharset}. The character encoding of the page.
    - **Indexability:** ${seoindexability}. Indicates if the page is indexable by search engines.
    - **Images without Alt Tags:** ${seoImages.length}. Number of images that lack alt text, which is important for accessibility and SEO.
    -  **Total images:** ${seoalttags.length}. The total amount of images on the page.
     - **Images with alt tags:** ${-(seoImages.length - seoalttags.length)}. The total number of images with a valid alt tag.
    - **Status Codes:** ${seostatusCodes}. HTTP status codes of the page and its resources.
    - **Headings:** ${seoheadings}. Structure of the headings in the page.
    - **Images:** ${seoImages}. List of the images in the page.
    - **Open Graph Data:** ${seoOpenGraph}. The open graph data of the page.
    - **Render Blocking Resources:** ${seoRenderBlocking}. List of render blocking resources.
    - **Content Quality:** ${seoContentQuality}. An assessment of the quality of the content on the page.
     -   **Media:** ${seoMedia}. All the media files on the page.
    -   **URL Length:** ${seoUrlLength}. The length of the URL of the page.

    **Content Analysis:**
    -   **Reading Time:** ${readingTime}. The estimated time it takes to read the content.
    -   **Word Count:** ${wordCount}. The total number of words in the content.
    -   **Reading Level:** ${readingLevel}. The reading level of the content.
    -   **Text Ratio:** ${textRatio}. The ratio of text to HTML on the page.
    - **Keywords:** ${contentKeywords}. The important keywords found in the content.
    -   **Video:** ${contentVideo}. The video found on the page.

     My prompt is: ${input}`;

    const deepRusty =
      "You are RustySEO, a SEO/GEO marketing toolkit. You have the knowledge of the greatest SEOs and have been developed by google to help improve websites";

    if (pathname === "/") {
      setMyMessage(shallowRusty);
    } else {
      setMyMessage(deepRusty);
    }

    try {
      const response = await invoke("ask_rusty_command", {
        prompt: myMessage,
      });

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: response as string,
      };

      updatedMessages = [...updatedMessages, assistantMessage];
      setMessages(updatedMessages);
      try {
        sessionStorage?.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify(updatedMessages),
        );
      } catch (e) {
        console.error("Failed to save messages to session storage", e);
      }
    } catch (error) {
      console.error("Error from Ollama:", error);
      toast.error("Failed to get response from AI");
    } finally {
      setIsThinking(false);
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
        toast.error("Failed to copy to clipboard");
      });
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
  const renderMessages = () => {
    switch (selectedModel) {
      case "ollama":
      case "gemini":
        return (
          <>
            <div className="flex justify-end ">
              {messages.length > 0 && (
                <button
                  onClick={clearChatHistory}
                  className="px-2 py-1 mt-4 right-4 text-xs  text-gray-400 rounded fixed top-[30px] hover:text-red-500"
                >
                  Clear chat history
                </button>
              )}
            </div>
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
                    // @ts-ignore
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
            {renderThinkingDots()}
            <div ref={messagesEndRef} />
          </>
        );
      default:
        return (
          <div className="h-full flex flex-col items-center justify-center text-lg">
            <span>No AI model found.</span>
            <span className="block">
              Go to <strong>Menu</strong> &gt; <strong>Connectors</strong> &gt;{" "}
              <strong>Ollama</strong>
            </span>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-[70vh] max-w-8xl mx-auto bg-gray-100 dark:bg-brand-darker border border-gray-300 dark:border-brand-dark rounded-lg shadow-lg">
      <div ref={containerRef} className="flex-1 p-4 overflow-y-auto">
        {renderMessages()}
      </div>
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
