import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TypeIcon as type, LucideIcon } from "lucide-react";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  color: string;
  differential: number;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
  differential,
}: StatCardProps) {
  const isPositive = differential >= 0;
  const differentialColor = isPositive ? "text-green-600" : "text-red-600";
  const DifferentialIcon = isPositive ? ArrowUpIcon : ArrowDownIcon;

  return (
    <Card className="dark:bg-brand-darker dark:border-brand-dark">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-8 w-8 ${color}`} />
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold">{value}</span>
          <DifferentialIcon className={`h-4 w-4 ${differentialColor}`} />
          <span className={`text-sm font-medium ${differentialColor}`}>
            {Math.abs(differential)}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
