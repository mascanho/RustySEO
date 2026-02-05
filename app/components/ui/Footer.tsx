// @ts-nocheck
"use client";
import React, { useEffect, useState, useCallback } from "react";
import { LiaTasksSolid } from "react-icons/lia";
import { CgWebsite } from "react-icons/cg";
import { FaDatabase, FaRobot, FaTerminal } from "react-icons/fa6";
import { useChat } from "ai/react";
import {
  BsChatDots,
  BsLayoutSidebarInsetReverse,
  BsPeopleFill,
} from "react-icons/bs";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTrigger,
} from "@/components/ui/drawer";
import AIcontainer from "./AiContainer/AIcontainer";
import { useDisclosure } from "@mantine/hooks";
import TodoItems from "./TodoItems";
import { Drawer as MantineDrawer } from "@mantine/core";
import { IoMdClose } from "react-icons/io";
import { usePathname } from "next/navigation";
import { useVisibilityStore } from "@/store/VisibilityStore";
import { GiSurprisedSkull } from "react-icons/gi";
import FooterLoader from "./FooterLoader/FooterLoader";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import CrawlerType from "./Footer/CrawlerType";
import SeoToolkit from "./Footer/SeoToolkit/SeoToolkit";
import useGlobalConsoleStore from "@/store/GlobalConsoleLog";
import { Code } from "lucide-react";
import { useServerLogsStore } from "@/store/ServerLogsGlobalStore";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FaInfoCircle } from "react-icons/fa";
import PopOverParsedLogs from "@/app/serverlogs/_components/PopOverParsedLogs";
import ChangeLogContainer from "@/components/ui/changelog/ChangeLogContainer";
import System from "./Footer/Sys/System";
import LogAnalyserFooter from "./Footer/Loganalyserfooter/LoganalyserFooter";
import useLoaderStore from "@/store/loadersStore";
import HttpFooterLoader from "./URLchecker/FooterLoader";
import { IoTerminal } from "react-icons/io5";
import Terminal from "./Footer/Terminal/Terminal";

const date = new Date();
const year = date.getFullYear();

type Task = {
  id: string;
  title: string;
  type: string[];
  priority: string;
  url: [] | null;
  date: string;
  completed?: boolean;
};

