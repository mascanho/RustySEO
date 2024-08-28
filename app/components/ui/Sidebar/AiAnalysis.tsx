// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import { Bot } from "lucide-react";
import useOnPageSeo from "@/store/storeOnPageSeo";
import usePageSpeedStore from "@/store/StorePerformance";

const AIFeedbackTab = ({ pageSpeed, loading, seo }) => {
  const [feedback, setFeedback] = useState(null);
  const [sessionScore, setSessionScore] = useState(null);
  const { seoContentQuality } = useOnPageSeo();
  const globalPerformanceScore = usePageSpeedStore(
    (state) => state.GlobalPerformanceScore,
  );
  const seoScore = seo?.lighthouseResult?.categories?.seo?.score ?? 0;

  console.log(seoScore, "SEO SCORE FROM SCORE");

  const metrics = {
    performance: globalPerformanceScore?.performance || 0,
    fcp: globalPerformanceScore?.fcp || 0,
    lcp: globalPerformanceScore?.lcp || 0,
    tti: globalPerformanceScore?.tti || 0,
    tbt: globalPerformanceScore?.tbt || 0,
    cls: globalPerformanceScore?.cls || 0,
    speedIndex: globalPerformanceScore?.speedIndex || 0,
    serverResponse: globalPerformanceScore?.serverResponse || 0,
    largePayloads: globalPerformanceScore?.largePayloads || 0,
    domSize: globalPerformanceScore?.domSize || 0,
    longTasks: globalPerformanceScore?.longTasks || 0,
    networkRequests: globalPerformanceScore?.networkRequests || null,
    renderBlocking: globalPerformanceScore?.renderBlocking || 0,
    urlRedirects: globalPerformanceScore?.urlRedirects || null,
  };

  const weights = {
    performance: 0.24,
    fcp: 0.15,
    lcp: 0.15,
    tti: 0.14,
    tbt: 0.05,
    cls: 0.05,
    speedIndex: 0.05,
    serverResponse: 0.05,
    largePayloads: 0.05,
    domSize: 0.01,
    urlRedirects: 0.01,
    longTasks: 0.01,
    renderBlocking: 0.03,
    networkRequests: 0.01,
  };

  function calculateGlobalScore(metrics, weights) {
    let totalWeight = 0;
    let weightedSum = 0;

    Object.keys(metrics).forEach((key) => {
      const value = metrics[key];
      const weight = weights[key];

      if (value !== null && weight !== undefined) {
        const normalizedValue =
          key === "domSize"
            ? Math.min(1, value / 3000)
            : key === "renderBlocking"
              ? Math.min(1, value / 1000)
              : value;

        weightedSum += normalizedValue * weight;
        totalWeight += weight;
      }
    });

    const globalScore = weightedSum / totalWeight;
    return globalScore;
  }

  const globalPercentageScore = calculateGlobalScore(metrics, weights);

  const pageScoring = useMemo(
    () => ({
      readingLevel:
        seoContentQuality?.readingLevelResults?.[0]?.[1] || "Unknown",
    }),
    [seoContentQuality],
  );

  useEffect(() => {
    const scoring = sessionStorage.getItem("score");
    if (scoring) {
      setSessionScore(JSON.parse(scoring));
    }
  }, [pageSpeed]);

  const overallScore = useMemo(
    () =>
      (sessionScore &&
        (sessionScore[0]?.passed / sessionScore[0]?.total) * 100) ||
      0,
    [sessionScore],
  );

  useEffect(() => {
    const getSummaryText = (score) => {
      if (score >= 85)
        return "The page is performing excellently, with just a few minor areas for improvement.";
      if (score >= 60)
        return "The page shows promise but has room for improvement in key areas.";
      return "The page needs significant improvement in several key areas to enhance performance.";
    };

    const getContentQuality = (level) => {
      switch (level) {
        case "Very Easy":
        case "Easy":
          return {
            status: "Excellent",
            description:
              "Content is very easy to read and understand, suitable for a wide audience.",
          };
        case "Fairly Easy":
        case "Standard":
          return {
            status: "Good",
            description:
              "Content is fairly easy to read, appropriate for most readers.",
          };
        case "Fairly Difficult":
          return {
            status: "Needs Improvement",
            description:
              "Content may be challenging for some readers. Consider simplifying.",
          };
        case "Difficult":
        case "Very Confusing":
          return {
            status: "Poor",
            description:
              "Content is difficult to read. Significant simplification is recommended.",
          };
        default:
          return {
            status: "Unknown",
            description:
              "Unable to determine content readability. Please review manually.",
          };
      }
    };

    const getPerformanceRating = (score) => {
      if (score < 25) {
        return {
          status: "Unacceptable",
          description:
            "Webpage performance is critical, causing significant user experience issues. Immediate action is required.",
        };
      } else if (score < 70) {
        return {
          status: "Needs Improvement",
          description:
            "Webpage performance is below average, with noticeable delays. Optimization is recommended.",
        };
      } else if (score < 85) {
        return {
          status: "Acceptable",
          description:
            "Webpage performance is adequate, but there may be room for improvement in load times or responsiveness.",
        };
      } else {
        return {
          status: "Optimal",
          description:
            "Webpage performance is excellent, ensuring fast load times and a smooth user experience.",
        };
      }
    };

    const getSeoRating = (score) => {
      if (score < 0.25) {
        return {
          status: "Unacceptable",
          description:
            "SEO performance is critically low, potentially harming search rankings and visibility. Urgent optimization of key SEO elements is necessary.",
        };
      } else if (score < 0.5) {
        return {
          status: "Needs Improvement",
          description:
            "SEO performance is suboptimal, likely affecting search engine rankings. Focus on enhancing meta tags, content quality, and site structure.",
        };
      } else if (score < 0.75) {
        return {
          status: "Acceptable",
          description:
            "SEO performance is moderate, but there's room for improvement. Consider refining keyword strategies and improving content relevance.",
        };
      } else {
        return {
          status: "Optimal",
          description:
            "SEO performance is excellent, supporting strong search engine visibility. Continue monitoring and adjusting strategies to maintain high rankings.",
        };
      }
    };

    const performanceRating = getPerformanceRating(overallScore);
    const contentQuality = getContentQuality(pageScoring?.readingLevel);
    const seoRating = getSeoRating(seoScore);

    const aiFeedback = {
      overallScore: overallScore.toFixed(2),
      summary: getSummaryText(overallScore),
      insights: [
        {
          aspect: "Content Quality",
          status: contentQuality.status,
          description: contentQuality.description,
        },
        {
          aspect: "Page Performance",
          status: performanceRating.status,
          description: performanceRating.description,
        },
        {
          aspect: "SEO",
          status: seoRating.status,
          description: seoRating.description,
        },
      ],
      topRecommendation:
        "Focus on improving page load speed and expanding content depth.",
    };

    setFeedback(aiFeedback);
  }, [pageSpeed, overallScore, pageScoring.readingLevel]);

  return (
    <div className="p-4 dark:text-gray-300 dark:bg-gray-900 h-screen bg-white">
      <div className="flex items-center mb-2">
        <Bot className="w-6 h-6 mr-2 text-blue-400" />
        <h2 className="text-sm font-semibold">Rusty Feedback</h2>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium">Overall Score</span>

          <span className="text-sm font-bold text-blue-400">
            {loading ? (
              <div className="animate-spin ml-2 h-5 w-5 border-t-2 border-b-2 border-brand-bright rounded-full mr-3" />
            ) : pageSpeed ? (
              `${feedback?.overallScore}%`
            ) : (
              "n/a"
            )}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          {pageSpeed && (
            <div
              className="bg-blue-400 h-2.5 rounded-full"
              style={{ width: `${feedback?.overallScore}%` }}
            />
          )}
        </div>
      </div>

      <p className="text-xs mb-4">{feedback?.summary}</p>

      <div className="space-y-3 mb-4">
        {feedback?.insights.map((insight, index) => (
          <div
            key={index}
            className="border-b border-b-gray-300 last-of-type:border-b-0 last:pb-0 dark:border-brand-dark border-gray-700 pb-2"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-xs">{insight?.aspect}</span>
              <span
                className={`text-xs px-2 py-[2px] rounded ${
                  insight.status === "Excellent" || insight.status === "Optimal"
                    ? "bg-green-900 text-green-300"
                    : insight.status === "Good" ||
                        insight.status === "Acceptable"
                      ? "bg-blue-900 text-blue-300"
                      : insight.status === "Needs Improvement"
                        ? "bg-yellow-900 text-yellow-300"
                        : "bg-red-900 text-red-300"
                }`}
              >
                {(pageSpeed && insight.status) || "n/a"}
              </span>
            </div>
            <p className="text-xs mt-2 text-gray-400">
              {(pageSpeed && insight.description) || "n/a"}
            </p>
          </div>
        ))}
      </div>

      {/* <div className="text-sm"> */}
      {/*   <span className="font-medium text-xs">Top Recommendation:</span> */}
      {/*   <p className="mt-1 text-blue-300 text-xs"> */}
      {/*     {feedback?.topRecommendation} */}
      {/*   </p> */}
      {/* </div> */}
    </div>
  );
};

export default AIFeedbackTab;
