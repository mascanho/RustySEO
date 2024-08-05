import React from "react";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FiClipboard } from "react-icons/fi";
import { Switch } from "@/components/ui/switch";

const PerformanceImprovements = ({ pageSpeed }: any) => {
  // ------------- HELPERS -------------
  const performance =
    pageSpeed?.lighthouseResult?.categories?.performance?.score;

  const fcp =
    pageSpeed?.lighthouseResult?.audits?.["first-contentful-paint"]?.score;

  console.log(fcp, "performance");

  const AIfeedback = false;

  const dummyImprovements = [
    {
      id: 1,
      title: "Performance Score",
      improved: performance > 0.5 ? true : false,
      passAdvice: "Your performance score is good.",
      failsAdvice: "Your performance score is too low.",
      aiImprovement: AIfeedback
        ? "Function call"
        : "To improve your website's performance score, optimize images by compressing and using responsive formats, minimize and bundle CSS and JavaScript, and leverage server-side caching and a CDN. Reduce render-blocking resources, defer non-essential scripts, and use efficient web fonts. Enhance mobile performance with responsive design and touch-friendly interactions. Regularly monitor performance with tools like Google Lighthouse and WebPageTest, and ensure backend efficiency through database optimization and efficient algorithms.",
    },
    {
      id: 2,
      title: "First Contentful Paint",
      passAdvice: "Your First Contentful Paint score is good.",
      failsAdvice: "",
      improved: fcp > 0.5 ? true : false,
      aiImprovement: AIfeedback
        ? "Function call"
        : "To improve your First Contentful Paint (FCP), optimize critical rendering by inlining essential CSS, deferring non-critical CSS and JavaScript, using `font-display: swap`, preloading fonts, reducing server response time with caching and CDNs, minimizing and compressing resources, serving optimized images, asynchronously loading third-party scripts, considering server-side or static site rendering, and applying effective caching headers.",
    },
  ];

  const handleCopy = (text: any) => {
    navigator.clipboard.writeText(text);
  };

  if (!pageSpeed) {
    return null;
  }

  return (
    <div className="bg-gray-100 w-full dark:bg-brand-darker p-6 rounded-lg shadow max-w-7xl mx-auto mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
          Performance Improvements
        </h2>
        <div className="flex items-center -mt-4 space-x-2">
          <span className="text-sm text-black/50 dark:text-white/50">
            {" "}
            A.I Feedback
          </span>
          <Switch className="" />
        </div>
      </div>
      <div className="space-y-4">
        {dummyImprovements.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-lg border ${item.improved ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"}`}
          >
            <div className="flex items-center space-x-2 mb-2">
              {item.improved ? (
                <FaCheckCircle className="text-green-500" />
              ) : (
                <FaExclamationCircle className="text-red-500" />
              )}
              <h3
                className={`text-lg font-semibold ${item.improved ? "text-green-800" : "text-red-800"}`}
              >
                {item.title}
              </h3>
            </div>
            <p className="text-gray-700">
              {item.improved ? item.passAdvice : `${item.failsAdvice}`}
            </p>
            <section>
              {!item.improved && (
                <Collapsible>
                  <CollapsibleTrigger className="text-xs underline">
                    View suggestion
                  </CollapsibleTrigger>
                  <CollapsibleContent className="bg-blue-200 rounded-md p-2 mt-2 relative min-h-8">
                    <FiClipboard
                      onClick={() => handleCopy(item.aiImprovement)}
                      className="absolute active:bg-gray-300 active:scale-95 top-3 cursor-pointer right-3 text-gray-800"
                    />
                    {item.aiImprovement}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </section>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceImprovements;
