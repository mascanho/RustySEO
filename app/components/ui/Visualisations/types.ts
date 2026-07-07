import type { ComponentType } from "react";

// Props every visualisation chart component receives. Kept minimal and
// uniform so the hub can render whichever chart is selected without
// per-chart wiring — this is what makes adding a new visualisation a
// one-file, one-registry-entry change.
export interface VisualisationChartProps {
  crawlData: any[];
  aggregatedData: {
    images: any[];
    scripts: string[];
    css: string[];
    internalLinks: any[];
    externalLinks: any[];
    keywords: any[];
    redirects: any[];
    cwv: any[];
    files: any[];
  };
  isDark: boolean;
}

export type VisualisationCategory =
  | "Site Structure"
  | "Indexation & Compliance"
  | "Content Quality"
  | "Performance"
  | "Link Equity";

export interface VisualisationDefinition {
  id: string;
  title: string;
  shortDescription: string;
  category: VisualisationCategory;
  icon: ComponentType<{ className?: string }>;
  Component: ComponentType<VisualisationChartProps>;
}
