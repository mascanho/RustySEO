// @ts-nocheck
import React, { useEffect, useRef } from "react";
import WordCloud from "wordcloud";

const words = [
  { text: "Tourism", weight: 100 },
  { text: "Digital Marketing", weight: 9 },
  { text: "Destination", weight: 8 },
  { text: "Innovation", weight: 7 },
  { text: "Transformation", weight: 6 },
  { text: "Strategy", weight: 5 },
  { text: "Experience", weight: 4 },
  { text: "Trends", weight: 3 },
  { text: "Technology", weight: 2 },
];

const WordCloudWidget = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      WordCloud(canvasRef.current, {
        list: words.map((word) => [word.text, word.weight]),
        gridSize: 12,
        weightFactor: 3,
        fontFamily: "Times, serif",
        color: "random-dark",
        backgroundColor: "#f0f0f0",
      });
    }
  }, []);

  return <canvas ref={canvasRef} width="750" height="400" />;
};

export default WordCloudWidget;
