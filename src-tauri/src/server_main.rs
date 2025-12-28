use axum::{
    routing::{get, post, delete},
    Json, Router, extract::Path,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use app::crawler;
use app::genai;
use app::globals;
use app::commands;
use app::domain_crawler;
use app::domain_crawler::domain_commands;
use app::domain_crawler::database::DiffAnalysis;
use app::crawler::db;
use app::crawler::libs;
use app::crawler::libs::Credentials;
use app::crawler::libs::DateRange;
use app::settings::settings;
use serde_json::Value;

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(root))
        .route("/api/crawl", post(crawl_handler))
        .route("/api/db_data", get(get_db_data_handler))
        .route("/api/page_speed", post(page_speed_handler))
        .route("/api/check_link_status", post(check_link_status_handler))
        .route("/api/settings/all", get(get_all_settings_handler))
        .route("/api/seo_data", get(get_seo_data_handler))
        .route("/api/ollama_status", get(get_ollama_status_handler))
        .route("/api/model", post(write_model_handler))
        .route("/api/gsc/credentials", post(set_gsc_credentials_handler))
        .route("/api/gsc/call", post(call_gsc_handler))
        .route("/api/gsc/match_url", post(match_gsc_url_handler))
        .route("/api/gsc/data", get(get_gsc_data_handler))
        .route("/api/analytics", post(get_analytics_handler))
        .route("/api/clarity/credentials", post(set_clarity_credentials_handler))
        .route("/api/clarity/credentials/get", get(get_clarity_credentials_handler))
        .route("/api/clarity/data", get(get_clarity_data_handler))
        .route("/api/keywords/tracking", post(add_keyword_tracking_handler))
        .route("/api/keywords/tracked", get(get_tracked_keywords_handler))
        .route("/api/keywords/:id", delete(delete_keyword_handler))
        .route("/api/keywords/sync", post(sync_keyword_tables_handler))
        .route("/api/keywords/match", post(match_keywords_handler))
        .route("/api/keywords/matched", get(get_matched_keywords_handler))
        .route("/api/keywords/summary", get(get_keywords_summary_handler))
        .route("/api/configs/open", post(open_configs_handler))
        .route("/api/version/check", get(version_check_handler))
        .route("/api/diff/url", get(get_url_diff_handler))
        .route("/api/credentials/gsc", get(read_gsc_credentials_handler))
        // AI
        .route("/api/ai/model", get(get_ai_model_handler))
        .route("/api/ai/check", get(check_ai_model_handler))
        // PageSpeed Bulk
        .route("/api/pagespeed/bulk/check", get(check_page_speed_bulk_handler))
        .layer(CorsLayer::permissive());

    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    
    let listener = match tokio::net::TcpListener::bind(addr).await {
        Ok(listener) => listener,
        Err(e) => {
            if e.kind() == std::io::ErrorKind::AddrInUse {
                eprintln!("Error: Port 8080 is already in use.");
                eprintln!("The RustySEO server may already be running.");
                eprintln!("To fix: Kill the existing process with 'lsof -ti:8080 | xargs kill -9'");
                std::process::exit(0);
            } else {
                eprintln!("Failed to bind to {}: {}", addr, e);
                std::process::exit(1);
            }
        }
    };
    
    println!("RustySEO Server listening on http://{}", addr);
    
    if let Err(e) = axum::serve(listener, app).await {
        eprintln!("Server error: {}", e);
        std::process::exit(1);
    }
}

async fn root() -> &'static str {
    "RustySEO Server is running!"
}

#[derive(Deserialize)]
struct CrawlRequest {
    url: String,
}

#[derive(Serialize)]
struct CrawlResponse {
    status: String,
    data: crawler::CrawlResult,
}

#[derive(Serialize)]
struct ErrorResponse {
    status: String,
    error: String,
}

async fn crawl_handler(Json(payload): Json<CrawlRequest>) -> Result<Json<CrawlResponse>, Json<ErrorResponse>> {
    println!("Crawling URL: {}", payload.url);
    let result = crawler::crawl(payload.url).await;
    match result {
        Ok(data) => Ok(Json(CrawlResponse {
            status: "success".to_string(),
            data,
        })),
        Err(err) => Err(Json(ErrorResponse {
            status: "error".to_string(),
            error: err,
        })),
    }
}

async fn get_db_data_handler() -> Json<Result<Vec<crawler::db::ResultRecord>, String>> {
    let result = crawler::db::read_data_from_db();
    match result {
        Ok(data) => Json(Ok(data)),
        Err(err) => Json(Err(err.to_string())),
    }
}

#[derive(Deserialize)]
struct PageSpeedRequest {
    url: String,
    strategy: String,
}

