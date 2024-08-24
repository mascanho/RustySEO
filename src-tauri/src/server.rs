use std::f64::consts::E;

use actix_web::{web, App, HttpServer, Responder};
use directories::ProjectDirs;
use tokio::fs;
use yup_oauth2::AccessToken;

//----------- Get the AI MODEL -------------
// Read the file
async fn read_model_file() -> Result<String, Box<dyn std::error::Error>> {
    let config_dir = directories::ProjectDirs::from("", "", "rustyseo")
        .ok_or("Failed to get project directories")?;
    let models_dir = config_dir.data_dir().join("models");

    // Read the file
    let model_file = models_dir.join("ai.toml");

    if !model_file.exists() {
        return Err("No file available".into());
    }

    println!("Ai File is: {:#?}", model_file);

    let file_toml = fs::read_to_string(model_file).await?;

    println!("This is the content of the file {:#?}", file_toml);

    Ok(file_toml)
}

async fn model() -> impl Responder {
    let model = read_model_file().await;
    model
}

pub async fn gsc(response: String) -> impl Responder {
    response
}

pub async fn rusty_server() {
    // Start the Actix Web server asynchronously

    println!("Starting Rusty's server");

    // getting the stored model

    tokio::spawn(async {
        HttpServer::new(|| {
            App::new()
                .route("/hello", web::get().to(model))
                .route("/gsc", web::get().to(gsc))
        })
        .bind("127.0.0.1:8080")
        .expect("Failed to bind address")
        .run()
        .await
        .expect("Failed to run server");
    });
}
