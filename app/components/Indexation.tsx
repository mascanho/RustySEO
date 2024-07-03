"use client";
import React from "react";

const Indexation = ({ index }: { index: string[] }) => {
  return (
    <section className="border p-4 border-apple-spaceGray w-60 rounded-md space-y-2 shadow drop-shadow-md bg-white ">
      <h2 className="font-bold">Indexation</h2>
      <span
        className={`${index[0] === "Indexed" ? "text-green-800" : "text-red-500"}`}
      >
        {index[0] ? index[0] : "-"}
      </span>
      <h2 className="text-xs">This page is indexed on S.E</h2>
    </section>
  );
};

export default Indexation;
