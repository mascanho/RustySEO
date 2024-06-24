import React from "react";

interface SitemapDisplayProps {
  sitemapContent: string; // Assuming you pass sitemap content as a prop
}

const SitemapDisplay: React.FC<SitemapDisplayProps> = ({ sitemapContent }) => {
  // Split the sitemap content by lines
  const lines = sitemapContent.split("\n");

  return (
    <div className="h-[600px]   rounded-md  ">
      <pre>
        <code>
          {lines.map((line, index) => (
            <div className="crawl-item" key={index}>
              {line}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
};

export default SitemapDisplay;
