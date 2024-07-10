import { Button, Chip, Collapse, Tabs, Title, Box, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import React, { useEffect, useState } from "react";

type Task = {
  title: string;
  type: string[];
  priority: string;
  url: string;
  date: string;
};

const TodoItems = ({ url }: { url: string }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [opened, { toggle }] = useDisclosure(false);
  const [newTask, setNewTask] = useState<Task>({
    title: "",
    type: [],
    priority: "",
    url: url,
    date: "",
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

  const handleRemoveTask = (index: number) => {
    const newTasks = tasks.filter((_, taskIndex) => taskIndex !== index);
    setTasks(newTasks);
  };

  return (
    <section>
      <Tabs color="teal" defaultValue="first">
        <Tabs.List>
          <Tabs.Tab value="first">Pending</Tabs.Tab>
          <Tabs.Tab value="second" color="blue">
            Completed
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="first" pt="xs">
          <section className="py-4">
            <Tabs color="teal" defaultValue="first">
              <Tabs.Panel value="first" pt="xs">
                <section>
                  {tasks
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                    )
                    .map((task, index) => (
                      <Box
                        key={index}
                        className="mb-3 bg-white shadow-sm border relative overflow-hidden rounded-lg p-3"
                      >
                        <div className="flex justify-between items-center">
                          <Title
                            order={6}
                            className="text-sm font-semibold text-gray-800"
                          >
                            {task.title}
                          </Title>
                          <span
                            className={` w-2 h-full absolute right-0 bottom-0 text-xs font-semibold ${
                              task.priority === "High"
                                ? "bg-red-500 text-white"
                                : task.priority === "Medium"
                                  ? "bg-yellow-500 text-white"
                                  : "bg-green-500 text-white"
                            }`}
                          ></span>
                        </div>
                        <span className="text-sm text-gray-500 ">
                          {task.url}
                        </span>
                        <Group className="flex flex-wrap">
                          {task.type.map((type, i) => (
                            <span
                              key={i}
                              className="flex items-center pt-1 px-2  -mr-3 bg-gray-500 text-[11px] rounded-full text-white"
                            >
                              {type}
                            </span>
                          ))}
                        </Group>
                      </Box>
                    ))}
                </section>
              </Tabs.Panel>

              <Tabs.Panel value="second" pt="xs">
                Second tab color is blue, it gets this value from props, props
                have the priority and will override context value
              </Tabs.Panel>
            </Tabs>
          </section>{" "}
        </Tabs.Panel>

        <Tabs.Panel value="second" pt="xs">
          Second tab color is blue, it gets this value from props, props have
          the priority and will override context value
        </Tabs.Panel>
      </Tabs>
    </section>
  );
};

export default TodoItems;
