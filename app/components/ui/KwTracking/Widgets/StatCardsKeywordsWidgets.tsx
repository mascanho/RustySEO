import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TypeIcon as type, LucideIcon } from "lucide-react";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useEffect } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  color: string;
  differential: number;
  keywordsSummary: [];
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
  differential,
  keywordsSummary,
}: StatCardProps) {
  const isPositive = differential >= 0;
  const differentialColor = isPositive ? "text-green-600" : "text-red-600";
  const DifferentialIcon = isPositive ? ArrowUpIcon : ArrowDownIcon;

  useEffect(() => {
    // This effect will run whenever keywordsSummary changes
  }, [keywordsSummary]);

  return (
    <Card className="dark:bg-brand-darker dark:border-brand-dark p-3">
      <CardHeader className="flex flex-row items-center justify-between p-0">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${color}`} />
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <DifferentialIcon className={`h-3 w-3 ${differentialColor}`} />
          <span className={`text-xs font-medium ${differentialColor}`}>
            {Math.abs(differential)}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-2 px-0 pb-0">
        <div className="flex items-baseline justify-between">
          <span className="text-base font-bold">{value}</span>
          <p className="text-xs text-muted-foreground text-brand-bright">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
