import React, { useEffect, useState } from "react";
import { Tabs } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import TodoItem from "./TodoItem";
import { v4 as uuidv4 } from "uuid";
import TaskManagerContainerItem from "./TaskManager/TaskManagerContainerItem";

type Task = {
  id: string;
  title: string;
  type: string[];
  priority: string;
  url: string;
  date: string;
  completed?: boolean;
  strategy?: "mobile" | "desktop";
  status?: "Todo" | "Pending" | "Completed";
};

const TodoItems = ({ url, strategy }: { url: string; strategy: string }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [opened, { toggle }] = useDisclosure(false);

  // Load tasks from localStorage when the component mounts
  useEffect(() => {
    const storedTasks = JSON.parse(
      localStorage.getItem("tasks") || "[]",
    ) as Task[];
    if (storedTasks.length > 0) {
      setTasks(storedTasks);
    }
  }, []);

  // Save tasks to localStorage whenever they are updated
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    // Dispatch custom event
    const event = new Event("tasksUpdated");
    window.dispatchEvent(event);
  }, [tasks]);

  const completedTasks = tasks.filter((task) => task.status === "Completed");
  const pendingTasks = tasks.filter((task) => task.status !== "Completed");

  const handleRemoveTask = (id: string) => {
    console.log("Removing task with id:", id);
    const newTasks = tasks.filter((task) => task.id !== id);
    setTasks(newTasks);
    console.log("Updated tasks after removal:", newTasks);
  };

  const handleMarkCompleted = (id: string) => {
    console.log("Marking task as completed with id:", id);
    const newTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: true } : task,
    );
    setTasks(newTasks);
    console.log("Updated tasks after marking as completed:", newTasks);
  };

  return (
    <section className="relative h-full">
      <Tabs color="red" defaultValue="first">
        <Tabs.List className="tabs-list tabs-drawer z-[5000] sticky top-0 bg-white  w-[88%] mx-auto shadow-2 -mt-5">
          <Tabs.Tab className="py-2" value="first">
            Pending
          </Tabs.Tab>
          <Tabs.Tab className="py-2" value="second" color="green">
            Completed
          </Tabs.Tab>
        </Tabs.List>
        <section className="mt-4">
          <Tabs.Panel value="first" pt="xs">
            <section className="py-4 overflow-auto h-full -mt-2">
              <section className="todoItems custom-scrollbar mx-4 -mt-3 space-y-3">
                {pendingTasks
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime(),
                  )
                  .map((task) => (
                    <TaskManagerContainerItem key={task.id} data={task} />
                  ))}
              </section>
            </section>
          </Tabs.Panel>

          {/* Completed Tasks */}
          <Tabs.Panel value="second" pt="xs">
            <section className="todoItems custom-scrollbar mx-4 -mt-1.5">
              {completedTasks
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                )
                .map((task) => (
                  <TaskManagerContainerItem key={task.id} data={task} />
                ))}
            </section>
          </Tabs.Panel>
        </section>
      </Tabs>
    </section>
  );
};

export default TodoItems;
