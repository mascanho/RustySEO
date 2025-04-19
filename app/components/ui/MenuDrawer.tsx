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
import Onboarding from "../Onboarding";

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
    { name: "Log Analyzer", route: "/serverlogs" },
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
    } else if (path === "/serverlogs") {
      setBadge("Log Analyzer");
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

  // USE KEYBINDINGS TO SEND CHANGE PAGES

  useEffect(() => {
    // Function to handle the keydown event
    const handleKeyDown = (event: any) => {
      // Check if Ctrl (or Cmd on Mac) and D are pressed
      if (event.ctrlKey && event.key === "d") {
        router.push("global/"); // Navigate to the /deepcrawl page
      }
      // Check if Ctrl (or Cmd on Mac) and S are pressed
      if (event.ctrlKey && event.key === "s") {
        router.push("/"); // Navigate to home page
      }

      if (event.ctrlKey && event.key === "r") {
        router.refresh();
      }

      if (event.ctrlKey && event.key === "k") {
        router.push("/serverlogs");
      }
    };

    // Add the event listener
    window.addEventListener("keydown", handleKeyDown);

    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [router]); // Add router to the dependency array

  return (
    <>
      <KeywordSerp />
      <Onboarding />
      <div
        className={`items-center hidden md:flex  z-[50] absolute top-[9px] ${pathname === "/images" ? "pt-1" : ""} left-2`}
      >
        <div className=" items-center flex bg-transparent rounded-tr-lg">
          <Menu>
            <Menu.Target>
              <Button className="text-xs bg-gradient-to-r from-brand-bright to-purple-900 px-3 h-6 rounded-tr-2xl text-white">
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
        className="absolute right-4 flex cursor-pointer"
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
          className="object-contain h-auto  -ml-1"
          alt=""
        />
      </a>
    </>
  );
}
export default MenuDrawer;
