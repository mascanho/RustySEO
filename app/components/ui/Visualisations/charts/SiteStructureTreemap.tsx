import React, { useMemo } from "react";
import { Treemap, Tooltip, ResponsiveContainer } from "recharts";
import type { VisualisationChartProps } from "../types";
import { CATEGORICAL, CATEGORICAL_OTHER, tooltipStyle } from "../shared/colors";
import EmptyState from "../shared/EmptyState";

const MAX_TOP_FOLDERS = 10;
const MAX_SUBFOLDERS_PER_TOP = 8;

function firstTwoSegments(url: string): [string, string] {
  try {
    const { pathname } = new URL(url);
    const segments = pathname.split("/").filter(Boolean);
    const top = segments[0] || "(root)";
    const sub = segments[1] || "(index)";
    return [top, sub];
  } catch {
    return ["(unknown)", "(unknown)"];
  }
}

interface TreemapNode {
  name: string;
  size?: number;
  color?: string;
  children?: TreemapNode[];
}

// Directory-tree view of the crawled URL structure, sized by page count —
// the fastest way to see which sections of a site are largest, and whether
// crawl depth is concentrated in a handful of folders.
export default function SiteStructureTreemap({ crawlData, isDark }: VisualisationChartProps) {
  const data = useMemo<TreemapNode[]>(() => {
    const top = new Map<string, Map<string, number>>();

    for (const item of crawlData) {
      if (!item?.url) continue;
      const [topSeg, subSeg] = firstTwoSegments(item.url);
      if (!top.has(topSeg)) top.set(topSeg, new Map());
      const subMap = top.get(topSeg)!;
      subMap.set(subSeg, (subMap.get(subSeg) || 0) + 1);
    }

    const topEntries = Array.from(top.entries())
      .map(([name, subMap]) => ({
        name,
        subMap,
        total: Array.from(subMap.values()).reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => b.total - a.total);

    const visibleTop = topEntries.slice(0, MAX_TOP_FOLDERS);
    const restTop = topEntries.slice(MAX_TOP_FOLDERS);

    const nodes: TreemapNode[] = visibleTop.map((folder, i) => {
      const color = CATEGORICAL[i % CATEGORICAL.length];
      const subEntries = Array.from(folder.subMap.entries()).sort((a, b) => b[1] - a[1]);
      const visibleSub = subEntries.slice(0, MAX_SUBFOLDERS_PER_TOP);
      const restSub = subEntries.slice(MAX_SUBFOLDERS_PER_TOP);
      const restSubTotal = restSub.reduce((sum, [, c]) => sum + c, 0);

      const children: TreemapNode[] = visibleSub.map(([name, size]) => ({
        name: `/${folder.name}/${name}`,
        size,
        color,
      }));
      if (restSubTotal > 0) {
        children.push({ name: `/${folder.name}/… (${restSub.length} more)`, size: restSubTotal, color });
      }

      return { name: `/${folder.name}`, color, children };
    });

    const restTotal = restTop.reduce((sum, f) => sum + f.total, 0);
    if (restTotal > 0) {
      nodes.push({
        name: `Other (${restTop.length} folders)`,
        color: CATEGORICAL_OTHER,
        children: [{ name: `Other (${restTop.length} folders)`, size: restTotal, color: CATEGORICAL_OTHER }],
      });
    }

    return nodes;
  }, [crawlData]);

  if (!crawlData.length) return <EmptyState />;

  return (
    <div className="flex-1 flex flex-col">
      <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">
        Box size = page count. Top {MAX_TOP_FOLDERS} folders shown, grouped by their sub-paths.
      </p>
      <ResponsiveContainer width="100%" height="100%" minHeight={260}>
        <Treemap
          data={data}
          dataKey="size"
          nameKey="name"
          fill="#38bdf8"
          content={((props: any) => <TreemapCell {...props} isDark={isDark} />) as any}
          isAnimationActive={false}
        >
          <Tooltip
            {...tooltipStyle(isDark)}
            formatter={(value: number) => [`${value} page${value === 1 ? "" : "s"}`, "Pages"]}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}

// Custom cell renderer — recharts' default Treemap content doesn't label
// leaves legibly at small sizes, so we hide labels below a size threshold.
function TreemapCell(props: any) {
  const { x, y, width, height, name, color, isDark } = props;
  if (width <= 0 || height <= 0) return null;
  // Recharts calls this renderer for every node in the hierarchy, including
  // synthetic intermediate/root wrapper nodes that don't carry our leaf
  // data (name/color) — only draw a label when we actually have one.
  const showLabel = typeof name === "string" && name.length > 0 && width > 46 && height > 20;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: color || "#38bdf8",
          stroke: isDark ? "#0f172a" : "#ffffff",
          strokeWidth: 2,
        }}
      />
      {showLabel && (
        <text
          x={x + 6}
          y={y + 16}
          fontSize={10}
          fill="#fff"
          style={{ pointerEvents: "none", textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
        >
          {name.length > Math.floor(width / 6) ? `${name.slice(0, Math.floor(width / 6))}…` : name}
        </text>
      )}
    </g>
  );
}
