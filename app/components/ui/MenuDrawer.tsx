"use client";
import { useState } from "react";
import { Drawer, Button, Group } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { MENUS } from "@/app/Data/Menus";
import { usePathname } from "next/navigation";

function MenuDrawer() {
  const [opened, setOpened] = useState(false);
  const mobile = useMediaQuery("(max-width: 768px)");

  const pathname = usePathname();

  let path = pathname;
  if (path === "/") {
    path = "Home";
  }

  if (path === "/sitemaps") {
    path = "Sitemaps";
  }

  return (
    <>
      <div className="items-center hidden md:flex  z-[2000] absolute top-[6px] left-5">
        <div className="flex items-center">
          <img src="icon.png" alt="" className="w-8 h-8 mr-2" />
          <span className="text-xs bg-brand-dark px-3  py-1  rounded-full text-white">
            Page crawler
          </span>
        </div>
      </div>
    </>
  );
}
export default MenuDrawer;
