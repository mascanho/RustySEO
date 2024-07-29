"use client";
import React, { useEffect, useState } from "react";
import { BiDotsVerticalRounded } from "react-icons/bi";
import { FaMobileAlt, FaDesktop } from "react-icons/fa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Task {
  id: string;
  type: string[];
  title: string;
  description: string;
  url: string;
  priority: "Low" | "Medium" | "High";
  strategy: "mobile" | "desktop";
  date: string;
  status: "Completed" | "Doing" | "Todo";
}

const taskColors: Record<string, string> = {
  CWV: "blue",
  Head: "green",
  Content: "red",
  Links: "brown",
  Images: "purple",
  Headings: "pink",
  Keywords: "orange",
  Schema: "teal",
};

const TaskManagerContainerItem: React.FC<{ data: any }> = ({ data }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentStatus, setCurrentStatus] = useState<Task["status"]>(
    data.status,
  );

  // Add state for animation class
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Fetch tasks from localStorage on component mount
    const storedTasks = localStorage.getItem("tasks");
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    }

    // Trigger animation when component mounts
    setAnimate(true);
  }, []);

  useEffect(() => {
    // Listen for custom events
    const handleTasksUpdated = () => {
      const storedTasks = localStorage.getItem("tasks");
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    };

    window.addEventListener("tasksUpdated", handleTasksUpdated);

    return () => {
      window.removeEventListener("tasksUpdated", handleTasksUpdated);
    };
  }, []);

  const handleStatusChange = (status: Task["status"]) => {
    const updatedTasks = tasks.map((task) =>
      task.id === data.id ? { ...task, status } : task,
    );

    // Update localStorage and dispatch custom event
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
    window.dispatchEvent(new Event("tasksUpdated"));
    setTasks(updatedTasks);
    setCurrentStatus(status);
  };

  const handleDelete = () => {
    const updatedTasks = tasks.filter((task) => task.id !== data.id);

    // Update localStorage and dispatch custom event
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
    window.dispatchEvent(new Event("tasksUpdated"));
    setTasks(updatedTasks);
  };

  return (
    <section
      className={`shadow border dark:border-brand-dark rounded-lg overflow-auto transition-all delay-75 ${animate ? "fade-in" : ""}`}
    >
      <div className="rounded-md flex flex-col p-3">
        <section className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1 items-center">
            {data.type.map((item: any, index: any) => (
              <span
                key={index}
                className="text-[10px] text-white px-2 py-0.5 rounded-xl"
                style={{ backgroundColor: taskColors[item] || "gray" }}
              >
                {item}
              </span>
            ))}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <BiDotsVerticalRounded className="text-xl dark:text-brand-highlight cursor-pointer hover:scale-105 active:scale-95 transition-all delay-75 ease-in-out" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white absolute right-0 dark:border-brand-dark dark:bg-brand-darker dark:text-white">
              <DropdownMenuLabel>Task Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {["Completed", "Doing", "Todo"].map((status) => (
                <DropdownMenuItem
                  key={status}
                  className={`hover:dark:bg-white hover:bg-gray-100 hover:dark:text-brand-darker cursor-pointer ${
                    status === currentStatus
                      ? "bg-gray-200 dark:bg-gray-700"
                      : ""
                  }`}
                  onClick={() => handleStatusChange(status as Task["status"])}
                >
                  {status}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="hover:bg-red-100 dark:hover:bg-red-800 cursor-pointer text-red-600 dark:text-red-400"
                onClick={handleDelete}
              >
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </section>
        <span className="block mt-2 max-w-[90%] font-semibold dark:text-white line-clamp-1">
          {data.title}
        </span>
        <span className="text-sm text-black/50 dark:text-white/50 line-clamp-2">
          {data.description}
        </span>
        <span className="text-sm text-sky-400 dark:text-brand-highlight mt-1">
          {data.url}
        </span>
      </div>
      <footer className="border-t dark:border-brand-dark flex items-center h-10 px-3">
        <div className="flex items-center justify-between w-full space-x-1 text-black/50 dark:text-white/50">
          <span
            className={`text-xs py-[2px] px-[6px] rounded-md text-black ${
              data.priority === "Low" && "bg-green-300"
            } ${data.priority === "Medium" && "bg-yellow-300"} ${
              data.priority === "High" && "bg-red-300"
            }`}
          >
            {data.priority}
          </span>
          <div className="flex items-center space-x-2">
            {data.strategy.strategy === "DESKTOP" ? (
              <FaDesktop />
            ) : (
              <FaMobileAlt />
            )}
            <span className="text-xs">
              {new Date(data.date).toDateString()}
            </span>
          </div>
        </div>
      </footer>
    </section>
  );
};

export default TaskManagerContainerItem;
