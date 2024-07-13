type Task = {
  title: string;
  type: string[];
  priority: string;
  url: string | null;
  date: string;
  completed?: boolean;
};

export const updateTasks = (newTasks: Task[]) => {
  localStorage.setItem("tasks", JSON.stringify(newTasks));
  window.dispatchEvent(new Event("tasksUpdated"));
};
