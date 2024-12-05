import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TaskSection } from "./task-section";
import { CalendarDays, Target } from "lucide-react";

const sections = [
  {
    title: "Technical",
    tasks: [
      {
        id: "1",
        title: "Update component library to match storybook",
        completed: false,
        inProgress: true,
        assignee: {
          name: "Alice",
          avatar: "/placeholder.svg?height=32&width=32",
        },
      },
      {
        id: "2",
        title: "Refactor main components to match system 1.4",
        completed: false,
        assignee: {
          name: "Bob",
          avatar: "/placeholder.svg?height=32&width=32",
        },
      },
      {
        id: "3",
        title: "Implement API integration",
        completed: true,
        assignee: {
          name: "Charlie",
          avatar: "/placeholder.svg?height=32&width=32",
        },
      },
    ],
  },
  {
    title: "On-Page",
    tasks: [
      {
        id: "4",
        title: "Design homepage layout",
        completed: true,
        assignee: {
          name: "Diana",
          avatar: "/placeholder.svg?height=32&width=32",
        },
      },
      {
        id: "5",
        title: "Optimize page load time",
        completed: false,
        inProgress: true,
        assignee: {
          name: "Eve",
          avatar: "/placeholder.svg?height=32&width=32",
        },
      },
    ],
  },
  {
    title: "Off-Page",
    tasks: [
      {
        id: "6",
        title: "Create content strategy",
        completed: true,
        assignee: {
          name: "Frank",
          avatar: "/placeholder.svg?height=32&width=32",
        },
      },
      {
        id: "7",
        title: "Plan social media campaign",
        completed: false,
        assignee: {
          name: "Grace",
          avatar: "/placeholder.svg?height=32&width=32",
        },
      },
    ],
  },
];

export default function TodoBoard() {
  const totalTasks = sections.reduce(
    (acc, section) => acc + section.tasks.length,
    0,
  );
  const completedTasks = sections.reduce(
    (acc, section) =>
      acc + section.tasks.filter((task) => task.completed).length,
    0,
  );
  const progress = (completedTasks / totalTasks) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-start mb-4">
            <div>
              <CardTitle className="text-2xl font-bold mb-1">
                Project Roadmap
              </CardTitle>
              <p className="text-muted-foreground">Development Phase</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold mb-1">
                {Math.round(progress)}% complete
              </p>
              <p className="text-muted-foreground">2 days left</p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span>Start: Nov 12</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span>End: Dec 12</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {sections.map((section) => (
        <TaskSection key={section.title} section={section} />
      ))}
    </div>
  );
}
