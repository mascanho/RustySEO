// @ts-nocheck
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
import { Alert, Drawer, Modal } from "@mantine/core";
import Todo from "./Todo";
import { useDisclosure } from "@mantine/hooks";
import TodoItems from "./TodoItems";
import { useCallback, useEffect, useState } from "react";
import PageSpeedInsigthsApi from "../PageSpeedInsigthsApi";
import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import OllamaSelect from "./OllamaSelector/OllamaSelect";
import GoogleSearchConsoleModal from "./GoogleSearchConsole/GoogleSearchConsoleModal";
import { useRouter } from "next/navigation";
import WindowToggler from "./Panes/WindowToggler";
import GeminiSelector from "./GeminiSelector/GeminiSelector";
import About from "./About/About";
import { invoke } from "@tauri-apps/api/tauri";
import { save } from "@tauri-apps/api/dialog";
import { writeTextFile } from "@tauri-apps/api/fs";
import { LuPanelRight } from "react-icons/lu";
import {
  FiFile,
  FiEye,
  FiCheckSquare,
  FiBarChart2,
  FiZap,
  FiTool,
  FiHelpCircle,
  FiLogOut,
} from "react-icons/fi";
import { FaRegLightbulb, FaRegMoon } from "react-icons/fa";
import { AiOutlineShareAlt, AiOutlinePrinter } from "react-icons/ai";

