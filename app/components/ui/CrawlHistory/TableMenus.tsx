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
import { useEffect, useState } from "react";

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
} from "react-icons/fi";

const handleCopy = (url: string) => {
  navigator?.clipboard.writeText(url);
};

const TableMenus = ({ children, data, crawl, url }: any) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-40">
        <ContextMenuItem onClick={() => handleCopy(data?.url || url)}>
          <FiClipboard className="mr-2" /> Copy
        </ContextMenuItem>
        <ContextMenuItem onClick={() => crawl(data?.url || url)}>
          <FiGlobe className="mr-2" />
          Open in Browser
        </ContextMenuItem>
        <ContextMenuItem onClick={() => crawl(data?.url || url)}>
          <FiRefreshCw className="mr-2" /> Re-crawl
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FiCheckSquare className="mr-2" /> Check Index
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
            <FiLink className="mr-2" /> Backlinks
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
