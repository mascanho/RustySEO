extern crate google_sheets4 as sheets4;
use sheets4::api::ValueRange;
use sheets4::oauth2::ApplicationSecret;
use sheets4::{chrono, hyper, hyper_rustls, oauth2, FieldMask, Sheets};
use sheets4::{Error, Result};
use std::default::Default;

#[tauri::command]
pub async fn sheets_command() {
    sheets().await;
}

pub async fn sheets() -> Result<String, Box<dyn std::error::Error>> {
    // Get an ApplicationSecret instance by some means. It contains the `client_id` and
    // `client_secret`, among other things.
    let secret: oauth2::ApplicationSecret = Default::default();

    // Instantiate the authenticator. It will choose a suitable authentication flow for you.
    let auth = oauth2::InstalledFlowAuthenticator::builder(
        secret,
        oauth2::InstalledFlowReturnMethod::HTTPRedirect,
    )
    .build()
    .await?;

    let hub = Sheets::new(
        hyper::Client::builder().build(
            hyper_rustls::HttpsConnectorBuilder::new()
                .with_native_roots() // No need for `?` here
                .https_or_http()
                .enable_http1()
                .build(),
        ),
        auth,
    );

    // Create the request object.
    let req = ValueRange::default();

    // Execute the append operation with correct parameters.
    let result = hub
        .spreadsheets()
        .values_append(req, "spreadsheetId", "range")
        .value_input_option("USER_ENTERED") // Correct input option
        .response_value_render_option("FORMATTED_VALUE") // Correct response render option
        .response_date_time_render_option("SERIAL_NUMBER") // Correct date-time render option
        .insert_data_option("INSERT_ROWS") // Correct data insertion option
        .include_values_in_response(true)
        .doit()
        .await;

    // Handle the result using pattern matching.
    match result {
        Err(e) => {
            println!("Error: {}", e);
            Err(Box::new(e))
        }
        Ok(res) => {
            println!("Success: {:?}", res);
            Ok("Success".to_string())
        }
    }
}
