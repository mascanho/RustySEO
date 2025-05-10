use reqwest;
use semver::Version;
use serde::Serialize;
use std::error::Error;

pub async fn get_version() -> Result<(Version, Version), Box<dyn Error>> {
    // Local software version (replace with actual version or fetch dynamically)
    let local_version = Version::parse("0.2.3")?;

    // GitHub repository details
    let owner = "mascanho"; // Replace with the repo owner
    let repo = "rustyseo"; // Replace with the repo name
    let url = format!(
        "https://api.github.com/repos/{}/{}/releases/latest",
        owner, repo
    );

    // Fetch the latest release from GitHub
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("User-Agent", "rust-version-checker") // GitHub requires a User-Agent
        .send()
        .await?;

    match response.status().is_success() {
        true => {
            let json: serde_json::Value = response.json().await?;
            match json["tag_name"].as_str() {
                Some(tag_name) => {
                    println!("GitHub tag name: {}", tag_name);
                    // Remove 'v' prefix if it exists, otherwise use the full tag_name
                    let version_str = if tag_name.starts_with('v') {
                        &tag_name[1..]
                    } else {
                        tag_name
                    };

                    match version_str.is_empty() {
                        false => match Version::parse(version_str) {
                            Ok(latest_version) => {
                                if local_version == latest_version {
                                    println!(
                                        "Local version matches the latest GitHub version: {}",
                                        latest_version
                                    );
                                } else {
                                    println!(
                                            "Version mismatch: Local version is {}, but GitHub latest is {}",
                                            local_version, latest_version
                                        );
                                }
                                Ok((local_version, latest_version))
                            }
                            Err(e) => {
                                println!("Error parsing version '{}': {}", version_str, e);
                                Err(e.into())
                            }
                        },
                        true => Err("Invalid version string format in GitHub tag".into()),
                    }
                }
                None => Err("Unable to fetch the latest version from the GitHub API.".into()),
            }
        }
        false => Err(format!(
            "Failed to fetch the latest version from GitHub. HTTP status: {}",
            response.status()
        )
        .into()),
    }
}

#[derive(Serialize)]
pub struct Versions {
    pub local: String,
    pub github: String,
}

#[tauri::command]
pub async fn version_check_command() -> Result<Versions, String> {
    let checked_versions = get_version().await.unwrap();

    let versions = Versions {
        local: checked_versions.0.to_string(),
        github: checked_versions.1.to_string(),
    };

    Ok(versions)
}
