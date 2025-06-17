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
import { Alert, Drawer, MenuItem, Modal } from "@mantine/core";
import Todo from "./Todo";
import { useDisclosure } from "@mantine/hooks";
import TodoItems from "./TodoItems";
import { useCallback, useEffect, useState } from "react";
import PageSpeedInsigthsApi from "../PageSpeedInsigthsApi";
import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import OllamaSelect from "./OllamaSelector/OllamaSelect";
import GoogleSearchConsoleModal from "./GoogleSearchConsole/GoogleSearchConsoleModal";
import { usePathname, useRouter } from "next/navigation";
import WindowToggler from "./Panes/WindowToggler";
import GeminiSelector from "./GeminiSelector/GeminiSelector";
import About from "./About/About";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
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
  FiGlobe,
  FiSearch,
} from "react-icons/fi";
import { GiRobotGrab } from "react-icons/gi";
import { FaRegLightbulb, FaRegMoon } from "react-icons/fa";
import { AiOutlineShareAlt, AiOutlinePrinter } from "react-icons/ai";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useVisibilityStore } from "@/store/VisibilityStore";
import KeywordSerp from "./TopMenuBar/KeywordSerp";
import GoogleAnalyticsModal from "./GoogleAnalyticsModal/GoogleAnalyticsModal";
import Configurations from "./TopMenuBar/Configurations/Configurations";
import { FaGear } from "react-icons/fa6";
import MSClarity from "./MSClarityModal/MSClarityModal";
import { getCurrentWindow } from "@tauri-apps/api/window";
import CustomSearchSelector from "./Extractors/CustomSearchSelector";
import { PiGitDiff } from "react-icons/pi";
import DiffChecker from "./DiffChecker/DiffChecker";
import { GoFileDiff } from "react-icons/go";
import { Settings } from "lucide-react";
import PowerBi from "./MSClarityModal/PowerBi";
import { useOnboardingStore } from "@/store/OnboardingStore";
import { BiDoorOpen, BiLogoSlackOld } from "react-icons/bi";
import { CiSettings } from "react-icons/ci";

