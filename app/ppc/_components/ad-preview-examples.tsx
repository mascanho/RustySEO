import React from "react";
import type { Ad } from "@/types/ad";
import { Play, Youtube as YoutubeIcon } from "lucide-react";

interface PreviewProps {
  ad: Ad;
  currentHeadlines: string[];
  currentDescription: string;
  displayUrl: string;
}

export function SearchPreview({
  ad,
  currentHeadlines,
  currentDescription,
  displayUrl,
}: PreviewProps) {
  const validSitelinks = (ad.sitelinks || [])
    .filter((sitelink) => sitelink.title.trim() && sitelink.url.trim())
    .slice(0, 4);

  const formattedUrl = displayUrl.replace(/^https?:\/\//, "").split("/");
  const domain = formattedUrl[0];
  const paths = formattedUrl.slice(1).filter(Boolean);

  return (
    <div className="w-full max-w-[1000px] mx-auto group">
      {/* Browser Chrome Shell */}
      <div className="bg-[#f2f2f2] dark:bg-[#1a1a1a] rounded-t-2xl p-3 flex items-center gap-2 border-x border-t border-gray-200 dark:border-white/5 shadow-sm">
        <div className="flex gap-1.5 ml-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
          <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
        </div>
        <div className="flex-1 max-w-md mx-auto bg-white dark:bg-black/20 rounded-lg h-7 border border-gray-200 dark:border-white/5 flex items-center px-4 text-[10px] text-gray-400 font-mono italic">
          https://www.google.com/search?q={encodeURIComponent(ad.name)}
        </div>
      </div>

      <div className="bg-white dark:bg-[#202124] border-x border-b border-gray-200 dark:border-white/5 rounded-b-2xl p-8 shadow-2xl transition-all duration-500 group-hover:shadow-blue-500/5">
        {/* Top section: Sponsored and URL */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-[13px] text-gray-600 dark:text-gray-300 font-black border border-gray-100 dark:border-white/5 shadow-inner">
              {domain.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center text-[14px] text-[#202124] dark:text-gray-200 leading-tight">
                <span className="font-bold tracking-tight">{domain}</span>
              </div>
              <div className="flex items-center text-[12px] text-[#4d5156] dark:text-gray-400 mt-0.5">
                <span className="font-black mr-1 text-[10px] uppercase tracking-tighter text-blue-600 dark:text-blue-400">Sponsored</span>
                <span className="mx-1.5 opacity-30">·</span>
                <span className="flex items-center truncate max-w-[250px] font-medium opacity-80">
                  {displayUrl}
                  {paths.map((p, i) => (
                    <React.Fragment key={i}>
                      <span className="mx-1 text-[10px] opacity-40">›</span>
                      {p}
                    </React.Fragment>
                  ))}
                </span>
              </div>
            </div>
          </div>
          <div className="text-gray-300 dark:text-gray-600 hover:text-blue-500 transition-colors cursor-pointer p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/10">
            <svg focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
            </svg>
          </div>
        </div>

        {/* Headline */}
        <div className="mt-2">
          {currentHeadlines.length > 0 ? (
            <h3 className="text-[22px] text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer leading-[1.3] font-medium tracking-tight">
              {currentHeadlines.join(" - ")}
            </h3>
          ) : (
            <h3 className="text-[22px] text-gray-300 dark:text-gray-700 italic font-medium">[Add your headlines in the form]</h3>
          )}
        </div>

        {/* Description */}
        <div className="mt-2.5 text-[14px] text-[#4d5156] dark:text-[#bdc1c6] leading-[1.6] max-w-[620px] font-normal">
          {currentDescription ? (
            <p className="line-clamp-3">{currentDescription}</p>
          ) : (
            <p className="text-gray-300 dark:text-gray-700 italic">[Your description will appear here]</p>
          )}
        </div>

        {/* Sitelinks - Desktop Style */}
        {validSitelinks.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-x-12 gap-y-6">
            {validSitelinks.map((sitelink) => (
              <div key={sitelink.id} className="group/item cursor-pointer">
                <div className="text-[17px] text-[#1a0dab] dark:text-[#8ab4f8] group-hover/item:underline font-medium mb-1">
                  {sitelink.title}
                </div>
                {(sitelink.description1 || sitelink.description2) && (
                  <div className="text-[13px] text-[#4d5156] dark:text-[#bdc1c6] leading-[1.4] line-clamp-2 opacity-80 group-hover/item:opacity-100 transition-opacity">
                    {[sitelink.description1, sitelink.description2].filter(Boolean).join(" ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function YoutubePreview({
  ad,
  currentHeadlines,
  currentDescription,
  displayUrl,
}: PreviewProps) {
  return (
    <div className="w-full max-w-[540px] mx-auto relative group">
      <div className="bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-gray-900 group-hover:shadow-red-500/5 transition-all duration-700">
        <div className="relative aspect-video bg-gray-900 flex items-center justify-center group cursor-pointer overflow-hidden">
          {/* Animated Glow Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-purple-600/20 animate-pulse"></div>

          <div className="relative z-10 w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:shadow-red-500/50">
            <Play fill="currentColor" className="ml-1 w-8 h-8" />
          </div>

          {/* Cinematic Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>

          {/* Skip Ad Overlay - Redesigned */}
          <div className="absolute bottom-6 right-0 bg-black/70 backdrop-blur-xl text-white py-3 px-6 border-l-[3px] border-amber-400 flex items-center gap-3 animate-in slide-in-from-right duration-1000">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Skip in</span>
            <span className="text-xl font-black italic tabular-nums">5</span>
          </div>

          {/* Ad Info Overlay */}
          <div className="absolute bottom-6 left-6 flex items-center gap-3">
            <div className="bg-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded shadow-lg uppercase tracking-wider">
              Ad
            </div>
            <div className="text-white text-sm font-bold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] opacity-90">
              {displayUrl}
            </div>
          </div>
        </div>

        {/* Youtube Info Section */}
        <div className="p-6 bg-white dark:bg-[#0f0f0f] flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex-shrink-0 flex items-center justify-center shadow-lg">
            <YoutubeIcon className="text-white w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black text-gray-900 dark:text-white line-clamp-2 mb-1 tracking-tight">
              {currentHeadlines[0] || "[Cinematic Headline Ready]"}
            </h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 font-medium italic opacity-70">
              {currentDescription || "[Engagement description pending marketing copy]"}
            </p>
            <button className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-black transition-all duration-300 shadow-xl shadow-blue-500/20 active:scale-95">
              Experience Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobilePreview({
  ad,
  currentHeadlines,
  currentDescription,
  displayUrl,
}: PreviewProps) {
  const validSitelinks = (ad.sitelinks || [])
    .filter((sitelink) => sitelink.title.trim() && sitelink.url.trim())
    .slice(0, 4);

  const domain = displayUrl.replace(/^https?:\/\//, "").split("/")[0];

  return (
    <div className="flex justify-center items-center py-6 group">
      {/* High-Fidelity Phone Frame */}
      <div className="w-[340px] h-[640px] border-[12px] border-gray-950 dark:border-gray-900 rounded-[3.5rem] bg-white dark:bg-[#121212] shadow-2xl relative overflow-hidden flex flex-col ring-1 ring-white/10">
        {/* Dynamic Island / Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-gray-950 dark:bg-gray-900 rounded-b-[1.5rem] z-30 flex items-center justify-end px-5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500/20 border border-white/5"></div>
        </div>

        {/* Glossy Screen Effect */}
        <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-br from-white/10 via-transparent to-transparent"></div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#f8f9fa] dark:bg-[#121212] flex flex-col pt-10">
          {/* Mock Browser Header */}
          <div className="px-5 py-4 flex items-center gap-3 border-b dark:border-white/5 bg-white/80 dark:bg-black/40 backdrop-blur-md">
            <div className="flex-1 bg-gray-100 dark:bg-white/5 rounded-2xl h-9 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500/20 p-0.5">
                <div className="w-full h-full rounded-full bg-green-500"></div>
              </div>
              <span className="text-[11px] font-bold text-gray-500 truncate italic tracking-tight">{displayUrl}</span>
            </div>
          </div>

          {/* Ad Content */}
          <div className="p-5">
            <div className="bg-white dark:bg-[#1c1c1e] rounded-[2.5rem] p-6 shadow-xl shadow-black/5 dark:shadow-none border border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-[12px] font-black text-gray-400">
                    {domain.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-black tracking-tight text-gray-900 dark:text-white">
                      {domain}
                    </span>
                    <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                      <span className="text-blue-500">Sponsored</span>
                    </div>
                  </div>
                </div>
                <div className="text-gray-300">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
                  </svg>
                </div>
              </div>

              <h3 className="text-[#1a0dab] dark:text-[#8ab4f8] text-[20px] font-bold leading-[1.2] mb-3 group-hover:underline">
                {currentHeadlines.length > 0
                  ? currentHeadlines.slice(0, 3).join(" - ")
                  : "[Viral Headline]"}
              </h3>

              <p className="text-[14px] text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed font-medium line-clamp-3 opacity-90">
                {currentDescription || "[Compelling ad copy that converts users on the first glance]"}
              </p>

              {/* Mobile Sitelinks - Premium Carousel Pills */}
              {validSitelinks.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {validSitelinks.map((sitelink) => (
                    <div
                      key={sitelink.id}
                      className="bg-gray-50 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 rounded-[1.25rem] px-5 py-2 text-[12px] text-blue-600 dark:text-blue-400 font-black tracking-tight shadow-sm"
                    >
                      {sitelink.title}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mock Organic Result for Contrast */}
            <div className="mt-6 bg-white/40 dark:bg-white/5 rounded-[2rem] p-6 opacity-30">
              <div className="h-3 w-32 bg-gray-200 dark:bg-white/10 rounded-full mb-3"></div>
              <div className="h-5 w-full bg-gray-200 dark:bg-white/10 rounded-full mb-3"></div>
              <div className="h-3 w-2/3 bg-gray-200 dark:bg-white/10 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Home Indicator */}
        <div className="h-8 flex justify-center items-center pb-1 bg-white/80 dark:bg-black/40 backdrop-blur-md">
          <div className="w-32 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

export function AdThumbnail({ ad }: { ad: Ad }) {
  // Get first valid headline and description
  const headline = (ad.headlines || []).find((h) => h.trim()) || "[No headline]";
  const description =
    (ad.descriptions || []).find((d) => d.trim()) || "[No description]";
  const displayUrl =
    ad.displayPath || (ad.finalUrl ? ad.finalUrl.replace(/^https?:\/\//, "") : "example.com");

  return (
    <div className="rounded-xl p-4 h-full bg-white dark:bg-[#202124] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-gray-100 dark:bg-gray-800 text-[10px] font-bold px-1.5 py-0.5 rounded text-gray-500">
          Ad
        </div>
        <span className="text-[11px] text-gray-500 truncate">{displayUrl}</span>
      </div>

      <h3 className="text-[14px] font-medium text-[#1a0dab] dark:text-[#8ab4f8] truncate mb-1">
        {headline}
      </h3>

      <p className="text-[12px] text-[#4d5156] dark:text-[#bdc1c6] line-clamp-2 mt-1 leading-normal">
        {description}
      </p>

      <div className="mt-3 flex justify-between items-center pt-2 border-t border-gray-50 dark:border-gray-800">
        <span className="text-[10px] text-gray-400 font-medium px-2 py-0.5 bg-gray-50 dark:bg-gray-800 rounded-full uppercase tracking-wider">
          {ad.type}
        </span>
        <span className="text-[10px] text-gray-400">
          {(ad.headlines || []).length} headlines
        </span>
      </div>
    </div>
  );
}
