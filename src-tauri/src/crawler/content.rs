use html2text::from_read;
use regex::Regex;
use reqwest;
use reqwest::header::{HeaderMap, HeaderValue};
use reqwest::Client;
use scraper::{ElementRef, Html, Selector};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::error::Error;
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;
use tokio::time::sleep;
use urlencoding;

pub async fn fetch_url(url: &str) -> Result<String, Box<dyn Error>> {
    let response = reqwest::get(url).await?.text().await?;
    Ok(response)
}
// TODO: make this more accurate
// --------------------------------- WORD COUNT ---------------------------------
pub fn count_words_accurately(document: &Html) -> (usize, Vec<String>) {
    let text_selector = Selector::parse("h1, h2, h3, h4, h5, h6, p, span").unwrap();
    let word_regex = Regex::new(r"\p{L}+(?:[-']\p{L}+)*").unwrap();

    let mut word_count = 0;
    let mut words = Vec::new();

    for element in document.select(&text_selector) {
        if should_skip_element(&element) {
            continue;
        }

        let text = get_visible_text(&element);
        let cleaned_text = clean_text(&text);

        if cleaned_text.trim().is_empty() {
            continue;
        }

        let element_words: Vec<String> = word_regex
            .find_iter(&cleaned_text)
            .map(|m| m.as_str().to_lowercase())
            .collect();

        word_count += element_words.len();

        if !cleaned_text.trim().is_empty() {
            words.push(cleaned_text.trim().to_string());
        }
    }

    // Remove duplicate entries and very short entries
    words.retain(|w| w.split_whitespace().count() > 3);
    words.sort();
    words.dedup();

    (word_count, words)
}

fn should_skip_element(element: &ElementRef) -> bool {
    let tag_name = element.value().name();
    let skip_tags = [
        "script", "style", "noscript", "iframe", "img", "svg", "path", "meta", "link", "footer",
        "form", "nav", "header", "head", "a", "button", "input", "select", "textarea",
    ];

    if skip_tags.contains(&tag_name) {
        return true;
    }

    element
        .value()
        .attr("aria-hidden")
        .map_or(false, |value| value == "true")
}

fn get_visible_text(element: &ElementRef) -> String {
    element.text().collect::<Vec<_>>().join(" ")
}

fn clean_text(text: &str) -> String {
    let mut cleaned = text
        .replace(['\n', '\r', '\t'], " ")
        .replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&apos;", "'");

    // Collapse multiple spaces into a single space
    let re = Regex::new(r"\s+").unwrap();
    cleaned = re.replace_all(&cleaned, " ").into_owned();

    cleaned.trim().to_string()
}

pub fn extract_text(html: &Html) -> String {
    let document = html;
    let selector = Selector::parse("h1, h2, h3, h4, h5, h6, p, span, blockquote").unwrap();
    let mut text = String::new();

    for element in document.select(&selector) {
        text.push_str(&element.text().collect::<Vec<_>>().join(" "));
    }
    // println!("Extracted HTML: {}", document.html().len());
    // println!("Extracted text: {}", text.len());
    text
}

//CALCULATE HTML TO TEXT RATIO
pub fn html_to_text_ratio(html: &Html) -> (f64, f64, f64) {
    let text = extract_text(html);
    let html_length = html.html().len() as f64;
    let text_length = text.len() as f64;
    let ratio = text_length / html_length;
    println!("HTML to text ratio: {}%", ratio as f64 * 100 as f64);
    (ratio, html_length, text_length)
}

