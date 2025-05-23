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
  id: number;
  title: string;
  description: string;
  type: string[];
  priority: string;
  url: string | null;
  date: string;
  status: string;
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
  const [tasksInitialized, setTasksInitialized] = useState(false);
  const [opened, { toggle }] = useDisclosure(false);
  const [recrawlUrl, setRecrawlUrl] = useState<string | null>(null);

  const [newTask, setNewTask] = useState<Task>({
    id: Math.random() * 100000,
    title: "",
    description: "",
    type: [],
    priority: "",
    url: url,
    date: new Date().toISOString(),
    status: "Todo",
    strategy: strategy || "DESKTOP",
  });

  useEffect(() => {
    const recrawl = sessionStorage.getItem("url");
    setRecrawlUrl(recrawl);
  }, []);

  useEffect(() => {
    const storedTasks = localStorage.getItem("tasks");
    if (storedTasks) {
      console.log("Loading tasks from localStorage", JSON.parse(storedTasks));
      setTasks(JSON.parse(storedTasks));
    }
    setTasksInitialized(true);
  }, []);

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
        id: Math.random() * 100000,
        title: "",
        description: "",
        type: [],
        priority: "",
        url: url,
        date: new Date().toISOString(),
        status: "Todo",
        strategy,
      });
      const event = new Event("tasksUpdated");
      window.dispatchEvent(event);
      console.log("Task added", updatedTasks);
      updateTasks(updatedTasks);
      closeModal();
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
        onClose={closeModal}
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
              className="dark:text-white"
              value={newTask.title}
              onChange={(event) =>
                setNewTask({ ...newTask, title: event.currentTarget.value })
              }
              mb="md"
            />
            <TextInput
              label="Task Description"
              placeholder="Enter task description"
              className="dark:text-white"
              value={newTask.description}
              onChange={(event) =>
                setNewTask({
                  ...newTask,
                  description: event.currentTarget.value,
                })
              }
              mb="md"
            />
            <MultiSelect
              label="Type"
              placeholder="Select task type"
              className="dark:text-white text-black"
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
              className="dark:text-white"
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
              className="dark:text-white dark:placeholder:text-white"
              label="Page Url"
              placeholder={!url && !recrawlUrl ? "" : url || recrawlUrl || ""}
              value={url || recrawlUrl || "..."}
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
