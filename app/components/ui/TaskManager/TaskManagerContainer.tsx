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
    <div className="grid grid-cols-3 p-7 w-full gap-8 h-screen bg-slate-100 dark:bg-brand-darker rounded-xl max-w-[1800px] mx-auto">
      <section className="w-full border bg-white dark:bg-brand-normal rounded-xl">
        <div className="flex items-center border-b justify-between px-6 py-5 font-semibold">
          <h1 className="text-xl">TODO</h1>
          <FaCirclePlus className="text-2xl text-brand-highlight dark:text-brand-dark" />
        </div>
        <div className="p-3">
          {/* @ts-ignore */}
          <TodoContainerItems status={"todo"} />
        </div>
      </section>
      <section className="w-full border bg-white dark:bg-brand-normal rounded-xl">
        <div className="flex items-center border-b justify-between px-6 py-5 font-semibold">
          <h1 className="text-xl">TODO</h1>
          <FaCirclePlus className="text-2xl text-brand-highlight dark:text-brand-dark" />
        </div>
        <div className="p-3">
          {/* @ts-ignore */}
          <TodoContainerItems status={"todo"} />
        </div>
      </section>
      <section className="w-full border bg-white dark:bg-brand-normal rounded-xl">
        <div className="flex items-center border-b justify-between px-6 py-5 font-semibold">
          <h1 className="text-xl">TODO</h1>
          <FaCirclePlus className="text-2xl text-brand-highlight dark:text-brand-dark" />
        </div>
        <div className="p-3">
          {/* @ts-ignore */}
          <TodoContainerItems status={"todo"} />
        </div>
      </section>
    </div>
  );
};

export default TaskManagerContainer;
