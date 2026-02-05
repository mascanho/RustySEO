import React from "react";
import { useFixesStore } from "@/store/FixesStore";
import { FixesData } from "./FixesData";
import {
  IconBulb,
  IconInfoCircle,
  IconExternalLink,
  IconCircleCheck,
} from "@tabler/icons-react";

const FixesContainer = () => {
  const { fix } = useFixesStore();

  // Find the matching fix object
  const fixDetail = FixesData.find((item) => item.title === fix);

  if (!fix) {
    return (
      <div className="h-64 flex flex-col justify-center items-center w-full text-center px-8">
        <IconBulb size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Select an issue from the list above to see detailed optimization
          recommendations.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh - 200px)] bg-white dark:bg-gray-900 overflow-y-auto custom-scrollbar ">
      {/* Header */}
      <div className="px-4 py-2 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
        <div className="flex items-center gap-2 mb-1">
          <IconCircleCheck size={18} className="text-brand-bright" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate">
            {fix}
          </h2>
        </div>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
          Recommended Fixes
        </p>
      </div>

      <div className="p-4 space-y-6">
        {fixDetail ? (
          <>
            {/* Description Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                <IconInfoCircle size={14} />
                <span className="text-[10px] font-bold uppercase tracking-tight">
                  Understanding the Issue
                </span>
              </div>
              <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20">
                <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">
                  {fixDetail.description}
                </p>
              </div>
            </div>

            {/* How to Fix Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-brand-bright">
                <IconBulb size={14} />
                <span className="text-[10px] font-bold uppercase tracking-tight">
                  How to improve
                </span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20">
                <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300 italic">
                  "{fixDetail.fixes}"
                </p>
              </div>
            </div>

            {/* Resources Section */}
            {fixDetail.links && fixDetail.links.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                  <IconExternalLink size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-tight">
                    Learn More
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 ">
                  {fixDetail.links.map((link, index) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[11px] text-gray-600 dark:text-gray-300 hover:border-brand-bright dark:hover:border-brand-bright hover:text-brand-bright transition-colors duration-200"
                    >
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${new URL(link).hostname}&sz=16`}
                        alt=""
                        className="w-3 h-3 grayscale opacity-70"
                      />
                      Reference {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 text-center">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Technical details for this issue are still being generated. Please
              check back shortly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FixesContainer;
