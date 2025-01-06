import { Eye, MousePointerClick, Percent } from "lucide-react";
import { StatCard } from "./StatCardsKeywordsWidgets";

export function StatsWidgets() {
  const stats = [
    {
      title: "Impressions",
      value: 1000000,
      description: "Total impressions this month",
      icon: Eye,
      color: "text-blue-600",
      differential: 12.5,
      position: 1,
    },
    {
      title: "Clicks",
      value: 50000,
      description: "Total clicks this month",
      icon: MousePointerClick,
      color: "text-green-600",
      differential: -2.3,
      position: 2,
    },
    {
      title: "CTR",
      value: "5.00%",
      description: "Click-through rate this month",
      icon: Percent,
      color: "text-purple-600",
      differential: 0.8,
      position: 3,
    },
    {
      title: "Average Position",
      value: "2.1",
      description: "Average position this month",
      icon: MousePointerClick,
      color: "text-orange-600",
      differential: 0.3,
      position: 4,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={
            typeof stat.value === "number"
              ? stat.value.toLocaleString()
              : stat.value
          }
          description={stat.description}
          icon={stat.icon}
          color={stat.color}
          differential={stat.differential}
        />
      ))}
    </div>
  );
}
