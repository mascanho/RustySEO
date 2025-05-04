use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

use crate::settings::settings::Settings;

#[derive(Debug, Serialize, Deserialize)]
pub struct PsiResponse {
    #[serde(rename = "lighthouseResult")]
    pub lighthouse_result: LighthouseResult,
    #[serde(rename = "audits")]
    pub audits: Vec<(String, Value)>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LighthouseResult {
    #[serde(rename = "finalUrl")]
    pub final_url: String,
    #[serde(rename = "audits")]
    pub audits: HashMap<String, Audit>,
    #[serde(rename = "categories")]
    pub categories: HashMap<String, Category>,
    #[serde(rename = "categoryGroups")]
    pub category_groups: HashMap<String, CategoryGroup>,
    #[serde(rename = "timing")]
    pub timing: Timing,
    #[serde(rename = "i18n")]
    pub i18n: I18n,
    #[serde(rename = "entities")]
    pub entities: Vec<Entity>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Audit {
    #[serde(rename = "id")]
    pub id: String,
    #[serde(rename = "title")]
    pub title: String,
    #[serde(rename = "description")]
    pub description: String,
    #[serde(rename = "score")]
    pub score: Option<f64>,
    #[serde(rename = "scoreDisplayMode")]
    pub score_display_mode: String,
    #[serde(rename = "details")]
    pub details: Option<AuditDetails>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuditDetails {
    #[serde(rename = "items")]
    pub items: Vec<AuditItem>,
    #[serde(rename = "type")]
    pub detail_type: String,
    #[serde(rename = "headings")]
    pub headings: Option<Vec<Heading>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuditItem {
    #[serde(rename = "url")]
    pub url: Option<String>,
    #[serde(rename = "value")]
    pub value: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Heading {
    #[serde(rename = "key")]
    pub key: String,
    #[serde(rename = "label")]
    pub label: String,
    #[serde(rename = "valueType")]
    pub value_type: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Category {
    pub title: String,
    pub score: f64,
    #[serde(rename = "auditRefs")]
    pub audit_refs: Vec<AuditRef>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuditRef {
    #[serde(rename = "id")]
    pub id: String,
    pub weight: i32,
    pub group: String,
    #[serde(rename = "acronym")]
    pub acronym: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CategoryGroup {
    pub title: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Timing {
    pub total: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct I18n {
    #[serde(rename = "rendererFormattedStrings")]
    pub renderer_formatted_strings: RendererFormattedStrings,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RendererFormattedStrings {
    #[serde(rename = "varianceDisclaimer")]
    pub variance_disclaimer: String,
    #[serde(rename = "opportunityResourceColumnLabel")]
    pub opportunity_resource_column_label: String,
    #[serde(rename = "opportunitySavingsColumnLabel")]
    pub opportunity_savings_column_label: String,
    #[serde(rename = "errorMissingAuditInfo")]
    pub error_missing_audit_info: String,
    #[serde(rename = "errorLabel")]
    pub error_label: String,
    #[serde(rename = "warningHeader")]
    pub warning_header: String,
    #[serde(rename = "passedAuditsGroupTitle")]
    pub passed_audits_group_title: String,
    #[serde(rename = "notApplicableAuditsGroupTitle")]
    pub not_applicable_audits_group_title: String,
    #[serde(rename = "manualAuditsGroupTitle")]
    pub manual_audits_group_title: String,
    #[serde(rename = "topLevelWarningsMessage")]
    pub top_level_warnings_message: String,
    #[serde(rename = "crcLongestDurationLabel")]
    pub crc_longest_duration_label: String,
    #[serde(rename = "crcInitialNavigation")]
    pub crc_initial_navigation: String,
    #[serde(rename = "lsPerformanceCategoryDescription")]
    pub ls_performance_category_description: String,
    #[serde(rename = "labDataTitle")]
    pub lab_data_title: String,
    #[serde(rename = "warningAuditsGroupTitle")]
    pub warning_audits_group_title: String,
    #[serde(rename = "snippetExpandButtonLabel")]
    pub snippet_expand_button_label: String,
    #[serde(rename = "snippetCollapseButtonLabel")]
    pub snippet_collapse_button_label: String,
    #[serde(rename = "thirdPartyResourcesLabel")]
    pub third_party_resources_label: String,
    #[serde(rename = "runtimeDesktopEmulation")]
    pub runtime_desktop_emulation: String,
    #[serde(rename = "runtimeMobileEmulation")]
    pub runtime_mobile_emulation: String,
    #[serde(rename = "runtimeNoEmulation")]
    pub runtime_no_emulation: String,
    #[serde(rename = "runtimeSettingsBenchmark")]
    pub runtime_settings_benchmark: String,
    #[serde(rename = "runtimeSettingsCPUThrottling")]
    pub runtime_settings_cpu_throttling: String,
    #[serde(rename = "runtimeSettingsDevice")]
    pub runtime_settings_device: String,
    #[serde(rename = "runtimeSettingsNetworkThrottling")]
    pub runtime_settings_network_throttling: String,
    #[serde(rename = "runtimeSettingsUANetwork")]
    pub runtime_settings_ua_network: String,
    #[serde(rename = "runtimeUnknown")]
    pub runtime_unknown: String,
    #[serde(rename = "dropdownCopyJSON")]
    pub dropdown_copy_json: String,
    #[serde(rename = "dropdownDarkTheme")]
    pub dropdown_dark_theme: String,
    #[serde(rename = "dropdownPrintExpanded")]
    pub dropdown_print_expanded: String,
    #[serde(rename = "dropdownPrintSummary")]
    pub dropdown_print_summary: String,
    #[serde(rename = "dropdownSaveGist")]
    pub dropdown_save_gist: String,
    #[serde(rename = "dropdownSaveHTML")]
    pub dropdown_save_html: String,
    #[serde(rename = "dropdownSaveJSON")]
    pub dropdown_save_json: String,
    #[serde(rename = "dropdownViewer")]
    pub dropdown_viewer: String,
    #[serde(rename = "footerIssue")]
    pub footer_issue: String,
    #[serde(rename = "throttlingProvided")]
    pub throttling_provided: String,
    #[serde(rename = "calculatorLink")]
    pub calculator_link: String,
    #[serde(rename = "runtimeSettingsAxeVersion")]
    pub runtime_settings_axe_version: String,
    #[serde(rename = "viewTreemapLabel")]
    pub view_treemap_label: String,
    #[serde(rename = "showRelevantAudits")]
    pub show_relevant_audits: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Entity {
    pub name: String,
    #[serde(rename = "isFirstParty")]
    pub is_first_party: bool,
    #[serde(rename = "isUnrecognized")]
    pub is_unrecognized: bool,
    pub origins: Vec<String>,
    pub homepage: Option<String>,
    pub category: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Metric {
    pub score: Option<f64>,
    #[serde(rename = "numericValue")]
    pub numeric_value: Option<f64>,
}

// Crawler configuration
pub struct Crawler {
    pub client: Client,
    pub settings: Settings,
}
