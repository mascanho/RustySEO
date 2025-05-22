use super::analyser::LogResult;
use crate::loganalyser::analyser::{analyse_log, LogAnalysisResult, LogInput};

#[tauri::command]
pub fn check_logs_command(data: LogInput, app: tauri::AppHandle) -> Result<LogResult, String> {
    let log_count = data.log_contents.len() as i32;

    match analyse_log(data, &log_count, app) {
        Ok(result) => {
            // Optional: You could include the current total in the result
            Ok(result)
        }
        Err(e) => Err(e),
    }
}
