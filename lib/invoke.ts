/**
 * Compatibility layer for Tauri invoke calls.
 * This wrapper attempts to use the REST API first, falling back gracefully if unavailable.
 * For commands that don't have API equivalents yet, it returns null/empty data.
 */

import { api } from "./api";

// Map of Tauri commands to API methods
const commandApiMap: Record<string, () => Promise<any>> = {
  // Database
  "get_db_data": () => api.getDbData(),
  "read_seo_data_from_db": () => api.readSeoData(),
  
  // Version
  "version_check_command": () => api.versionCheck(),
  
  // GSC
  "read_credentials_file": () => api.readGscCredentials(),
  "call_google_search_console": () => api.callGoogleSearchConsole(),
  "call_gsc_match_url": async (args: any) => api.matchGscUrl(args?.url || ""),
  "read_gsc_data_from_db_command": () => api.getGscData(),
  
  // Keywords
  "fetch_tracked_keywords_command": () => api.getTrackedKeywords(),
  "match_tracked_with_gsc_command": () => api.matchKeywordsWithGsc(),
  "read_matched_keywords_from_db_command": () => api.getMatchedKeywords(),
  "fetch_keywords_summarized_matched_command": () => api.getKeywordsSummary(),
  "add_gsc_data_to_kw_tracking_command": async (args: any) => api.addKeywordTracking(args),
  "delete_keyword_command": async (args: any) => api.deleteKeyword(args?.id || ""),
  "sync_keyword_tables_command": () => api.syncKeywordTables(),
  
  // AI/Ollama
  "check_ollama": () => api.checkOllama(),
  "write_model_to_disk": async (args: any) => api.writeModel(args?.model || ""),
  "get_ai_model": () => api.getSettings().then(s => s.ai_model),
  "check_ai_model": () => api.getSettings().then(s => s.ai_model_check),
  
  // Settings
  "open_configs_with_native_editor": () => api.openConfigs(),
  
  // Microsoft Clarity
  "set_microsoft_clarity_command": async (args: any) => 
    api.setMicrosoftClarityCredentials(args?.endpoint || "", args?.token || ""),
  "get_microsoft_clarity_command": () => api.getMicrosoftClarityCredentials(),
  "get_microsoft_clarity_data_command": () => api.getMicrosoftClarityData(),
  
  // Analytics
  "get_google_analytics_command": async (args: any) => 
    api.getGoogleAnalytics(args?.search_type || [], args?.date_ranges || []),
  
  // Diff
  "get_url_diff_command": () => api.getUrlDiff(),
  
  // PageSpeed
  "fetch_page_speed": async (args: any) => api.fetchPageSpeed(args?.url || "", args?.strategy || "DESKTOP"),
  "check_page_speed_bulk": () => api.getSettings().then(s => ({ page_speed_crawl: s.page_speed_bulk })),
};

// Commands that are not yet migrated - return empty/null gracefully
const unmigrated: Set<string> = new Set([
  // Log Analyzer
  "get_taxonomies",
  "set_taxonomies",
  "get_all_projects_command",
  "get_logs_by_project_name_command",
  "create_project_command",
  "delete_project_command",
  "get_logs_by_project_name_for_processing_command",
  "get_project_chunk_size_command",
  "read_logs_from_db",
  "delete_log_from_db",
  "get_stored_logs_command",
  "save_gsc_data",
  "load_gsc_from_database",
  "get_log_file_upload_size_command",
  "check_logs_command",
  "fetch_all_bot_ranges",
  "remove_all_logs_from_serverlog_db",
  "reverse_lookup",
  
  // Domain Crawl
  "crawl_domain",
  "domain_crawl_command",
  "read_domain_results_history_table",
  "create_domain_results_history",
  "create_domain_results_table",
  "toggle_page_speed_bulk",
  "read_page_speed_bulk_api_key",
  
  // Excel/CSV Export
  "create_excel_main_table",
  "generate_links_table_xlsx_command",
  "create_keywords_excel_command",
  "create_excel_two_cols",
  "create_excel",
  "create_css_excel",
  "generate_seo_csv",
  "generate_csv_command",
  "export_to_excel_command",
  "sheets_command",
  
  // AI/GenAI
  "generate_ai_topics",
  "generated_page_title",
  "generated_page_description",
  "ask_rusty_command",
  
  // Schema/Content
  "get_jsonld_command",
  "get_headings_command",
  
  // GSC
  "get_search_console_credentials",
  "set_google_search_console_credentials",
  
  // Settings
  "open_config_folder_command",
  "delete_config_folders_command",
  "get_system",
  "clear_table_command",
  "store_custom_search",
  "set_google_analytics_id",
]);

/**
 * Compatibility invoke function that works with REST API
 */
export async function invoke<T = any>(cmd: string, args?: Record<string, any>): Promise<T> {
  // Check if we have an API mapping
  const apiMethod = commandApiMap[cmd];
  
  if (apiMethod) {
    try {
      if (args && typeof apiMethod === "function") {
        // For methods that need arguments, we call with args
        const methodWithArgs = commandApiMap[cmd] as any;
        return await methodWithArgs(args);
      }
      return await apiMethod();
    } catch (error) {
      console.warn(`API call failed for ${cmd}:`, error);
      return getDefaultValue(cmd) as T;
    }
  }
  
  // For unmigrated commands, return default values
  if (unmigrated.has(cmd)) {
    console.info(`[invoke] Command "${cmd}" not yet migrated to API, returning default value`);
    return getDefaultValue(cmd) as T;
  }
  
  // Unknown command
  console.warn(`[invoke] Unknown command: ${cmd}`);
  return getDefaultValue(cmd) as T;
}

/**
 * Get default/empty value for a command
 */
function getDefaultValue(cmd: string): any {
  // Commands that return arrays
  if (cmd.includes("_from_db") || cmd.includes("_command") || cmd.includes("get_")) {
    return [];
  }
  
  // Commands that return objects
  if (cmd.includes("check_") || cmd.includes("credentials")) {
    return {};
  }
  
  // Commands that return strings
  if (cmd.includes("generate_") || cmd.includes("model")) {
    return "";
  }
  
  // Default
  return null;
}

export default invoke;

