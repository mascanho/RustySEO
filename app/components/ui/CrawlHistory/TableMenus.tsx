import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useEffect, useState, useCallback } from "react";
import { FaSearchengin } from "react-icons/fa";

import {
  FiRefreshCw,
  FiRotateCw, // Replace FiReload with FiRotateCw
  FiSave,
  FiPlusSquare, // Replace FiShortcut with FiPlusSquare
  FiEdit,
  FiTool,
  FiLink,
  FiCheckSquare,
  FiClock,
  FiGlobe,
  FiClipboard,
  FiExternalLink,
} from "react-icons/fi";
import { PiFileMagnifyingGlassDuotone } from "react-icons/pi";

const TableMenus = ({ children, data, crawl }: any) => {
  const handleCopy = useCallback((url: string) => {
    navigator?.clipboard.writeText(url);
  }, []);

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-40">
        <ContextMenuItem onClick={() => handleCopy(data?.url)}>
          <FiClipboard className="mr-2" /> Copy
        </ContextMenuItem>
        <ContextMenuItem onClick={() => openBrowserWindow(data?.url)}>
          <FiGlobe className="mr-2" />
          Open in Browser
        </ContextMenuItem>
        <ContextMenuItem onClick={() => crawl(data?.url)}>
          <FiRefreshCw className="mr-2" /> Re-crawl
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FiCheckSquare className="mr-2" /> Check Index
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem
              onClick={() =>
                openBrowserWindow(
                  `https://www.google.com/search?q=${data?.url}`,
                )
              }
            >
              <FaSearchengin className="mr-2" /> Google
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() =>
                openBrowserWindow(`https://www.bing.com/search?q=${data?.url}`)
              }
            >
              <FaSearchengin className="mr-2" /> Bing
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() =>
                openBrowserWindow(
                  `https://search.yahoo.com/search?p=${data?.url}`,
                )
              }
            >
              <FaSearchengin className="mr-2" /> Yahoo
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() =>
                openBrowserWindow(
                  `https://www.yandex.com/search/?text=${data?.url}`,
                )
              }
            >
              <FaSearchengin className="mr-2" /> Yandex
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FiLink className="mr-2" /> Backlinks
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem>
              <FiExternalLink className="mr-2" /> Ahrefs
            </ContextMenuItem>
            <ContextMenuItem>
              <FiPlusSquare className="mr-2" /> Moz
            </ContextMenuItem>
            <ContextMenuItem>
              <FiGlobe className="mr-2" /> Majestic
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FiCheckSquare className="mr-2" /> Validation
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem>
              <FiSave className="mr-2" /> Save Page As...
              <ContextMenuShortcut>⇧⌘S</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              <FiPlusSquare className="mr-2" /> Create Shortcut...
            </ContextMenuItem>
            <ContextMenuItem>
              <FiEdit className="mr-2" /> Name Window...
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>
              <FiTool className="mr-2" /> Developer Tools
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FiClock className="mr-2" /> History
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem>
              <FiSave className="mr-2" /> Save Page As...
              <ContextMenuShortcut>⇧⌘S</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              <FiPlusSquare className="mr-2" /> Create Shortcut...
            </ContextMenuItem>
            <ContextMenuItem>
              <FiEdit className="mr-2" /> Name Window...
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>
              <FiTool className="mr-2" /> Developer Tools
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        {/* <ContextMenuRadioGroup value="pedro">
            <ContextMenuLabel>People</ContextMenuLabel>
          </ContextMenuRadioGroup> */}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default TableMenus;
