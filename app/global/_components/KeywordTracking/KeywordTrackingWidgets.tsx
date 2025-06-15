// @ts-nocheck
import { StatCard } from "@/app/components/ui/KwTracking/Widgets/StatCardsKeywordsWidgets";
import {
  Eye,
  MousePointerClick,
  Percent,
  ArrowUpDown,
  KeySquare,
  Trophy,
  Medal,
  Crown,
} from "lucide-react";
import { useKeywordsStore } from "@/store/KWTrackingStore";

interface KeywordData {
  id: number;
  query: string;
  url: string;
  current_impressions: number;
  initial_impressions: number;
  current_clicks: number;
  initial_clicks: number;
  current_position: number;
  initial_position: number;
}

export function StatsWidgets() {
  // Use the hook directly to subscribe to state updates
  const { keywords } = useKeywordsStore();

  // console.log(keywords, "keywords from store");

  // Calculate stats based on keywords from store
  const totalImpressions = keywords.reduce(
    (sum, keyword) => sum + (keyword?.current_impressions || 0),
    0,
  );

  const totalClicks = keywords.reduce(
    (sum, keyword) => sum + (keyword?.current_clicks || 0),
    0,
  );

  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  const avgPosition =
    keywords.length > 0
      ? keywords.reduce(
          (sum, keyword) => sum + (keyword?.current_position || 0),
          0,
        ) / keywords.length
      : 0;

  const mostImpressions =
    keywords.length > 0
      ? keywords.reduce((prev, current) =>
          (prev?.current_impressions || 0) > (current?.current_impressions || 0)
            ? prev
            : current,
        )
      : null;

  const mostClicks =
    keywords.length > 0
      ? keywords.reduce((prev, current) =>
          (prev?.current_clicks || 0) > (current?.current_clicks || 0)
            ? prev
            : current,
        )
      : null;

  const bestPosition =
    keywords.length > 0
      ? keywords.reduce((prev, current) =>
          (prev?.current_position || 0) < (current?.current_position || 0)
            ? prev
            : current,
        )
      : null;

  const stats = [
    {
      title: "Impressions",
      value: totalImpressions,
      description: "Total impressions",
      icon: Eye,
      color: "text-blue-600",
      differential: totalImpressions === 0 ? 0 : 12.5,
      position: 1,
    },
    {
      title: "Clicks",
      value: totalClicks,
      description: "Total clicks",
      icon: MousePointerClick,
      color: "text-green-600",
      differential: totalClicks === 0 ? 0 : -2.3,
      position: 2,
    },
    {
      title: "CTR",
      value: ctr.toFixed(2) + "%",
      description: "Click-through rate",
      icon: Percent,
      color: "text-purple-600",
      differential: ctr === 0 ? 0 : 0.8,
      position: 3,
    },
    {
      title: "Average Position",
      value: avgPosition.toFixed(1),
      description: "Average position",
      icon: ArrowUpDown,
      color: "text-orange-600",
      differential: avgPosition === 0 ? 0 : 0.3,
      position: 4,
    },
    {
      title: "Keywords Tracked",
      value: keywords.length,
      description: "Total keywords tracked",
      icon: KeySquare,
      color: "text-orange-600",
      differential: keywords.length === 0 ? 0 : 0.4,
      position: 5,
    },
    {
      title: "Most Impressions",
      value: mostImpressions?.query || "-",
      description: `${mostImpressions?.current_impressions || 0} impressions`,
      icon: Trophy,
      color: "text-yellow-600",
      differential: 0,
      position: 6,
    },
    {
      title: "Most Clicks",
      value: mostClicks?.query || "-",
      description: `${mostClicks?.current_clicks || 0} clicks`,
      icon: Medal,
      color: "text-red-600",
      differential: 0,
      position: 7,
    },
    {
      title: "Best Position",
      value: bestPosition?.query || "-",
      description: `Position ${bestPosition?.current_position.toFixed(1) || 0}`,
      icon: Crown,
      color: "text-emerald-600",
      differential: 0,
      position: 8,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-5 lg:grid-cols-4">
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
          keywordsSummary={keywords} // Pass the keywords from store
        />
      ))}
    </div>
  );
}
