"use client";

const openBrowserWindow = async (url: any): Promise<void> => {
  try {
    window.open(url, "_blank");
    console.log("Browser window opened successfully");
  } catch (error) {
    console.error(error);
  }
};

export default openBrowserWindow;
