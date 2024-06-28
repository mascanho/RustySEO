import React from "react";

const ResponseCodeEl = ({ res }: { res: number | undefined }) => {
  return (
    <section className="border p-4 border-apple-spaceGray w-60 rounded-md space-y-2 shadow drop-shadow-md bg-apple-gold ">
      <h2 className="font-bold">Response Code</h2>
      <span>{res || "N/A"}</span>
      <h2 className="text-xs">The performance of the app</h2>
    </section>
  );
};

export default ResponseCodeEl;
