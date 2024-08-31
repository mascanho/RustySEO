use directories::ProjectDirs;
use uuid::Uuid;

// ------------- Check if the UUID is present in the system  ---------------
pub fn uuid_creation_check() -> String {
    // CHECK FOR THE FILE IN THE CONFIG DIRECTORY
    println!("Checking for UUID file");
    let project_dirs =
        ProjectDirs::from("", "", "rustyseo").expect("Failed to get project directories");
    println!("Config directory: {:?}", project_dirs.config_dir());
    let config_dir = project_dirs.config_dir();
    let uuid_file = config_dir.join("uuid.toml");

    // Create directories if they don't exist
    if !config_dir.exists() {
        std::fs::create_dir_all(config_dir).unwrap();
    }

    // Check if the file exists
    if uuid_file.exists() {
        let uuid = std::fs::read_to_string(&uuid_file).unwrap();
        return uuid;
    } else {
        let uuid = Uuid::new_v4().to_string();
        std::fs::write(&uuid_file, &uuid).unwrap();
        return uuid;
    }
}

// ---------- Write to disk the AI Model being used
#[tauri::command]
pub fn ai_model_selected(model: String) -> String {
    // CHECK FOR THE FILE IN THE CONFIG DIRECTORY
    println!("Checking for AI Model file");
    let project_dirs =
        ProjectDirs::from("", "", "rustyseo").expect("Failed to get project directories");
    println!("Config directory: {:?}", project_dirs.config_dir());
    let config_dir = project_dirs.config_dir();
    let ai_model_file = config_dir.join("chosen_ai_model.toml");

    std::fs::write(&ai_model_file, &model).unwrap();
    return model;
}

// ------ read the AI Model being used
pub fn ai_model_read() -> String {
    // CHECK FOR THE FILE IN THE CONFIG DIRECTORY
    println!("Checking for AI Model file");
    let project_dirs =
        ProjectDirs::from("", "", "rustyseo").expect("Failed to get project directories");
    println!("Config directory: {:?}", project_dirs.config_dir());
    let config_dir = project_dirs.config_dir();
    let ai_model_file = config_dir.join("chosen_ai_model.toml");

    // Create directories if they don't exist
    if !config_dir.exists() {
        std::fs::create_dir_all(config_dir).unwrap();
    }

    // Check if the file exists
    if ai_model_file.exists() {
        let ai_model = std::fs::read_to_string(&ai_model_file).unwrap();
        println!("General AI Model Selected : {:?}", ai_model);
        return ai_model;
    } else {
        return "No AI Model selected".to_string();
    }
}
