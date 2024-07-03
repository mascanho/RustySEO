"use client";
import { shell } from "@tauri-apps/api";

const openBrowserWindow = async (url: any): Promise<void> => {
  try {
    await shell.open(url); // Use an object with uri property
    console.log("Browser window opened successfully");
  } catch (error) {
    console.error(error);
  }
};

export default openBrowserWindow;
