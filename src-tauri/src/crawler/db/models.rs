use rusqlite::types::Value;
use serde::{Deserialize, Serialize};

// Main response struct
#[derive(Serialize, Deserialize, Debug)]
pub struct PageSpeedResponse {
    pub captchaResult: String,
    pub kind: String,
    pub id: String,
    #[serde(rename = "loadingExperience")]
    pub loading_experience: LoadingExperience,
    #[serde(rename = "lighthouseResult")]
    pub lighthouse_result: LighthouseResult,
}

// LoadingExperience struct
#[derive(Serialize, Deserialize, Debug)]
pub struct LoadingExperience {
    #[serde(rename = "initial_url")]
    pub initial_url: String,
}

// LighthouseResult struct
#[derive(Serialize, Deserialize, Debug)]
pub struct LighthouseResult {
    #[serde(rename = "requestedUrl")]
    pub requested_url: String,
    #[serde(rename = "finalUrl")]
    pub final_url: String,
    #[serde(rename = "mainDocumentUrl")]
    pub main_document_url: String,
    #[serde(rename = "finalDisplayedUrl")]
    pub final_displayed_url: String,
    #[serde(rename = "lighthouseVersion")]
    pub lighthouse_version: String,
    #[serde(rename = "userAgent")]
    pub user_agent: String,
    #[serde(rename = "fetchTime")]
    pub fetch_time: String,
    pub environment: Environment,
    #[serde(rename = "runWarnings")]
    pub run_warnings: Vec<String>,
    #[serde(rename = "configSettings")]
    pub config_settings: ConfigSettings,
    pub audits: Audits,
    pub categories: Categories,
}

// Environment struct
#[derive(Serialize, Deserialize, Debug)]
pub struct Environment {
    #[serde(rename = "networkUserAgent")]
    pub network_user_agent: String,
    #[serde(rename = "hostUserAgent")]
    pub host_user_agent: String,
    #[serde(rename = "benchmarkIndex")]
    pub benchmark_index: f64,
}

// ConfigSettings struct
#[derive(Serialize, Deserialize, Debug)]
pub struct ConfigSettings {
    #[serde(rename = "emulatedFormFactor")]
    pub emulated_form_factor: String,
    #[serde(rename = "formFactor")]
    pub form_factor: String,
    pub locale: String,
    #[serde(rename = "onlyCategories")]
    pub only_categories: Vec<String>,
    pub channel: String,
}

// Audits struct
#[derive(Serialize, Deserialize, Debug)]
pub struct Audits {
    pub interactive: Audit,
    #[serde(rename = "render-blocking-resources")]
    pub render_blocking_resources: Audit,
    #[serde(rename = "first-contentful-paint")]
    pub first_contentful_paint: Audit,
    #[serde(rename = "largest-contentful-paint")]
    pub largest_contentful_paint: Audit,
    #[serde(rename = "cumulative-layout-shift")]
    pub cumulative_layout_shift: Audit,
    #[serde(rename = "total-blocking-time")]
    pub total_blocking_time: Audit,
    #[serde(rename = "total-byte-weight")]
    pub total_byte_weight: Audit,
    #[serde(rename = "dom-size")]
    pub dom_size: Audit,
}

// Categories struct
#[derive(Serialize, Deserialize, Debug)]
pub struct Categories {
    pub performance: Performance,
}

// Performance struct
#[derive(Serialize, Deserialize, Debug)]
pub struct Performance {
    pub score: f64,
}

// Audit struct
#[derive(Serialize, Deserialize, Debug)]
pub struct Audit {
    pub id: String,
    pub title: String,
    pub description: String,
    pub score: f64,
    #[serde(rename = "scoreDisplayMode")]
    pub score_display_mode: Option<String>,
    #[serde(rename = "displayValue")]
    pub display_value: Option<String>,
    #[serde(rename = "numericValue")]
    pub numeric_value: Option<f64>,
    #[serde(rename = "numericUnit")]
    pub numeric_unit: Option<String>,
    #[serde(rename = "details")]
    pub details: Option<AuditDetails>,
}

// AuditDetails struct
#[derive(Serialize, Deserialize, Debug)]
pub struct AuditDetails {
    pub headings: Option<Vec<Heading>>,
    #[serde(rename = "overallSavingsMs")]
    pub overall_savings_ms: Option<f64>,
    pub items: Option<Vec<AuditDetailItem>>,
    #[serde(rename = "sortedBy")]
    pub sorted_by: Option<Vec<String>>,
}

// Heading struct
#[derive(Serialize, Deserialize, Debug)]
pub struct Heading {
    #[serde(rename = "valueType")]
    pub value_type: String,
    pub label: String,
    pub key: String,
    #[serde(rename = "granularity")]
    pub granularity: Option<u32>,
}

// AuditDetailItem struct
#[derive(Serialize, Deserialize, Debug)]
pub struct AuditDetailItem {
    #[serde(rename = "serverResponseTime")]
    pub server_response_time: Option<f64>,
}
