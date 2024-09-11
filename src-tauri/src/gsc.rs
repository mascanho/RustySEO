use oauth2::{
    basic::BasicClient, reqwest::async_http_client, AuthUrl, AuthorizationCode, ClientId,
    ClientSecret, CsrfToken, PkceCodeChallenge, PkceCodeVerifier, RedirectUrl, TokenResponse,
    TokenUrl,
};
use reqwest::Client;
use serde::Deserialize;

#[derive(Deserialize)]
struct SearchAnalyticsQueryResponse {
    rows: Vec<Row>,
}

#[derive(Deserialize)]
struct Row {
    keys: Vec<String>,
    clicks: f64,
    impressions: f64,
    ctr: f64,
    position: f64,
}

pub async fn check_google_search_console() {
    // Hardcoded client ID and client secret (for testing purposes only)
    let client_id = ClientId::new(
        "616986262649-oub9ts4pcjujcabmtn5e8n2jkur5borp.apps.googleusercontent.com".to_string(),
    );
    let client_secret = ClientSecret::new("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".to_string());

    let auth_url = AuthUrl::new("https://accounts.google.com/o/oauth2/auth".to_string())
        .expect("Invalid authorization endpoint URL");
    let token_url = TokenUrl::new("https://accounts.google.com/o/oauth2/token".to_string())
        .expect("Invalid token endpoint URL");

    // Set up the OAuth2 client
    let client = BasicClient::new(
        client_id.clone(),
        Some(client_secret),
        auth_url.clone(),
        Some(token_url),
    )
    .set_redirect_uri(
        RedirectUrl::new("urn:ietf:wg:oauth:2.0:oob".to_string()).expect("Invalid redirect URL"),
    );

    // Generate the PKCE code challenge and verifier
    let (pkce_code_challenge, pkce_code_verifier) = PkceCodeChallenge::new_random_sha256();

    // Generate the authorization URL and CSRF token
    let (auth_url, _csrf_token) = client
        .authorize_url(CsrfToken::new_random)
        .add_scope(oauth2::Scope::new(
            "https://www.googleapis.com/auth/webmasters".to_string(),
        ))
        .set_pkce_challenge(pkce_code_challenge)
        .url();


    // Prompt the user to enter the authorization code
    println!("Enter the authorization code:");
    let mut input = String::new();
    std::io::stdin()
        .read_line(&mut input)
        .expect("Failed to read line");
    let authorization_code = AuthorizationCode::new(input.trim().to_string());

    // Exchange the authorization code for an access token, using the PKCE code verifier
    let token_result = client
        .exchange_code(authorization_code.clone())
        .set_pkce_verifier(pkce_code_verifier)
        .request_async(async_http_client)
        .await
        .expect("Failed to exchange authorization code for a token");

    let access_token = token_result.access_token().secret();

    // Use the access token to make requests to the Google Search Console API
    let http_client = Client::new();
    let url = "https://searchconsole.googleapis.com/v1/sites/YOUR_SITE_URL/searchAnalytics/query";
    let response = http_client
        .post(url)
        .bearer_auth(access_token)
        .json(&serde_json::json!({
            "startDate": "2023-01-01",
            "endDate": "2023-01-31",
            "dimensions": ["query"],
            "dimensionFilterGroups": [{
                "filters": [{
                    "dimension": "page",
                    "operator": "equals",
                    "expression": "YOUR_PAGE_URL"
                }]
            }]
        }))
        .send()
        .await
        .expect("Failed to send request");

    let query_response: SearchAnalyticsQueryResponse = response
        .json()
        .await
        .expect("Failed to deserialize response");

    // Process and display the response
    // for row in query_response.rows {
    //     println!(
    //         "Query: {}, Clicks: {}, Impressions: {}, CTR: {}, Position: {}",
    //         row.keys.join(", "),
    //         row.clicks,
    //         row.impressions,
    //         row.ctr,
    //         row.position
    //     );
    // }
}
