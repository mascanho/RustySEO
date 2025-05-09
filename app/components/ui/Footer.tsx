"use client";
import React, { useEffect, useState, useCallback } from "react";
import { LiaTasksSolid } from "react-icons/lia";
import { CgWebsite } from "react-icons/cg";
import { FaRobot } from "react-icons/fa6";
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
  } = useVisibilityStore();
  const [openedDrawer, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false);
  const [hasOllama, setHasOllama] = useState("");
  const pathname = usePathname();
  const [openedAiDrawer, { open: openAiDrawer, close: closeAiDrawer }] =
    useDisclosure(false);
  const { crawlerType } = useGlobalCrawlStore();
  const { setTasksNumber } = useGlobalConsoleStore();

  const deep = pathname === "/global";
  const shallow = pathname === "/";

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

      <footer className="w-full justify-between bg-apple-silver dark:bg-brand-darker dark:text-white/50 shadow fixed ml-0 left-0 bottom-0 z-[99999999999] border-t-2 pb-1.5 dark:border-t-brand-dark flex items-center py-1 text-xs">
        <section>
          <div className="flex items-center ml-2 space-x-1 w-full">
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
          </div>
        </section>
        <section className="flex items-center space-x-2">
          <div className="flex w-50 items-center justify-center pr-3">
            <div className="flex items-center text-xs mt-[2px] space-x-[1em]">
              <div
                onClick={() => (openedDrawer ? closeDrawer() : openDrawer())}
                className="flex items-center cursor-pointer relative group hover:delay-1000"
              >
                <LiaTasksSolid
                  className={`text-sm dark:text-white/50 ${iconClasses}`}
                />
                <div className="absolute bottom-[calc(100%+5px)] left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[9px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity delay-1000 whitespace-nowrap">
                  Task List
                </div>
                <span>Tasks:</span>
                <span className="text-sky-dark dark:text-sky-dark ml-1">
                  {tasks.length}
                </span>
              </div>

              {/* CHAT BUTTON */}

              <div className="relative group hover:delay-1000">
                <BsPeopleFill
                  onClick={() =>
                    visibility.chatbar ? hideChatbar() : showChatbar()
                  }
                  className={`text-sm mb-[2px] cursor-pointer ${visibility.chatbar && "text-brand-bright"}`}
                />
                <div className="absolute bottom-[calc(100%+5px)] left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[9px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity delay-1000 whitespace-nowrap">
                  Open chat
                </div>
              </div>

              {/* TODO: FIX THE GOOGLE CRAWL ISSUE  */}
              {/* <div className="relative group hover:delay-1000"> */}
              {/*   <ImGoogle3 */}
              {/*     onClick={() => */}
              {/*       visibility.serpKeywords */}
              {/*         ? hideSerpKeywords() */}
              {/*         : showSerpKeywords() */}
              {/*     } */}
              {/*     className={iconClasses} */}
              {/*   /> */}
              {/*   <div className="absolute bottom-[calc(100%+5px)] left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[9px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity delay-1000 whitespace-nowrap"> */}
              {/*     Google Crawler */}
              {/*   </div> */}
              {/* </div> */}

              {/* SEO HELPKIT */}
              <div className="relative group hover:delay-1000">
                <GiSurprisedSkull
                  onClick={() =>
                    visibility.seotoolkit ? hideSeoToolkit() : showSeoToolkit()
                  }
                  className={`${iconClasses} ${visibility.seotoolkit && "text-brand-bright"}`}
                  style={{ fontSize: "15px", marginBottom: "0.5px" }}
                />
                <div className="absolute bottom-[calc(100%+5px)] left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[9px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity delay-1000 whitespace-nowrap">
                  SEO Resources
                </div>
              </div>

              <Drawer
                open={openedAiDrawer}
                onOpenChange={(open) =>
                  open ? openAiDrawer() : closeAiDrawer()
                }
              >
                {/* <DrawerTrigger className="flex items-center space-x-1"> */}
                <div className="relative group hover:delay-1000">
                  <FaRobot
                    onClick={() =>
                      openedAiDrawer ? closeAiDrawer() : openAiDrawer()
                    }
                    className={`pb-[2px] cursor-pointer z-50 text-base ${iconClasses} ${openedAiDrawer && "text-brand-bright cursor-pointer"} ${!openedAiDrawer && "cursor-pointer"}`}
                  />
                  <div className="absolute bottom-[calc(100%+5px)] left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[9px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity delay-1000 whitespace-nowrap">
                    Rusty AI
                  </div>
                </div>
                {/* </DrawerTrigger> */}
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

              <button
                disabled={pathname === "/serverlogs"}
                className={`relative group hover:delay-1000 ${pathname === "/serverlogs" ? "not cursor-not-allowed" : " "}`}
              >
                <BsLayoutSidebarInsetReverse
                  className={`text-sm ${iconClasses} ${visibility.sidebar && "text-brand-bright"} ${pathname === "/serverlogs" ? "text-gray-400 cursor-not-allowed" : ""}`}
                  onClick={() => {
                    if (visibility.sidebar) {
                      hideSidebar();
                    } else {
                      showSidebar();
                    }
                  }}
                />
                <div className="absolute bottom-[calc(100%+5px)] -right-2 bg-gray-800 text-white text-[9px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity delay-1000 whitespace-nowrap">
                  Toggle Sidebar
                </div>
              </button>
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
      </footer>
    </>
  );
};

export default Footer;
