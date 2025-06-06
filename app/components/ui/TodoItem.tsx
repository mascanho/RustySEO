import React from "react";
import { Title, Box, Group } from "@mantine/core";
import { FaDesktop, FaMobileAlt } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const taskColors: Record<string, string> = {
  CWV: "blue",
  Head: "green",
  Content: "red",
  Links: "yellow",
  Images: "purple",
  Headings: "pink",
  Keywords: "orange",
  Schema: "teal",
};

type Task = {
  id: string; // Changed to string
  title: string;
  type: string[];
  priority: string;
  url: string;
  date: string;
  completed?: boolean;
  strategy?: "mobile" | "desktop";
};

const TodoItem = ({
  task,
  handleMarkCompleted,
  handleRemoveTask,
}: {
  task: Task;
  handleMarkCompleted: (id: string) => void; // Changed to string
  handleRemoveTask: (id: string) => void; // Changed to string
}) => {
  return (
    <Box
      key={task.id}
      className="mb-3 bg-white shadow-sm border relative overflow-hidden w-full rounded-lg p-3"
    >
      <div className="flex justify-between items-center">
        <Title order={6} className="text-xs font-semibold text-gray-800">
          {task.title}
        </Title>
        <span
          className={`w-12 h-fit rounded-bl-lg absolute right-0 flex justify-center items-center top-0 text-[10px] py-0.5 font-semibold ${
            task.priority === "High"
              ? "bg-red-500 text-white"
              : task.priority === "Medium"
                ? "bg-yellow-500 text-white"
                : "bg-green-500 text-white"
          }`}
        >
          {task.priority}
        </span>
      </div>
      <span className="text-sm text-gray-500">{task.url}</span>
      <Group className="flex flex-wrap">
        {task.type.map((type, index) => (
          <span
            key={index}
            className="text-[10px] text-white pt-0.5 px-1 -mr-3 rounded-xl"
            style={{
              backgroundColor: taskColors[type] || "gray", // Fallback color
            }}
          >
            {type}
          </span>
        ))}
        <div className="w-full h-[1px] -mt-2 bg-gray-100" />
        <footer className="flex justify-around items-center p-0 -mb-2 w-full -mt-3 space-x-2">
          <div className="flex-1 flex space-x-2">
            <span className="text-[10px] text-gray-500">
              {task.date.substring(0, 10)}
            </span>
            <span>
              {task.strategy === "desktop" ? <FaDesktop /> : <FaMobileAlt />}
            </span>
          </div>
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <BsThreeDotsVertical />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="z-[10000] mr-32 bg-white active:text-white">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleMarkCompleted(task.id)}
                >
                  Mark as Completed
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-red-500"
                  onClick={() => handleRemoveTask(task.id)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </footer>
      </Group>
    </Box>
  );
};

export default TodoItem;
