import React from "react";

const PerformanceEl = ({ stat }: { stat: number }) => {
  return (
    <section className="border p-4 border-apple-spaceGray w-60 rounded-md space-y-2">
      <h2 className="font-bold">Performance</h2>
      <span>{stat * 100}%</span>
      <h2 className="text-xs">The performance of the app</h2>
    </section>
  );
};

export default PerformanceEl;
