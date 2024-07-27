import React, { useEffect, useState } from "react";
import TaskManagerContainerItem from "./TaskManagerContainerItem";

// Define a type for the Todo item
interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

// Define props type
interface TodoContainerItemsProps {
  status: string; // Update this type based on what `status` represents
}

const TodoContainerItems: React.FC<TodoContainerItemsProps> = ({ status }) => {
  // State with type annotation
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);

  useEffect(() => {
    // Function to handle the custom event
    const handleTasksUpdated = (event: Event) => {
      // Retrieve tasks from localStorage and update state
      const tasks = localStorage.getItem("tasks");
      if (tasks) {
        setTodoItems(JSON.parse(tasks));
      }
    };

    // Add event listener for the custom event
    window.addEventListener("tasksUpdated", handleTasksUpdated);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener("tasksUpdated", handleTasksUpdated);
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  useEffect(() => {
    try {
      const tasks = localStorage.getItem("tasks");
      if (tasks) {
        setTodoItems(JSON.parse(tasks));
      }
    } catch (error) {
      console.error("Failed to parse JSON from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "tasks") {
        const tasks = localStorage.getItem("tasks");
        if (tasks) {
          setTodoItems(JSON.parse(tasks));
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []); // Dependency array should be empty, as you want to listen to any changes in localStorage

  return (
    <div className="p-2 space-y-3  w-full rounded-md pb-5">
      {todoItems.map((item) => (
        <TaskManagerContainerItem key={item.id} data={item} />
      ))}
    </div>
  );
};

export default TodoContainerItems;
