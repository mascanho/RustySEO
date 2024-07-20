import { Chip, Collapse, Tabs, Title, Box, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import React, { useEffect, useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaDesktop, FaMobile, FaMobileAlt } from "react-icons/fa";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TodoItem from "./TodoItem";

type Task = {
  title: string;
  type: string[];
  priority: string;
  url: string;
  date: string;
  completed?: boolean;
  strategy?: string;
};

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

const TodoItems = ({ url, strategy }: { url: string; strategy: string }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [opened, { toggle }] = useDisclosure(false);
  const [newTask, setNewTask] = useState<Task>({
    title: "",
    type: [],
    priority: "",
    url: url,
    date: "",
    completed: false,
    strategy: "",
  });

  // Load tasks from localStorage when the component mounts
  useEffect(() => {
    const storedTasks = JSON.parse(
      localStorage.getItem("tasks") || "[]",
    ) as Task[];
    if (storedTasks && storedTasks.length > 0) {
      setTasks(storedTasks);
    }
  }, []);

  const completedTasks = tasks.filter((task) => task.completed);
  const pendingTasks = tasks.filter((task) => !task.completed);

  // Save tasks to localStorage whenever they are updated
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const handleRemoveTask = (index: number) => {
    const newTasks = tasks.filter((_, taskIndex) => taskIndex !== index);
    setTasks(newTasks);
  };

  const handleMarkCompleted = (index: number) => {
    const newTasks = [...tasks];
    newTasks[index].completed = true;
    setTasks(newTasks);
  };

  return (
    <section className="relative h-full">
      <Tabs color="teal" defaultValue="first">
        <Tabs.List className="tabs-list z-[5000] sticky -top-6 bg-white w-[88%] mx-auto shadow-2">
          <Tabs.Tab className=" py-2" value="first">
            Pending
          </Tabs.Tab>
          <Tabs.Tab className=" py-2" value="second" color="blue">
            Completed
          </Tabs.Tab>
        </Tabs.List>
        <section className="mt-4">
          <Tabs.Panel value="first" pt="xs">
            <section className="py-4 overflow-auto h-full -mt-8 ">
              <Tabs color="teal" defaultValue="first">
                <Tabs.Panel value="first" pt="xs">
                  <section className="todoItems custom-scrollbar mx-4 ">
                    {pendingTasks
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime(),
                      )
                      .map((task, index) => (
                        <TodoItem
                          key={index}
                          task={task}
                          index={index}
                          url={url}
                          handleRemoveTask={handleRemoveTask}
                          handleMarkCompleted={handleMarkCompleted}
                        />
                      ))}
                  </section>
                </Tabs.Panel>
              </Tabs>
            </section>{" "}
          </Tabs.Panel>

          {/* COMPLETED TASKS */}

          <Tabs.Panel value="second" pt="xs">
            <section className="todoItems custom-scrollbar mx-4 -mt-1.5 ">
              {completedTasks
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                )
                .map((task, index) => (
                  <TodoItem
                    key={index}
                    task={task}
                    index={index}
                    url={url}
                    handleRemoveTask={handleRemoveTask}
                    handleMarkCompleted={handleMarkCompleted}
                  />
                ))}
            </section>
          </Tabs.Panel>
        </section>
      </Tabs>
    </section>
  );
};

export default TodoItems;
