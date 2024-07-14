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
import { invoke } from "@tauri-apps/api/tauri";
import PageSpeedInsigthsApi from "../PageSpeedInsigthsApi";

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

  // Get the url currently being searched from the session storage
  useEffect(() => {
    const fetchUrlFromSessionStorage = () => {
      const urlSession: any = window.sessionStorage.getItem("url");
      setUrl(urlSession);
    };

    fetchUrlFromSessionStorage(); // Call function initially

    // Clean-up function (optional)
    return () => {
      // This function runs when the component unmounts or useEffect runs again
      // It's optional and can be omitted if not needed
    };
  }, [openModal, openedModal]);

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
        {openedModal && <Todo url={url} close={closeModal} />}
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
        <TodoItems url={url} />
      </Drawer>
      <Menubar className="fixed w-full top-0 z-[1001] p-0 text-black/50 shadow">
        <MenubarMenu>
          <MenubarTrigger className="ml-4">File</MenubarTrigger>
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
            <MenubarItem onClick={openModal}>New task</MenubarItem>
            <MenubarItem>New</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Share</MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={open}>View all tasks</MenubarItem>
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
            <MenubarItem>New Window</MenubarItem>
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
