import * as XLSX from "xlsx";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { categorizeUserAgent } from "../WidgetTables/helpers/useCategoriseUserAgents";
import { categorizeReferrer } from "../WidgetTables/helpers/useCategoriseReferrer";

interface ExcelExportData {
  overview: any;
  widgetAggs: any;
  timelineData: any[];
  taxonomyNameMap: Record<string, string>;
}

const getStatusText = (code: string) => {
  const codes: Record<string, string> = {
    "200": "OK",
    "301": "Redirect",
    "302": "Found",
    "403": "Forbidden",
    "404": "Not Found",
    "500": "Server Error",
    "503": "Service Unavailable",
  };
  return codes[code] || "";
};

export const exportServerLogsExcel = async (data: ExcelExportData) => {
  const { overview, widgetAggs, timelineData, taxonomyNameMap } = data;

  if (!overview && !widgetAggs && !timelineData?.length) {
    console.error("No data provided for Excel export");
    return;
  }

  const wb = XLSX.utils.book_new();

  // 1. OVERVIEW SHEET
  const overviewRows = [
    ["Metric", "Value"],
    ["Total Lines", overview?.line_count || 0],
    ["Unique IPs", overview?.unique_ips || 0],
    ["Unique User Agents", overview?.unique_user_agents || 0],
    ["Crawler Hits", overview?.crawler_count || 0],
    ["Success Rate", `${((overview?.success_rate || 0) * 100).toFixed(2)}%`],
    ["File Count", overview?.file_count || 0],
    ["Log Start Time", overview?.log_start_time || ""],
    ["Log Finish Time", overview?.log_finish_time || ""],
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
  XLSX.utils.book_append_sheet(wb, wsOverview, "Overview");

  // 2. TIMELINE SHEET
  if (timelineData?.length) {
    const timelineRows = [
      ["Date", "Human Hits", "Crawler Hits"],
      ...timelineData.map((item) => [item.date, item.human, item.crawler]),
    ];
    const wsTimeline = XLSX.utils.aoa_to_sheet(timelineRows);
    XLSX.utils.book_append_sheet(wb, wsTimeline, "Timeline");
  }

  // 3. FILE TYPES SHEET
  const fileTypes = widgetAggs?.file_types || {};
  const fileTypeRows = [
    ["File Type", "Hits"],
    ...Object.entries(fileTypes)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([name, value]) => [name.toUpperCase(), value]),
  ];
  const wsFileTypes = XLSX.utils.aoa_to_sheet(fileTypeRows);
  XLSX.utils.book_append_sheet(wb, wsFileTypes, "File Types");

  // 4. CONTENT SEGMENTS SHEET
  const contentData = widgetAggs?.content || {};
  const contentBySegment: Record<string, number> = {};
  Object.entries(contentData).forEach(([pathOrName, value]) => {
    const name =
      pathOrName.toLowerCase() === "other"
        ? "Uncategorized"
        : taxonomyNameMap[pathOrName] || pathOrName;
    contentBySegment[name] = (contentBySegment[name] || 0) + (value as number);
  });
  const contentRows = [
    ["Segment", "Hits"],
    ...Object.entries(contentBySegment)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => [name, value]),
  ];
  const wsContent = XLSX.utils.aoa_to_sheet(contentRows);
  XLSX.utils.book_append_sheet(wb, wsContent, "Content Segments");

  // 5. STATUS CODES SHEET
  const statusCodes = widgetAggs?.status_codes || {};
  const statusRows = [
    ["Status Code", "Description", "Hits"],
    ...Object.entries(statusCodes)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([code, value]) => [code, getStatusText(code), value]),
  ];
  const wsStatus = XLSX.utils.aoa_to_sheet(statusRows);
  XLSX.utils.book_append_sheet(wb, wsStatus, "Status Codes");

  // 6. CRAWLERS (AGGREGATED) SHEET
  const crawlerTotals = overview?.totals || {};
  const crawlerRows = [
    ["Crawler", "Hits"],
    ["Google", crawlerTotals.google || 0],
    ["Bing", crawlerTotals.bing || 0],
    ["Semrush", crawlerTotals.semrush || 0],
    ["Hrefs", crawlerTotals.hrefs || 0],
    ["Moz", crawlerTotals.moz || 0],
    ["Uptime", crawlerTotals.uptime || 0],
    ["OpenAI", crawlerTotals.openai || 0],
    ["Claude", crawlerTotals.claude || 0],
  ].sort((a, b) => (typeof b[1] === "number" && typeof a[1] === "number" ? b[1] - a[1] : 0));
  // Re-insert header if sort messed it up (it shouldn't if we slice, but let's be safe)
  const sortedCrawlerRows = [
    ["Crawler", "Hits"],
    ...crawlerRows.filter(r => r[0] !== "Crawler" && r[1] > 0)
  ];
  const wsCrawlers = XLSX.utils.aoa_to_sheet(sortedCrawlerRows);
  XLSX.utils.book_append_sheet(wb, wsCrawlers, "Crawlers");

  // 7. USER AGENTS SHEET
  const userAgents = widgetAggs?.user_agents || {};
  const uaCategories: Record<string, number> = {};
  
  if (widgetAggs?.user_agent_categories) {
    Object.entries(widgetAggs.user_agent_categories).forEach(([cat, count]) => {
      uaCategories[cat] = count as number;
    });
  } else {
    Object.entries(userAgents).forEach(([ua, count]) => {
      const cat = categorizeUserAgent(ua);
      uaCategories[cat] = (uaCategories[cat] || 0) + (count as number);
    });
  }

  const uaRows = [
    ["Category", "Hits"],
    ...Object.entries(uaCategories)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => [name, value]),
  ];
  const wsUA = XLSX.utils.aoa_to_sheet(uaRows);
  XLSX.utils.book_append_sheet(wb, wsUA, "User Agents");

  // 8. REFERRERS SHEET
  const referrers = widgetAggs?.referrers || {};
  const refCategories: Record<string, number> = {};

  if (widgetAggs?.referrer_categories) {
    Object.entries(widgetAggs.referrer_categories).forEach(([cat, count]) => {
      refCategories[cat] = count as number;
    });
  } else {
    Object.entries(referrers).forEach(([ref, count]) => {
      const cat = categorizeReferrer(ref);
      refCategories[cat] = (refCategories[cat] || 0) + (count as number);
    });
  }

  const refRows = [
    ["Category", "Hits"],
    ...Object.entries(refCategories)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => [name, value]),
  ];
  const wsRef = XLSX.utils.aoa_to_sheet(refRows);
  XLSX.utils.book_append_sheet(wb, wsRef, "Referrers");

  // 9. SPECIALIZED BOTS (Indexing, Retrieval, Agentic)
  try {
    const [indexingBots, retrievalAgents, agenticBots] = await Promise.all([
      invoke<string[]>("get_indexing_bots_command"),
      invoke<string[]>("get_retrieval_agents_command"),
      invoke<string[]>("get_agentic_bots_command"),
    ]);

    const crawlerTypes = widgetAggs?.crawler_types || {};

    const createBotSheet = (botList: string[], sheetName: string) => {
      const botSet = new Set(botList.map((name) => name.toLowerCase()));
      const displayNameMap = new Map(botList.map((name) => [name.toLowerCase(), name]));
      
      const rows = [
        ["Bot Name", "Hits"],
        ...Object.entries(crawlerTypes)
          .filter(([name]) => botSet.has(name.toLowerCase()))
          .map(([name, value]) => [displayNameMap.get(name.toLowerCase()) || name, value])
          .sort((a, b) => (b[1] as number) - (a[1] as number)),
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    };

    if (indexingBots.length) createBotSheet(indexingBots, "Indexing Crawlers");
    if (retrievalAgents.length) createBotSheet(retrievalAgents, "Retrieval Agents");
    if (agenticBots.length) createBotSheet(agenticBots, "Agentic Bots");

  } catch (error) {
    console.error("Failed to fetch specialized bots for Excel export:", error);
  }

  // GENERATE FILE
  try {
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
    
    const filePath = await save({
      defaultPath: `RustySEO_Log_Metrics_${new Date().toISOString().slice(0, 10)}.xlsx`,
      filters: [{ name: "Excel", extensions: ["xlsx"] }],
    });

    if (filePath) {
      await writeFile(filePath, new Uint8Array(excelBuffer));
      return true;
    }
  } catch (error) {
    console.error("Failed to save Excel file:", error);
    throw error;
  }
  
  return false;
};
