import React from "react";
import { FaCirclePlus } from "react-icons/fa6";
import TodoItems from "../TodoItems";
import TodoContainerItems from "./TodoContainerItems";

type Task = {
  id: string;
  title: string;
  type: string[];
  priority: string;
  url: string;
  date: string;
  completed?: boolean;
  strategy?: string;
};

const TaskManagerContainer = () => {
  return (
    <div className="grid grid-cols-3 p-7 w-full max-w-400px gap-8 h-screen bg-slate-800 overflow-hidden dark:bg-brand-darker rounded-xl max-w-[1800px] mx-auto shadow">
      <section className="w-full max-w-[380px] h-[61rem]  border bg-white dark:bg-brand-normal rounded-xl mb-10  overflow-hidden">
        <div className="flex items-center border-b justify-between px-6 py-5 font-semibold">
          <h1 className="text-xl">TODO</h1>
          <FaCirclePlus className="text-2xl text-brand-highlight dark:text-brand-dark" />
        </div>
        <div className="p-2 overflow-scroll h-[57.6rem] mb-5 rounded-md">
          {/* @ts-ignore */}
          <TodoContainerItems status={"todo"} />
        </div>
      </section>
    </div>
  );
};

export default TaskManagerContainer;
