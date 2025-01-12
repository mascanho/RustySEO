import { Eye, MousePointerClick, Percent, ArrowUpDown } from "lucide-react";
import { StatCard } from "./StatCardsKeywordsWidgets";

interface KeywordSummary {
  current_impressions: number;
  current_clicks: number;
  current_position: number;
  initial_impressions: number;
  initial_clicks: number;
  initial_position: number;
  query: string;
  url: string;
}

export function StatsWidgets({
  keywordsSummary,
}: {
  keywordsSummary: KeywordSummary[];
}) {
  const totalImpressions =
    keywordsSummary?.reduce(
      (sum, keyword) => sum + (keyword?.current_impressions || 0),
      0,
    ) || 0;
  const totalClicks =
    keywordsSummary?.reduce(
      (sum, keyword) => sum + (keyword?.current_clicks || 0),
      0,
    ) || 0;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgPosition =
    keywordsSummary?.length > 0
      ? keywordsSummary.reduce(
          (sum, keyword) => sum + (keyword?.current_position || 0),
          0,
        ) / keywordsSummary.length
      : 0;

  const stats = [
    {
      title: "Impressions",
      value: totalImpressions || 0,
      description: "Total impressions this month",
      icon: Eye,
      color: "text-blue-600",
      differential: 12.5,
      position: 1,
    },
    {
      title: "Clicks",
      value: totalClicks || 0,
      description: "Total clicks this month",
      icon: MousePointerClick,
      color: "text-green-600",
      differential: -2.3,
      position: 2,
    },
    {
      title: "CTR",
      value: (ctr || 0).toFixed(2) + "%",
      description: "Click-through rate this month",
      icon: Percent,
      color: "text-purple-600",
      differential: 0.8,
      position: 3,
    },
    {
      title: "Average Position",
      value: (avgPosition || 0).toFixed(1),
      description: "Average position this month",
      icon: ArrowUpDown,
      color: "text-orange-600",
      differential: 0.3,
      position: 4,
    },
  ];

  console.log("Keywords Summary", keywordsSummary);

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
          keywordsSummary={keywordsSummary}
        />
      ))}
    </div>
  );
}
