import React, { useState, useEffect } from "react";
import {
  Container,
  TextInput,
  MultiSelect,
  Select,
  Button,
  Box,
  Title,
  Chip,
  Group,
} from "@mantine/core";

type Task = {
  title: string;
  type: string[];
  priority: string;
  url: string;
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
}

const Todo: React.FC<TodoProps> = ({ url }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<Task>({
    title: "",
    type: [],
    priority: "",
    url: url,
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

  // Save tasks to localStorage whenever they are updated
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = () => {
    if (newTask.title && newTask.type.length > 0 && newTask.priority) {
      setTasks([...tasks, newTask]);
      setNewTask({ title: "", type: [], priority: "", url: url });
    }
  };

  const handleRemoveTask = (index: number) => {
    const newTasks = tasks.filter((_, taskIndex) => taskIndex !== index);
    setTasks(newTasks);
  };

  return (
    <Container size="sm">
      <Box mt={40}>
        <Title order={2} mb="lg">
          Task Manager
        </Title>
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
        <Box>
          {tasks.map((task, index) => (
            <Box
              key={index}
              p="md"
              mb="md"
              style={{
                border: "1px solid #ccc",
                borderRadius: 5,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div className="flex justify-between items-center">
                <Title order={4}>{task.title}</Title>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    task.priority === "High"
                      ? "bg-red-500 text-white"
                      : task.priority === "Medium"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                >
                  {task.priority}
                </span>
              </div>
              <span className="text-sm text-gray-500 mt-1">{task.url}</span>
              <Group mt="xs">
                {task.type.map((type, i) => (
                  <Chip key={i} variant="filled" size="xs">
                    {type}
                  </Chip>
                ))}
              </Group>
              <Button
                color="red"
                size="xs"
                mt="sm"
                onClick={() => handleRemoveTask(index)}
              >
                Remove Task
              </Button>
            </Box>
          ))}
        </Box>
      </Box>
    </Container>
  );
};

export default Todo;
