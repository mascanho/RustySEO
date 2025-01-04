"use client";
import { useEffect, useState, useMemo } from "react";

const Loader = () => {
  const loadingMessages = useMemo(
    () => [
      "Grabbing a few beers...",
      "Fetching some data...",
      "Seting up the database...",
      "Brewing coffee...",
      "Loading awesome stuff...",
    ],
    [],
  );

  const [message, setMessage] = useState(loadingMessages[0]);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== "undefined") {
      const hasLoaded = sessionStorage.getItem("hasInitiallyLoaded");
      return !hasLoaded;
    }
    return true;
  });

  useEffect(() => {
    if (isVisible) {
      // Rotate messages every 2 seconds
      const messageInterval = setInterval(() => {
        setMessageIndex((prevIndex) =>
          prevIndex === loadingMessages.length - 1 ? 0 : prevIndex + 1,
        );
      }, 2000);

      // Hide loader after 11 seconds
      const timeout = setTimeout(() => {
        setIsVisible(false);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("hasInitiallyLoaded", "true");
        }
      }, 11000);

      return () => {
        clearInterval(messageInterval);
        clearTimeout(timeout);
      };
    }
  }, [loadingMessages, isVisible]);

  useEffect(() => {
    setMessage(loadingMessages[messageIndex]);
  }, [messageIndex, loadingMessages]);

  if (!isVisible) return null;

  return (
    <div className="fixed bg-black inset-0 flex items-center justify-center z-50 h-screen">
      <div className="fixed inset-0 bg-black opacity-50"></div>
      <div className="relative z-10 flex flex-col bg-whitw items-center">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <h1 className="text-white mt-4">{message}</h1>
      </div>
    </div>
  );
};

export default Loader;
