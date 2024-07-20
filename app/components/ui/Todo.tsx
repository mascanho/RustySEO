import React, { useState, useEffect } from "react";
import {
  Container,
  TextInput,
  MultiSelect,
  Select,
  Button,
  Box,
  Drawer,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import TodoItems from "./TodoItems";
import { updateTasks } from "@/app/Hooks/taskUtils";
import { toast } from "sonner";

type Task = {
  title: string;
  type: string[];
  priority: string;
  url: string | null;
  date: string;
  completed?: boolean;
  strategy: string;
};

const taskTypes = [
  "CWV",
  "Head",
  "Content",
  "Links",
  "Images",
  "Headings",
  "Keywords",
  "Schema",
];
const priorities = ["Low", "Medium", "High"];

interface TodoProps {
  url: string;
  close: () => void;
  strategy: string;
}

const Todo: React.FC<TodoProps> = ({ strategy, url, close: closeModal }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksInitialized, setTasksInitialized] = useState(false); // New flag for initialization
  const [opened, { toggle }] = useDisclosure(false);

  const [newTask, setNewTask] = useState<Task>({
    title: "",
    type: [],
    priority: "",
    url: url,
    date: new Date().toISOString(),
    completed: false,
    strategy,
  });

  // Load tasks from localStorage when the component mounts
  useEffect(() => {
    const storedTasks = localStorage.getItem("tasks");
    if (storedTasks) {
      console.log("Loading tasks from localStorage", JSON.parse(storedTasks));
      setTasks(JSON.parse(storedTasks));
    }
    setTasksInitialized(true); // Set the initialization flag to true
  }, []);

  // Save tasks to localStorage whenever they are updated
  useEffect(() => {
    if (tasksInitialized) {
      console.log("Saving tasks to localStorage", tasks);
      localStorage.setItem("tasks", JSON.stringify(tasks));
    }
  }, [tasks, tasksInitialized]);

  const handleAddTask = () => {
    if (newTask.title && newTask.type.length > 0 && newTask.priority) {
      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      setNewTask({
        title: "",
        type: [],
        priority: "",
        url: url,
        date: new Date().toISOString(),
        completed: false,
        strategy,
      });
      console.log("Task added", updatedTasks);
      updateTasks(updatedTasks);
      closeModal(); // Ensure this is a function call
      toast("Task added");
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  return (
    <>
      <Drawer
        offset={8}
        radius="md"
        opened={opened}
        onClose={closeModal} // Use closeModal function
        title="Todo"
        size="sm"
        className="overflow-hidden"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        transitionProps={{
          transition: "scale-x",
          duration: 200,
          timingFunction: "ease",
        }}
        position="left"
        withCloseButton
        closeOnClickOutside
      >
        <TodoItems url={url} strategy={strategy} />
      </Drawer>

      <Container size="sm">
        <Box>
          <Box mb="lg">
            <TextInput
              label="Task Title"
              placeholder="Enter task title"
              value={newTask.title}
              onChange={(event) =>
                setNewTask({ ...newTask, title: event.currentTarget.value })
              }
              mb="md"
            />
            <MultiSelect
              label="Type"
              placeholder="Select task type"
              data={taskTypes.map((type) => ({ value: type, label: type }))}
              value={newTask.type}
              onChange={(value) => setNewTask({ ...newTask, type: value })}
              mb="md"
              maxDropdownHeight={200}
              comboboxProps={{
                transitionProps: { transition: "pop", duration: 200 },
                shadow: "md",
              }}
            />
            <Select
              label="Priority"
              placeholder="Select priority"
              data={priorities.map((priority) => ({
                value: priority,
                label: priority,
              }))}
              value={newTask.priority}
              onChange={(value) =>
                setNewTask({ ...newTask, priority: value || "" })
              }
              mb="md"
              comboboxProps={{
                transitionProps: { transition: "pop", duration: 200 },
                shadow: "md",
              }}
            />
            <TextInput
              label="Page Url"
              placeholder="Custom layout"
              value={url}
              readOnly
            />
            <Button className="mt-4 w-full" fullWidth onClick={handleAddTask}>
              Add Task
            </Button>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default Todo;
