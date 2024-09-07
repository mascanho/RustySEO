"use client";
import { useEffect, useState } from "react";
import { Drawer, Button, Group, Menu } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { usePathname, useRouter } from "next/navigation";
import useStore from "../../../store/Panes";

function MenuDrawer() {
  const [opened, setOpened] = useState(false);
  const mobile = useMediaQuery("(max-width: 768px)");
  const [badge, setBadge] = useState("Page Crawler");
  const pathname = usePathname();
  const router = useRouter();
  const { Visible } = useStore();

  const options = [
    { name: "Page Crawler", route: "/" },
    { name: "Domain Crawler", route: "/global" },
  ];

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
    const currentOption = options.find((option) => option.route === path);
    if (currentOption) {
      setBadge(currentOption.name);
    } else if (path === "/images") {
      setBadge("Image Converter");
    }
  }, [path]);

  const handleOptionClick = (option) => {
    setBadge(option.name);
    router.push(option.route);
  };

  return (
    <>
      <div className="items-center hidden md:flex  z-[10] absolute top-[1px] left-2">
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
          <Menu>
            <Menu.Target>
              <Button className="text-xs bg-brand-dark px-3 h-7  rounded-full text-white">
                {badge}
              </Button>
            </Menu.Target>
            <Menu.Dropdown className="z-[2000] dark:bg-brand-darker dark:text-red-500 dark:border-brand-dark mt-1 ">
              {options.map((option, index) => (
                <Menu.Item
                  className="z-[2000] hover:bg-brand-bright hover:text-white dark:text-white/60"
                  key={index}
                  onClick={() => handleOptionClick(option)}
                >
                  {option.name}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        </div>
      </div>
    </>
  );
}
export default MenuDrawer;
