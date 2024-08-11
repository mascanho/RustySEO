// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Bot } from "lucide-react";

const AIFeedbackTab = () => {
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulating API call to get AI feedback
    const fetchFeedback = async () => {
      setLoading(true);
      // In a real scenario, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const aiFeedback = {
        overallScore: 99,
        summary:
          "The page shows promise but has room for improvement in key areas.",
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
    };

    fetchFeedback();
  }, []);

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
      <div className="flex items-center mb-4">
        <Bot className="w-6 h-6 mr-2 text-blue-400" />
        <h2 className="text-lg font-semibold">AI Feedback</h2>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span>Overall Score</span>
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

      <p className="text-sm mb-4">{feedback.summary}</p>

      <div className="space-y-3 mb-4">
        {feedback.insights.map((insight, index) => (
          <div
            key={index}
            className="border-b border-b-gray-300 dark:border-brand-dark border-gray-700 pb-2"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{insight.aspect}</span>
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
        <span className="font-medium">Top Recommendation:</span>
        <p className="mt-1 text-blue-300">{feedback.topRecommendation}</p>
      </div>
    </div>
  );
};

export default AIFeedbackTab;
