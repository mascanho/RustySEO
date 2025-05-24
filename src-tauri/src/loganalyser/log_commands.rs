use super::{
    analyser::LogResult,
    database::{add_data_to_serverlog_db, create_serverlog_db},
};
use crate::loganalyser::analyser::{analyse_log, LogAnalysisResult, LogInput};

#[tauri::command]
pub fn check_logs_command(data: LogInput, app: tauri::AppHandle) -> Result<LogResult, String> {
    let log_count = data.log_contents.len() as i32;

    println!("Data is: {:?}", &data);

    // Create the DB
    let _create_table = create_serverlog_db("serverlog.db");
    // Add the data to the debug_assert!
    let _add_data = add_data_to_serverlog_db("serverlog.db", &data);

    match analyse_log(data, &log_count, app) {
        Ok(result) => {
            // Optional: You could include the current total in the result
            Ok(result)
        }
        Err(e) => Err(e),
    }
}