const Footer = () => {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  const {
    visibility,
    showSidebar,
    hideSidebar,
    showSerpKeywords,
    hideSerpKeywords,
    showSeoToolkit,
    hideSeoToolkit,
    showChatbar,
    hideChatbar,
    showTerminal,
    hideTerminal,
  } = useVisibilityStore();

  // HTTP CHECKER FOOTER LOADER
  const { loaders, toggleHttpChecker } = useLoaderStore();

  const [openedDrawer, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false);
  const [hasOllama, setHasOllama] = useState("");
  const pathname = usePathname();
  const [openedAiDrawer, { open: openAiDrawer, close: closeAiDrawer }] =
    useDisclosure(false);
  const { crawlerType } = useGlobalCrawlStore();
  const { setTasksNumber } = useGlobalConsoleStore();
  const [logSorage, setLogStorage] = useState<boolean>(false);
  const { setStoringLogs, storingLogs } = useServerLogsStore();

  const deep = pathname === "/global";
  const shallow = pathname === "/";
  const serverLogs = pathname === "/serverlogs";

  const updateSessionState = () => {
    const storedUrl = sessionStorage?.getItem("url") || "";
    setUrl(storedUrl);

    const storedLoading = sessionStorage?.getItem("loading");
    setLoading(storedLoading === "true");
  };

  useEffect(() => {
    updateSessionState();

    const handleSessionStorageUpdate = () => {
      updateSessionState();
    };

    window.addEventListener(
      "sessionStorageUpdated",
      handleSessionStorageUpdate,
    );

    return () => {
      window.removeEventListener(
        "sessionStorageUpdated",
        handleSessionStorageUpdate,
      );
    };
  }, []);

  const updateTasks = () => {
    try {
      const storedTasks = JSON.parse(
        localStorage?.getItem("tasks") || "[]",
      ) as Task[];
      const filteredTasks = storedTasks.filter((task) => !task.completed);
      setTasks(filteredTasks);
      setTasksNumber(filteredTasks.length);
    } catch (error) {
      console.error("Error parsing tasks:", error);
    }
  };

  useEffect(() => {
    updateTasks();

    const handleTasksUpdated = () => {
      updateTasks();
    };

    window.addEventListener("tasksUpdated", handleTasksUpdated);

    return () => {
      window.removeEventListener("tasksUpdated", handleTasksUpdated);
    };
  }, []);

  const iconClasses =
    "cursor-pointer active:scale-95 transition-all ease-linear duration-75";

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "l") {
        event.preventDefault();
        openedDrawer ? closeDrawer() : openDrawer();
      }
      if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        openedAiDrawer ? closeAiDrawer() : openAiDrawer();
      }

      if (event.ctrlKey && event.key === "h") {
        event.preventDefault();
        if (visibility.sidebar) {
          hideSidebar();
        } else {
          showSidebar();
        }
      }
    },
    [
      openDrawer,
      closeDrawer,
      openedDrawer,
      openAiDrawer,
      closeAiDrawer,
      openedAiDrawer,
      visibility.sidebar,
      hideSidebar,
      showSidebar,
    ],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // GET THE STATUS OF THE DATABSE STORAGE FOR THE LOGS
  useEffect(() => {
    // Initial load
    const logStorageValue = JSON.parse(
      localStorage.getItem("logsStorage") || "false",
    );
    setLogStorage(logStorageValue);
    setStoringLogs(logStorageValue);

    // Cross-tab listener (storage event)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "logsStorage") {
        setLogStorage(JSON.parse(e.newValue || "false"));
      }
    };

    // Same-tab listener (custom event)
    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === "logsStorage") {
        setLogStorage(e.detail.value);

        setStoringLogs(e.detail.value);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "localStorageChange",
      handleCustomStorageChange as EventListener,
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "localStorageChange",
        handleCustomStorageChange as EventListener,
      );
    };
  }, []);
  return (
    <>
      <MantineDrawer
        offset={8}
        radius="sm"
        opened={openedDrawer}
        onClose={closeDrawer}
        title=""
        size="sm"
        position="left"
        shadow="xl"
        style={{ paddingTop: "5rem" }}
        closeOnEscape
        closeOnClickOutside
      >
        <TodoItems url={url} strategy={""} />
      </MantineDrawer>

      <ChangeLogContainer />

      <footer className="w-full justify-between bg-apple-silver dark:bg-brand-darker dark:text-white/50 shadow fixed ml-0 left-0 bottom-0 z-[999999999999999] border-t dark:border-t-brand-dark flex items-center px-2 text-xs h-9">
        <section className="flex items-center">
          <div className="flex items-center ml-2 space-x-1">
            {loading ? (
              <>
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-1" />
                <span className="mt-[5px] text-orange-500">Fetching...</span>
              </>
            ) : (
              url &&
              shallow && (
                <div className="flex items-center space-x-1">
                  <a href={url} rel="noreferrer">
                    <div className="relative group hover:delay-1000">
                      <CgWebsite className={`text-xl ${iconClasses}`} />
                      <div className="absolute bottom-[calc(100%+5px)] left-6 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity delay-1000 whitespace-nowrap">
                        Visit URL
                      </div>
                    </div>
                  </a>
                  {shallow ? <span className="mt-[2px]">{url}</span> : null}
                </div>
              )
            )}
            {deep && <CrawlerType />}
            {deep ? <FooterLoader /> : null}
            {serverLogs && (
              <div className="flex items-center">
                <Popover>
                  <PopoverTrigger>
                    <FaInfoCircle className=" text-sm ml-0.5 text-black mt-[1px] dark:text-white/50" />
                  </PopoverTrigger>
                  <PopoverContent className="min-w-70 max-w-96 max-h-[400px] py-2 px-0 mb-10 ml-2 relative z-20">
                    {/* <div className="h-5 w-5 absolute -top-2 right-32 bg-white rotate-45 border -z-10" /> */}
                    <PopOverParsedLogs />
                  </PopoverContent>
                </Popover>
                <section className="flex items-center ml-2.5">
                  <FaDatabase
                    className={`${logSorage ? "text-green-700 mt-[1px]" : "text-red-700 mt-[1px]"} mr-[5px] `}
                  />{" "}
                  {logSorage ? "" : ""}
                </section>
                <LogAnalyserFooter />
              </div>
            )}
          </div>
          {/* HTTP CHECKER LOADER  */}
          {loaders?.httpChecker && <HttpFooterLoader />}
        </section>
        <section className="flex items-center gap-1 pr-1.5">
          <div
            onClick={() => (openedDrawer ? closeDrawer() : openDrawer())}
            className={`flex items-center gap-2 px-2.5 h-7 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer relative group ${iconClasses}`}
          >
            <LiaTasksSolid className="text-[17px] dark:text-white/60 group-hover:dark:text-white" />
            <div className="absolute bottom-[calc(100%+8px)] left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
              Task List
            </div>
            <span className="leading-none text-[11px] font-medium hidden sm:inline opacity-70">
              Tasks:
            </span>
            <span className="text-sky-dark dark:text-sky-dark font-bold leading-none text-[11px]">
              {tasks.length}
            </span>
          </div>

          {/* SYSTEM SETTINGS */}
          <div className="relative group flex items-center">
            <div className="flex items-center justify-center h-7 w-8 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer">
              <System />
            </div>
            <div className="absolute bottom-[calc(100%+8px)] left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
              System Status
            </div>
          </div>

          {/* CHAT BUTTON */}
          <div className="relative group flex items-center">
            <div
              onClick={() =>
                visibility.chatbar ? hideChatbar() : showChatbar()
              }
              className={`flex items-center justify-center h-7 w-8 rounded transition-all cursor-pointer ${visibility.chatbar ? "bg-brand-bright/10" : "hover:bg-black/5 dark:hover:bg-white/5"}`}
            >
              <BsPeopleFill
                className={`text-[16px] transition-colors ${visibility.chatbar ? "text-brand-bright" : "dark:text-white/60 group-hover:dark:text-white"}`}
              />
            </div>
            <div className="absolute bottom-[calc(100%+8px)] left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
              AI Chat
            </div>
          </div>

          {/* TERMINAL/STATUS */}
          <div className="relative group flex items-center">
            <div
              onClick={() =>
                visibility.terminal ? hideTerminal() : showTerminal()
              }
              className={`flex items-center justify-center h-7 w-8 rounded transition-all cursor-pointer ${visibility.terminal ? "bg-brand-bright/10" : "hover:bg-black/5 dark:hover:bg-white/5"}`}
            >
              <FaTerminal
                className={`text-[15px] transition-colors ${visibility.terminal ? "text-brand-bright" : "dark:text-white/60 group-hover:dark:text-white"}`}
              />
            </div>
            <div className="absolute bottom-[calc(100%+8px)] left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
              Terminal Logs
            </div>
          </div>

          {/* SEO HELPKIT */}
          <div className="relative group flex items-center">
            <div
              onClick={() =>
                visibility.seotoolkit ? hideSeoToolkit() : showSeoToolkit()
              }
              className={`flex items-center justify-center h-7 w-8 rounded transition-all cursor-pointer ${visibility.seotoolkit ? "bg-brand-bright/10" : "hover:bg-black/5 dark:hover:bg-white/5"}`}
            >
              <GiSurprisedSkull
                className={`text-[18px] transition-colors ${visibility.seotoolkit ? "text-brand-bright" : "dark:text-white/60 group-hover:dark:text-white"}`}
              />
            </div>
            <div className="absolute bottom-[calc(100%+8px)] left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
              SEO Toolkit
            </div>
          </div>

          {/* RUSTY AI ROBOT */}
          <Drawer
            open={openedAiDrawer}
            onOpenChange={(open) => (open ? openAiDrawer() : closeAiDrawer())}
          >
            <div className="relative group flex items-center">
              <div
                onClick={() =>
                  openedAiDrawer ? closeAiDrawer() : openAiDrawer()
                }
                className={`flex items-center justify-center h-7 w-8 rounded transition-all cursor-pointer ${openedAiDrawer ? "bg-brand-bright/10" : "hover:bg-black/5 dark:hover:bg-white/5"}`}
              >
                <FaRobot
                  className={`text-[19px]  transition-colors ${openedAiDrawer ? "text-brand-bright" : "dark:text-white/60 group-hover:dark:text-white"}`}
                />
              </div>
              <div className="absolute bottom-[calc(100%+8px)] left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
                Rusty AI
              </div>
            </div>
            <DrawerContent>
              <DrawerHeader>
                <div className="flex items-center space-x-2">
                  <FaRobot
                    className={`text-2xl pb-1 text-brand-highlight ${iconClasses}`}
                  />
                  <span className="text-xl font-bold text-brand-highlight dark:text-white/40">
                    Rusty AI
                  </span>
                </div>
                <DrawerDescription>
                  <AIcontainer />
                </DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <DrawerClose
                  className={`dark:text-white text-gray-600 absolute right-4 top-6 dark:text-white/30 ${iconClasses}`}
                >
                  <div className="relative group hover:delay-1000">
                    <IoMdClose className="text-lg" />
                    <div className="absolute bottom-[calc(100%+5px)] right-0 bg-gray-800 text-white text-[9px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity delay-1000 whitespace-nowrap">
                      Rusty AI
                    </div>
                  </div>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>

          {/* SIDEBAR TOGGLE */}
          <div className="relative group flex items-center">
            <button
              disabled={pathname === "/serverlogs"}
              onClick={() =>
                visibility.sidebar ? hideSidebar() : showSidebar()
              }
              className={`flex items-center justify-center h-7 w-8 rounded transition-all ${pathname === "/serverlogs" ? "cursor-not-allowed opacity-30" : "hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"}`}
            >
              <BsLayoutSidebarInsetReverse
                className={`text-[15px] transition-colors ${visibility.sidebar ? "text-brand-bright" : "dark:text-white/60 group-hover:dark:text-white"}`}
              />
            </button>
            <div className="absolute bottom-[calc(100%+8px)] -right-1 bg-gray-900 text-white text-[10px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
              Toggle Sidebar
            </div>
          </div>
        </section>
        {/* SEO TOOLKIT MODAL */}
        {visibility.seotoolkit && (
          <SeoToolkit
            hideSeoToolkit={hideSeoToolkit}
            showSeoToolkit={showSeoToolkit}
          />
        )}{" "}
        {/* TERMINAL MODAL */}
        <Terminal />
      </footer>
    </>
  );
};

export default Footer;
