import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState, useCallback } from "react";
import { FaSearchengin } from "react-icons/fa";

import {
  FiRefreshCw,
  FiRotateCw,
  FiSave,
  FiPlusSquare,
  FiEdit,
  FiTool,
  FiLink,
  FiCheckSquare,
  FiClock,
  FiGlobe,
  FiClipboard,
  FiExternalLink,
} from "react-icons/fi";

const RankingMenus = ({ children, url, query }: any) => {
  const handleCopy = useCallback((url: string) => {
    navigator?.clipboard.writeText(url);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-40 bg-white dark:bg-brand-darker dark:border-brand-dark dark:text-white/50 text-xs">
        <DropdownMenuItem
          className="hover:bg-brand-bright hover:text-white"
          onClick={() => handleCopy(url)}
        >
          <FiClipboard className="mr-2 text-xs" /> Copy
        </DropdownMenuItem>
        <DropdownMenuItem
          className="hover:bg-brand-bright hover:text-white"
          onClick={() => openBrowserWindow(url)}
        >
          <FiGlobe className="mr-2" />
          Open in Browser
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="hover:bg-brand-bright hover:text-white">
            <FiCheckSquare className="mr-2" /> SERP results
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48 ml-1 bg-white dark:bg-brand-darker dark:border-brand-dark">
            <DropdownMenuItem
              className="hover:bg-brand-bright hover:text-white"
              onClick={() =>
                openBrowserWindow(`https://www.google.com/search?q=${query}`)
              }
            >
              <FaSearchengin className="mr-2" /> Google
            </DropdownMenuItem>
            <DropdownMenuItem
              className="hover:bg-brand-bright hover:text-white"
              onClick={() =>
                openBrowserWindow(`https://www.bing.com/search?q=${query}`)
              }
            >
              <FaSearchengin className="mr-2" /> Bing
            </DropdownMenuItem>
            <DropdownMenuItem
              className="hover:bg-brand-bright hover:text-white"
              onClick={() =>
                openBrowserWindow(`https://search.yahoo.com/search?p=${query}`)
              }
            >
              <FaSearchengin className="mr-2" /> Yahoo
            </DropdownMenuItem>
            <DropdownMenuItem
              className="hover:bg-brand-bright hover:text-white"
              onClick={() =>
                openBrowserWindow(
                  `https://www.yandex.com/search/?text=${query}`,
                )
              }
            >
              <FaSearchengin className="mr-2" /> Yandex
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="hover:bg-brand-bright hover:text-white">
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
          <DropdownMenuSubTrigger className="hover:bg-brand-bright hover:text-white">
            <FiCheckSquare className="mr-2" /> Validation
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48 ml-1 bg-white dark:bg-brand-darker dark:border-brand-dark">
            <DropdownMenuItem className="hover:bg-brand-bright hover:text-white">
              <FiSave className="mr-2" /> Save Page As...
              <DropdownMenuShortcut>⇧⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-brand-bright hover:text-white">
              <FiPlusSquare className="mr-2" /> Create Shortcut...
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-brand-bright hover:text-white">
              <FiEdit className="mr-2" /> Name Window...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="hover:bg-brand-bright hover:text-white">
              <FiTool className="mr-2" /> Developer Tools
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="hover:bg-brand-bright hover:text-white">
            <FiClock className="mr-2" /> History
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48 ml-1 bg-white dark:bg-brand-darker dark:border-brand-dark">
            <DropdownMenuItem className="hover:bg-brand-bright hover:text-white">
              <FiSave className="mr-2" /> Save Page As...
              <DropdownMenuShortcut>⇧⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-brand-bright hover:text-white">
              <FiPlusSquare className="mr-2" /> Create Shortcut...
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-brand-bright hover:text-white">
              <FiEdit className="mr-2" /> Name Window...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="hover:bg-brand-bright hover:text-white">
              <FiTool className="mr-2" /> Developer Tools
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {/* <DropdownMenuRadioGroup value="pedro">
            <DropdownMenuLabel>People</DropdownMenuLabel>
          </DropdownMenuRadioGroup> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RankingMenus;
