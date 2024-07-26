import React from "react";
import { BiDotsVerticalRounded } from "react-icons/bi";

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
    <section className="border rounded-lg">
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
          <BiDotsVerticalRounded className="text-xl" />
        </section>
        <span className="block mt-2 max-w-[90%] font-semibold">
          {data?.title}
        </span>
      </div>
      <footer className="border-t flex items-center h-7 px-3">
        <div className="mt-1 ">hello</div>
      </footer>
    </section>
  );
};

export default TaskManagerContainerItem;
