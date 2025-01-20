"use client";
import { useState, useEffect } from "react";

const ChatLoading = () => {
  const [dots, setDots] = useState([false, false, false]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prevDots) => {
        const nextDots = [...prevDots];
        const activeIndex = prevDots.findIndex((dot) => dot);

        if (activeIndex === -1) {
          nextDots[0] = true;
        } else {
          nextDots[activeIndex] = false;
          nextDots[(activeIndex + 1) % 3] = true;
        }

        return nextDots;
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex -ml-2 items-center gap-2 p-4">
      {dots.map((isActive, index) => (
        <div
          key={index}
          className={`w-2 h-2 rounded-full transition-all duration-300 ease-in-out
            ${isActive ? "bg-blue-500 scale-125" : "bg-gray-300 scale-100"}`}
        />
      ))}
    </div>
  );
};

export default ChatLoading;
