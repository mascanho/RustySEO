"use client";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Drawer, Modal } from "@mantine/core";
import Todo from "./Todo";
import { useDisclosure } from "@mantine/hooks";
import TodoItems from "./TodoItems";
import { useCallback, useEffect, useState } from "react";
import PageSpeedInsigthsApi from "../PageSpeedInsigthsApi";
import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import { LuPanelRight } from "react-icons/lu";

const TopMenuBar = () => {
  const onClose = useCallback(async () => {
    const { appWindow } = await import("@tauri-apps/api/window");
    appWindow.close();
  }, []);

  const [openedPageSpeed, { open: openPageSpeed, close: closePageSpeed }] =
    useDisclosure(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [openedModal, { open: openModal, close: closeModal }] =
    useDisclosure(false);
  const [url, setUrl] = useState<string>("");
  const [strategy, setStrategy] = useState("");

  useEffect(() => {
    const fetchUrlFromSessionStorage = () => {
      const urlSession: any = window?.sessionStorage?.getItem("url");
      const strategySession: any = window?.sessionStorage?.getItem("strategy");
      setUrl(urlSession || ""); // Handle empty URL case
      setStrategy(strategySession || "DESKTOP");
    };

    fetchUrlFromSessionStorage();

    // Optional cleanup
    return () => {
      // Cleanup logic if needed
    };
  }, [openModal, openedModal, url, strategy]);

  return (
    <>
      <Modal
        opened={openedModal || openedPageSpeed}
        overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
        closeOnEscape
        closeOnClickOutside
        onClose={openedModal ? closeModal : closePageSpeed}
        title={openedModal ? "" : "Page Speed Insights API key"}
        centered
      >
        {openedModal && (
          <Todo url={url} close={closeModal} strategy={strategy} />
        )}
        {openedPageSpeed && <PageSpeedInsigthsApi />}
      </Modal>

      <Drawer
        offset={8}
        radius="md"
        opened={opened}
        onClose={close}
        title=""
        size="sm"
        position="left"
        shadow="xl"
        style={{ paddingTop: "5rem" }}
        closeOnEscape
        closeOnClickOutside
        overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
      >
        <TodoItems url={url} strategy={strategy} />
      </Drawer>
      <Menubar className="fixed w-full top-0 z-[1000] p-0 pl-1 dark:bg-gray-400 bg-white ">
        <MenubarMenu>
          <MenubarTrigger className="ml-4">File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={onClose}>Exit</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="ml-4">View</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              New Tab <MenubarShortcut>⌘T</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>New Window</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Share</MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={onClose}>Exit</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger className="ml-3">Tasks</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={openModal}>
              New task
              <MenubarShortcut>⌘T</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>New</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Share</MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={open}>
              View all tasks
              <MenubarShortcut>
                <LuPanelRight />
              </MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger className="ml-3">Reports</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              New Tab <MenubarShortcut>⌘T</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>New Window</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Share</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Print</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger className="ml-3">Connectors</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={openPageSpeed}>PageSpeed Key</MenubarItem>
            <MenubarItem
              onClick={() => {
                openBrowserWindow("https://www.ollama.com/");
              }}
            >
              Ollama
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Share</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Print</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger className="ml-3">Tools</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={openPageSpeed}>PageSpeed Key</MenubarItem>
            <MenubarItem
              onClick={() => {
                openBrowserWindow("https://www.ollama.com/");
              }}
            >
              Ollama
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Share</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Print</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger className="ml-3">Help</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={openPageSpeed}>PageSpeed Key</MenubarItem>
            <MenubarItem
              onClick={() => {
                openBrowserWindow("https://www.ollama.com/");
              }}
            >
              Ollama
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Share</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Print</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </>
  );
};

export default TopMenuBar;
