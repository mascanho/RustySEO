use base64::{engine::general_purpose::STANDARD, Engine};
use headless_chrome::{protocol::cdp::Page::CaptureScreenshotFormatOption, Browser, LaunchOptions};
use std::thread;
use std::time::Duration;

// A real desktop viewport. Without an explicit window_size, Chrome launches
// at its own small headless default (~800x600), so a responsive site renders
// its narrow/mobile layout instead of the desktop one — this is what was
// producing a not-full-width screenshot.
const VIEWPORT_WIDTH: u32 = 1920;
const VIEWPORT_HEIGHT: u32 = 1080;

/// Captures a JPEG screenshot of `url` at desktop width, using the same
/// headless Chrome engine already bundled for JS-rendering crawls (see
/// helpers::headless_fetch) — independent of PageSpeed Insights, which is
/// opt-in and often not run. Returns a ready-to-embed
/// `data:image/jpeg;base64,...` URI.
pub fn capture_page_screenshot(url: &str) -> Result<String, String> {
    let browser = Browser::new(LaunchOptions {
        headless: true,
        window_size: Some((VIEWPORT_WIDTH, VIEWPORT_HEIGHT)),
        ..Default::default()
    })
    .map_err(|e| format!("Failed to create browser: {}", e))?;

    let tab = browser
        .new_tab()
        .map_err(|e| format!("Failed to create tab: {}", e))?;

    tab.navigate_to(url)
        .map_err(|e| format!("Failed to navigate to {}: {}", url, e))?;
    let _ = tab.wait_until_navigated();

    // Brief settle time for fonts/images/layout to finish after navigation
    // reports "done" — mirrors the same tradeoff headless_fetch.rs makes for
    // JS hydration, just shorter since we only need a visual paint, not API
    // round-trips.
    thread::sleep(Duration::from_millis(800));

    let jpeg_bytes = tab
        .capture_screenshot(CaptureScreenshotFormatOption::Jpeg, Some(80), None, true)
        .map_err(|e| format!("Failed to capture screenshot of {}: {}", url, e))?;

    Ok(format!("data:image/jpeg;base64,{}", STANDARD.encode(jpeg_bytes)))
}
