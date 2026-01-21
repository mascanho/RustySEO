// Column configurations
export const initialColumnWidths = [
  "40px",   // ID
  "500px",  // URL
  "80px",   // Perf (M)
  "80px",   // Perf (D)
  "80px",   // Acc (M)
  "80px",   // Acc (D)
  "80px",   // BP (M)
  "80px",   // BP (D)
  "80px",   // SEO (M)
  "80px",   // SEO (D)
  "120px",  // Speed Index (M)
  "120px",  // Speed Index (D)
  "100px",  // LCP (M)
  "100px",  // LCP (D)
  "100px",  // CLS (M)
  "100px",  // CLS (D)
  "100px",  // FCP (M)
  "100px",  // FCP (D)
  "110px",  // Interactive (M)
  "110px",  // Interactive (D)
  "90px",   // TBT (M)
  "90px",   // TBT (D)
  "80px",   // Redirects
  "100px",  // TTFB (M)
  "100px",  // TTFB (D)
  "100px",  // DOM Nodes
  "120px",  // Byte Weight (M)
  "120px",  // Byte Weight (D)
];

export const initialColumnAlignments = Array(initialColumnWidths.length).fill("center");
// Set URL to left alignment
initialColumnAlignments[1] = "left";

export const headerTitles = [
  "ID",
  "URL",
  "Perf (M)",
  "Perf (D)",
  "Acc (M)",
  "Acc (D)",
  "BP (M)",
  "BP (D)",
  "SEO (M)",
  "SEO (D)",
  "Speed Index (M)",
  "Speed Index (D)",
  "LCP (M)",
  "LCP (D)",
  "CLS (M)",
  "CLS (D)",
  "FCP (M)",
  "FCP (D)",
  "Interactive (M)",
  "Interactive (D)",
  "TBT (M)",
  "TBT (D)",
  "Redirects",
  "TTFB (M)",
  "TTFB (D)",
  "DOM Nodes",
  "Byte Weight (M)",
  "Byte Weight (D)",
];