pub fn get_top_keywords(text: &str, top_n: usize) -> Vec<(String, usize)> {
    // Define a more comprehensive set of stop words
    let stop_words: HashSet<&str> = vec![
        "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with", "by", "from",
        "up", "about", "into", "over", "after", "we", "us", "you", "they", "them", "our", "more",
        "your", "find", "here", "there", "when", "where", "why", "how", "all", "any", "that", "as",
        "is", "was", "were", "can", "could", "did", "do", "does", "have", "has", "had", "how",
        "why", "where", "when", "what", "which", "who", "whom", "has", "having", "having", "this",
        "each", "there", "their", "theirs", "the", "these", "those", "and", "but", "or", "yet",
        "it", "of", "be", "are", "am", "is", "was", "were", "been", "will", "shall", "could", "if",
        "will", "need", "https", "http", "www", "com", "org", "net", "co", "au", "uk", "us", "jpg",
        "png", // German stop words
        "der", "die", "das", "und", "in", "ich", "zu", "den", "ist", "sie", "mit", "für", "auf",
        "ein", "eine", "sich", "von", "dem", "dass", "aber", "auch", "nach", "bei", "es", "im",
        // Spanish stop words
        "el", "la", "los", "las", "un", "una", "unos", "unas", "y", "en", "de", "para", "por",
        "con", "su", "sus", "al", "del", "lo", "pero", "más", "qué", "cuando", "hay", "este", "se",
        "no", "si", "sin", "sobre", "que", // Italian stop words
        "il", "lo", "la", "i", "gli", "le", "uno", "una", "del", "della", "dei", "degli", "delle",
        "in", "con", "su", "per", "tra", "fra", "che", "ma", "perché", "come", "dove", "questo",
        // Dutch stop words
        "de", "het", "een", "en", "van", "is", "dat", "op", "te", "in", "aan", "met", "voor", "bij",
        "of", "als", "door", "maar", "dan", "die", "dit", "niet", "om", "hebben", "zijn",
    ]
    .into_iter()
    .collect();

    let mut occurrences = HashMap::new();

    // Use a regex that captures words with internal punctuation but ignores other symbols
    let word_regex = Regex::new(r"\b[a-zA-Z'-]+\b").unwrap();

    for word_match in word_regex.find_iter(text) {
        let word = word_match.as_str().to_lowercase();
        if word.len() > 1 && !stop_words.contains(word.as_str()) {
            *occurrences.entry(word).or_insert(0) += 1;
        }
    }

    // Convert to vec and sort by frequency and alphabetically
    let mut keywords: Vec<(String, usize)> = occurrences.into_iter().collect();
    keywords.sort_unstable_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));

    // Truncate to top_n
    keywords.truncate(top_n);

    keywords
}

pub fn calculate_reading_time(word_count: usize, words_per_minute: usize) -> usize {
    (word_count as f64 / words_per_minute as f64).ceil() as usize
}

// TODO: make this more accurate
// Function to calculate the reading level and classify it
pub fn calculate_reading_level(html: &str) -> (f64, String) {
    let text = from_read(html.as_bytes(), 80); // Convert HTML to plain text
    let sentences = text.split_terminator(['.', '!', '?']).count();
    let words: Vec<&str> = text.split_whitespace().collect();
    let syllables = words
        .iter()
        .map(|&word| count_syllables(word))
        .sum::<usize>();

    let words_count = words.len() as f64;
    let sentences_count = sentences as f64;
    let syllables_count = syllables as f64;

    let reading_score = 206.835
        - (1.015 * (words_count / sentences_count))
        - (84.6 * (syllables_count / words_count));
    let classification = classify_reading_level(reading_score);

    (reading_score, classification)
}

// Function to count syllables in a word
fn count_syllables(word: &str) -> usize {
    let word = word.to_lowercase();
    let mut count: usize = 0;
    let mut prev_char_is_vowel = false;
    let vowels = Regex::new(r"[aeiouy]").unwrap();

    for c in word.chars() {
        if vowels.is_match(&c.to_string()) {
            if !prev_char_is_vowel {
                count += 1;
                prev_char_is_vowel = true;
            }
        } else {
            prev_char_is_vowel = false;
        }
    }

    if word.ends_with('e') && count > 1 {
        count -= 1; // Adjust count for words ending with 'e'
    }

    count.max(1)
}

// Function to classify the reading score
fn classify_reading_level(score: f64) -> String {
    match score {
        90.0..=100.0 => "Very Easy".to_string(),
        80.0..=89.9 => "Easy".to_string(),
        70.0..=79.9 => "Fairly Easy".to_string(),
        60.0..=69.9 => "Standard".to_string(),
        50.0..=59.9 => "Fairly Difficult".to_string(),
        30.0..=49.9 => "Difficult".to_string(),
        0.0..=29.9 => "Very Confusing".to_string(),
        _ => "Unknown".to_string(),
    }
}

// ---------------- SCRAPPING GOOGLE FOR HEADINGS ----------------

#[derive(Debug, Serialize, Deserialize)]
pub struct Page {
    url: String,
    position: usize,
    headings: Vec<(String, String)>, // (heading tag, text)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SERP {
    query: String,
    pages: Vec<Page>,
    number: usize,
}

