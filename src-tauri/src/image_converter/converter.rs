use base64::{
    alphabet::STANDARD,
    engine::general_purpose::{self, URL_SAFE},
    Engine,
};
use image::{codecs::png::FilterType, ImageFormat, ImageOutputFormat};
use std::{io::Cursor, u32};
use tauri::Manager;

#[tauri::command]
pub async fn handle_image_conversion(
    image: String,
    format: String,
    quality: u8,
    width: u32,
    height: u32,
) -> Result<Vec<String>, String> {
    // Decode the base64 image
    let decoded = general_purpose::STANDARD
        .decode(image)
        .expect("Failed to decode base64 image");

    // Load the image
    let img = image::load_from_memory(&decoded).expect("Failed to load image");

    // create a vector to store different versions
    let mut results = Vec::new();

    // Define formats and sizes
    let formats = vec![ImageFormat::Jpeg, ImageFormat::Png, ImageFormat::WebP];
    let sizes = vec![
        (width, height),
        (width / 2, height / 2),
        (width / 4, height / 4),
    ];

    for &current_format in &formats {
        for &(w, h) in &sizes {
            // resize the image
            let resized = img.resize(w, h, image::imageops::FilterType::Lanczos3);

            // Prepare a buffer for the output
            let mut buffer = Cursor::new(Vec::new());

            // Save the image to the buffer
            resized
                .write_to(&mut buffer, current_format)
                .map_err(|e| e.to_string())?;

            // Encode the result as base64
            let result_base64 = general_purpose::STANDARD.encode(buffer.into_inner());

            // Add the result to the vector
            results.push(result_base64);
        }
    }
    Ok((results))
}

#[tauri::command]
pub async fn process_single_image(
    image_data: Option<Vec<u8>>,
    path: Option<String>,
    width: u32,
    height: u32,
    quality: u8,
    format: String,
    maintain_aspect_ratio: bool,
) -> Result<Vec<u8>, String> {
    let result = tauri::async_runtime::spawn_blocking(move || {
        let img = if let Some(p) = path {
            image::open(p).map_err(|e| format!("Failed to open image from path: {}", e))?
        } else if let Some(data) = image_data {
            image::load_from_memory(&data).map_err(|e| format!("Failed to load image from memory: {}", e))?
        } else {
            return Err("No image data or path provided".to_string());
        };

        let (target_width, target_height) = if maintain_aspect_ratio {
             let ratio = f64::min(
                width as f64 / img.width() as f64,
                height as f64 / img.height() as f64
            );
            ((img.width() as f64 * ratio).round() as u32, (img.height() as f64 * ratio).round() as u32)
        } else {
            (width, height)
        };
        
        let resized = img.resize(target_width, target_height, image::imageops::FilterType::Lanczos3);

        let mut buffer = Cursor::new(Vec::new());

        let output_format = match format.to_lowercase().as_str() {
            "png" => ImageOutputFormat::Png,
            "jpeg" | "jpg" => ImageOutputFormat::Jpeg(quality),
            "webp" => ImageOutputFormat::WebP, 
            _ => ImageOutputFormat::Jpeg(quality),
        };
        
        resized.write_to(&mut buffer, output_format)
            .map_err(|e| format!("Failed to write image: {}", e))?;
            
        Ok(buffer.into_inner())
    }).await.map_err(|e| format!("Task failed: {}", e))??;

    Ok(result)
}
