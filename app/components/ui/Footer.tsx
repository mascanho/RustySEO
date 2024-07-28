"use client";
import React, { useEffect, useState } from "react";
import { LiaTasksSolid } from "react-icons/lia";
import { CgWebsite } from "react-icons/cg";

const date = new Date();
const year = date.getFullYear();

type Task = {
  id: string;
  title: string;
  type: string[];
  priority: string;
  url: [] | null;
  date: string;
  completed?: boolean;
};

const Footer = () => {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Function to update URL and loading state from session storage
  const updateSessionState = () => {
    const storedUrl = sessionStorage.getItem("url") || "";
    setUrl(storedUrl);

    const storedLoading = sessionStorage.getItem("loading");
    setLoading(storedLoading === "true");
  };

  // Effect to handle initial data load and set up event listener
  useEffect(() => {
    updateSessionState(); // Initial load

    const handleSessionStorageUpdate = () => {
      updateSessionState(); // Update state when session storage changes
    };

    window.addEventListener(
      "sessionStorageUpdated",
      handleSessionStorageUpdate,
    );

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener(
        "sessionStorageUpdated",
        handleSessionStorageUpdate,
      );
    };
  }, []);

  // Function to update tasks
  const updateTasks = () => {
    try {
      const storedTasks = JSON.parse(
        localStorage.getItem("tasks") || "[]",
      ) as Task[];
      const filteredTasks = storedTasks.filter((task) => !task.completed);
      setTasks(filteredTasks);
    } catch (error) {
      console.error("Error parsing tasks:", error);
    }
  };

  // Effect to update tasks and listen for the "tasksUpdated" event
  useEffect(() => {
    updateTasks();

    const handleTasksUpdated = () => {
      updateTasks();
    };

    window.addEventListener("tasksUpdated", handleTasksUpdated);

    return () => {
      window.removeEventListener("tasksUpdated", handleTasksUpdated);
    };
  }, []);

  return (
    <footer className="w-full text-xs justify-between bg-apple-silver shadow fixed ml-0 left-0 bottom-0 z-[1000] border-t-2 flex items-center py-1 overflow-hidden">
      <section>
        <div className="flex items-center ml-2 space-x-1 w-full">
          {loading ? (
            <>
              <div className="w-2 h-2 rounded-full bg-orange-500 mt-1" />
              <span className="mt-[5px] text-orange-500">Fetching...</span>
            </>
          ) : (
            url && (
              <div className="flex items-center space-x-1">
                <CgWebsite className="text-xl" />
                <span className="mt-[2px]">{url}</span>
              </div>
            )
          )}
        </div>
      </section>
      <section className="flex items-center space-x-4">
        <div className="flex w-20 items-center">
          <LiaTasksSolid className="text-xl" />
          <div className="flex items-center mt-1 mr-1">
            <span>Tasks:</span>
            <span className="text-red-500 ml-1">{tasks.length}</span>
          </div>
        </div>
        <span className="pt-1">{`© ${year} - RustySEO`}</span>
      </section>
    </footer>
  );
};

export default Footer;
