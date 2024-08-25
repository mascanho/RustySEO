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
    const widgetselement = document.querySelector(".widgets");
    if (widgetselement) {
      widgetselement.classList.toggle("hidden", !Visible.widgets);
    }

    const headElement = document.querySelector(".head");
    if (headElement) {
      headElement.classList.toggle("hidden", !Visible.head);
    }

    const chartsElement = document.querySelector(".charts");
    if (chartsElement) {
      chartsElement.classList.toggle("hidden", !Visible.charts);
    }

    const serpElement = document.querySelector(".serp");
    if (serpElement) {
      serpElement.classList.toggle("hidden", !Visible.serp);
    }

    const opengraphElement = document.querySelector(".opengraph");
    if (opengraphElement) {
      opengraphElement.classList.toggle("hidden", !Visible.opengraph);
    }

    const headingsElement = document.querySelector(".headings");
    if (headingsElement) {
      headingsElement.classList.toggle("hidden", !Visible.headings);
    }

    const linksElement = document.querySelector(".links");
    if (linksElement) {
      linksElement.classList.toggle("hidden", !Visible.links);
    }

    const imagesElement = document.querySelector(".images");
    if (imagesElement) {
      imagesElement.classList.toggle("hidden", !Visible.images);
    }

    const scriptsElement = document.querySelector(".scripts");
    if (scriptsElement) {
      scriptsElement.classList.toggle("hidden", !Visible.scripts);
    }

    const tbwElement = document.querySelector(".tbw");
    if (tbwElement) {
      tbwElement.classList.toggle("hidden", !Visible.tbw);
    }

    const renderBlockingElement = document.querySelector(".render-blocking");
    if (renderBlockingElement) {
      renderBlockingElement.classList.toggle("hidden", !Visible.renderBlocking);
    }

    const schemaElement = document.querySelector(".schema");
    if (schemaElement) {
      schemaElement.classList.toggle("hidden", !Visible.schema);
    }

    // Add similar blocks for other components as needed
  }, [Visible]);

  let path = pathname;

  useEffect(() => {
    if (path === "/images") {
      setBadge("Image Converter");
    }
    if (path === "/global") setBadge("Domain Crawler");
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
