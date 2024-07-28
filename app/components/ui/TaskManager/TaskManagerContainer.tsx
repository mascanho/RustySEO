"use client";
import React, { useEffect, useState } from "react";
import { FaCirclePlus } from "react-icons/fa6";
import TodoContainerItems from "./TodoContainerItems";
import { Modal } from "@mantine/core";
import Todo from "../Todo";
import { useDisclosure } from "@mantine/hooks";

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

const TaskManagerContainer: React.FC<{ strategy: string }> = ({ strategy }) => {
  const [openedModal, { open: openModal, close: closeModal }] =
    useDisclosure(false);
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    // Fetch the URL and strategy from session storage when the component mounts
    const fetchUrlFromSessionStorage = () => {
      const urlSession = window?.sessionStorage?.getItem("url");
      const strategySession = window?.sessionStorage?.getItem("strategy");
      setUrl(urlSession || ""); // Handle empty URL case
      // Handle strategy session if needed
    };

    fetchUrlFromSessionStorage();
  }, []);

  return (
    <>
      <Modal
        opened={openedModal}
        overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
        closeOnEscape
        closeOnClickOutside
        onClose={closeModal}
        title=""
        centered
      >
        <Todo url={url} close={closeModal} strategy={strategy} />
      </Modal>
      <div className="grid grid-cols-3 px-7 pt-8 w-full max-w-400px overflow-hidden rounded-xl max-w-[1800px] mx-auto shadow mt-20 place-items-center">
        <section className="w-full max-w-[380px] h-[61rem] dark:border-brand-dark border bg-white dark:bg-brand-darker rounded-xl mb-10 overflow-hidden my-auto shadow">
          <div className="flex items-center border-b dark:border-b-brand-dark justify-between px-6 py-5 font-semibold">
            <h1 className="text-xl dark:text-white">TODO 📝</h1>
            <FaCirclePlus
              onClick={openModal}
              className="text-2xl cursor-pointer hover:scale-110 active:scale-90 text-brand-highlight dark:text-brand-highlight transition-all ease-in delay-75"
            />
          </div>
          <div className="p-2 overflow-scroll h-[57.6rem] mb-5 rounded-md">
            <TodoContainerItems status={"Todo"} />
          </div>
        </section>
        <section className="w-full max-w-[380px] h-[61rem] dark:border-brand-dark border bg-white dark:bg-brand-darker rounded-xl mb-10 overflow-hidden my-auto shadow">
          <div className="flex items-center border-b dark:border-b-brand-dark justify-between px-6 py-5 font-semibold">
            <h1 className="text-xl dark:text-white">DOING ⏳</h1>
            <FaCirclePlus
              onClick={openModal}
              className="text-2xl cursor-pointer hover:scale-110 active:scale-90 text-brand-highlight dark:text-brand-highlight transition-all ease-in delay-75"
            />
          </div>
          <div className="p-2 overflow-scroll h-[57.6rem] mb-5 rounded-md">
            <TodoContainerItems status={"Doing"} />
          </div>
        </section>
        <section className="w-full max-w-[380px] h-[61rem] dark:border-brand-dark border bg-white dark:bg-brand-darker rounded-xl mb-10 overflow-hidden my-auto shadow">
          <div className="flex items-center border-b dark:border-b-brand-dark justify-between px-6 py-5 font-semibold">
            <h1 className="text-xl dark:text-white">Completed 🎉</h1>
            <FaCirclePlus
              onClick={openModal}
              className="text-2xl cursor-pointer hover:scale-110 active:scale-90 text-brand-highlight dark:text-brand-highlight transition-all ease-in delay-75"
            />
          </div>
          <div className="p-2 overflow-scroll h-[57.6rem] mb-5 rounded-md">
            <TodoContainerItems status={"Completed"} />
          </div>
        </section>
      </div>
    </>
  );
};

export default TaskManagerContainer;
