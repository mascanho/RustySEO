use headless_chrome::{Browser, LaunchOptions};
use std::time::Duration;
use std::thread;

pub fn fetch_js_body(url: &str) -> Result<String, String> {
    // Create a new browser instance
    // We enable headless mode (default is true, but being explicit)
    let browser = Browser::new(LaunchOptions {
        headless: true,
        ..Default::default()
    }).map_err(|e| format!("Failed to create browser: {}", e))?;

    // Create a new tab
    let tab = browser.new_tab().map_err(|e| format!("Failed to create tab: {}", e))?;
    
    // Navigate to the URL
    tab.navigate_to(url).map_err(|e| format!("Failed to navigate to {}: {}", url, e))?;
    
    // Wait for the page to navigate
    // We attempt to wait, but don't hard fail if it times out as we have a manual sleep
    let _ = tab.wait_until_navigated();

    // Sleep to allow JavaScript execution (React/Vue/Angular hydration, API calls)
    // 3 seconds is a reasonable compromise between speed and correctness for most SPAs
    thread::sleep(Duration::from_secs(3));

    // Get the rendered HTML content
    let content = tab.get_content().map_err(|e| format!("Failed to get content from {}: {}", url, e))?;
    
    Ok(content)
}
