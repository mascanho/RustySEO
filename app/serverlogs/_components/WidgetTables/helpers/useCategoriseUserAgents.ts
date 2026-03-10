// Helper function to categorize user agents
export const categorizeUserAgent = (userAgent: string): string => {
  if (
    !userAgent ||
    userAgent.trim() === "" ||
    userAgent === "-" ||
    userAgent === "Unknown"
  ) {
    return "Unknown/Empty";
  }

  const ua = userAgent.toLowerCase();

  // 1. Bot/Crawler detection (Prioritize bots as they often identify as browsers)
  if (ua.includes("googlebot")) return "Googlebot";
  if (ua.includes("bingbot")) return "Bingbot";
  if (ua.includes("slurp")) return "Yahoo Slurp";
  if (ua.includes("duckduckbot")) return "DuckDuckGo Bot";
  if (ua.includes("baiduspider")) return "Baidu Spider";
  if (ua.includes("yandexbot")) return "Yandex Bot";
  if (ua.includes("facebookexternalhit")) return "Facebook Bot";
  if (ua.includes("twitterbot")) return "Twitter Bot";
  if (ua.includes("linkedinbot")) return "LinkedIn Bot";
  if (ua.includes("applebot")) return "Apple Bot";

  // Generic bot patterns
  if (ua.includes("bot") || ua.includes("crawler") || ua.includes("spider")) {
    return "Other Bots";
  }

  // 2. Tools and libraries
  if (ua.includes("curl")) return "cURL";
  if (ua.includes("wget")) return "Wget";
  if (ua.includes("postman")) return "Postman";
  if (ua.includes("python")) return "Python Requests";

  // 3. Browser detection
  if (ua.includes("chrome")) {
    return ua.includes("mobile") ? "Chrome Mobile" : "Chrome";
  }
  if (ua.includes("firefox")) {
    return ua.includes("mobile") ? "Firefox Mobile" : "Firefox";
  }
  if (ua.includes("safari") && !ua.includes("chrome")) {
    return ua.includes("mobile") || ua.includes("iphone") || ua.includes("ipad")
      ? "Safari Mobile"
      : "Safari";
  }
  if (ua.includes("edge")) return "Microsoft Edge";
  if (ua.includes("opera")) return "Opera";
  if (ua.includes("trident") || ua.includes("msie")) return "Internet Explorer";

  // 4. Mobile device detection (Generic)
  if (ua.includes("android")) return "Android Browser";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod"))
    return "iOS Browser";

  // 5. Operating System detection (Generic)
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("mac os")) return "macOS";
  if (ua.includes("linux")) return "Linux";

  return "Other";
};