async fn page_speed_handler(Json(payload): Json<PageSpeedRequest>) -> Json<Result<(crawler::PageSpeedResponse, crawler::SeoPageSpeedResponse), String>> {
    let timeout = std::time::Duration::from_secs(70);
    let result = tokio::time::timeout(
        timeout,
        crawler::get_page_speed_insights(payload.url, Some(payload.strategy)),
    ).await;

    match result {
        Ok(inner_result) => match inner_result {
            Ok(data) => Json(Ok(data)),
            Err(err) => Json(Err(err)),
        },
        Err(_) => Json(Err("Request timed out".to_string())),
    }
}

#[derive(Deserialize)]
struct LinkStatusRequest {
    url: String,
}

async fn check_link_status_handler(Json(payload): Json<LinkStatusRequest>) -> Json<Result<Vec<app::crawler::libs::LinkStatus>, String>> {
    let result = app::crawler::libs::check_links(payload.url).await;
    match result {
        Ok(data) => Json(Ok(data)),
        Err(err) => Json(Err(err.to_string())),
    }
}

#[derive(Serialize)]
struct AllSettings {
    ai_model: String,
    ai_model_check: String,
    page_speed_key: String,
    ga4_id: Option<String>,
    clarity_command: String,
    page_speed_bulk: bool,
}

async fn get_all_settings_handler() -> Json<AllSettings> {
    let ai_model = genai::get_ai_model();
    let ai_model_check = globals::actions::check_ai_model();
    let page_speed = app::crawler::libs::load_api_keys().await.unwrap_or(app::crawler::libs::ApiKeys { page_speed_key: "".to_string() });
    let ga4 = app::crawler::libs::get_google_analytics_id().await.ok();
    let clarity_res = commands::get_microsoft_clarity_command().await;
    let clarity = clarity_res.unwrap_or_default().first().cloned().unwrap_or_default();
    let bulk_details = domain_crawler::page_speed::store_key::check_page_speed_bulk().await.unwrap_or(
        domain_crawler::page_speed::store_key::PageSpeedDetails { 
            api_key: None,
            page_speed_crawl: false 
        }
    );

    Json(AllSettings {
        ai_model,
        ai_model_check,
        page_speed_key: page_speed.page_speed_key,
        ga4_id: ga4,
        clarity_command: clarity,
        page_speed_bulk: bulk_details.page_speed_crawl,
    })
}

async fn get_seo_data_handler() -> Json<Result<Vec<db::SEOResultRecord>, String>> {
    let result = db::read_seo_data_from_db();
    match result {
        Ok(data) => Json(Ok(data)),
        Err(err) => Json(Err(err.to_string())),
    }
}

async fn get_ollama_status_handler() -> Json<Result<commands::OllamaProcess, String>> {
    let result = libs::check_ollama();
    Json(Ok(if result {
        commands::OllamaProcess {
            text: String::from("Ollama is running"),
            status: true,
        }
    } else {
        commands::OllamaProcess {
            text: String::from("Ollama is not running"),
            status: false,
        }
    }))
}

#[derive(Deserialize)]
struct ModelRequest {
    model: String,
}

async fn write_model_handler(Json(payload): Json<ModelRequest>) -> Json<Result<String, String>> {
    let result = commands::write_model_to_disk(payload.model);
    match result {
        Ok(data) => Json(Ok(data)),
        Err(err) => Json(Err(err)),
    }
}

async fn set_gsc_credentials_handler(Json(payload): Json<Credentials>) -> Json<Result<(), String>> {
    libs::set_search_console_credentials(payload).await;
    Json(Ok(()))
}

async fn call_gsc_handler() -> Json<Result<(), String>> {
    match libs::get_google_search_console().await {
        Ok(_) => Json(Ok(())),
        Err(e) => Json(Err(format!("Failed to call Google Search Console: {}", e))),
    }
}

#[derive(Deserialize)]
struct MatchUrlRequest {
    url: String,
}

async fn match_gsc_url_handler(Json(payload): Json<MatchUrlRequest>) -> Json<Result<Vec<db::GscMatched>, String>> {
    if let Err(e) = db::match_gsc_url(&payload.url) {
        return Json(Err(e.to_string()));
    }
    match db::read_gsc_matched_from_db() {
        Ok(result) => Json(Ok(result)),
        Err(err) => Json(Err(err.to_string())),
    }
}

async fn get_gsc_data_handler() -> Json<Result<Vec<db::GscDataFromDB>, String>> {
    let result = db::read_gsc_data_from_db();
    match result {
        Ok(data) => Json(Ok(data)),
        Err(err) => Json(Err(err.to_string())),
    }
}

#[derive(Deserialize)]
struct AnalyticsRequest {
    search_type: Vec<Value>,
    date_ranges: Vec<DateRange>,
}

async fn get_analytics_handler(Json(payload): Json<AnalyticsRequest>) -> Json<Result<libs::AnalyticsData, String>> {
    match libs::get_google_analytics(payload.search_type, payload.date_ranges).await {
        Ok(result) => Json(Ok(result)),
        Err(e) => Json(Err(format!("Failed to call Google Analytics: {}", e))),
    }
}

#[derive(Deserialize)]
struct ClarityCredentialsRequest {
    endpoint: String,
    token: String,
}

