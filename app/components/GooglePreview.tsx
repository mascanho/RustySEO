"use client";
import React from "react";

const GooglePreview = ({
  pageTitle,
  pageDescription,
  url,
  favicon_url,
}: {
  favicon_url: string[];
  pageTitle: any;
  url: string;
  pageDescription: any;
}) => {
  return (
    <div
      className={`shadow overflow-hidden rounded-md ${pageTitle.length === 0 ? "bg-white/40" : "bg-white"}`}
    >
      <h2 className=" bg-apple-spaceGray font-semibold text-white   rounded-t-md w-full pt-1  text-center ">
        SERP Preview
      </h2>

      <section
        className={`px-8 h-full  pb-10 min-h-28 flex items-center  w-full rounded-md overflow-auto`}
      >
        <div>
          <a
            style={{
              textDecoration: "none",
              color: "#1a0dab",
              fontSize: "18px",
            }}
          >
            {pageTitle}
          </a>
          <div style={{ color: "green", fontSize: "14px" }}>{url}</div>
          <div style={{ color: "#4d5156", fontSize: "14px" }}>
            {pageDescription}
          </div>
        </div>{" "}
      </section>
    </div>
  );
};

export default GooglePreview;
