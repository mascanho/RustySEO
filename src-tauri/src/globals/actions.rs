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
