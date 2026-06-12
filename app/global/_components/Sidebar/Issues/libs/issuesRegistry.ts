// @ts-nocheck

export interface IssueDefinition {
  id: number;
  name: string;
  priority: "High" | "Medium" | "Low";
  detect: (crawlData: any[]) => any[];
}

export const ISSUE_REGISTRY: IssueDefinition[] = [
  {
    id: 1,
    name: "Missing Page Title",
    priority: "High",
    detect: (data) => data.filter((p) => !p?.title?.[0]?.title),
  },
  {
    id: 2,
    name: "Missing Description",
    priority: "High",
    detect: (data) => data.filter((p) => !p?.description),
  },
  {
    id: 3,
    name: "Duplicated Titles",
    priority: "High",
    detect: (data) => {
      const titles = data
        .map((p) => p?.title?.[0]?.title)
        .filter(Boolean);
      const dupes = titles.filter(
        (t, i) => t && titles.indexOf(t) !== i,
      );
      return data.filter((p) => dupes.includes(p?.title?.[0]?.title));
    },
  },
  {
    id: 4,
    name: "Page Title > 60 Chars",
    priority: "Medium",
    detect: (data) =>
      data.filter((p) => (p?.title?.[0]?.title?.length || 0) > 60),
  },
  {
    id: 5,
    name: "Page Title < 30 Chars",
    priority: "Medium",
    detect: (data) =>
      data.filter((p) => (p?.title?.[0]?.title?.length || 0) < 30),
  },
  {
    id: 6,
    name: "Duplicated Descriptions",
    priority: "Medium",
    detect: (data) => {
      const descs = data.map((p) => p?.description).filter(Boolean);
      const dupes = descs.filter(
        (d, i) => d && descs.indexOf(d) !== i,
      );
      return data.filter((p) => dupes.includes(p?.description));
    },
  },
  {
    id: 7,
    name: "Descriptions > 160 Chars",
    priority: "Medium",
    detect: (data) =>
      data.filter((p) => (p?.description?.length || 0) > 160),
  },
  {
    id: 8,
    name: "4XX Client Error",
    priority: "High",
    detect: (data) =>
      data.filter(
        (p) => p?.status_code >= 400 && p?.status_code < 500,
      ),
  },
  {
    id: 9,
    name: "5XX Server Error",
    priority: "High",
    detect: (data) =>
      data.filter(
        (p) => p?.status_code >= 500 && p?.status_code < 600,
      ),
  },
  {
    id: 10,
    name: "H1 Missing",
    priority: "High",
    detect: (data) =>
      data.filter(
        (p) => !p?.headings?.h1 || p?.headings?.h1?.length === 0,
      ),
  },
  {
    id: 11,
    name: "H2 Missing",
    priority: "Low",
    detect: (data) =>
      data.filter(
        (p) => !p?.headings?.h2 || p?.headings?.h2?.length === 0,
      ),
  },
  {
    id: 12,
    name: "Multiple H1 tags",
    priority: "Medium",
    detect: (data) =>
      data.filter((p) => (p?.headings?.h1?.length || 0) > 1),
  },
  {
    id: 13,
    name: "Canonical Missing",
    priority: "Medium",
    detect: (data) =>
      data.filter(
        (p) => !p?.canonicals || p?.canonicals?.length === 0,
      ),
  },
  {
    id: 14,
    name: "Canonical Mismatch",
    priority: "Medium",
    detect: (data) =>
      data.filter((p) => {
        if (
          !p?.canonicals ||
          p?.canonicals?.length === 0 ||
          !p?.url
        )
          return false;
        const url = p.url.replace(/\/$/, "");
        const canonical = p.canonicals[0].replace(/\/$/, "");
        return url !== canonical;
      }),
  },
  {
    id: 15,
    name: "NoIndex Pages",
    priority: "Medium",
    detect: (data) =>
      data.filter((p) => p?.indexability?.noindex === true),
  },
  {
    id: 16,
    name: "NoFollow Pages",
    priority: "Medium",
    detect: (data) =>
      data.filter((p) => p?.indexability?.nofollow === true),
  },
  {
    id: 17,
    name: "Images Missing Alt Text",
    priority: "Low",
    detect: (data) =>
      data.filter(
        (p) =>
          p?.images?.some((img) => !img?.alt) ||
          p?.images?.some((img) => img?.alt === ""),
      ),
  },
  {
    id: 18,
    name: "Broken Images",
    priority: "High",
    detect: (data) =>
      data.filter((p) => p?.images?.some((img) => img?.broken)),
  },
  {
    id: 19,
    name: "Large Images (>100KB)",
    priority: "Medium",
    detect: (data) =>
      data.filter((p) =>
        p?.images?.some(
          (img) => (img?.size || 0) > 100 * 1024,
        ),
      ),
  },
  {
    id: 20,
    name: "Slow Response (>2s)",
    priority: "High",
    detect: (data) =>
      data.filter((p) => (p?.response_time || 0) > 2000),
  },
  {
    id: 21,
    name: "Large HTML Page (>100KB)",
    priority: "Low",
    detect: (data) =>
      data.filter((p) => (p?.page_size?.[0]?.kb || 0) > 100),
  },
  {
    id: 22,
    name: "Thin Content (<300 words)",
    priority: "Low",
    detect: (data) =>
      data.filter((p) => (p?.word_count || 0) < 300),
  },
  {
    id: 23,
    name: "Non-HTTPS Pages",
    priority: "High",
    detect: (data) =>
      data.filter((p) => !p?.url?.startsWith("https")),
  },
  {
    id: 24,
    name: "Long Redirect Chains",
    priority: "Medium",
    detect: (data) =>
      data.filter((p) => (p?.redirect_count || 0) > 2),
  },
  {
    id: 25,
    name: "Missing Schema",
    priority: "Medium",
    detect: (data) => data.filter((p) => !p?.schema),
  },
  {
    id: 26,
    name: "Deeply Nested URLs (4+ Depth)",
    priority: "Low",
    detect: (data) =>
      data.filter((p) => (p?.url_depth || 0) >= 4),
  },
  {
    id: 27,
    name: "Missing OpenGraph Tags",
    priority: "Low",
    detect: (data) =>
      data.filter(
        (p) =>
          !p?.opengraph ||
          Object.keys(p?.opengraph || {}).length === 0,
      ),
  },
  {
    id: 28,
    name: "Blocked by Robots.txt",
    priority: "High",
    detect: (_data, robotsBlocked) =>
      (robotsBlocked || []).map((url) => ({ url })),
  },
  {
    id: 29,
    name: "Redirect Detected",
    priority: "Medium",
    detect: (data) => data.filter((p) => p?.had_redirect),
  },
  {
    id: 30,
    name: "URL Has Uppercase Characters",
    priority: "Low",
    detect: (data) =>
      data.filter((p) => /[A-Z]/.test(p?.url)),
  },
  {
    id: 31,
    name: "URL Too Long (>100 chars)",
    priority: "Low",
    detect: (data) =>
      data.filter((p) => (p?.url?.length || 0) > 100),
  },
  {
    id: 32,
    name: "URL Contains Special Characters",
    priority: "Low",
    detect: (data) =>
      data.filter((p) => /[_\s]/.test(p?.url)),
  },
  {
    id: 33,
    name: "Low Readability Score",
    priority: "Medium",
    detect: (data) =>
      data.filter(
        (p) =>
          p?.flesch !== null &&
          p?.flesch !== undefined &&
          p?.flesch < 50,
      ),
  },
  {
    id: 34,
    name: "Low Text-to-HTML Ratio",
    priority: "Low",
    detect: (data) =>
      data.filter(
        (p) =>
          p?.text_ratio !== null &&
          p?.text_ratio !== undefined &&
          p?.text_ratio < 10,
      ),
  },
  {
    id: 35,
    name: "Missing Language Attribute",
    priority: "Low",
    detect: (data) =>
      data.filter((p) => !p?.language),
  },
  {
    id: 36,
    name: "Too Many Internal Links (>150)",
    priority: "Medium",
    detect: (data) =>
      data.filter((p) => (p?.internal_links_count || 0) > 150),
  },
  {
    id: 37,
    name: "Too Many External Links (>50)",
    priority: "Low",
    detect: (data) =>
      data.filter((p) => (p?.external_links_count || 0) > 50),
  },
  {
    id: 38,
    name: "Inline CSS Detected",
    priority: "Low",
    detect: (data) =>
      data.filter((p) => (p?.css_inline_count || 0) > 0),
  },
  {
    id: 39,
    name: "Mixed Content Detected",
    priority: "High",
    detect: (data) =>
      data.filter(
        (p) => (p?.security?.total_mixed_content || 0) > 0,
      ),
  },
  {
    id: 40,
    name: "Unsafe Cross-Origin Links",
    priority: "Medium",
    detect: (data) =>
      data.filter(
        (p) => (p?.security?.total_unsafe_anchors || 0) > 0,
      ),
  },
  {
    id: 41,
    name: "Not Mobile-Friendly",
    priority: "High",
    detect: (data) =>
      data.filter((p) => p?.mobile === false),
  },
  {
    id: 42,
    name: "Cookies Detected",
    priority: "Low",
    detect: (data) =>
      data.filter((p) => (p?.cookies_count || 0) > 0),
  },
];
