"use client";
import React, { useEffect, useState } from "react";
import { LiaTasksSolid } from "react-icons/lia";

const date = new Date();
const year = date.getFullYear();

type Task = {
  title: string;
  type: string[];
  priority: string;
  url: string | null;
  date: string;
  completed?: boolean;
};

const Footer = ({ url, loading }: { url: string; loading: boolean }) => {
  const [tasks, setTasks] = useState([]);

  // get the todo list from local storage
  useEffect(() => {
    const task: any = JSON.parse(
      localStorage.getItem("tasks") || "[]",
    ) as Task[];
    setTasks(task);
  }, [tasks]);

  return (
    <footer className="w-full text-sm justify-between bg-apple-silver shadow fixed ml-0 left-0 bottom-0 z-[1000] border-t-2 flex items-center py-1 rounded-b-md overflow-hidden">
      <section>
        <div className="flex items-center ml-2 space-x-1 w-96 border">
          {!loading && url && (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="mt-[5px]">{url}</span>
            </>
          )}
        </div>
      </section>
      <section className="flex items-center space-x-4">
        <div className="flex border w-20 items-center">
          <LiaTasksSolid className="text-xl" />
          <div className="flex items-center mt-1 mr-1">
            <span>Tasks:</span>
            <span className="text-red-500 ml-1">{tasks?.length}</span>
          </div>
        </div>
        <span className="pt-1">{`© ${year} - RustySEO`}</span>
      </section>
    </footer>
  );
};

export default Footer;
