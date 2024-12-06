import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  inProgress?: boolean;
  assignee?: {
    name: string;
    avatar: string;
  };
}

interface Section {
  title: string;
  tasks: Task[];
}

interface TaskSectionProps {
  section: Section;
}

export function TaskSection({ section }: TaskSectionProps) {
  // Local state to manage task completion
  const [tasks, setTasks] = useState(section.tasks);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Handle toggling the task completion
  const toggleTaskCompletion = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  };

  const completedTasks = tasks.filter((task) => task.completed).length;
  const progress = (completedTasks / tasks.length) * 100;

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">{section.title}</CardTitle>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            {completedTasks} of {tasks.length} Tasks
          </span>
          <button onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent>
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
          </div>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center space-x-4 ${
                  task.completed ? "line-through text-muted-foreground" : ""
                }`}
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTaskCompletion(task.id)}
                />
                <span className="flex-1">{task.title}</span>
                {task.inProgress && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800"
                  >
                    In progress
                  </Badge>
                )}
                {task.assignee && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={task.assignee.avatar}
                      alt={task.assignee.name}
                    />
                    <AvatarFallback>{task.assignee.name[0]}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
