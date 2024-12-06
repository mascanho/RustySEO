import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TaskSection } from "./task-section";
import { CalendarDays, Target } from "lucide-react";
import sections from "./Sections";

// Constants for project dates
const START_DATE = "Nov 12";
const END_DATE = "Dec 12";
const DAYS_LEFT = 2;

export default function TodoBoard() {
  const { totalTasks, completedTasks } = sections.reduce(
    (acc, section) => {
      acc.totalTasks += section?.tasks.length;
      acc.completedTasks += section?.tasks.filter(
        (task) => task.completed,
      ).length;
      return acc;
    },
    { totalTasks: 0, completedTasks: 0 },
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
              <p
                className="text-2xl font-bold mb-1"
                aria-label={`Progress: ${Math.round(progress)}%`}
              >
                {Math.round(progress)}% complete
              </p>
              <p className="text-muted-foreground">{DAYS_LEFT} days left</p>
            </div>
          </div>
          <Progress
            value={progress}
            className="h-2"
            aria-label="Progress bar"
          />
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span>Start: {START_DATE}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span>End: {END_DATE}</span>
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
