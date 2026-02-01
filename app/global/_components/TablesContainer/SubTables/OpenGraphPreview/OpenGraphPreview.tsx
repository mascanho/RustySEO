// @ts-nocheck
import React from "react";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";

interface OpenGraphPreviewProps {
    height: number;
}

const OpenGraphPreview: React.FC<OpenGraphPreviewProps> = ({ height }) => {
    const { selectedTableURL } = useGlobalCrawlStore();

    if (!selectedTableURL?.[0]) {
        return (
            <div
                className="text-base text-black/50 dark:text-white/50 flex justify-center items-center m-auto w-full h-full"
            >
                <span className="text-xs">Select a URL from the HTML table to view OpenGraph preview</span>
            </div>
        );
    }

    const ogData = selectedTableURL[0]?.opengraph || {};
    const url = selectedTableURL[0]?.url || "";

    // Extract OpenGraph data with fallbacks
    const ogTitle = ogData["og:title"] || selectedTableURL[0]?.title?.[0]?.title || "No title";
    const ogDescription = ogData["og:description"] || selectedTableURL[0]?.description || "No description available";
    const ogImage = ogData["og:image"] || "";
    const ogUrl = ogData["og:url"] || url;
    const ogSiteName = ogData["og:site_name"] || new URL(url).hostname;
    const ogType = ogData["og:type"] || "website";

    // Twitter card data
    const twitterCard = ogData["twitter:card"] || "summary_large_image";
    const twitterTitle = ogData["twitter:title"] || ogTitle;
    const twitterDescription = ogData["twitter:description"] || ogDescription;
    const twitterImage = ogData["twitter:image"] || ogImage;

    return (
        <div className="h-full w-full overflow-auto p-6 bg-gray-50 dark:bg-brand-darker">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* OpenGraph Preview */}
                <div>
                    <h2 className="text-lg font-semibold mb-4 dark:text-white">Facebook / OpenGraph Preview</h2>
                    <div className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        {ogImage && (
                            <div className="w-full aspect-[1.91/1] bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                                <img
                                    src={ogImage}
                                    alt={ogTitle}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 dark:text-gray-600 text-sm">Image not available</div>';
                                    }}
                                />
                            </div>
                        )}
                        <div className="p-3 bg-gray-50 dark:bg-brand-dark/50 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1 truncate">
                                {ogSiteName}
                            </div>
                            <div className="text-base font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                                {ogTitle}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                {ogDescription}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Twitter Card Preview */}
                <div>
                    <h2 className="text-lg font-semibold mb-4 dark:text-white">Twitter Card Preview</h2>
                    <div className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        {twitterImage && (
                            <div className="w-full aspect-[2/1] bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                                <img
                                    src={twitterImage}
                                    alt={twitterTitle}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 dark:text-gray-600 text-sm">Image not available</div>';
                                    }}
                                />
                            </div>
                        )}
                        <div className="p-3">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 truncate">
                                {new URL(ogUrl).hostname}
                            </div>
                            <div className="text-base font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                                {twitterTitle}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                {twitterDescription}
                            </div>
                        </div>
                    </div>
                </div>

                {/* LinkedIn Preview */}
                <div>
                    <h2 className="text-lg font-semibold mb-4 dark:text-white">LinkedIn Preview</h2>
                    <div className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-700 rounded overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        {ogImage && (
                            <div className="w-full aspect-[1.91/1] bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                                <img
                                    src={ogImage}
                                    alt={ogTitle}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 dark:text-gray-600 text-sm">Image not available</div>';
                                    }}
                                />
                            </div>
                        )}
                        <div className="p-3 bg-white dark:bg-brand-dark">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                                {ogTitle}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {new URL(ogUrl).hostname}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Raw OpenGraph Data */}
                <div>
                    <h2 className="text-lg font-semibold mb-4 dark:text-white">OpenGraph Data</h2>
                    <div className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        {Object.keys(ogData).length > 0 ? (
                            <div className="space-y-2">
                                {Object.entries(ogData).map(([key, value]) => (
                                    <div key={key} className="flex flex-col sm:flex-row text-xs">
                                        <span className="font-mono font-semibold text-brand-bright min-w-[200px]">
                                            {key}:
                                        </span>
                                        <span className="text-gray-700 dark:text-gray-300 break-all">
                                            {String(value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                No OpenGraph data found for this URL
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OpenGraphPreview;
