import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Modal } from "@mantine/core";
import { useState, useCallback, useEffect } from "react";
import { FaGoogle, FaSearchengin } from "react-icons/fa";

import { AiFillGoogleCircle } from "react-icons/ai";

import {
  FiRefreshCw,
  FiPlusSquare,
  FiLink,
  FiCheckSquare,
  FiClock,
  FiGlobe,
  FiSearch,
  FiClipboard,
  FiExternalLink,
  FiCheckCircle,
} from "react-icons/fi";
import Todo from "../../Todo";

import { useDisclosure } from "@mantine/hooks";
import { toast } from "sonner";

const TableFloatMenus = ({ children, data, crawl, url }: any) => {
  const handleCopy = useCallback((url: string) => {
    navigator?.clipboard.writeText(url);
    toast("Copied to clipboard");
  }, []);

  const [todoStrategy, setTodoStrategy] = useState<string>("");
  const [todoUrl, setTodoUrl] = useState<string | null>(null);

  // Handle adding to-do
  const handleAddTodo = (url: string, strategy: string) => {
    setTodoStrategy(strategy);
    setTodoUrl(url);
    openModal();
  };

  const [openedModal, { open: openModal, close: closeModal }] =
    useDisclosure(false);

  useEffect(() => {
    if (data.url) {
      sessionStorage?.setItem("reCrawlUrl", data?.url);
    }
  }, [crawl]);

  const handleReCrawl = async () => {
    const url = sessionStorage?.getItem("reCrawlUrl");
    if (url) {
      await crawl(url);
      sessionStorage?.removeItem("reCrawlUrl");
    }
    crawl(data?.url, "reCrawl");
  };

  return (
    <>
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
        {/* @ts-ignore */}
        <Todo url={todoUrl} close={closeModal} strategy={todoStrategy} />
      </Modal>

      <DropdownMenu>
        <DropdownMenuTrigger>{children}</DropdownMenuTrigger>
        <DropdownMenuContent className="w-40 bg-white dark:bg-brand-darker dark:border-brand-dark dark:text-white/50 text-xs z-[999999]">
          <DropdownMenuItem
            className="hover:bg-brand-bright hover:text-white"
            onClick={() => handleCopy(data?.url)}
          >
            <FiClipboard className="mr-2" /> Copy
          </DropdownMenuItem>
          <DropdownMenuItem
            className="hover:bg-brand-bright hover:text-white"
            onClick={() => openBrowserWindow(data?.url || url)}
          >
            <FiGlobe className="mr-2" />
            Open in Browser
          </DropdownMenuItem>
          <DropdownMenuItem
            className="hover:bg-brand-bright hover:text-white"
            onClick={() => crawl(data?.url)}
          >
            <FiRefreshCw className="mr-2" /> Re-crawl
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleAddTodo(data?.url, data?.strategy)}
            className="hover:bg-brand-bright hover:text-white"
          >
            <FiCheckCircle className="mr-2 cursor-pointer" />
            Todo
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              openBrowserWindow(`https://www.google.com/search?q=${data?.url}`)
            }
            className="hover:bg-brand-bright hover:text-white"
          >
            <FaGoogle className="mr-2 cursor-pointer" />
            Search Console
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-xs hover:bg-brand-bright hover:text-white">
              <FiCheckSquare className="mr-2 text-xs" /> Check Index
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48 ml-1 bg-white dark:bg-brand-darker dark:border-brand-dark">
              <DropdownMenuItem
                className="hover:bg-brand-bright hover:text-white"
                onClick={() =>
                  openBrowserWindow(
                    `https://www.google.com/search?q=${data?.url}`,
                  )
                }
              >
                <FaSearchengin className="mr-2" /> Google
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:bg-brand-bright text-xs hover:text-white"
                onClick={() =>
                  openBrowserWindow(
                    `https://www.bing.com/search?q=${data?.url}`,
                  )
                }
              >
                <FaSearchengin className="mr-2" /> Bing
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:bg-brand-bright hover:text-white"
                onClick={() =>
                  openBrowserWindow(
                    `https://search.yahoo.com/search?p=${data?.url}`,
                  )
                }
              >
                <FaSearchengin className="mr-2" /> Yahoo
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:bg-brand-bright hover:text-white"
                onClick={() =>
                  openBrowserWindow(
                    `https://www.yandex.com/search/?text=${data?.url}`,
                  )
                }
              >
                <FaSearchengin className="mr-2" /> Yandex
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="hover:bg-brand-bright hover:text-white text-xs">
              <FiLink className="mr-2" /> Backlinks
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48 ml-1 bg-white dark:bg-brand-darker dark:border-brand-dark">
              <DropdownMenuItem className="hover:bg-brand-bright hover:text-white">
                <FiExternalLink className="mr-2" /> Ahrefs
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-brand-bright hover:text-white">
                <FiPlusSquare className="mr-2" /> Moz
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-brand-bright hover:text-white">
                <FiGlobe className="mr-2" /> Majestic
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="hover:bg-brand-bright hover:text-white text-xs">
              <FiCheckSquare className="mr-2" /> Validation
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48 ml-1 bg-white dark:bg-brand-darker dark:border-brand-dark">
              <DropdownMenuItem
                onClick={() =>
                  openBrowserWindow(
                    `https://validator.w3.org/nu/?doc=${data?.url}`,
                  )
                }
                className="hover:bg-brand-bright hover:text-white"
              >
                <FiGlobe className="mr-2" /> W3C Validator
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  openBrowserWindow(
                    `https://validator.schema.org/#url=${data?.url}`,
                  )
                }
                className="hover:bg-brand-bright hover:text-white"
              >
                <FiCheckCircle className="mr-2" /> Schema Validator
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() =>
                  openBrowserWindow(
                    `https://search.google.com/test/rich-results?url=${data?.url}`,
                  )
                }
                className="hover:bg-brand-bright hover:text-white"
              >
                <FiSearch className="mr-2" /> Rich Test Results
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>{" "}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="hover:bg-brand-bright hover:text-white text-xs">
              <FiClock className="mr-2" /> History
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48 ml-1 bg-white dark:bg-brand-darker dark:border-brand-dark">
              <DropdownMenuItem
                onClick={() =>
                  openBrowserWindow(
                    `https://webcache.googleusercontent.com/search?q=cache:${data?.url}`,
                  )
                }
                className="hover:bg-brand-bright hover:text-white"
              >
                Google Cache
                <DropdownMenuShortcut>⇧⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  openBrowserWindow(
                    `https://web.archive.org/web/20240000000000*/${data?.url}`,
                  )
                }
                className="hover:bg-brand-bright hover:text-white"
              >
                WaybackMachine
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default TableFloatMenus;
