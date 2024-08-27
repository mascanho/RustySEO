// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import { Bot } from "lucide-react";
import useOnPageSeo from "@/store/storeOnPageSeo";

const AIFeedbackTab = ({ pageSpeed, loading }) => {
  const [feedback, setFeedback] = useState(null);
  const [sessionScore, setSessionScore] = useState(null);
  const { seoContentQuality } = useOnPageSeo();

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

    const contentQuality = getContentQuality(pageScoring?.readingLevel);

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
          status: "Needs Improvement",
          description:
            "Page load time is slightly higher than recommended, affecting UX.",
        },
        {
          aspect: "SEO",
          status: "Excellent",
          description: "The page is well-optimized for mobile devices.",
        },
      ],
      topRecommendation:
        "Focus on improving page load speed and expanding content depth.",
    };

    setFeedback(aiFeedback);
  }, [pageSpeed, overallScore, pageScoring.readingLevel]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[20rem] text-gray-400">
        <Bot className="w-6 h-6 mr-2" />
        <span>Analyzing...</span>
        <div className="animate-spin ml-2 rounded-full h-5 w-5 border-t-2 border-b-2 border-brand-bright mr-3" />
      </div>
    );
  }

  if (!pageSpeed && !loading) {
    return (
      <div className="flex items-center justify-center h-[20rem] text-gray-400">
        <Bot className="w-6 h-6 mr-2 animate-pulse" />
        <span>Crawl a page to get data</span>
      </div>
    );
  }

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
            {pageSpeed && `${feedback.overallScore}%`}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          {pageSpeed && (
            <div
              className="bg-blue-400 h-2.5 rounded-full"
              style={{ width: `${feedback.overallScore}%` }}
            />
          )}
        </div>
      </div>

      <p className="text-xs mb-4">{feedback.summary}</p>

      <div className="space-y-3 mb-4">
        {feedback.insights.map((insight, index) => (
          <div
            key={index}
            className="border-b border-b-gray-300 dark:border-brand-dark border-gray-700 pb-2"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-xs">{insight.aspect}</span>
              <span
                className={`text-xs px-2 py-[2px] rounded ${
                  insight.status === "Excellent"
                    ? "bg-green-900 text-green-300"
                    : insight.status === "Good"
                      ? "bg-blue-900 text-blue-300"
                      : insight.status === "Needs Improvement"
                        ? "bg-yellow-900 text-yellow-300"
                        : "bg-red-900 text-red-300"
                }`}
              >
                {insight.status}
              </span>
            </div>
            <p className="text-xs mt-2 text-gray-400">{insight.description}</p>
          </div>
        ))}
      </div>

      <div className="text-sm">
        <span className="font-medium text-xs">Top Recommendation:</span>
        <p className="mt-1 text-blue-300 text-xs">
          {feedback.topRecommendation}
        </p>
      </div>
    </div>
  );
};

export default AIFeedbackTab;
