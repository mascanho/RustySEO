use super::{
    analyser::LogResult,
    database::{add_data_to_serverlog_db, create_serverlog_db},
};
use crate::loganalyser::analyser::{analyse_log, LogAnalysisResult, LogInput};
use tauri::Manager;

#[tauri::command]
pub fn check_logs_command(
    data: LogInput,
    storing_logs: bool,
    project: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let app = app.clone();

    // IF THE USER HAS CHOOSEN TO STORE THE LOGS IN A DB
    if storing_logs == true {
        // Create the DB
        let _create_table = create_serverlog_db("serverlog.db");
        // Add the data to the debug_assert!
        let _add_data = add_data_to_serverlog_db("serverlog.db", &data, &project);

        println!("Stored logs in serverlog.db");
    } else {
        println!("Not storing logs");
    }

    match analyse_log(data, app) {
        Ok(()) => {
            // Optional: You could include the current total in the result
            Ok(())
        }
        Err(e) => Err(e),
    }
}