const TopMenuBar = () => {
  const [download, setDownload] = useState("");
  const pathname = usePathname();

  const {
    visibility,
    showSerpKeywords,
    hideSerpKeywords,
    showCustomSearch,
    hideCustomSearch,
    showChangelog,
  } = useVisibilityStore();

  const router = useRouter();
  // Theme
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const theme = localStorage?.getItem("dark-mode");
    if (theme === "true") {
      // Changed to string comparison
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

  const [openedMSClarity, { open: openMSClarity, close: closeMSClarity }] =
    useDisclosure(false);

  const [openedPowerBi, { open: openPowerBi, close: closePowerBi }] =
    useDisclosure(false);

  const [
    openedGoogleAnalytics,
    { open: openGoogleAnalytics, close: closeGoogleAnalytics },
  ] = useDisclosure(false);

  const [openedConfs, { open: openConfs, close: closeConfs }] =
    useDisclosure(false);

  // Diff Crawl Checker
  const [
    openedDiffChecker,
    { open: openDiffChecker, close: closeDiffChecker },
  ] = useDisclosure(false);

  // HANDLE ONBOARDING MODAL
  const [showOnboarding, setShowOnboarding] = useState(false);
  const completed = useOnboardingStore((state) => state.completed);

  useEffect(() => {
    const fetchUrlFromSessionStorage = () => {
      const urlSession: any = window?.sessionStorage?.getItem("url");
      const strategySession: any = window?.sessionStorage?.getItem("strategy");
      setUrl(urlSession || "");
      setStrategy(strategySession || "DESKTOP");
    };

    fetchUrlFromSessionStorage();

    return () => {
      // Cleanup logic if needed
    };
  }, [openModal, openedModal, url, strategy]);

  // CHANGE THEME
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage?.setItem("dark-mode", newMode.toString());
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    const savedMode = localStorage?.getItem("dark-mode");
    if (savedMode !== null) {
      const parsedMode = savedMode === "true";
      setIsDarkMode(parsedMode);
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
      filters: [{ name: "CSV Files", extensions: ["csv"] }],
    });
    if (path) {
      await writeTextFile(path, download);
      console.log("File saved successfully");
    }
  };

  const handleDownloadPerformance = async () => {
    let path;
    invoke("generate_csv_command").then((result) => {
      console.log(result);
      // @ts-ignore
      setDownload(result);
    });

    path = await save({
      defaultPath: "performance.csv",
      filters: [{ name: "CSV Files", extensions: ["csv"] }],
    });
    if (path) {
      await writeTextFile(path, download);
      console.log("File saved successfully");
    }
  };

  const handleAddTodo = (url: string, strategy: string) => {
    setUrl(url); // Changed from setTodoUrl
    setStrategy(strategy); // Changed from setTodoStrategy
    openModal();
  };

  // OPEN Configurations FILE USING NATIVE TEXT EDITOR
  async function handleOpenConfigFile() {
    try {
      await invoke("open_configs_with_native_editor");
      console.log("Config file opened successfuylly");
    } catch (error) {
      console.error("failed to open the file", error);
    }
  }

  // Sync with localstorage to avoid double click
  useEffect(() => {
    // Sync with localStorage on mount
    const savedValue = localStorage.getItem("onboarding") === "true";
    if (savedValue !== completed) {
      useOnboardingStore.setState({ completed: savedValue });
    }

    // Listen for storage events (changes from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "onboarding") {
        useOnboardingStore.setState({ completed: e.newValue === "true" });
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Handles the click on the menu
  const handleOnboarding = () => {
    // Get current state directly from the store
    const currentState = useOnboardingStore.getState().completed;

    // Calculate new value
    const newValue = !currentState;

    // Update both localStorage and Zustand store
    localStorage.setItem("onboarding", String(newValue));
    useOnboardingStore.setState({ completed: newValue });
  };

  return (
    <>
      {/* Panes Insights Modal */}
      <Modal
        opened={openedPanes}
        closeOnEscape
        closeOnClickOutside
        onClose={closePanes}
        title="Toggle Panels"
        centered
      >
        <WindowToggler />
      </Modal>

      {/* PageSpeed Insights Modal */}
      <Modal
        opened={openedPageSpeed}
        closeOnEscape
        closeOnClickOutside
        onClose={closePageSpeed}
        title="Page Speed Insights API key"
        centered
      >
        <PageSpeedInsigthsApi close={closePageSpeed} />
      </Modal>

      {/* MS CLARITY MODAL */}
      <Modal
        opened={openedMSClarity}
        closeOnEscape
        closeOnClickOutside
        onClose={closeMSClarity}
        title="Microsoft Clarity Connector"
        centered
      >
        <MSClarity close={closeMSClarity} />
      </Modal>

      {/* MS  Power BI MODAL */}
      <Modal
        opened={openedPowerBi}
        closeOnEscape
        closeOnClickOutside
        onClose={closePowerBi}
        title="Microsoft Power BI Connector"
        centered
      >
        <PowerBi close={closePowerBi} />
      </Modal>

      {/* Todo Modal */}
      <Modal
        opened={openedModal}
        closeOnEscape
        closeOnClickOutside
        onClose={closeModal}
        title=""
        centered
      >
        <Todo url={url} close={closeModal} strategy={strategy} />
      </Modal>

      {/* Ollama Model */}
      <Modal
        opened={openedOllama}
        closeOnEscape
        closeOnClickOutside
        onClose={closeOllama}
        title="Ollama Model Selector"
        centered
        size={"500px"}
      >
        <OllamaSelect closeOllama={closeOllama} />
      </Modal>

      {/* Gemini Model */}
      <Modal
        opened={openedGemini}
        closeOnEscape
        closeOnClickOutside
        onClose={closeGemini}
        title="Google Gemini"
        centered
        size={"500px"}
      >
        <GeminiSelector closeGemini={closeGemini} />
      </Modal>

      {/* About Section */}
      <Modal
        opened={openedAbout}
        closeOnEscape
        closeOnClickOutside
        onClose={closeAbout}
        title="About RustySEO"
        centered
        size={"500px"}
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
      >
        <TodoItems url={url} strategy={strategy} />
      </Drawer>

      {/* GOOGLE SEARCH CONSOLE MODAL */}
      <Modal
        opened={openedSearchConsole}
        onClose={closeSearchConsole}
        title="Google Search Console"
        centered
      >
        <GoogleSearchConsoleModal close={closeSearchConsole} />
      </Modal>

      {/* GOOGLE Analytics Modal */}
      <Modal
        opened={openedGoogleAnalytics}
        onClose={closeGoogleAnalytics}
        title="Google Analytics"
        centered
      >
        <GoogleAnalyticsModal close={closeGoogleAnalytics} />
      </Modal>

      {/* Configurations Modal */}
      <Modal
        size={"800px"}
        opened={openedConfs}
        onClose={closeConfs}
        title="Connector Settings"
        centered
      >

        <Configurations close={closeConfs} />
      </Modal>

      {/* Native-like Diff Checker Modal */}
      <Modal
        opened={openedDiffChecker}
        onClose={closeDiffChecker}
        title="Crawl Diff Checker"
        size="60%"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
          zIndex: 20,
        }}
        transitionProps={{
          transition: "fade",
          duration: 200,
          timingFunction: "ease",
        }}
        styles={{
          header: {
            backgroundColor: isDarkMode ? "#171717" : "#f8f9fa",
            borderBottom: isDarkMode
              ? "1px solid #2d3748"
              : "1px solid #e2e8f0",
            padding: "0.2rem",
          },
          content: {
            backgroundColor: isDarkMode ? "#171717" : "#ffffff",
            border: isDarkMode ? "1px solid #2d3748" : "1px solid #e2e8f0",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
            maxHeight: "100%",
            padding: 0,
            marginTop: "10rem",
            height: "37rem",
            overflow: "hidden",
          },
          body: {
            padding: 0,
            height: "100%",
          },
        }}
        closeButtonProps={{
          color: isDarkMode ? "gray" : "dark",
          size: "md",
          right: 10,
        }}
      >
        <DiffChecker />
      </Modal>

      {/* Extractor Component - Now controlled by global store */}
      {visibility.customSearch && (
        <CustomSearchSelector close={hideCustomSearch} />
      )}

      <Menubar className="fixed w-full top-0 z-[999999999] p-0 pl-0 dark:bg-brand-darker dark:text-white/50 text-black/70 bg-white dark:border-b-brand-dark border-b pb-1 font-mono font-light">
        <section className="flex -ml-3 space-x-1 cursor-pointer">
          <MenubarMenu>
            <MenubarTrigger className="ml-4 text-xs">File</MenubarTrigger>
            <MenubarContent className="z-[999999999999999]">
            <MenubarItem onClick={handleOpenConfigFile}>
                <CiSettings
                  className=" text-sm mr-1.5 "
                  style={{ marginLeft: "-1px" }}
                />
                Crawler settings
              </MenubarItem>
              <MenubarItem onClick={() => getCurrentWindow().close()}>
                <FiLogOut className="mr-2" />
                Exit
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="ml-4 text-xs">View</MenubarTrigger>
            <MenubarContent className="z-[999999999999999]">
             
              <MenubarItem
                disabled={pathname === "/global"}
                onClick={openPanes}
              >
                <FiEye className="mr-2" />
                Panels
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
            <MenubarContent className="z-[999999999999999]">
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
            <MenubarTrigger className="ml-3 text-xs">Reports</MenubarTrigger>
            <MenubarContent className="z-[999999999999999]">
              <MenubarItem onClick={handleDownloadPerformance}>
                <FiBarChart2 className="mr-2" />
                Performance History
              </MenubarItem>
              <MenubarItem onClick={handleDownloadSEO}>
                <FiBarChart2 className="mr-2" />
                SEO History
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="ml-3 text-xs">Tools</MenubarTrigger>
            <MenubarContent className="z-[999999999999999]">
              <MenubarItem onClick={() => router.push("/images")}>
                <FiTool className="mr-2" />
                Image Converter
              </MenubarItem>
              {/* <MenubarItem onClick={showSerpKeywords}> */}
              {/*   <FiTool className="mr-2" /> */}
              {/*   Headings SERP */}
              {/* </MenubarItem> */}
              <MenubarItem onClick={() => router.push("/ppc")}>
                <FiTool className="mr-2" />
                Google Ads Sim.
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem
                disabled={pathname !== "/global"}
                onClick={openDiffChecker}
              >
                <GoFileDiff className="mr-2 font-semibold" />
                Crawl Diff
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={() => router.push("/serverlogs")}>
                <GoFileDiff className="mr-2 font-semibold" />
                Log Analyser
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="ml-3 text-xs">Connectors</MenubarTrigger>
            <MenubarContent className="z-[999999999999999]">
              <MenubarItem onClick={openMSClarity}>
                <FiZap className="mr-2" />
                Microsoft Clarity
              </MenubarItem>
              <MenubarItem onClick={openPowerBi}>
                <FiZap className="mr-2" />
                MS Power BI
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={openPageSpeed}>
                <FiZap className="mr-2" />
                PageSpeed Insights
              </MenubarItem>
              <MenubarItem onClick={openGoogleAnalytics}>
                <FiZap className="mr-2" />
                Google Analytics
              </MenubarItem>
              <MenubarItem onClick={openSearchConsole}>
                <FiZap className="mr-2" />
                Search Console
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem className="flex items-center" onClick={openOllama}>
                <FiZap className="mr-2" />
                Ollama{" "}
                <span className="text-[10px] dark:text-gray-300/50 text-black/50 mt-[2px] ml-1">
                  (AI Models)
                </span>
              </MenubarItem>
              <MenubarItem className="flex items-center" onClick={openGemini}>
                <FiZap className="mr-2" />
                Google Gemini
              </MenubarItem>
              <MenubarSeparator />
                 <MenubarItem onClick={openConfs}>
                <FiTool className="mr-2" />
                Connector Settings
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="ml-3 text-xs">Crawlers</MenubarTrigger>
            <MenubarContent className="z-[999999999999999]">
              <MenubarItem onClick={() => router.push("/")}>
                <GiRobotGrab className="mr-2" />
                Shallow Crawler
              </MenubarItem>
              <MenubarItem onClick={() => router.push("/global")}>
                <GiRobotGrab className="mr-2" />
                Deep Crawler
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="ml-3 text-xs">Extractors</MenubarTrigger>
            <MenubarContent className="z-[999999999999999]">
              <MenubarItem
                className={`mr-2 ${pathname !== "/global" ? "text-gray-400 pointer-events-none w-full" : "w-full"}`}
                onClick={showCustomSearch}
                disabled={pathname !== "/global"}
              >
                <GiRobotGrab className="mr-2" />
                Custom Search
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="ml-3 text-xs">Help</MenubarTrigger>
            <MenubarContent className="z-[999999999999999]">
              <MenubarItem onClick={handleOnboarding}>
                <BiDoorOpen className="mr-2" />
                Onboarding
              </MenubarItem>
              <MenubarItem onClick={showChangelog}>
                <BiLogoSlackOld className="mr-2" />
                Changelog
              </MenubarItem>
              <MenubarItem onClick={openAbout}>
                <FiHelpCircle className="mr-2" />
                About
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </section>
      </Menubar>
    </>
  );
};

export default TopMenuBar;
