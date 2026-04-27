use crate::settings::settings;
use crate::version::local_version;

pub async fn replace_config_file() -> Result<(), String> {
    let settings = settings::load_settings().await?;
    let version = settings.version;
    let expected = local_version();

    println!("TOML Config Version: {} | App Version: {}", version, expected);

    if version != expected {
        println!("Version mismatch detected! Migrating settings and replacing the configuration file with the new format.");
        let _ = settings::Settings::delete_file();
        settings::create_config_file().await.map(|_| ()).map_err(|e| e.to_string())?;
    } else {
        println!("Config file format is up-to-date.");
    }
    
    Ok(())
}
