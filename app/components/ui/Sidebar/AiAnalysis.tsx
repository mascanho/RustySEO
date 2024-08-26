// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Bot } from "lucide-react";

const AIFeedbackTab = ({ pageSpeed }) => {
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionScore, setSessionScore] = useState(null);

  // GET THE SCORE FROM SESSION STORAGE
  useEffect(() => {
    const scoring = sessionStorage.getItem("score");

    if (scoring) {
      setSessionScore(JSON.parse(scoring));
    }
  }, [pageSpeed]);

  console.log(sessionScore, "session score");

  const overallScore =
    (sessionScore &&
      (sessionScore[0]?.passed / sessionScore[0]?.total) * 100) ||
    0;
  console.log(overallScore, "overall score");

  useEffect(() => {
    // Simulating API call to get AI feedback
    setLoading(true);
    // In a real scenario, this would be an API call

    // Determine summary based on overallScore
    let summaryText;
    if (overallScore >= 85) {
      summaryText =
        "The page is performing excellently, with just a few minor areas for improvement.";
    } else if (overallScore >= 60) {
      summaryText =
        "The page shows promise but has room for improvement in key areas.";
    } else {
      summaryText =
        "The page needs significant improvement in several key areas to enhance performance.";
    }

    const aiFeedback = {
      overallScore: overallScore.toFixed(2),
      summary: summaryText,
      insights: [
        {
          aspect: "Content Quality",
          status: "Good",
          description:
            "Content is relevant and engaging, but could be more comprehensive.",
        },
        {
          aspect: "User Experience",
          status: "Needs Improvement",
          description:
            "Page load time is slightly higher than recommended, affecting UX.",
        },
        {
          aspect: "Mobile Optimization",
          status: "Excellent",
          description: "The page is well-optimized for mobile devices.",
        },
      ],
      topRecommendation:
        "Focus on improving page load speed and expanding content depth.",
    };

    setFeedback(aiFeedback);
    setLoading(false);
  }, [pageSpeed, overallScore]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <Bot className="w-6 h-6 mr-2 animate-pulse" />
        <span>Analyzing...</span>
      </div>
    );
  }

  return (
    <div className="p-4 dark:text-gray-300 dark:bg-gray-900 h-screen bg-white">
      <div className="flex items-center mb-2">
        <Bot className="w-6 h-6 mr-2 text-blue-400" />
        <h2 className="text-lg font-semibold">Rusty Feedback</h2>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium">Overall Score</span>
          <span className="text-xl font-bold text-blue-400">
            {feedback.overallScore}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-blue-400 h-2.5 rounded-full"
            style={{ width: `${feedback.overallScore}%` }}
          ></div>
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
