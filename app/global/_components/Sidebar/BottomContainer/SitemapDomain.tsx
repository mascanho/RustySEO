// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { listen } from "@/lib/tauri-compat";
import { useEffect, useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { darkula } from "react-syntax-highlighter/dist/cjs/styles/hljs";

const SitemapDomain = () => {
  const { crawlData, setSitemaps, sitemaps } = useGlobalCrawlStore();
  const [sitemapState, setSitemapState] = useState();

  useEffect(() => {
    // handle the event from the crawler
    const unlisten = listen("sitemaps", (event) => {
      const sitemap = event.payload;
      console.log(sitemap, "SITEMAPS");
      setSitemapState(sitemap);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [crawlData]);

  return (
    <div className="w-[20rem] h-[28rem] overflow-clip sitemapsDomain">
      <SyntaxHighlighter language="text" style={darkula}>
        {sitemapState?.Ok?.[0]}
      </SyntaxHighlighter>
    </div>
  );
};

export default SitemapDomain;
