// @ts-nocheck
// Builds a single, comprehensive PDF report from the current in-memory crawl
// (store) plus a handful of on-demand backend fetches for data that is only
// ever lazily loaded when the user visits a specific table tab (images,
// redirects, broken links). This is the sole "Reports" feature in the top
// menubar — it replaces the old ad-hoc "Performance History" / "SEO History"
// CSV exports, which pulled from an unrelated legacy single-URL database.
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { invoke } from "@tauri-apps/api/core";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { ISSUE_REGISTRY } from "@/app/global/_components/Sidebar/Issues/libs/issuesRegistry";

const MARGIN = 14;
const BRAND_COLOR = [37, 99, 235]; // blue-600
const DANGER_COLOR = [220, 38, 38]; // red-600
const APPENDIX_ROW_CAP = 200;
const ISSUE_APPENDIX_ROW_CAP = 100;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const average = (nums: number[]): number | null => {
  const valid = nums.filter((n) => typeof n === "number" && !Number.isNaN(n));
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
};

const pct = (part: number | undefined, total: number | undefined): string => {
  if (!total || part === undefined || part === null) return "-";
  return `${((part / total) * 100).toFixed(1)}%`;
};

const truncate = (str: string, max: number): string => {
  if (!str) return "";
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
};

const domainFromUrl = (url: string | undefined): string => {
  if (!url) return "Unknown domain";
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

const safeTitle = (page: any): string => page?.title?.[0]?.title || "";
const safeTitleLen = (page: any): number =>
  page?.title?.[0]?.title_len ?? safeTitle(page).length;

// ---------------------------------------------------------------------------
// PDF drawing helpers
// ---------------------------------------------------------------------------

const sectionTitle = (doc: jsPDF, text: string, y: number): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(text, MARGIN, y);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y + 2.5, pageWidth - MARGIN, y + 2.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  return y + 9;
};

const subNote = (doc: jsPDF, text: string, y: number): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const lines = doc.splitTextToSize(text, pageWidth - MARGIN * 2);
  doc.text(lines, MARGIN, y);
  doc.setTextColor(0, 0, 0);
  return y + lines.length * 4 + 3;
};

const ensureSpace = (doc: jsPDF, y: number, needed = 30): number => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 18) {
    doc.addPage();
    return 20;
  }
  return y;
};

const kvTable = (doc: jsPDF, startY: number, rows: [string, string][]): number => {
  autoTable(doc, {
    startY,
    body: rows,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 1.6 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 75, textColor: [51, 65, 85] },
      1: { textColor: [15, 23, 42] },
    },
    margin: { left: MARGIN, right: MARGIN },
  });
  // @ts-ignore - attached by the autotable plugin
  return doc.lastAutoTable.finalY + 8;
};

const dataTable = (
  doc: jsPDF,
  startY: number,
  head: string[][],
  body: (string | number)[][],
  opts: Record<string, any> = {},
): number => {
  autoTable(doc, {
    startY,
    head,
    body,
    theme: opts.theme || "striped",
    headStyles: { fillColor: opts.headColor || BRAND_COLOR, fontSize: 8.5 },
    styles: { fontSize: opts.fontSize || 8.5, cellPadding: 1.8, overflow: "linebreak" },
    margin: { left: MARGIN, right: MARGIN },
    ...opts.extra,
  });
  // @ts-ignore
  return doc.lastAutoTable.finalY + 9;
};

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export interface CrawlReportResult {
  success: boolean;
  message: string;
}

