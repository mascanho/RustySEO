// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Tabs } from "@mantine/core";
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

  // Load tasks from localStorage when the component mounts
  useEffect(() => {
    const loadTasks = () => {
      const storedTasks = JSON.parse(
        localStorage.getItem("tasks") || "[]",
      ) as Task[];
      console.log("Loaded tasks from localStorage:", storedTasks);
      setTasks(storedTasks);
    };

    // Load tasks initially
    loadTasks();

    // Add event listener for storage changes
    const handleStorageChange = (event: StorageEvent) => {
      console.log("Storage event detected:", event);
      if (event.key === "tasks") {
        console.log("tasks key in localStorage changed. Reloading tasks...");
        loadTasks(); // Reload tasks when localStorage changes
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Clean up the event listener
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    // Listen for custom events
    const handleTasksUpdated = () => {
      const storedTasks = localStorage.getItem("tasks");
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    };

    window.addEventListener("tasksUpdated", handleTasksUpdated);

    return () => {
      window.removeEventListener("tasksUpdated", handleTasksUpdated);
    };
  }, []);

  // Filter tasks based on their status
  const completedTasks = tasks.filter((task) => task.status === "Completed");
  const pendingTasks = tasks.filter((task) => task.status !== "Completed");

  // Remove a task
  const handleRemoveTask = (id: string) => {
    const newTasks = tasks.filter((task) => task.id !== id);
    console.log("Removing task. Updated tasks:", newTasks);
    setTasks(newTasks);
    localStorage.setItem("tasks", JSON.stringify(newTasks));
  };

  // Toggle task completion status
  const handleMarkCompleted = (id: string) => {
    const newTasks = tasks.map((task) =>
      task.id === id
        ? {
            ...task,
            status: task.status === "Completed" ? "Pending" : "Completed",
          }
        : task,
    );
    console.log("Marking task as completed. Updated tasks:", newTasks);
    setTasks(newTasks);
    localStorage.setItem("tasks", JSON.stringify(newTasks));
  };

  return (
    <section className="relative h-full">
      <Tabs color="red" defaultValue="first">
        <Tabs.List className="tabs-list tabs-drawer z-[5000] bg-white w-[88%] mx-auto shadow-2 -mt-5">
          <Tabs.Tab className="py-2" value="first">
            Pending
          </Tabs.Tab>
          <Tabs.Tab className="py-2" value="second" color="green">
            Completed
          </Tabs.Tab>
        </Tabs.List>

        {/* PENDING TASKS */}
        <section className="mt-4 h-2">
          <Tabs.Panel value="first" pt="xs">
            <section className="py-4 -mt-2 overflow-auto h-[calc(100vh-14rem)] ">
              <section className="todoItems custom-scrollbar  mx-4 -mt-3 space-y-3">
                {pendingTasks
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime(),
                  )
                  .map((task) => (
                    <TaskManagerContainerItem
                      key={task.id}
                      data={task}
                      onMarkCompleted={handleMarkCompleted}
                      onRemoveTask={handleRemoveTask}
                    />
                  ))}
              </section>
            </section>
          </Tabs.Panel>

          {/* Completed Tasks */}
          <Tabs.Panel value="second" pt="xs">
            <section className="todoItems custom-scrollbar mx-4 -mt-1.5 space-y-3">
              {completedTasks
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                )
                .map((task) => (
                  <TaskManagerContainerItem
                    key={task.id}
                    data={task}
                    onMarkCompleted={handleMarkCompleted}
                    onRemoveTask={handleRemoveTask}
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
