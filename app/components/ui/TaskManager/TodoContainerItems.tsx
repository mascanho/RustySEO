import React, { useEffect, useState } from "react";
import TaskManagerContainerItem from "./TaskManagerContainerItem";
import useGlobalConsoleStore from "@/store/GlobalConsoleLog";

// Define a type for the Todo item
interface TodoItem {
  id: string; // Changed to string to match the example in the TaskManagerContainerItem
  text: string;
  completed: boolean;
  status: string; // Ensure that status is part of the TodoItem interface
  priority: string;
  strategy: string;
  date: string;
  url: string;
  description: string;
  title: string;
}

// Define props type
interface TodoContainerItemsProps {
  status: string; // Represents the current status filter
}

const TodoContainerItems: React.FC<TodoContainerItemsProps> = ({ status }) => {
  // State with type annotation
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);

  // Update todoItems state when tasks are updated in localStorage
  const updateTodoItems = () => {
    try {
      const tasks = localStorage.getItem("tasks");
      if (tasks) {
        setTodoItems(JSON.parse(tasks));
      }
    } catch (error) {
      console.error("Failed to parse JSON from localStorage:", error);
    }
  };

  useEffect(() => {
    // Function to handle custom event
    const handleTasksUpdated = () => {
      updateTodoItems();
    };

    // Add event listener for the custom event
    window.addEventListener("tasksUpdated", handleTasksUpdated);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener("tasksUpdated", handleTasksUpdated);
    };
  }, []); // Only run once on mount and cleanup on unmount

  useEffect(() => {
    // Fetch tasks on mount
    updateTodoItems();
  }, []);

  useEffect(() => {
    // Handle changes in localStorage
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "tasks") {
        updateTodoItems();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Filter tasks based on the current status
  const filteredTodoItems = todoItems.filter((item) => item.status === status);

  return (
    <div className="p-2 space-y-3 w-full rounded-md pb-5">
      {filteredTodoItems
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((item) => (
          <TaskManagerContainerItem key={item.id} data={item} />
        ))}
    </div>
  );
};

export default TodoContainerItems;
