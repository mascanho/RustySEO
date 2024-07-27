import React, { useEffect, useState } from "react";
import { LiaTasksSolid } from "react-icons/lia";

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

const Footer = ({ url, loading }: { url: string; loading: boolean }) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const updateTasks = () => {
    const storedTasks = JSON.parse(
      localStorage.getItem("tasks") || "[]",
    ) as Task[];

    // filter the ones that are not completed
    const filteredTasks = storedTasks.filter((task) => !task.completed);
    setTasks(filteredTasks);
    console.log("Tasks updated in Footer:", filteredTasks);
  };

  useEffect(() => {
    updateTasks();

    window.addEventListener("tasksUpdated", updateTasks);

    return () => {
      window.removeEventListener("tasksUpdated", updateTasks);
    };
  }, []);

  return (
    <footer className="w-full text-xs justify-between bg-apple-silver shadow fixed ml-0 left-0 bottom-0 z-[1000] border-t-2 flex items-center py-1 overflow-hidden">
      <section>
        <div className="flex items-center ml-2 space-x-1 w-full">
          {!loading && url && (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500 mt-1" />
              <span className="mt-[5px]">{url}</span>
            </>
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