export async function generateCrawlReportPDF(): Promise<CrawlReportResult> {
  const state = useGlobalCrawlStore.getState();
  const crawlData: any[] = state.crawlData || [];
  const stats: any = state.finalCrawlStats || {};
  const robotsBlocked: string[] = state.robotsBlocked || [];

  if (!crawlData.length) {
    return {
      success: false,
      message: "No crawl data available yet. Run a crawl first.",
    };
  }

  const domain = domainFromUrl(crawlData[0]?.url);
  const generatedAt = new Date();
  const totalPages = stats.pages ?? crawlData.length;

  // Data that's only ever lazily fetched when the user opens a specific table
  // tab — fetch it fresh here so the report never depends on which tabs the
  // user happened to visit during/after the crawl.
  const [imagesRes, redirectsRes, internalLinksRes, externalLinksRes] =
    await Promise.allSettled([
      invoke("get_aggregated_crawl_data_command", { dataType: "images" }),
      invoke("get_aggregated_crawl_data_command", { dataType: "redirects" }),
      invoke("get_links_page_command", {
        dataType: "internal_links",
        limit: 0,
        offset: 0,
      }),
      invoke("get_links_page_command", {
        dataType: "external_links",
        limit: 0,
        offset: 0,
      }),
    ]);

  const images: any[] =
    imagesRes.status === "fulfilled" && Array.isArray(imagesRes.value)
      ? imagesRes.value
      : [];
  const redirects: any[] =
    redirectsRes.status === "fulfilled" && Array.isArray(redirectsRes.value)
      ? redirectsRes.value
      : [];
  const internalLinks: any[] =
    internalLinksRes.status === "fulfilled" && Array.isArray(internalLinksRes.value)
      ? internalLinksRes.value
      : [];
  const externalLinks: any[] =
    externalLinksRes.status === "fulfilled" && Array.isArray(externalLinksRes.value)
      ? externalLinksRes.value
      : [];
  const brokenLinks = [...internalLinks, ...externalLinks].filter(
    (l) => typeof l?.status === "number" && l.status >= 400,
  );

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ---------------------------------------------------------------------
  // Cover page
  // ---------------------------------------------------------------------
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("RUSTYSEO", pageWidth / 2, 70, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("SEO Crawl Report", pageWidth / 2, 88, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(15);
  doc.setTextColor(226, 232, 240);
  doc.text(domain, pageWidth / 2, 99, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated ${generatedAt.toLocaleDateString()} at ${generatedAt.toLocaleTimeString()}`,
    pageWidth / 2,
    108,
    { align: "center" },
  );

  const highlightStats: [string, string | number][] = [
    ["Pages Crawled", totalPages],
    ["Indexable", stats.indexable_pages ?? "-"],
    ["Errors (4xx/5xx)", stats.errors ?? "-"],
    ["Avg Response", stats.avg_response_time != null ? `${stats.avg_response_time}ms` : "-"],
  ];
  const boxWidth = 40;
  const boxGap = 6;
  const totalBoxWidth = highlightStats.length * boxWidth + (highlightStats.length - 1) * boxGap;
  let bx = pageWidth / 2 - totalBoxWidth / 2;
  const boxY = 130;
  highlightStats.forEach(([label, value]) => {
    doc.setFillColor(30, 41, 59); // slate-800
    doc.roundedRect(bx, boxY, boxWidth, 26, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(String(value), bx + boxWidth / 2, boxY + 12, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(label, bx + boxWidth / 2, boxY + 19, { align: "center" });
    bx += boxWidth + boxGap;
  });

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Full technical SEO, on-page, performance and issue analysis for the crawled domain.",
    pageWidth / 2,
    pageHeight - 20,
    { align: "center" },
  );

  // ---------------------------------------------------------------------
  // Executive summary
  // ---------------------------------------------------------------------
  doc.addPage();
  let y = 20;
  y = sectionTitle(doc, "Executive Summary", y);
  y = kvTable(doc, y, [
    ["Domain", domain],
    ["Pages Crawled", String(totalPages)],
    ["Indexable Pages", `${stats.indexable_pages ?? "-"} (${pct(stats.indexable_pages, totalPages)})`],
    ["Non-Indexable Pages", `${stats.not_indexable_pages ?? "-"} (${pct(stats.not_indexable_pages, totalPages)})`],
    ["Pages with Errors (4xx/5xx)", String(stats.errors ?? "-")],
    ["Max Crawl Depth", String(stats.max_crawl_depth ?? "-")],
    ["Avg Response Time", stats.avg_response_time != null ? `${stats.avg_response_time} ms` : "-"],
    ["Avg Word Count", String(stats.avg_word_count ?? "-")],
    ["Avg Readability (Flesch)", String(stats.avg_readability ?? "-")],
    ["Avg Page Size", stats.avg_page_size_kb != null ? `${stats.avg_page_size_kb} KB` : "-"],
  ]);

  // ---------------------------------------------------------------------
  // HTTP status breakdown
  // ---------------------------------------------------------------------
  y = ensureSpace(doc, y, 45);
  y = sectionTitle(doc, "HTTP Status Code Breakdown", y);
  y = dataTable(
    doc,
    y,
    [["Status Range", "Count", "% of Pages"]],
    [
      ["2xx — Success", stats.status_2xx ?? 0, pct(stats.status_2xx, totalPages)],
      ["3xx — Redirects", stats.status_3xx ?? 0, pct(stats.status_3xx, totalPages)],
      ["4xx — Client Errors", stats.status_4xx ?? 0, pct(stats.status_4xx, totalPages)],
      ["5xx — Server Errors", stats.status_5xx ?? 0, pct(stats.status_5xx, totalPages)],
    ],
  );

  // ---------------------------------------------------------------------
  // Technical SEO health
  // ---------------------------------------------------------------------
  y = ensureSpace(doc, y, 90);
  y = sectionTitle(doc, "Technical SEO Health", y);
  y = dataTable(
    doc,
    y,
    [["Metric", "Count", "% of Pages"]],
    [
      ["Missing Titles", stats.missing_title ?? 0, pct(stats.missing_title, totalPages)],
      ["Missing Descriptions", stats.missing_description ?? 0, pct(stats.missing_description, totalPages)],
      ["Missing H1", stats.missing_h1 ?? 0, pct(stats.missing_h1, totalPages)],
      ["Missing Canonical", stats.missing_canonical ?? 0, pct(stats.missing_canonical, totalPages)],
      ["Duplicate Titles", stats.duplicate_titles ?? 0, pct(stats.duplicate_titles, totalPages)],
      ["Duplicate Descriptions", stats.duplicate_descriptions ?? 0, pct(stats.duplicate_descriptions, totalPages)],
      ["Thin Content (<300 words)", stats.thin_content_pages ?? 0, pct(stats.thin_content_pages, totalPages)],
      ["Noindex Pages", stats.noindex_pages ?? 0, pct(stats.noindex_pages, totalPages)],
      ["Blocked by Robots.txt", robotsBlocked.length, pct(robotsBlocked.length, totalPages)],
      ["Redirected Pages", stats.total_redirects ?? 0, pct(stats.total_redirects, totalPages)],
      ["Secure (HTTPS) Pages", stats.total_secure_pages ?? 0, pct(stats.total_secure_pages, totalPages)],
      ["Pages with Schema Markup", stats.total_schema_pages ?? 0, pct(stats.total_schema_pages, totalPages)],
      ["Mobile-Friendly Pages", stats.total_mobile_pages ?? 0, pct(stats.total_mobile_pages, totalPages)],
      ["Pages with Mixed Content", stats.mixed_content_pages ?? 0, pct(stats.mixed_content_pages, totalPages)],
      ["Pages Using Cookies", stats.cookies_pages ?? 0, pct(stats.cookies_pages, totalPages)],
    ],
  );

  // ---------------------------------------------------------------------
  // Resource & link totals
  // ---------------------------------------------------------------------
  y = ensureSpace(doc, y, 55);
  y = sectionTitle(doc, "Resource & Link Totals", y);
  y = dataTable(
    doc,
    y,
    [["Resource", "Total"]],
    [
      ["Internal Links", stats.total_internal_links ?? 0],
      ["External Links", stats.total_external_links ?? 0],
      ["Total Links", stats.total_links ?? 0],
      ["Image References (site-wide)", stats.total_images ?? 0],
      ["Unique Images", images.length],
      ["External CSS Files", stats.total_css ?? 0],
      ["External JS Files", stats.total_javascript ?? 0],
    ],
  );

  // ---------------------------------------------------------------------
  // PageSpeed Insights scores
  // ---------------------------------------------------------------------
  const perfRows = crawlData.filter((p) => p.performance_score != null);
  if (perfRows.length) {
    doc.addPage();
    y = 20;
    y = sectionTitle(doc, "PageSpeed Insights — Average Scores", y);
    const avgPerf = average(crawlData.map((p) => p.performance_score).filter((v) => v != null));
    const avgAcc = average(crawlData.map((p) => p.accessibility_score).filter((v) => v != null));
    const avgBP = average(crawlData.map((p) => p.best_practices_score).filter((v) => v != null));
    const avgSEO = average(crawlData.map((p) => p.seo_score).filter((v) => v != null));
    y = dataTable(
      doc,
      y,
      [["Category", "Average Score (0-100)"]],
      [
        ["Performance", avgPerf != null ? Math.round(avgPerf) : "-"],
        ["Accessibility", avgAcc != null ? Math.round(avgAcc) : "-"],
        ["Best Practices", avgBP != null ? Math.round(avgBP) : "-"],
        ["SEO", avgSEO != null ? Math.round(avgSEO) : "-"],
      ],
    );

    const worst = [...perfRows]
      .sort((a, b) => (a.performance_score ?? 0) - (b.performance_score ?? 0))
      .slice(0, 20);
    y = ensureSpace(doc, y, 50);
    y = sectionTitle(doc, "Lowest Performance-Score Pages", y);
    y = dataTable(
      doc,
      y,
      [["URL", "Performance", "Accessibility", "Best Practices", "SEO"]],
      worst.map((p) => [
        truncate(p.url, 70),
        p.performance_score != null ? Math.round(p.performance_score) : "-",
        p.accessibility_score != null ? Math.round(p.accessibility_score) : "-",
        p.best_practices_score != null ? Math.round(p.best_practices_score) : "-",
        p.seo_score != null ? Math.round(p.seo_score) : "-",
      ]),
      { fontSize: 7.5 },
    );
  }

  // ---------------------------------------------------------------------
  // Images
  // ---------------------------------------------------------------------
  if (images.length) {
    doc.addPage();
    y = 20;
    y = sectionTitle(doc, "Images", y);
    const withAlt = images.filter((i) => (i?.[1] || "").toString().trim() !== "").length;
    const withoutAlt = images.length - withAlt;
    const brokenImages = images.filter((i) => typeof i?.[4] === "number" && i[4] >= 400).length;
    y = kvTable(doc, y, [
      ["Unique Images Found", String(images.length)],
      ["With Alt Text", `${withAlt} (${pct(withAlt, images.length)})`],
      ["Missing Alt Text", `${withoutAlt} (${pct(withoutAlt, images.length)})`],
      ["Broken Images (4xx/5xx)", String(brokenImages)],
    ]);

    const largest = [...images]
      .filter((i) => typeof i?.[2] === "number")
      .sort((a, b) => (b[2] ?? 0) - (a[2] ?? 0))
      .slice(0, 20);
    if (largest.length) {
      y = ensureSpace(doc, y, 50);
      y = sectionTitle(doc, "Largest Images", y);
      y = dataTable(
        doc,
        y,
        [["Image URL", "Size (KB)", "Type", "Alt Text"]],
        largest.map((i) => [
          truncate(i[0] || "", 65),
          i[2] != null ? Math.round(i[2] / 1024) : "-",
          i[3] || "-",
          i[1] ? "Yes" : "Missing",
        ]),
        { fontSize: 7.5 },
      );
    }
  }

  // ---------------------------------------------------------------------
  // Broken links
  // ---------------------------------------------------------------------
  doc.addPage();
  y = 20;
  y = sectionTitle(doc, "Broken Links", y);
  if (!brokenLinks.length) {
    doc.setFontSize(10);
    doc.setTextColor(21, 128, 61);
    doc.text("No broken links (4xx/5xx) were found in the crawl.", MARGIN, y);
    doc.setTextColor(0, 0, 0);
    y += 10;
  } else {
    y = subNote(
      doc,
      `${brokenLinks.length} broken link(s) found. Showing the first ${Math.min(
        brokenLinks.length,
        APPENDIX_ROW_CAP,
      )}.`,
      y,
    );
    y = dataTable(
      doc,
      y,
      [["Source Page", "Broken URL", "Status", "Anchor Text"]],
      brokenLinks.slice(0, APPENDIX_ROW_CAP).map((l) => [
        truncate(l.page || "", 45),
        truncate(l.url || "", 45),
        l.status ?? "-",
        truncate(l.anchor_text || "-", 25),
      ]),
      { fontSize: 7, headColor: DANGER_COLOR },
    );
  }

  // ---------------------------------------------------------------------
  // Redirects
  // ---------------------------------------------------------------------
  doc.addPage();
  y = 20;
  y = sectionTitle(doc, "Redirects", y);
  if (!redirects.length) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("No redirects were found in the crawl.", MARGIN, y);
    doc.setTextColor(0, 0, 0);
    y += 10;
  } else {
    y = subNote(
      doc,
      `${redirects.length} redirect(s) found. Showing the first ${Math.min(
        redirects.length,
        APPENDIX_ROW_CAP,
      )}.`,
      y,
    );
    y = dataTable(
      doc,
      y,
      [["Original URL", "Redirects To", "Type", "Status"]],
      redirects.slice(0, APPENDIX_ROW_CAP).map((r) => [
        truncate(r.url || r.original_url || "", 55),
        truncate(r.redirect_url || "-", 55),
        r.redirection_type || "-",
        r.status_code ?? "-",
      ]),
      { fontSize: 7 },
    );
  }

  // ---------------------------------------------------------------------
  // Issues detected
  // ---------------------------------------------------------------------
  doc.addPage();
  y = 20;
  y = sectionTitle(doc, "Issues Detected", y);

  const priorityOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
  const issueResults = ISSUE_REGISTRY.map((def) => {
    let matches: any[] = [];
    try {
      matches = def.detect(crawlData, robotsBlocked) || [];
    } catch {
      matches = [];
    }
    return { ...def, matches };
  })
    .filter((r) => r.matches.length > 0)
    .sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.matches.length - a.matches.length;
    });

  if (!issueResults.length) {
    doc.setFontSize(10);
    doc.setTextColor(21, 128, 61);
    doc.text("No issues detected across the crawled pages.", MARGIN, y);
    doc.setTextColor(0, 0, 0);
    y += 10;
  } else {
    y = dataTable(
      doc,
      y,
      [["Issue", "Priority", "Affected Pages", "% of Crawl"]],
      issueResults.map((r) => [r.name, r.priority, r.matches.length, pct(r.matches.length, totalPages)]),
      {
        headColor: DANGER_COLOR,
        extra: {
          columnStyles: {
            1: { cellWidth: 24 },
            2: { cellWidth: 30, halign: "right" },
            3: { cellWidth: 28, halign: "right" },
          },
          didParseCell: (data: any) => {
            if (data.section === "body" && data.column.index === 1) {
              const p = data.cell.raw;
              if (p === "High") data.cell.styles.textColor = [185, 28, 28];
              else if (p === "Medium") data.cell.styles.textColor = [161, 98, 7];
              else data.cell.styles.textColor = [21, 128, 61];
            }
          },
        },
      },
    );

    const highPriorityIssues = issueResults.filter((r) => r.priority === "High");
    for (const issue of highPriorityIssues) {
      y = ensureSpace(doc, y, 35);
      y = sectionTitle(doc, `${issue.name} (${issue.matches.length})`, y);
      y = subNote(doc, `Recommended fix: ${issue.recommendedFix}`, y);
      y = dataTable(
        doc,
        y,
        [["Affected URL"]],
        issue.matches.slice(0, ISSUE_APPENDIX_ROW_CAP).map((p: any) => [truncate(p.url, 110)]),
        { theme: "plain", fontSize: 7.5 },
      );
      if (issue.matches.length > ISSUE_APPENDIX_ROW_CAP) {
        y = subNote(doc, `…and ${issue.matches.length - ISSUE_APPENDIX_ROW_CAP} more.`, y);
      }
    }
  }

  // ---------------------------------------------------------------------
  // Full page inventory
  // ---------------------------------------------------------------------
  doc.addPage();
  y = 20;
  y = sectionTitle(doc, `Full Page Inventory (${crawlData.length} pages)`, y);
  dataTable(
    doc,
    y,
    [["URL", "Status", "Title (chars)", "Desc (chars)", "H1s", "Words", "Indexable", "Canonical"]],
    crawlData.map((p) => [
      truncate(p.url, 60),
      p.status_code ?? "-",
      String(safeTitleLen(p)),
      String(p.description?.length ?? 0),
      String(p.headings?.h1?.length ?? 0),
      String(p.word_count ?? 0),
      (p.indexability?.indexability ?? 0) >= 0.5 ? "Yes" : "No",
      p.canonicals?.length ? "Yes" : "No",
    ]),
    { fontSize: 6.5 },
  );

  // ---------------------------------------------------------------------
  // Header + footer on every page except the cover
  // ---------------------------------------------------------------------
  const totalDocPages = doc.internal.getNumberOfPages();
  for (let i = 2; i <= totalDocPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`SEO Crawl Report — ${domain}`, MARGIN, 10);
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, 12, pageWidth - MARGIN, 12);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(generatedAt.toLocaleDateString(), MARGIN, pageHeight - 10);
    doc.text(`Page ${i - 1} of ${totalDocPages - 1}`, pageWidth - MARGIN, pageHeight - 10, {
      align: "right",
    });
  }

  const safeDomain = domain.replace(/[^a-z0-9.-]/gi, "_");
  const filename = `SEO-Crawl-Report-${safeDomain}-${generatedAt.toISOString().slice(0, 10)}.pdf`;

  try {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeFile } = await import("@tauri-apps/plugin-fs");
    const path = await save({
      defaultPath: filename,
      filters: [{ name: "PDF Files", extensions: ["pdf"] }],
    });
    if (!path) {
      return { success: false, message: "Export cancelled." };
    }
    const pdfBytes = doc.output("arraybuffer");
    await writeFile(path, new Uint8Array(pdfBytes));
    return { success: true, message: `Report saved to ${path}` };
  } catch (error) {
    console.error("Failed to save PDF via Tauri dialog, falling back to browser download:", error);
    doc.save(filename);
    return { success: true, message: "Report downloaded." };
  }
}
