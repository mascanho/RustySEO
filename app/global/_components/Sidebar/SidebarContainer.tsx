import React, { useState, useCallback, useRef, useEffect } from "react";
import BottomContainer from "./BottomContainer";
import TopContainer from "./TopContainer";

function SidebarContainer() {
  const [bottomHeight, setBottomHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    // Initial 50/50 split
    if (containerRef.current) {
      const height = containerRef.current.offsetHeight;
      setBottomHeight(height / 2);
    }
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    e.preventDefault();
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newBottomHeight = containerRect.bottom - e.clientY;

    // Constraints: min 100px for both top and bottom
    const minHeight = 100;
    const maxHeight = containerRect.height - minHeight;

    setBottomHeight(Math.max(minHeight, Math.min(newBottomHeight, maxHeight)));
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }, [onMouseMove]);

  return (
    <div
      ref={containerRef}
      className={`pt-[5.1rem] flex-1 w-[26rem] bg-white dark:bg-brand-darker h-screen border-t border-l flex flex-col dark:text-white dark:border-brand-dark overflow-hidden transition-all duration-300`}
    >
      <div
        className="flex-1 min-h-0 flex flex-col overflow-hidden"
        style={{ height: `calc(100% - ${bottomHeight}px - 8px)` }}
      >
        <TopContainer />
      </div>

      {/* Resizable Divider */}
      <div
        onMouseDown={onMouseDown}
        className="h-2 w-full bg-gray-100 dark:bg-brand-dark hover:bg-blue-500 dark:hover:bg-blue-600 cursor-row-resize transition-colors duration-150 flex-none relative z-10"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
      </div>

      <div
        className="flex-none dark:bg-gray-900 bg-slate-100 border-t dark:border-brand-dark overflow-hidden"
        style={{ height: `${bottomHeight}px` }}
      >
        <BottomContainer />
      </div>
    </div>
  );
}

export default SidebarContainer;
