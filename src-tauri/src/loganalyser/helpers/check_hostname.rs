use std::net::IpAddr;
use trust_dns_resolver::TokioAsyncResolver;

#[tauri::command]
pub async fn reverse_lookup(ip: String) -> Option<String> {
    let resolver = TokioAsyncResolver::tokio_from_system_conf().ok()?;
    let ip: IpAddr = ip.parse().ok()?;

    // For reverse lookup, we need to use the special PTR record format
    let ptr_name = match ip {
        IpAddr::V4(ipv4) => {
            let octets = ipv4.octets();
            format!(
                "{}.{}.{}.{}.in-addr.arpa",
                octets[3], octets[2], octets[1], octets[0]
            )
        }
        IpAddr::V6(ipv6) => {
            let segments = ipv6.segments();
            let mut s = String::new();
            for seg in segments.iter().rev() {
                for i in (0..4).rev() {
                    let nibble = (seg >> (i * 4)) & 0xF;
                    s.push_str(&format!("{:x}.", nibble));
                }
            }
            s.push_str("ip6.arpa");
            s
        }
    };

    resolver
        .reverse_lookup(ip)
        .await
        .ok()?
        .iter()
        .next()
        .map(|name| name.to_string())
}
