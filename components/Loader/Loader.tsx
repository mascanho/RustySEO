"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Loader = () => {
  const loadingMessages = useMemo(
    () => [
      "Grabbing a few beers...",
      "Fetching some data...",
      "Setting up the database...",
      "Brewing coffee...",
      "Loading awesome stuff...",
      "Synthesizing SEO insights...",
      "Optimizing crawl paths...",
      "Finalizing your workspace...",
    ],
    [],
  );

  const [messageIndex, setMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(() => {
    // We want it visible by default on the server and during early hydration
    // to prevent content flash.
    if (typeof window !== "undefined") {
      const hasLoaded = sessionStorage?.getItem("hasInitiallyLoaded");
      return !hasLoaded;
    }
    return true;
  });
  const pathname = usePathname();

  useEffect(() => {
    if (isVisible) {
      const messageInterval = setInterval(() => {
        setMessageIndex((prevIndex) =>
          prevIndex === loadingMessages.length - 1 ? 0 : prevIndex + 1,
        );
      }, 2500);

      const timeout = setTimeout(() => {
        setIsVisible(false);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("hasInitiallyLoaded", "true");
        }
      }, 10000); 

      return () => {
        clearInterval(messageInterval);
        clearTimeout(timeout);
      };
    }
  }, [loadingMessages, isVisible]);

  // We still want to allow AnimatePresence to handle the exit
  // So we only return null if it's completely not supposed to show OR on specific pages
  if (pathname === "/global") return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="app-loader"
          // Removed initial={{ opacity: 0 }} to ensure it shows immediately in the HTML
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
          className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-[#0a0a0a]"
          style={{ opacity: 1 }} // Force immediate opacity
        >
          {/* Subtle Background Glows */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.15, 0.1],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-blue-600 blur-[120px]"
            />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.1, 0.12, 0.1],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 1 }}
              className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-indigo-600 blur-[120px]"
            />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            {/* Modern Loader Animation */}
            <div className="relative w-24 h-24 mb-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-blue-500/30 border-r-blue-500/10"
              />
              
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 rounded-full border-[3px] border-transparent border-t-blue-400/50 border-l-blue-400/20"
              />

              <motion.div
                animate={{
                  scale: [0.8, 1.1, 0.8],
                  opacity: [0.5, 1, 0.5],
                  boxShadow: [
                    "0 0 20px rgba(59, 130, 246, 0.3)",
                    "0 0 40px rgba(59, 130, 246, 0.6)",
                    "0 0 20px rgba(59, 130, 246, 0.3)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-6 rounded-full bg-blue-500 flex items-center justify-center"
              >
                <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" />
              </motion.div>

              <motion.div
                style={{ originX: "50%", originY: "50%" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-300 rounded-full blur-[1px]" />
              </motion.div>
            </div>

            <div className="h-8 flex items-center justify-center overflow-hidden text-center">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={messageIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "backOut" }}
                  className="text-white text-lg font-light tracking-[0.2em] uppercase px-4"
                >
                  {pathname === "/serverlogs" ? "Reloading System" : loadingMessages[messageIndex]}
                </motion.h1>
              </AnimatePresence>
            </div>

            <div className="mt-8 w-48 h-[1px] bg-white/10 relative overflow-hidden rounded-full">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Loader;


