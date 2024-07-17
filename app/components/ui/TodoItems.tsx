import { Button, Chip, Collapse, Tabs, Title, Box, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import React, { useEffect, useState } from "react";

type Task = {
  title: string;
  type: string[];
  priority: string;
  url: string;
  date: string;
  completed?: boolean;
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

const TodoItems = ({ url }: { url: string }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [opened, { toggle }] = useDisclosure(false);
  const [newTask, setNewTask] = useState<Task>({
    title: "",
    type: [],
    priority: "",
    url: url,
    date: "",
    completed: false,
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

        <Tabs.Panel value="first" pt="xs">
          <section className="py-4 overflow-auto h-full -mt-8 ">
            <Tabs color="teal" defaultValue="first">
              <Tabs.Panel value="first" pt="xs">
                <section className="todoItems custom-scrollbar mx-4 ">
                  {tasks
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                    )
                    .map((task, index) => (
                      <Box
                        key={index}
                        className="mb-3 bg-white shadow-sm border relative overflow-hidden w-full rounded-lg p-3"
                      >
                        <div className="flex justify-between items-center">
                          <Title
                            order={6}
                            className="text-xs font-semibold text-gray-800"
                          >
                            {task.title}
                          </Title>
                          <span
                            className={`w-12 h-fit rounded-bl-lg absolute right-0 flex justify-center items-center top-0 text-[10px] pt-1 font-semibold ${
                              task.priority === "High"
                                ? "bg-red-500 text-white"
                                : task.priority === "Medium"
                                  ? "bg-yellow-500 text-white"
                                  : "bg-green-500 text-white"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {task.url}
                        </span>
                        <Group className="flex flex-wrap">
                          {/* make the types to have all different colours */}
                          {task.type.map((type, index) => (
                            <span
                              key={index}
                              className="text-[10px] text-white pt-1 px-1 -mr-3 rounded-sm"
                              style={{
                                backgroundColor: taskColors[type],
                              }}
                            >
                              {type}
                            </span>
                          ))}{" "}
                          <div className="w-full h-[1px] -mt-2 bg-gray-100" />
                          <div className="flex justify-between items-center p-0 -mb-2 -mt-3">
                            <span className="text-[10px] text-gray-500 ">
                              {task.date.substring(0, 10)}
                            </span>
                          </div>
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
