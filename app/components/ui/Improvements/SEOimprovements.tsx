"use client";
import React from "react";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

const improvements = [
  {
    id: 1,
    title: "Title Tag Optimization",
    description:
      "Ensure the title tag is unique and includes primary keywords.",
    improved: true,
  },
  {
    id: 2,
    title: "Meta Description",
    description:
      "Add a compelling meta description that includes relevant keywords.",
    improved: false,
  },
  {
    id: 3,
    title: "Alt Text for Images",
    description: "Use descriptive alt text for all images on the page.",
    improved: true,
  },
  {
    id: 4,
    title: "Mobile-Friendly Design",
    description:
      "Ensure your website is responsive and performs well on mobile devices.",
    improved: false,
  },
  {
    id: 5,
    title: "Page Load Speed",
    description:
      "Optimize the page load speed by compressing images and using efficient code.",
    improved: true,
  },
];

const SEOImprovements = () => {
  return (
    <div className="bg-gray-100 p-6 rounded-lg shadow-lg max-w-3xl mx-auto mt-40">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        SEO Improvements
      </h2>
      <div className="space-y-4">
        {improvements.map((item) => (
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
            <p className="text-gray-700">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SEOImprovements;
