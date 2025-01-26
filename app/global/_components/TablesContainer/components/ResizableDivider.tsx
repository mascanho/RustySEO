import type React from "react";
import { useState, useCallback, useRef, useEffect } from "react";

interface ResizableDividerProps {
  onResize: (newBottomHeight: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const ResizableDivider: React.FC<ResizableDividerProps> = ({
  onResize,
  containerRef,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number | null>(null);
  const startBottomHeightRef = useRef<number | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setIsDragging(true);
      startYRef.current = e.clientY;
      startBottomHeightRef.current = containerRef.current
        ? containerRef.current.getBoundingClientRect().bottom - e.clientY
        : null;
    },
    [containerRef],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (
        isDragging &&
        startYRef.current !== null &&
        startBottomHeightRef.current !== null &&
        containerRef.current
      ) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const deltaY = e.clientY - startYRef.current;
        const newBottomHeight = Math.max(
          100,
          startBottomHeightRef.current - deltaY,
        );
        const maxBottomHeight = containerRect.height - 100; // Ensure top section is at least 100px
        onResize(Math.min(newBottomHeight, maxBottomHeight));
      }
    },
    [isDragging, onResize, containerRef],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    startYRef.current = null;
    startBottomHeightRef.current = null;
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className="h-2 bg-gray-200 cursor-row-resize hover:bg-blue-300 transition-colors duration-200"
      onMouseDown={handleMouseDown}
    />
  );
};

export default ResizableDivider;
