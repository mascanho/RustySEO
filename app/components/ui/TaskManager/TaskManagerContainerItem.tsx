import React from "react";
import { BiDotsVerticalRounded } from "react-icons/bi";
import { FaMobileAlt } from "react-icons/fa";
import { FaDesktop } from "react-icons/fa";

const taskColors: any = {
  CWV: "blue",
  Head: "green",
  Content: "red",
  Links: "yellow",
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
          <BiDotsVerticalRounded className="text-xl dark:text-brand-highlight" />
        </section>
        <span className="block mt-2 max-w-[90%] font-semibold dark:text-white">
          {data?.title}
        </span>
        <span className="text-sm text-black/50 dark:text-white/50">
          The head on this is a bit strange
        </span>
        <span className="text-sm text-sky-400 dark:text-brand-highlight mt-1">
          {data?.url}
        </span>
      </div>
      <footer className="border-t dark:border-brand-dark flex items-center h-7 px-3">
        <div className="mt-1 flex items-center justify-between w-full space-x-1 text-black/50 dark:text-white/50">
          {data?.device === "mobile" ? <FaMobileAlt /> : <FaDesktop />}
          <span className="text-xs">{new Date(data?.date).toDateString()}</span>
        </div>
      </footer>
    </section>
  );
};

export default TaskManagerContainerItem;
