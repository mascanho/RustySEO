"use client";
import { useEffect, useState } from "react";
import { Drawer, Button, Group, Menu } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { usePathname, useRouter } from "next/navigation";
import useStore from "../../../store/Panes";
import { invoke } from "@tauri-apps/api/core";
import useModelStore from "@/store/AIModels";
import KeywordSerp from "./TopMenuBar/KeywordSerp";
import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";

function MenuDrawer() {
  const [opened, setOpened] = useState(false);
  const mobile = useMediaQuery("(max-width: 768px)");
  const [badge, setBadge] = useState("Page Crawler");
  const pathname = usePathname();
  const router = useRouter();
  const { Visible } = useStore();
  const { selectedModel, setSelectedModel } = useModelStore();

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

    const networkRequestsElement = document.querySelector(".network-requests");
    if (networkRequestsElement) {
      networkRequestsElement.classList.toggle(
        "hidden",
        !Visible.networkRequests,
      );
    }

    const longTasksElement = document.querySelector(".long-tasks");
    if (longTasksElement) {
      longTasksElement.classList.toggle("hidden", !Visible.longTasks);
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

  const handleOptionClick = (option: any) => {
    setBadge(option.name);
    router.push(option.route);
  };

  // CHECK THE AI MODEL BEING USED
  useEffect(() => {
    const checkModel = async () => {
      try {
        const model: string = await invoke("check_ai_model");
        console.log(model, "THE NEW MODEL CHECK");
        setSelectedModel(model);
        localStorage.setItem("AI-provider", model);
      } catch (error) {
        console.error("Error checking AI model:", error);
      }
    };

    checkModel();
  }, []);

  return (
    <>
      <KeywordSerp />
      <div className="items-center hidden md:flex  z-[10] absolute top-[9px] left-2">
        <div className="flex items-center flex bg-transparent rounded-full">
          <Menu>
            <Menu.Target>
              <Button className="text-xs bg-gradient-to-r from-brand-bright to-purple-900 px-2 h-6 rounded-full text-white">
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
      <a
        href="https://www.rustyseo.com"
        target="_blank"
        className="absolute right-3 flex cursor-pointer"
      >
        <img
          src="icon.png"
          alt=""
          className="w-6 h-auto py-1 object-cover mr-2 hidden dark:flex"
        />
        <img
          src="icon-light.png"
          alt=""
          className="w-6 h-auto py-1 object-cover mr-2  dark:hidden"
        />
        <img
          src="rustyLight.png"
          className="object-contain w-auto h-6 mt-1 -ml-1.5"
          alt=""
        />
      </a>
    </>
  );
}
export default MenuDrawer;