impl SERP {
    fn new(query: &str, number: &usize) -> Self {
        SERP {
            query: query.replace(" ", "+"),
            pages: Vec::new(),
            number: *number,
        }
    }

    async fn scrape_serp(
        &mut self,
        language: &str,
        country: &str,
        client: &Client,
        number: &usize,
    ) -> Result<(), Box<dyn Error>> {
        let url = format!(
            "https://www.google.com/search?hl={}&gl={}&q={}",
            language, country, self.query
        );

        let mut headers = HeaderMap::new();
        headers.insert(
            "User-Agent",
            HeaderValue::from_static(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            ),
        );

        let response = client.get(&url).headers(headers).send().await?;

        if response.status().is_success() {
            let body = response.text().await?;

            if body.contains("Google has blocked your IP address") {
                return Err("Google has blocked your IP address".into());
            }

            let document = Html::parse_document(&body);
            let link_selector =
                Selector::parse("div.g a").map_err(|e| format!("Invalid selector: {}", e))?;

            let mut count = 0;

            for link in document.select(&link_selector) {
                if let Some(href) = link.value().attr("href") {
                    if href.starts_with("http") {
                        count += 1;
                        let page = Page {
                            url: href.to_string(),
                            position: count,
                            headings: Vec::new(),
                        };
                        self.pages.push(page);

                        if count == *number {
                            break;
                        }
                    }
                }
            }
        } else {
            println!("Failed to scrape SERP: {}", response.status());
        }

        Ok(())
    }

    async fn scrape_page_headings(
        &mut self,
        client: &Client,
        heading_tags: &[&str],
    ) -> Result<(), Box<dyn Error>> {
        for page in &mut self.pages {
            let response = client.get(&page.url).send().await?; // Get page URL correctly
            let body = response.text().await?; // Await the text operation

            if body.contains("Google has blocked your IP address") {
                return Err("Google has blocked your IP address".into());
            }

            let document = Html::parse_document(&body);

            for tag in heading_tags {
                if let Ok(selector) = Selector::parse(tag) {
                    for element in document.select(&selector) {
                        let heading_text = element
                            .text()
                            .collect::<Vec<_>>()
                            .join(" ")
                            .trim()
                            .to_string();
                        if !heading_text.is_empty() {
                            page.headings.push((tag.to_string(), heading_text));
                        }
                    }
                } else {
                    println!("Failed to parse selector for tag: {}", tag);
                }
            }
        }

        Ok(())
    }
}

#[tauri::command]
pub async fn scrape_google_headings_command(
    keywords: Vec<String>,
    number: usize,
) -> Result<SERP, String> {
    let results = scrape_google_headings(keywords, number).await;
    match results {
        Ok(result) => Ok(result),
        Err(e) => Err(e.to_string()),
    }
}

async fn scrape_google_headings(
    keywords: Vec<String>,
    number: usize,
) -> Result<SERP, Box<dyn Error>> {
    let keyword = keywords.join(" ");
    let language = "en";
    let country = "uk";
    let heading_tags = vec!["h1", "h2", "h3", "h4", "h5", "h6"];

    let client = Client::new();

    let mut serp = SERP::new(&keyword, &number);
    serp.scrape_serp(language, country, &client, &number)
        .await?;

    println!("Scraped SERP pages for keywords: {}", &keyword);
    for page in &serp.pages {
        println!("- {}", page.url);
    }

    serp.scrape_page_headings(&client, &heading_tags).await?;

    println!("\nExtracted Headings:");
    for page in &serp.pages {
        println!("Page {}: {}", page.position, page.url);
        for (tag, text) in &page.headings {
            println!("  {}: {}", tag, text);
        }
    }

    Ok(serp)
}

// ------------------------ Google Suggestions Crawler --------------------------

