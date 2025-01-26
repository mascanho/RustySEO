import React, { useState, useCallback } from "react";

interface ResizableDividerProps {
  onResize: (newHeight: number) => void;
}

const ResizableDivider: React.FC<ResizableDividerProps> = ({ onResize }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isDragging) {
        onResize(e.clientY);
      }
    },
    [isDragging, onResize],
  );

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("mousemove", handleMouseMove as any);
    } else {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousemove", handleMouseMove as any);
    }
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousemove", handleMouseMove as any);
    };
  }, [isDragging, handleMouseUp, handleMouseMove]);

  return (
    <div
      className="h-2 bg-gray-200 cursor-row-resize hover:bg-blue-300 transition-colors duration-200"
      onMouseDown={handleMouseDown}
    />
  );
};

export default ResizableDivider;
