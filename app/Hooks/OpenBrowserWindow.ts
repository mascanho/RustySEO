"use client";
import { open } from "@tauri-apps/plugin-shell";

const openBrowserWindow = async (url: any): Promise<void> => {
  try {
    await open(url);
    console.log("Browser window opened successfully");
  } catch (error) {
    console.error(error);
  }
};

export default openBrowserWindow;
