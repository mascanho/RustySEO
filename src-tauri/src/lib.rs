// Re-export AppState and Settings so they can be accessed as crate::AppState and crate::Settings in other modules
pub use crate::main_lib_exports::AppState;
pub use crate::settings::settings::Settings;

pub mod chat;
pub mod crawler;
pub mod domain_crawler;
pub mod settings;
pub mod uploads;
pub mod url_checker;
pub mod users;
pub mod machine_learning;

pub mod downloads {
    pub mod csv;
    pub mod excel;
    pub mod google_sheets;
}

pub mod globals {
    pub mod actions;
}

pub mod commands;
pub mod gemini;
pub mod genai;
pub mod gsc;
pub mod image_converter;
pub mod loganalyser;
pub mod server;
pub mod version;

// Define AppState here in lib.rs or a shared module so it can be imported as crate::AppState
// But since AppState was defined in main.rs, we need to move it to a shared location.
// Let's create a new module for shared types or put it here.

pub mod main_lib_exports {
    use std::sync::Arc;
    use tokio::sync::RwLock;
    use crate::settings::settings::Settings;

    pub struct AppState {
        pub settings: Arc<RwLock<Settings>>,
    }
}
