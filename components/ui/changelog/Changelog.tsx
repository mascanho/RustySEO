import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { changelogData } from "./ChangelogData";
import { usePathname } from "next/navigation";

const getTypeColor = (type: string) => {
  switch (type) {
    case "feature":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "fix":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "breaking":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-orange-100 text-gray-800 dark:bg-orange-900 dark:text-gray-300";
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "feature":
      return "New";
    case "fix":
      return "Fix";
    case "breaking":
      return "Breaking";
    default:
      return "Update";
  }
};

export default function Changelog() {
  const pathname = usePathname();

  const logs = pathname === "/serverlogs";

  return (
    <Card className="w-full max-w-[360px] border-0 shadow-none max-h-[calc(100vh-0.8rem)] dark:bg-brand-darker">
      <CardHeader className="pb-3 shadow">
        <CardTitle className="text-lg -ml-3 mt-[2px] -mb-2 font-semibold">
          Changelog
        </CardTitle>
      </CardHeader>
      <CardContent
        className={`space-y-4 px-4 h-[calc(100vh-8.8rem)] pt-3 pb-8 overflow-auto`}
      >
        {changelogData.map((entry, index) => (
          <div key={entry.version} className="space-y-2 ">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm">v{entry.version}</span>
                <Badge
                  variant="secondary"
                  className={`text-xs px-2 py-0.5 ${getTypeColor(entry.type)}`}
                >
                  {getTypeLabel(entry.type)}
                </Badge>
              </div>
              <span className="text-xs text-brand-bright">
                {new Date(entry.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {entry.changes.map((change, changeIndex) => (
                <li key={changeIndex} className="flex items-start gap-2">
                  <span className="text-muted-foreground dark:text-white/50 mt-1.5 block w-1 h-1 bg-current rounded-full flex-shrink-0" />
                  <span className="leading-relaxed text-xs dark:text-white/50">
                    {change}
                  </span>
                </li>
              ))}
            </ul>
            {index < changelogData.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}
        <div className="pt-2">
          <a
            target="_blank"
            href="https://github.com/mascanho/rustyseo/releases"
          >
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View all releases →
            </button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
