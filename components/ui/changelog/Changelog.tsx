import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";
import { changelogData } from "./ChangelogData";
import {
  getTypeColor,
  getTypeLabel,
  getChangeDotColor,
  parseChange,
  renderChangeText,
} from "./changelogUtils";
import { usePathname } from "next/navigation";

export default function Changelog() {
  const pathname = usePathname();

  const logs = pathname === "/serverlogs";
  const ppc = pathname === "/ppc";

  return (
    <Card
      className={`w-full max-w-[460px] border-0 shadow-none max-h-[calc(100vh-0.8rem)] dark:bg-brand-darker ${ppc && "h-full overflow-clip"} -mt-[4.5rem]`}
    >
      <CardHeader className="pb-3 shadow">
        <CardTitle className="text-lg -ml-3 mt-[2px] -mb-2 font-semibold">
          Changelog
        </CardTitle>
      </CardHeader>
      <CardContent
        className={`space-y-5 px-4 h-[calc(100vh-6rem)] pt-3 pb-8 overflow-auto`}
      >
        {changelogData.map((entry, index) => (
          <div key={entry.version} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm dark:text-white">
                  v{entry.version}
                </span>
                {index === 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-2 py-0.5 bg-brand-bright/10 text-brand-bright dark:bg-brand-bright/20"
                  >
                    Latest
                  </Badge>
                )}
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
            <ul className="space-y-0.5">
              {entry.changes.map((change, changeIndex) => {
                const { category, text } = parseChange(change);
                return (
                  <li
                    key={changeIndex}
                    className="group flex items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full ${getChangeDotColor(entry.type)}`}
                    >
                      <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                    </span>
                    <span className="leading-relaxed text-xs text-gray-600 dark:text-white/70">
                      {category && (
                        <span className="mr-1.5 inline-block rounded-md bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-white/50">
                          {category}
                        </span>
                      )}
                      {renderChangeText(text)}
                    </span>
                  </li>
                );
              })}
            </ul>
            {index < changelogData.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}
        <div className="pt-2">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/mascanho/rustyseo/releases"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            View all releases →
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
