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
      <div className="items-center hidden md:flex  z-[2000] absolute top-[10px] left-5">
        <span className="text-xs bg-brand-dark px-3  py-1  rounded-full text-white">
          Page crawler
        </span>
      </div>
    </>
  );
}
export default MenuDrawer;