const TopMenuBar = () => {
  const [download, setDownload] = useState("");
  const onClose = useCallback(async () => {
    const { appWindow } = await import("@tauri-apps/api/window");
    appWindow.close();
  }, []);

  const router = useRouter();
  // Theme
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem("dark-mode");
    if (theme === true) {
      setIsDarkMode(true);
    } else {
      setIsDarkMode(false);
    }
  }, []);

  const [openedPageSpeed, { open: openPageSpeed, close: closePageSpeed }] =
    useDisclosure(false);
  const [openedDrawer, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false);
  const [openedModal, { open: openModal, close: closeModal }] =
    useDisclosure(false);
  const [url, setUrl] = useState<string>("");
  const [strategy, setStrategy] = useState("");

  const [openedOllama, { open: openOllama, close: closeOllama }] =
    useDisclosure(false);
  const [openedGemini, { open: openGemini, close: closeGemini }] =
    useDisclosure(false);
  const [openedPanes, { open: openPanes, close: closePanes }] =
    useDisclosure(false);
  const [openedAbout, { open: openAbout, close: closeAbout }] =
    useDisclosure(false);

  const [
    openedSearchConsole,
    { open: openSearchConsole, close: closeSearchConsole },
  ] = useDisclosure(false);

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

  // CHANGE THEME

  const toggleDarkMode = () => {
    // Get the current mode
    const newMode = !isDarkMode;

    // Update the state
    setIsDarkMode(newMode);

    // Update localStorage
    localStorage.setItem("dark-mode", newMode);

    // Toggle the dark mode class on the document
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    // Retrieve the dark mode setting from localStorage
    const savedMode = localStorage.getItem("dark-mode");

    // If a saved mode exists, parse it and update the state
    if (savedMode !== null) {
      const parsedMode = JSON.parse(savedMode);
      setIsDarkMode(parsedMode);

      // Update the class on the document
      if (parsedMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  // Handle download
  const handleDownloadSEO = async () => {
    let path;
    invoke("generate_seo_csv").then((result) => {
      console.log(result);
      setDownload(result);
    });

    path = await save({
      defaultPath: "seo.csv",
      filters: [
        {
          name: "CSV Files",
          extensions: ["csv"],
        },
      ],
    });
    if (path) {
      await writeTextFile(path, download);
      console.log("File saved successfully");
    }
  };

  // Handle download
  const handleDownloadPerformance = async () => {
    let path;
    invoke("generate_csv_command").then((result) => {
      console.log(result);
      // @ts-ignore
      setDownload(result);
    });

    path = await save({
      defaultPath: "performance.csv",
      filters: [
        {
          name: "CSV Files",
          extensions: ["csv"],
        },
      ],
    });
    if (path) {
      await writeTextFile(path, download);
      console.log("File saved successfully");
    }
  };

  // Handle adding to-do
  const handleAddTodo = (url: string, strategy: string) => {
    setTodoStrategy(strategy);
    setTodoUrl(url);
    openModal();
  };

  return (
    <>
      {/* Panes Insights Modal */}
      <Modal
        opened={openedPanes}
        // overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
        closeOnEscape
        closeOnClickOutside
        onClose={closePanes}
        title="Toggle Panels"
        centered
        // zIndex={"100000"}
      >
        <WindowToggler />
      </Modal>
      {/* PageSpeed Insights Modal */}
      <Modal
        opened={openedPageSpeed}
        // overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
        closeOnEscape
        closeOnClickOutside
        onClose={closePageSpeed}
        title="Page Speed Insights API key"
        centered
        // zIndex={"100000"}
      >
        <PageSpeedInsigthsApi close={closePageSpeed} />
      </Modal>
      {/* Todo Modal */}
      <Modal
        opened={openedModal}
        // overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
        closeOnEscape
        closeOnClickOutside
        onClose={closeModal}
        title=""
        centered
        // zIndex={"100000"}
      >
        <Todo url={url} close={closeModal} strategy={strategy} />
      </Modal>
      {/* Ollama Model */}
      <Modal
        opened={openedOllama}
        // overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
        closeOnEscape
        closeOnClickOutside
        onClose={closeOllama}
        title="Ollama Model Selector"
        centered
        size={"500px"}
        // zIndex={"100000"}
      >
        <OllamaSelect closeOllama={closeOllama} />
      </Modal>
      {/* Gemini Model */}
      <Modal
        opened={openedGemini}
        // overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
        closeOnEscape
        closeOnClickOutside
        onClose={closeGemini}
        title="Google Gemini"
        centered
        size={"500px"}
        // zIndex={"100000"}
      >
        <GeminiSelector closeGemini={closeGemini} />
      </Modal>
      {/* About Section */}
      <Modal
        opened={openedAbout}
        // overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
        closeOnEscape
        closeOnClickOutside
        onClose={closeAbout}
        title="About RustySEO"
        centered
        size={"500px"}
        // zIndex={"100000"}
      >
        <About closeGemini={closeAbout} />
      </Modal>
      {/* Drawer */}
      <Drawer
        offset={8}
        radius="md"
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
        <TodoItems url={url} strategy={strategy} />
      </Drawer>
      {/* GOOGLE SEACH CONSOLE MODAL */}
      <Modal
        opened={openedSearchConsole}
        onClose={closeSearchConsole}
        title="Search Console"
        centered
      >
        {/* @ts-ignore */}
        <GoogleSearchConsoleModal close={closeSearchConsole} />
      </Modal>
      {/* Menubar */}
      <Menubar className="fixed w-full top-0 z-[1000] p-0 pl-0 dark:bg-brand-darker dark:text-white bg-white dark:border-b-brand-dark border-b pb-1">
        <section className="flex -ml-3 space-x-1">
          <MenubarMenu>
            <MenubarTrigger className="ml-4">File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={onClose}>
                <FiLogOut className="mr-2" />
                Exit
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="ml-4">View</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={openPanes}>
                <FiEye className="mr-2" />
                Panels <MenubarShortcut>ctr + p</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={toggleDarkMode}>
                {isDarkMode ? (
                  <>
                    <FaRegLightbulb className="mr-2" /> Light Mode
                  </>
                ) : (
                  <>
                    <FaRegMoon className="mr-2" /> Dark Mode
                  </>
                )}
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="ml-3">Tasks</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={openModal}>
                <FiCheckSquare className="mr-2" />
                New task
                <MenubarShortcut>⌘T</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={openDrawer}>
                <LuPanelRight className="mr-2" />
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
              <MenubarItem onClick={handleDownloadPerformance}>
                <FiBarChart2 className="mr-2" />
                Performance History
              </MenubarItem>
              <MenubarItem onClick={handleDownloadSEO}>
                <FiBarChart2 className="mr-2" />
                SEO History
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                <AiOutlineShareAlt className="mr-2" />
                Share
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                <AiOutlinePrinter className="mr-2" />
                Print
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="ml-3">Connectors</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={openPageSpeed}>
                <FiZap className="mr-2" />
                PageSpeed Insights
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={openSearchConsole}>
                <FiZap className="mr-2" />
                Search Console
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem className="flex items-center" onClick={openOllama}>
                <FiZap className="mr-2" />
                Ollama{" "}
                <span className="text-[10px] text-gray-300/50 ml-1">
                  (AI Models)
                </span>
              </MenubarItem>
              <MenubarItem className="flex items-center" onClick={openGemini}>
                <FiZap className="mr-2" />
                Google Gemini
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="ml-3">Tools</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => router.push("/")}>
                <FiTool className="mr-2" />
                Page Crawler
              </MenubarItem>
              <MenubarItem onClick={() => router.push("/global")}>
                <FiTool className="mr-2" />
                Global Crawler
              </MenubarItem>
              <MenubarItem onClick={() => router.push("/images")}>
                <FiTool className="mr-2" />
                Image Converter
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="ml-3">Help</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={openAbout}>
                <FiHelpCircle className="mr-2" />
                About
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </section>
      </Menubar>{" "}
    </>
  );
};

export default TopMenuBar;
