use crate::loganalyser::analyser::{analyse_log, LogAnalysisResult, LogInput};

use super::analyser::LogResult;

#[tauri::command]
pub fn check_logs_command(data: LogInput) -> Result<LogResult, String> {
    match analyse_log(data) {
        Ok(result) => Ok(result),
        Err(e) => Err(e),
    }
}
