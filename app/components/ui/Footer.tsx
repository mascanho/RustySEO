"use client";
import React, { useEffect, useState } from "react";
import { LiaTasksSolid } from "react-icons/lia";
import { CgWebsite } from "react-icons/cg";
import { FaRobot } from "react-icons/fa6";
import { useChat } from "ai/react";
import { BsLayoutSidebarInsetReverse } from "react-icons/bs";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button, Modal } from "@mantine/core";
import AIcontainer from "./AiContainer/AIcontainer";
import { useVisibilityStore } from "@/store/VisibilityStore";
import { useDisclosure } from "@mantine/hooks";
import Todo from "./Todo";
import TodoItems from "./TodoItems";
import { Drawer as MantineDrawer } from "@mantine/core";
import { IoMdClose } from "react-icons/io";

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
  const { visibility, showSidebar, hideSidebar } = useVisibilityStore();
  const [openedDrawer, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false);
  const [hasOllama, setHasOllama] = useState("");

  // Function to update URL and loading state from session storage
  const updateSessionState = () => {
    const storedUrl = sessionStorage.getItem("url") || "";
    setUrl(storedUrl);

    const storedLoading = sessionStorage.getItem("loading");
    setLoading(storedLoading === "true");
  };

  // Effect to handle initial data load and set up event listener
  useEffect(() => {
    updateSessionState(); // Initial load

    const handleSessionStorageUpdate = () => {
      updateSessionState(); // Update state when session storage changes
    };

    window.addEventListener(
      "sessionStorageUpdated",
      handleSessionStorageUpdate,
    );

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener(
        "sessionStorageUpdated",
        handleSessionStorageUpdate,
      );
    };
  }, []);

  // Function to update tasks
  const updateTasks = () => {
    try {
      const storedTasks = JSON.parse(
        localStorage.getItem("tasks") || "[]",
      ) as Task[];
      const filteredTasks = storedTasks.filter((task) => !task.completed);
      setTasks(filteredTasks);
    } catch (error) {
      console.error("Error parsing tasks:", error);
    }
  };

  // Effect to update tasks and listen for the "tasksUpdated" event
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
        // overlayProps={{ backgroundOpacity: 0.5 }}
      >
        <TodoItems url={url} strategy={""} />
      </MantineDrawer>

      <footer className="w-full justify-between bg-apple-silver dark:bg-brand-darker dark:text-white/50 shadow fixed ml-0 left-0 bottom-0 z-[1000000] border-t-2 pb-1.5 dark:border-t-brand-dark flex items-center py-1 overflow-hidden text-xs">
        <section>
          <div className="flex items-center ml-2 space-x-1 w-full">
            {loading ? (
              <>
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-1" />
                <span className="mt-[5px] text-orange-500">Fetching...</span>
              </>
            ) : (
              url && (
                <div className="flex items-center space-x-1">
                  <a href={url} rel="noreferrer">
                    <CgWebsite className="text-xl" />
                  </a>
                  <span className="mt-[2px]">{url}</span>
                </div>
              )
            )}
          </div>
        </section>
        <section className="flex items-center space-x-2">
          <div className="flex w-50 items-center justify-center pr-3">
            <div className="flex items-center  text-xs mt-[2px] space-x-3">
              <div
                onClick={() => (openedDrawer ? closeDrawer() : openDrawer())}
                className="flex items-center cursor-pointer pt-[2px]"
              >
                <LiaTasksSolid className="text-sm dark:text-white/50" />
                <span>Tasks:</span>
                <span className="text-sky-dark dark:text-sky-dark ml-1">
                  {tasks.length}
                </span>
              </div>
              <Drawer>
                <DrawerTrigger className="flex items-center space-x-1">
                  <FaRobot className="text-lg pb-[2px]" />
                  {/* <span className="text-xs mt-[2px]">Oxide AI</span> */}
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <div className="flex items-center space-x-2">
                      <FaRobot
                        onClick={() =>
                          openedDrawer ? closeDrawer() : openDrawer()
                        }
                        className="text-2xl text-brand-highlight"
                      />
                      <span className="text-xl font-bold text-brand-highlight dark:text-white/40">
                        Rusty Chat
                      </span>
                    </div>
                    <DrawerDescription>
                      <AIcontainer />
                    </DrawerDescription>
                  </DrawerHeader>
                  <DrawerFooter>
                    <DrawerClose className="dark:text-white text-gray-600 absolute right-4 top-6 dark:text-white/30">
                      <IoMdClose className="text-lg" />
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
              <BsLayoutSidebarInsetReverse
                className="text-base hover:scale-105  transition-all ease-linear delay-75 cursor-pointer"
                onClick={() => {
                  // Toggle visibility based on current state
                  if (visibility.sidebar) {
                    hideSidebar();
                  } else {
                    showSidebar();
                  }
                }}
              />
            </div>
          </div>
        </section>
      </footer>
    </>
  );
};

export default Footer;
