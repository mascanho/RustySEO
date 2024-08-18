use base64::{
    alphabet::STANDARD,
    engine::general_purpose::{self, URL_SAFE},
    Engine,
};
use image::{codecs::png::FilterType, ImageFormat};
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
