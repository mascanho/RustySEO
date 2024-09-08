extern crate google_sheets4 as sheets4;
extern crate hyper;
extern crate hyper_rustls;
extern crate yup_oauth2 as oauth2;
use sheets4::Error;
use sheets4::Sheets;

#[tauri::command]
pub async fn sheets_command() -> Result<(), String> {
    sheets().await
        Ok(())
}

async fn sheets() -> Result<(), Box<dyn std::error::Error>> {
    // Get an ApplicationSecret instance by some means. It contains the `client_id` and
    // `client_secret`, among other things.
    let secret = yup_oauth2::read_application_secret("clientsecret.json")
        .await
        .expect("client secret could not be read");

    // Instantiate the authenticator. It will choose a suitable authentication flow for you,
    // unless you replace  `None` with the desired Flow.
    // Provide your own `AuthenticatorDelegate` to adjust the way it operates and get feedback about
    // what's going on. You probably want to bring in your own `TokenStorage` to persist tokens and
    // retrieve them from storage.
    let auth = yup_oauth2::InstalledFlowAuthenticator::builder(
        secret,
        yup_oauth2::InstalledFlowReturnMethod::HTTPRedirect,
    )
    .persist_tokens_to_disk("tokencache.json")
    .build()
    .await?;

    let hub = Sheets::new(
        hyper::Client::builder().build(hyper_rustls::HttpsConnector::with_native_roots()),
        auth,
    );

    let result = hub
        .spreadsheets()
        .get("1TWUpZdjXiquf-LsfbqXEIBVWgZ12XeaZtzrNp3uaHX8") // your spreadsheet id enters here
        .doit()
        .await;

    match result {
        Err(e) => {
            println!("Error: {}", e);
            Err(e.into())
        },
        Ok(res) => {
            println!("Success: {:?}", res);
            Ok(())
        }
    }
}
