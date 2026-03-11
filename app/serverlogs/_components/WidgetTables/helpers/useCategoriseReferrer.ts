export const categorizeReferrer = (referrer: string): string => {
  if (!referrer || referrer.trim() === "" || referrer === "-") {
    return "Direct/None";
  }

  const ref = referrer.toLowerCase();

  // Search engines
  if (ref.includes("google.com") || ref.includes("google.co")) {
    return "Google";
  }
  if (ref.includes("bing.com")) {
    return "MS Bing";
  }
  if (ref.includes("yahoo.com")) {
    return "Yahoo";
  }
  if (ref.includes("duckduckgo.com")) {
    return "DuckDuckGo";
  }
  if (ref.includes("baidu.com")) {
    return "Baidu";
  }
  if (ref.includes("yandex.com") || ref.includes("yandex.ru")) {
    return "Yandex";
  }

  // Social media
  if (ref.includes("facebook.com") || ref.includes("fb.com")) {
    return "Facebook";
  }
  if (ref.includes("twitter.com") || ref.includes("x.com")) {
    return "Twitter/X";
  }
  if (ref.includes("linkedin.com")) {
    return "LinkedIn";
  }
  if (ref.includes("instagram.com")) {
    return "Instagram";
  }
  if (ref.includes("pinterest.com")) {
    return "Pinterest";
  }
  if (ref.includes("reddit.com")) {
    return "Reddit";
  }
  if (ref.includes("tiktok.com")) {
    return "TikTok";
  }

  // Common internal/same domain
  if (
    ref.includes("localhost") ||
    ref.includes("127.0.0.1") ||
    ref.includes("::1")
  ) {
    return "Local/Internal";
  }

  // Check if it's from the same domain
  if (typeof window !== "undefined") {
    const domain = localStorage.getItem("domain");
    if (domain && ref.includes(domain.toLowerCase())) {
      // Return "Other" because Rust backend groups it in "Other"
      return "Other";
    }
  }

  // Try to extract domain for more specific categorization
  try {
    const url = new URL(referrer);
    const hostname = url.hostname.replace(/^www\./, "");

    // Check for more common domains
    if (hostname.includes("github.com")) return "GitHub";
    if (hostname.includes("stackoverflow.com")) return "Stack Overflow";
    if (hostname.includes("medium.com")) return "Medium";
    if (hostname.includes("wordpress.com")) return "WordPress";
    if (hostname.includes("blogger.com")) return "Blogger";
    if (hostname.includes("quora.com")) return "Quora";
    if (hostname.includes("youtube.com")) return "YouTube";
    if (hostname.includes("vimeo.com")) return "Vimeo";
    if (hostname.includes("wikipedia.org")) return "Wikipedia";
    if (hostname.includes("amazon.com")) return "Amazon";
    if (hostname.includes("ebay.com")) return "eBay";
    if (hostname.includes("etsy.com")) return "Etsy";
    if (hostname.includes("shopify.com")) return "Shopify";

    // For other domains that are not matched above, return "Other"
    return "Other";
  } catch (e) {
    // If not a valid URL, check common patterns
    const match = ref.match(/https?:\/\/([^\/]+)/);
    if (match && match[1]) {
      const hostname = match[1].replace(/^www\./, "");

      // Check for common patterns in non-URL referrers
      if (hostname.includes("github")) return "GitHub";
      if (hostname.includes("stackoverflow")) return "Stack Overflow";
      if (hostname.includes("medium")) return "Medium";
      if (hostname.includes("wordpress")) return "WordPress";

      return "Other";
    }

    // If it doesn't look like a URL at all, check if it's a common string

    // Return the original referrer truncated if it's too long
    return "Other";
  }
};
