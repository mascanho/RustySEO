const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Enable metrics collection
  await page.goto("https://example.com", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    window.performance.mark("mark_lcp");
  });

  // Wait for the largest contentful paint to occur
  await page.waitForSelector("img, video, [role=img]", { timeout: 5000 });

  // Measure the largest contentful paint time
  const lcpTime = await page.evaluate(() => {
    const entries = window.performance.getEntriesByName("mark_lcp");
    if (entries.length > 0) {
      return entries[0].startTime;
    }
    return null;
  });

  console.log("Largest Contentful Paint (LCP):", lcpTime);

  await browser.close();
})();
