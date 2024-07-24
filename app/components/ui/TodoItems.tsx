// @ts-ignore
import { Tabs } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import React, { useEffect, useState } from "react";
import TodoItem from "./TodoItem";
import { v4 as uuidv4 } from "uuid";

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

const TodoItems = ({ url, strategy }: { url: string; strategy: string }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [opened, { toggle }] = useDisclosure(false);
  const [newTask, setNewTask] = useState<Task>({
    id: uuidv4(),
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

  const handleRemoveTask = (id: number) => {
    console.log("Removing task with id:", id);
    // @ts-ignore
    const newTasks = tasks.filter((task) => task.id !== id);
    setTasks(newTasks);
    console.log("Updated tasks after removal:", newTasks);

    // Dispatch custom event
    const event = new Event("tasksUpdated");
    window.dispatchEvent(event);
  };

  const handleMarkCompleted = (id: number) => {
    console.log("Marking task as completed with id:", id);
    const newTasks = tasks.map((task) =>
      // @ts-ignore
      task.id === id ? { ...task, completed: true } : task,
    );
    setTasks(newTasks);
    console.log("Updated tasks after marking as completed:", newTasks);

    // Dispatch custom event
    const event = new Event("tasksUpdated");
    window.dispatchEvent(event);
  };

  return (
    <section className="relative h-full">
      <Tabs color="red" defaultValue="first">
        <Tabs.List className="tabs-list z-[5000] sticky -top-6 bg-white w-[88%] mx-auto shadow-2">
          <Tabs.Tab className="py-2" value="first">
            Pending
          </Tabs.Tab>
          <Tabs.Tab className="py-2" value="second" color="green">
            Completed
          </Tabs.Tab>
        </Tabs.List>
        <section className="mt-4">
          <Tabs.Panel value="first" pt="xs">
            <section className="py-4 overflow-auto h-full -mt-8">
              <section className="todoItems custom-scrollbar mx-4 -mt-3">
                {pendingTasks
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime(),
                  )
                  .map((task) => (
                    <TodoItem
                      key={task.id}
                      // @ts-ignore
                      task={task}
                      handleRemoveTask={handleRemoveTask}
                      handleMarkCompleted={handleMarkCompleted}
                    />
                  ))}
              </section>
            </section>
          </Tabs.Panel>

          {/* COMPLETED TASKS */}

          <Tabs.Panel value="second" pt="xs">
            <section className="todoItems custom-scrollbar mx-4 -mt-1.5">
              {completedTasks
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                )
                .map((task) => (
                  <TodoItem
                    key={task.id}
                    // @ts-ignore
                    task={task}
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
