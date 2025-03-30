use url::Url;

pub fn check_url_pdf(url: &Url) -> Result<Vec<String>, String> {
    println!("Not a HTML PAGE. Something Else: {}", url);

    let dummy_data = vec![
        "www.mascanho.com".to_string(),
        "www.mascanho.com".to_string(),
    ];

    Ok(dummy_data)
}
