"use client";
import React, { useEffect, useState } from "react";
import { FaCirclePlus } from "react-icons/fa6";
import TodoContainerItems from "./TodoContainerItems";
import { Modal } from "@mantine/core";
import Todo from "../Todo";
import { useDisclosure } from "@mantine/hooks";
import { RiTodoLine } from "react-icons/ri";
import { MdDoneOutline } from "react-icons/md";
import { MdOutlineIncompleteCircle } from "react-icons/md";
import { GoTasklist } from "react-icons/go";

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
      <div className="grid gap-4 grid-cols-3 px-7 pt-8 w-full max-w-[80rem] overflow-hidden rounded-xl  mx-auto   place-items-center">
        <section className="w-full max-w-[380px] h-[calc(100vh-20rem)] dark:border-brand-dark  bg-white dark:bg-brand-darker rounded-xl mb-10 overflow-hidden my-auto shadow border">
          <div className="flex items-center border-b dark:border-b-brand-dark justify-between px-5 py-3 font-semibold">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl dark:text-white">TODO</h1>
              <RiTodoLine className="text-xl text-brand-highlight dark:text-white/50" />
            </div>
            <FaCirclePlus
              onClick={openModal}
              className="text-lg cursor-pointer hover:scale-110 active:scale-90 text-blue-500 dark:text-brand-highlight transition-all ease-in delay-75"
            />
          </div>
          <div className="p-2 overflow-auto h-[calc(100vh-24rem)] mb-5 rounded-md">
            <TodoContainerItems status={"Todo"} />
          </div>
        </section>
        <section className="w-full max-w-[380px] h-[calc(100vh-20rem)] dark:border-brand-dark  bg-white dark:bg-brand-darker rounded-xl mb-10 overflow-hidden my-auto shadow border">
          <div className="flex items-center border-b dark:border-b-brand-dark justify-between px-5 py-3 font-semibold">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl dark:text-white">DOING</h1>
              <GoTasklist className="text-2xl text-brand-highlight dark:text-white/50" />
            </div>
          </div>
          <div className="p-2 overflow-auto h-[calc(100vh-24rem)] mb-5 rounded-md">
            <TodoContainerItems status={"Doing"} />
          </div>
        </section>
        <section className="w-full max-w-[380px] h-[calc(100vh-20rem)] dark:border-brand-dark  bg-white dark:bg-brand-darker rounded-xl mb-10 overflow-hidden my-auto shadow border">
          <div className="flex items-center border-b dark:border-b-brand-dark justify-between px-5 py-3 font-semibold">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl dark:text-white">COMPLETE</h1>
              <MdDoneOutline className="text-xl text-brand-highlight dark:text-white/50" />
            </div>
          </div>
          <div className="p-2 overflow-auto h-[calc(100vh-24rem)] mb-5 rounded-md">
            <TodoContainerItems status={"Completed"} />
          </div>
        </section>
      </div>
    </>
  );
};

export default TaskManagerContainer;
