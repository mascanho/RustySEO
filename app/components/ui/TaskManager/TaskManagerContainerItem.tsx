import React from "react";
import { BiDotsVerticalRounded } from "react-icons/bi";
import { FaMobileAlt } from "react-icons/fa";
import { FaDesktop } from "react-icons/fa";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const taskColors: any = {
  CWV: "blue",
  Head: "green",
  Content: "red",
  Links: "brown",
  Images: "purple",
  Headings: "pink",
  Keywords: "orange",
  Schema: "teal",
};

const TaskManagerContainerItem = ({ data }: any) => {
  return (
    <section className="border dark:border-brand-dark rounded-lg">
      <div className="rounded-md flex flex-col p-3">
        <section className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1 items-center">
            {data?.type?.map((item: any, index: any) => (
              <span
                key={index}
                className="text-[10px] text-white px-2 py-0.5 rounded-xl"
                style={{
                  backgroundColor: taskColors[item] || "gray", // Default color if not found
                }}
              >
                {item}
              </span>
            ))}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <BiDotsVerticalRounded className="text-xl dark:text-brand-highlight" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white absolute right-0 dark:border-brand-dark dark:bg-brand-darker dark:text-white">
              <DropdownMenuLabel>Task Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="hover:dark:bg-white hover:dark:text-brand-darker cursor-pointer">
                Completed
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:dark:bg-white hover:dark:text-brand-darker cursor-pointer">
                Doing
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:dark:bg-white hover:dark:text-brand-darker cursor-pointer">
                Todo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </section>
        <span className="block mt-2 max-w-[90%] font-semibold dark:text-white line-clamp-1">
          {data?.title}
        </span>
        <span className="text-sm text-black/50 dark:text-white/50 line-clamp-2">
          {data?.description}
        </span>
        <span className="text-sm text-sky-400 dark:text-brand-highlight mt-1">
          {data?.url}
        </span>
      </div>
      <footer className="border-t dark:border-brand-dark flex items-center h-10 px-3">
        <div className="flex items-center justify-between w-full space-x-1 text-black/50 dark:text-white/50">
          <span
            className={`text-xs py-[2px] px-[6px] ${data?.priority === "Low" && "bg-green-300"} ${data?.priority === "Medium" && "bg-yellow-300"} ${data?.priority === "High" && "bg-red-300"} rounded-md text-black`}
          >
            {data?.priority}
          </span>
          <div className="flex items-center space-x-2">
            {data?.strategy === "mobile" ? <FaMobileAlt /> : <FaDesktop />}
            <span className="text-xs">
              {new Date(data?.date).toDateString()}
            </span>
          </div>
        </div>
      </footer>
    </section>
  );
};

export default TaskManagerContainerItem;
