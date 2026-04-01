use std::net::IpAddr;
use trust_dns_resolver::TokioAsyncResolver;

#[tauri::command]
pub async fn reverse_lookup(ip: String) -> Option<String> {
    let resolver = TokioAsyncResolver::tokio_from_system_conf().ok()?;
    let ip: IpAddr = ip.parse().ok()?;

    resolver
        .reverse_lookup(ip)
        .await
        .ok()?
        .iter()
        .next()
        .map(|name| name.to_string())
}
