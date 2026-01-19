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
      className={`w-[325px] border-l-2 max-w-5xl absolute top-0 right-0 mx-auto h-[calc(100vh-3rem)] pt-16 ${visibility.changelog ? "block" : "hidden"}  border dark:border-brand-dark bg-white dark:bg-brand-darker z-50  ${serverlogs && "mt-2 h-full"} ${shallow && "-mt-[5.1rem]"} ${ppc && "h-full "} z-[999999] `}
    >
      <X
        onClick={() => hideChangelog()}
        className="absolute top-6  right-4 h-4 w-4 cursor-pointer dark:text-red-700"
      />
      <Changelog />
    </section>
  );
}

export default ChangeLogContainer;
