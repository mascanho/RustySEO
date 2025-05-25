// @ts-nocheck
"use client";

import type { Ad } from "@/types/ad";
import { ExternalLink } from "lucide-react";

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
  // Filter out empty sitelinks and limit to 4 for display
  const validSitelinks = (ad.sitelinks || [])
    .filter((sitelink) => sitelink.title.trim() && sitelink.url.trim())
    .slice(0, 4);

  return (
    <div className="border rounded-lg p-4 shadow-sm w-full mx-auto">
      <div className="flex items-center text-sm text-green-700 mb-1">
        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded mr-2">
          Ad
        </span>
        <span>{displayUrl}</span>
      </div>

      <div className="space-y-1 mb-2">
        {currentHeadlines.length > 0 ? (
          <h3 className="text-xl font-semibold text-blue-700 hover:underline cursor-pointer">
            {currentHeadlines.join(" | ")}
          </h3>
        ) : (
          <h3 className="text-xl font-semibold text-gray-400">
            [No headlines added]
          </h3>
        )}

        <div className="text-sm text-gray-600">
          {currentDescription ? (
            <p className="line-clamp-2">{currentDescription}</p>
          ) : (
            <p className="text-gray-400">[No description added]</p>
          )}
        </div>
      </div>

      {ad.finalUrl && (
        <div className="text-xs text-gray-500">{ad.finalUrl}</div>
      )}

      {validSitelinks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {validSitelinks.map((sitelink) => (
              <div key={sitelink.id} className="text-sm">
                <a
                  href="#"
                  className="text-blue-700 hover:underline flex items-center"
                >
                  {sitelink.title}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
                {(sitelink.description1 || sitelink.description2) && (
                  <div className="text-xs text-gray-600 mt-0.5">
                    {sitelink.description1 && (
                      <div>{sitelink.description1}</div>
                    )}
                    {sitelink.description2 && (
                      <div>{sitelink.description2}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
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
    <div className="border rounded-lg p-4 shadow-sm w-full mx-auto bg-gray-100">
      <div className="flex items-start gap-3">
        <div className="w-32 h-20 bg-gray-300 rounded flex items-center justify-center text-gray-500 text-xs">
          Video Thumbnail
        </div>
        <div className="flex-1">
          <div className="flex items-center text-xs text-gray-500 mb-1">
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded mr-2">
              Ad
            </span>
            <span>{displayUrl}</span>
          </div>

          {currentHeadlines.length > 0 ? (
            <h3 className="text-base font-semibold text-blue-700 hover:underline cursor-pointer line-clamp-2">
              {currentHeadlines[0]}
            </h3>
          ) : (
            <h3 className="text-base font-semibold text-gray-400">
              [No headline added]
            </h3>
          )}

          <div className="text-xs text-gray-600 mt-1">
            {currentDescription ? (
              <p className="line-clamp-2">{currentDescription}</p>
            ) : (
              <p className="text-gray-400">[No description added]</p>
            )}
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
  // Filter out empty sitelinks and limit to 2 for mobile display
  const validSitelinks = (ad.sitelinks || [])
    .filter((sitelink) => sitelink.title.trim() && sitelink.url.trim())
    .slice(0, 2);

  return (
    <div className="border rounded-lg p-3 shadow-sm max-w-sm mx-auto bg-white">
      <div className="flex items-center text-xs text-green-700 mb-1">
        <span className="bg-green-100 text-green-800 text-xs font-medium px-1.5 py-0.5 rounded mr-1">
          Ad
        </span>
        <span className="text-xs">{displayUrl}</span>
      </div>

      <div className="space-y-1 mb-1">
        {currentHeadlines.length > 0 ? (
          <h3 className="text-sm font-semibold text-blue-700 hover:underline cursor-pointer">
            {currentHeadlines.slice(0, 2).join(" | ")}
          </h3>
        ) : (
          <h3 className="text-sm font-semibold text-gray-400">
            [No headlines added]
          </h3>
        )}

        <div className="text-xs text-gray-600">
          {currentDescription ? (
            <p className="line-clamp-2">{currentDescription}</p>
          ) : (
            <p className="text-gray-400">[No description added]</p>
          )}
        </div>
      </div>

      {validSitelinks.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {validSitelinks.map((sitelink) => (
              <div key={sitelink.id} className="text-xs">
                <a
                  href="#"
                  className="text-blue-700 hover:underline flex items-center"
                >
                  {sitelink.title}
                  <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdThumbnail({ ad }: { ad: Ad }) {
  // Get first valid headline and description
  const headline = ad.headlines.find((h) => h.trim()) || "[No headline]";
  const description =
    ad.descriptions.find((d) => d.trim()) || "[No description]";
  const displayUrl =
    ad.displayPath || ad.finalUrl.replace(/^https?:\/\//, "") || "example.com";

  return (
    <div className="border rounded-md p-3 h-full bg-white hover:shadow-md transition-shadow">
      <div className="flex items-center text-xs text-green-700 mb-1">
        <span className="bg-green-100 text-green-800 text-xs font-medium px-1.5 py-0.5 rounded mr-1">
          Ad
        </span>
        <span className="text-xs truncate">{displayUrl}</span>
      </div>

      <h3 className="text-sm font-semibold text-blue-700 truncate">
        {headline}
      </h3>

      <p className="text-xs text-gray-600 line-clamp-2 mt-1">{description}</p>

      {ad.type === "search" && ad.sitelinks && ad.sitelinks.length > 0 && (
        <div className="mt-2 pt-1 border-t border-gray-100">
          <div className="flex gap-2 flex-wrap">
            {ad.sitelinks.slice(0, 2).map(
              (sitelink) =>
                sitelink.title && (
                  <span
                    key={sitelink.id}
                    className="text-xs text-blue-700 truncate"
                  >
                    {sitelink.title}
                  </span>
                ),
            )}
          </div>
        </div>
      )}

      <div className="mt-2 flex justify-between items-center">
        <span className="text-xs text-gray-500 capitalize">{ad.type}</span>
        <span className="text-xs text-gray-500">
          {ad.headlines.length} headlines
        </span>
      </div>
    </div>
  );
}