async fn busqueda_individual(
    client: &Client,
    busqueda: &str,
    url: &str,
    _idioma: &str,
    _pais: &str,
    scrapeado: Arc<Mutex<HashSet<String>>>,
) -> Result<Vec<(String, String)>, Box<dyn Error + Send + Sync>> {
    let mut locked_scrapeado = scrapeado.lock().await;
    if locked_scrapeado.contains(busqueda) {
        return Ok(vec![]);
    }

    let response = client.get(url).send().await?;
    let body = response.text().await?;
    locked_scrapeado.insert(busqueda.to_string());
    drop(locked_scrapeado);

    let mut preguntas = vec![];
    let mut busquedas = vec![];

    let delay = 1;
    sleep(Duration::from_millis(delay)).await;

    let document = Html::parse_document(&body);
    let pregunta_selector = Selector::parse(".xpc").expect("error");
    let busqueda_selector = Selector::parse(".Q71vJc").expect("error");

    for element in document.select(&pregunta_selector) {
        let text = element.text().collect::<String>();
        if let Some(href) = element.value().attr("href") {
            if let Ok(full_url) = reqwest::Url::parse(url).and_then(|base| base.join(href)) {
                preguntas.push((text, full_url.to_string()));
            }
        }
    }

    for element in document.select(&busqueda_selector) {
        let text = element.text().collect::<String>();
        if let Some(href) = element.value().attr("href") {
            if let Ok(full_url) = reqwest::Url::parse(url).and_then(|base| base.join(href)) {
                busquedas.push((text, full_url.to_string()));
            }
        }
    }

    let result = if !preguntas.is_empty() {
        preguntas
    } else {
        busquedas
    };

    println!("Individual search results for '{}': {:?}", busqueda, result);

    Ok(result)
}

fn busqueda_global_boxed<'a>(
    client: &'a Client,
    busquedas: Vec<(String, String)>,
    nivel: u32,
    niveles_scrapeo: u32,
    idioma: &'a str,
    pais: &'a str,
    scrapeado: Arc<Mutex<HashSet<String>>>,
) -> Pin<
    Box<
        dyn Future<Output = Result<Vec<(String, String)>, Box<dyn Error + Send + Sync>>>
            + Send
            + 'a,
    >,
> {
    Box::pin(busqueda_global(
        client,
        busquedas,
        nivel,
        niveles_scrapeo,
        idioma,
        pais,
        scrapeado,
    ))
}

async fn busqueda_global<'a>(
    client: &'a Client,
    busquedas: Vec<(String, String)>,
    nivel: u32,
    niveles_scrapeo: u32,
    idioma: &'a str,
    pais: &'a str,
    scrapeado: Arc<Mutex<HashSet<String>>>,
) -> Result<Vec<(String, String)>, Box<dyn Error + Send + Sync>> {
    if nivel > niveles_scrapeo {
        return Ok(vec![]);
    }

    let mut all_results = vec![];
    for (busqueda, url) in busquedas {
        let mut headers = HeaderMap::new();
        headers.insert(
            "User-Agent",
            HeaderValue::from_static(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            ),
        );
        let _request = client.get(&url).headers(headers);

        let nuevas_busquedas = busqueda_individual(
            client,
            &busqueda,
            &url,
            idioma,
            pais,
            Arc::clone(&scrapeado),
        )
        .await?;
        all_results.extend(nuevas_busquedas.clone());

        if !nuevas_busquedas.is_empty() {
            let sub_results = busqueda_global_boxed(
                client,
                nuevas_busquedas,
                nivel + 1,
                niveles_scrapeo,
                idioma,
                pais,
                Arc::clone(&scrapeado),
            )
            .await?;
            all_results.extend(sub_results);
        }
    }

    println!(
        "Global search results at level {}: {:?}",
        nivel, all_results
    );

    Ok(all_results)
}

#[tauri::command]
pub async fn fetch_google_suggestions(
    keyword: String,
    country: &str,
    language: &str,
) -> Result<Vec<(String, String)>, String> {
    let niveles_scrapeo = 2;

    let client = Client::new();

    let url_inicial = format!(
        "https://www.google.com/search?hl={}&gl={}&q={}",
        language,
        country,
        urlencoding::encode(&keyword)
    );

    let scrapeado: Arc<Mutex<HashSet<String>>> = Arc::new(Mutex::new(HashSet::new()));
    match busqueda_global(
        &client,
        vec![(keyword.clone(), url_inicial)],
        0,
        niveles_scrapeo,
        language,
        country,
        scrapeado,
    )
    .await
    {
        Ok(results) => {
            println!("Final results for '{}': {:?}", keyword, results);
            Ok(results)
        }
        Err(e) => Err(e.to_string()),
    }
}
