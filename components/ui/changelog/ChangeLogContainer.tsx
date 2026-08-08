"use client";
import { usePathname } from "next/navigation";
import Changelog from "./Changelog";
import { X } from "lucide-react";
import { useVisibilityStore } from "@/store/VisibilityStore";

function ChangeLogContainer() {
  const { visibility, hideChangelog } = useVisibilityStore();
  const pathname = usePathname();

  const deep = pathname === "/global";
  const shallow = pathname === "/";
  const serverlogs = pathname === "/serverlogs";
  const ppc = pathname === "/ppc";

  return (
    <section
      className={`w-[425px] border-l-2 max-w-5xl absolute top-0 right-0 mx-auto h-[calc(100vh-3.3rem)] pt-16 ${visibility.changelog ? "block" : "hidden"}  border dark:border-brand-dark bg-white dark:bg-brand-darker z-50  ${serverlogs && "mt-4 h-full"} ${shallow && "-mt-[5.1rem] h-[calc(100vh-2.8rem)] "} ${ppc && "h-full "} z-[9999] shadow-lg`}
    >
      <button
        onClick={() => hideChangelog()}
        aria-label="Close changelog"
        className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
      <Changelog />
    </section>
  );
}

export default ChangeLogContainer;
