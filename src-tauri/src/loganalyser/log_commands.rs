use super::{
    analyser::LogResult,
    database::{add_data_to_serverlog_db, create_serverlog_db},
};
use crate::loganalyser::analyser::{analyse_log, LogAnalysisResult, LogInput};

#[tauri::command]
pub fn check_logs_command(
    data: LogInput,
    app: tauri::AppHandle,
    storing_logs: bool,
) -> Result<LogResult, String> {
    let log_count = data.log_contents.len() as i32;

    println!("Storing Logs: {} ", storing_logs);

    // IF THE USER HAS CHOOSEN TO STORE THE LOGS IN A DB
    if storing_logs == true {
        // Create the DB
        let _create_table = create_serverlog_db("serverlog.db");
        // Add the data to the debug_assert!
        let _add_data = add_data_to_serverlog_db("serverlog.db", &data);

        println!("Stored logs in serverlog.db");
    } else {
        println!("Not storing logs");
    }

    match analyse_log(data, &log_count, app) {
        Ok(result) => {
            // Optional: You could include the current total in the result
            Ok(result)
        }
        Err(e) => Err(e),
    }
}