async fn set_clarity_credentials_handler(Json(payload): Json<ClarityCredentialsRequest>) -> Json<Result<String, String>> {
    let result = libs::set_microsoft_clarity_credentials(payload.endpoint, payload.token).await;
    match result {
        Ok(data) => Json(Ok(data)),
        Err(err) => Json(Err(err.to_string())),
    }
}

async fn get_clarity_credentials_handler() -> Json<Result<Vec<String>, String>> {
    let result = libs::get_microsoft_clarity_credentials().await;
    match result {
        Ok(data) => Json(Ok(data)),
        Err(err) => Json(Err(err.to_string())),
    }
}

async fn get_clarity_data_handler() -> Json<Result<Vec<Value>, String>> {
    let result = libs::get_microsoft_clarity_data().await;
    match result {
        Ok(data) => Json(Ok(data)),
        Err(err) => Json(Err(err.to_string())),
    }
}

async fn add_keyword_tracking_handler(Json(payload): Json<db::KwTrackingData>) -> Json<Result<(), String>> {
    match db::add_gsc_data_to_kw_tracking(&payload) {
        Ok(_) => Json(Ok(())),
        Err(err) => Json(Err(err.to_string())),
    }
}

async fn get_tracked_keywords_handler() -> Json<Result<Vec<db::KwTrackingData>, String>> {
    match db::read_tracked_keywords_from_db() {
        Ok(data) => Json(Ok(data)),
        Err(err) => Json(Err(err.to_string())),
    }
}

async fn delete_keyword_handler(Path(id): Path<String>) -> Json<Result<(), String>> {
    match db::delete_keyword_from_db(&id) {
        Ok(_) => Json(Ok(())),
        Err(err) => Json(Err(err.to_string())),
    }
}

async fn sync_keyword_tables_handler() -> Json<Result<(), String>> {
    match db::sync_keyword_tables() {
        Ok(_) => Json(Ok(())),
        Err(err) => Json(Err(err.to_string())),
    }
}

async fn match_keywords_handler() -> Json<Result<(), String>> {
    match db::match_tracked_with_gsc() {
        Ok(_) => Json(Ok(())),
        Err(err) => Json(Err(err.to_string())),
    }
}

async fn get_matched_keywords_handler() -> Json<Result<Vec<db::MatchedKeywordData>, String>> {
    match db::read_matched_keywords_from_db() {
        Ok(data) => Json(Ok(data)),
        Err(err) => Json(Err(err.to_string())),
    }
}

async fn get_keywords_summary_handler() -> Json<Result<Vec<db::KeywordsSummary>, String>> {
    match db::fetch_keywords_summarized_matched() {
        Ok(data) => Json(Ok(data)),
        Err(err) => Json(Err(err.to_string())),
    }
}

async fn open_configs_handler() -> Json<Result<(), String>> {
    let config_path = match settings::Settings::config_path() {
        Ok(path) => path,
        Err(e) => return Json(Err(format!("Failed to get config path: {}", e))),
    };

    let path = config_path.to_string_lossy().to_string();

    let result = {
        #[cfg(target_os = "windows")]
        {
            std::process::Command::new("cmd.exe")
                .args(["/C", "start", "", &path])
                .spawn()
        }

        #[cfg(not(target_os = "windows"))]
        {
            std::process::Command::new("xdg-open")
                .arg(&path)
                .spawn()
                .or_else(|_| {
                    std::process::Command::new("open")
                        .arg(&path)
                        .spawn()
                })
        }
    };

    match result {
        Ok(_) => Json(Ok(())),
        Err(e) => Json(Err(format!("Failed to open file: {}", e))),
    }
}

async fn version_check_handler() -> Json<Result<app::version::Versions, String>> {
    match app::version::version_check_command().await {
        Ok(versions) => Json(Ok(versions)),
        Err(err) => Json(Err(err.to_string())),
    }
}

async fn get_url_diff_handler() -> Json<Result<DiffAnalysis, String>> {
    match domain_commands::get_url_diff_command().await {
        Ok(diff) => Json(Ok(diff)),
        Err(err) => Json(Err(err.to_string())),
    }
}

async fn read_gsc_credentials_handler() -> Json<Result<libs::InstalledInfo, String>> {
    match libs::read_credentials_file().await {
        Ok(credentials) => Json(Ok(credentials)),
        Err(err) => Json(Err(err.to_string())),
    }
}

// AI Handlers
async fn get_ai_model_handler() -> Json<String> {
    Json(genai::get_ai_model())
}

async fn check_ai_model_handler() -> Json<String> {
    Json(globals::actions::check_ai_model())
}

// PageSpeed Bulk Handler
async fn check_page_speed_bulk_handler() -> Json<Result<Value, String>> {
    match domain_crawler::page_speed::store_key::check_page_speed_bulk().await {
        Ok(result) => Json(Ok(serde_json::to_value(result).unwrap_or(Value::Null))),
        Err(err) => Json(Err(err)),
    }
}
