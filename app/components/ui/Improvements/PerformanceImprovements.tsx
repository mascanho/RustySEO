import React, { useEffect } from "react";
import {
  FaCheckCircle,
  FaChevronCircleDown,
  FaChevronDown,
  FaExclamationCircle,
} from "react-icons/fa";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FiClipboard } from "react-icons/fi";
import { Switch } from "@/components/ui/switch";
import { invoke } from "@tauri-apps/api/tauri";

const PerformanceImprovements = ({ pageSpeed }: any) => {
  // ------------- HELPERS -------------
  const performance =
    pageSpeed?.lighthouseResult?.categories?.performance?.score;

  const fcp =
    pageSpeed?.lighthouseResult?.audits?.["first-contentful-paint"]?.score;

  const lcp =
    pageSpeed?.lighthouseResult?.audits?.["largest-contentful-paint"]?.score;

  const tti = pageSpeed?.lighthouseResult?.audits?.["interactive"]?.score;

  const cls =
    pageSpeed?.lighthouseResult?.audits?.["cumulative-layout-shift"]?.score;

  const speedIndex =
    pageSpeed?.lighthouseResult?.audits?.["speed-index"]?.score;

  const serverResponse =
    pageSpeed?.lighthouseResult?.audits?.["server-response-time"]?.score;

  const largePayloads =
    pageSpeed?.lighthouseResult?.audits?.["total-byte-weight"]?.score;

  const domSize =
    pageSpeed?.lighthouseResult?.audits?.["dom-size"]?.numericValue;

  const urlRedirects =
    pageSpeed?.lighthouseResult?.audits?.redirects?.details?.items.length;

  const longTasks = pageSpeed?.lighthouseResult?.audits?.["long-tasks"]?.score;

  const renderBlocking =
    pageSpeed?.lighthouseResult?.audits?.["render-blocking-resources"]
      ?.numericValue;

  console.log(longTasks, "DOM SIZE");

  const AIfeedback = false;

  const dummyImprovements = [
    {
      id: 1,
      title: "Performance ",
      improved: performance > 0.5 ? true : false,
      passAdvice: "Your performance score is good.",
      failsAdvice: "Your performance score is too low.",
      aiImprovement: AIfeedback
        ? "Function call"
        : "To improve your website's performance score, optimize images by compressing and using responsive formats, minimize and bundle CSS and JavaScript, and leverage server-side caching and a CDN. Reduce render-blocking resources, defer non-essential scripts, and use efficient web fonts. Enhance mobile performance with responsive design and touch-friendly interactions. Regularly monitor performance with tools like Google Lighthouse and WebPageTest, and ensure backend efficiency through database optimization and efficient algorithms.",
    },
    {
      id: 2,
      title: "FCP (First Contentful Paint)",
      passAdvice: "Your First Contentful Paint score is good.",
      failsAdvice: "Your FCP value is too low.",
      improved: fcp > 0.5 ? true : false,
      aiImprovement: AIfeedback
        ? "Function call"
        : "To improve your First Contentful Paint (FCP), optimize critical rendering by inlining essential CSS, deferring non-critical CSS and JavaScript, using `font-display: swap`, preloading fonts, reducing server response time with caching and CDNs, minimizing and compressing resources, serving optimized images, asynchronously loading third-party scripts, considering server-side or static site rendering, and applying effective caching headers.",
    },
    {
      id: 3,
      title: "LCP (Last Contentful Paint)",
      passAdvice: "Your Last Contentful Paint score is good.",
      failsAdvice: "Your LCP value is too low.",
      improved: lcp > 0.5 ? true : false,
      aiImprovement: AIfeedback
        ? "Function call"
        : "To enhance LCP, first reduce server response times and utilize a Content Delivery Network (CDN) to expedite content delivery. Compress and serve images in modern formats, and implement lazy loading for images and videos below the fold. Optimize resource loading by deferring non-essential JavaScript and inlining critical CSS. Preload key resources needed for the initial render to ensure they are available quickly. Regularly monitor and test performance to identify and address potential bottlenecks.",
    },
    {
      id: 4,
      title: "TTI (Time to Interactive)",
      passAdvice: "Your Time to Interactive score is good.",
      failsAdvice: "Your TTI value is too low.",
      improved: tti > 0.5 ? true : false,
      aiImprovement: AIfeedback
        ? "Function call"
        : "To improve Time to Interactive (TTI), begin by reducing server response times and utilizing a Content Delivery Network (CDN) to speed up resource delivery. Optimize JavaScript execution by splitting large scripts, deferring non-essential code, and using async or defer attributes. Minimize render-blocking CSS and inline critical styles to ensure quick rendering. Implement lazy loading for non-essential resources and reduce third-party scripts. Regularly test performance to identify and fix issues affecting interactivity.",
    },
    {
      id: 5,
      title: "CLS (Cumulative Layout Shift)",
      passAdvice: "Your Cumulative Layout Shift score is good.",
      failsAdvice: "Your CLS value is too low.",
      improved: cls > 0.5 ? true : false,
      aiImprovement: AIfeedback
        ? "Function call"
        : "To improve Cumulative Layout Shift (CLS), start by reserving space for images and other media with explicit width and height attributes to prevent layout shifts. Ensure fonts are loaded with a font-display strategy to avoid text shifting during loading. Use CSS animations and transitions carefully to avoid unexpected layout changes. Implement lazy loading for offscreen content while maintaining layout stability. Regularly test and audit your site for layout shifts to identify and address issues promptly.",
    },
    {
      id: 6,
      title: "Speed Index",
      passAdvice: "Your Speed Index score is good.",
      failsAdvice: "Your Speed Index value is too low.",
      improved: speedIndex > 0.5 ? true : false,
      aiImprovement: AIfeedback
        ? "Function call"
        : "To improve Speed Index, start by optimizing server response times and using a Content Delivery Network (CDN) to accelerate resource delivery. Minimize render-blocking resources by deferring non-critical JavaScript and inlining critical CSS. Optimize the loading of above-the-fold content to ensure it displays quickly and use efficient image formats with lazy loading for below-the-fold images. Reduce the complexity of your layout and avoid excessive reflows and repaints. Regularly monitor performance to identify and address any bottlenecks.",
    },
    {
      id: 7,
      title: "Server Response",
      passAdvice: "Your Server Response score is good.",
      failsAdvice: "Your Server Response value is too low.",
      improved: serverResponse > 0.5 ? true : false,
      aiImprovement: AIfeedback
        ? "Function call"
        : "To improve server response time, optimize your server configuration and use a Content Delivery Network (CDN) to reduce latency. Implement server-side caching to speed up data retrieval and minimize processing times. Optimize your database queries and ensure efficient code execution on the backend. Monitor server performance and scale resources appropriately to handle traffic spikes. Regularly review and update your server infrastructure to keep up with performance improvements.",
    },
    {
      id: 8,
      title: "Large Payloads",
      passAdvice: "Your Large Payloads score is good.",
      failsAdvice: "Your Large Payloads value is too low.",
      improved: largePayloads > 0.5 ? true : false,
      aiImprovement: AIfeedback
        ? "Function call"
        : "To improve performance with large payloads, compress data using gzip or Brotli to reduce size during transmission. Implement lazy loading for non-essential content to defer loading until needed. Optimize and minify JavaScript and CSS files to reduce their size. Use efficient data formats such as JSON over XML, and paginate or split large datasets into smaller, more manageable chunks. Regularly review and refine payloads to ensure only necessary data is transmitted.",
    },
    {
      id: 9,
      title: "Dom Size",
      passAdvice: "You have a good dom size, below 1500 nodes.",
      failsAdvice: "You have too many nodes in your dom.",
      improved: domSize < 1500 ? true : false,
      aiImprovement: AIfeedback
        ? "Function call"
        : " Minimize unnecessary elements and nesting, use semantic HTML for cleaner structure, consolidate CSS to reduce complexity, eliminate redundant or duplicate scripts, and employ lazy loading for deferred content to effectively manage and reduce DOM size.",
    },
    {
      id: 10,
      title: "Redirects",
      passAdvice: "This page does not have too many redirects on its URL.",
      failsAdvice: "You have too many redirects in the URL.",
      improved: urlRedirects <= 2 ? true : false,
      aiImprovement: AIfeedback
        ? "Function call"
        : "This page has too many redirects on its URL, causing a redirect chain loop that could potentially slow down your application.",
    },
    {
      id: 11,
      title: "Long Tasks",
      passAdvice: "Thre are no long tasks slowing down your application",
      failsAdvice:
        "There are too many long tasks slowing down your application.",
      improved: longTasks < 0.5 ? true : false,
      aiImprovement: AIfeedback
        ? "Function call"
        : "To manage long tasks, break them into smaller, manageable chunks using `setTimeout` or `requestIdleCallback`. Prioritize and schedule critical tasks to ensure they run first. Monitor performance using tools like the Performance tab in Chrome DevTools to identify and optimize long tasks.",
    },
    {
      id: 12,
      title: "Render Blocking",
      passAdvice:
        "There are no render-blocking resources slowing down your application",
      failsAdvice:
        "There are too many render-blocking resources slowing down your application.",
      improved: renderBlocking === 0 ? true : false,
      aiImprovement: AIfeedback
        ? "Function call"
        : "To improve render-blocking resources, first, move critical CSS inline to the HTML to prioritize it. Next, defer non-essential JavaScript by using the `defer` or `async` attributes. Finally, ensure that non-critical CSS is loaded asynchronously or via media queries to avoid blocking the initial render.",
    },
  ];

  const handleCopy = (text: any) => {
    navigator.clipboard.writeText(text);
  };

  if (!pageSpeed) {
    return null;
  }

  return (
    <div className="bg-gray-300 w-full dark:bg-brand-darker py-6 px-1 pl-6 rounded-lg shadow max-w-7xl mx-auto mt-10 text-xs">
      <div className="flex items-center justify-between pr-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
          Technical Improvements
        </h2>
        <div className="flex items-center -mt-4 space-x-2">
          <span className="text-sm text-black/50 dark:text-white/50">
            {" "}
            A.I Feedback
          </span>
          <Switch className="" />
        </div>
      </div>
      <div className="space-y-3 overflow-auto max-h-[40rem] pr-4">
        {dummyImprovements.map((item) => (
          <div
            key={item.id}
            className={`p-2 px-3 rounded-lg border ${item.improved ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"}`}
          >
            <div className="flex items-center space-x-2 mb-1">
              {item.improved ? (
                <FaCheckCircle className="text-green-500 mb-0.5" />
              ) : (
                <FaExclamationCircle className="text-red-500 mb-0.5" />
              )}
              <h3
                className={`text-lg font-semibold ${item.improved ? "text-green-800" : "text-red-800"}`}
              >
                {item.title}
              </h3>
            </div>
            <p className="text-gray-700 -mt-1 relative">
              {item.improved ? item.passAdvice : `${item.failsAdvice}`}
            </p>
            <section className="mt-0.5 ">
              {!item.improved && (
                <Collapsible>
                  <CollapsibleTrigger className="text-xs flex">
                    <span className="flex items-center text-gray-600 text-[9px]">
                      Fix
                      <FaChevronDown className="ml-1" />
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="bg-blue-200 rounded-md p-2 mt-2 relative min-h-8">
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
