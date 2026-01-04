use tauri::{AppHandle, Emitter};
use tokio::net::TcpListener;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use url::Url;
use std::collections::HashMap;

#[tauri::command]
pub async fn start_gsc_auth_server(app: AppHandle) -> Result<u16, String> {
    let listener = TcpListener::bind("127.0.0.1:0").await.map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();

    tokio::spawn(async move {
        if let Ok((mut socket, _)) = listener.accept().await {
            let mut buffer = [0; 1024];
            if let Ok(n) = socket.read(&mut buffer).await {
                let request = String::from_utf8_lossy(&buffer[..n]);
                let first_line = request.lines().next().unwrap_or("");
                let parts: Vec<&str> = first_line.split_whitespace().collect();
                
                if parts.len() > 1 {
                    let path = parts[1];
                    let full_url = format!("http://localhost{}{}", port, path);
                    if let Ok(url) = Url::parse(&full_url) {
                        let params: HashMap<String, String> = url.query_pairs().into_owned().collect();
                        if let Some(code) = params.get("code") {
                            let _ = app.emit("gsc-auth-code", code.clone());
                        } else if let Some(error) = params.get("error") {
                            let _ = app.emit("gsc-auth-error", error.clone());
                        }
                    }
                }

                let response = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n<html><body><h1>Authentication Successful!</h1><p>You can close this window now and return to RustySEO.</p><script>window.close();</script></body></html>";
                let _ = socket.write_all(response.as_bytes()).await;
                let _ = socket.flush().await;
            }
        }
    });

    Ok(port)
}

#[tauri::command]
pub async fn exchange_gsc_code(code: String, client_id: String, client_secret: String, redirect_uri: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let response = client.post("https://oauth2.googleapis.com/token")
        .form(&[
            ("code", code.as_str()),
            ("client_id", client_id.as_str()),
            ("client_secret", client_secret.as_str()),
            ("redirect_uri", redirect_uri.as_str()),
            ("grant_type", "authorization_code"),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let json: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
    
    Ok(json.to_string())
}
