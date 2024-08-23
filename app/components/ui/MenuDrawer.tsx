"use client";
import { useEffect, useState } from "react";
import { Drawer, Button, Group } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { MENUS } from "@/app/Data/Menus";
import { usePathname } from "next/navigation";
import Link from "next/link";
import useStore from "../../../store/Panes";

function MenuDrawer() {
  const [opened, setOpened] = useState(false);
  const mobile = useMediaQuery("(max-width: 768px)");
  const [badge, setBadge] = useState("Page Crawler");
  const pathname = usePathname();
  const { Visible } = useStore();

  useEffect(() => {
    const chartsElement = document.querySelector(".charts");
    if (chartsElement) {
      chartsElement.classList.toggle("hidden", !Visible.charts);
    }

    const headingsElement = document.querySelector(".headings");
    if (headingsElement) {
      headingsElement.classList.toggle("hidden", !Visible.headings);
    }

    // Add similar blocks for other components as needed
  }, [Visible]);

  let path = pathname;

  useEffect(() => {
    if (path === "/images") {
      setBadge("Image Converter");
    }
  }, []);

  return (
    <>
      <div className="items-center hidden md:flex  z-[2000] absolute top-[1px] left-2">
        <div className="flex items-center flex bg-transparent rounded-md">
          <img
            src="icon.png"
            alt=""
            className="w-8 h-auto py-1 object-cover mr-2 hidden dark:flex"
          />
          <img
            src="icon-light.png"
            alt=""
            className="w-8 h-auto py-1 object-cover mr-2  dark:hidden"
          />
          <Link
            href="/images"
            className="text-xs bg-brand-dark px-3  py-1  rounded-full text-white"
          >
            {badge}
          </Link>
        </div>
      </div>
    </>
  );
}
export default MenuDrawer;
