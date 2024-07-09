"use client";
import React from "react";

const GooglePreview = ({
  openGraphDetails,
  favicon_url,
  url,
}: {
  favicon_url: string[];
  openGraphDetails: any;
  url: string;
}) => {
  console.log(openGraphDetails);
  console.log(favicon_url);

  return (
    <div
      className={`shadow overflow-hidden rounded-md ${openGraphDetails.length === 0 ? "bg-white/40" : "bg-white"}`}
    >
      <h2 className=" bg-apple-spaceGray font-semibold text-white p-1 px-2 rounded-t-md w-full pt-2  text-center ">
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
            {openGraphDetails.title}
          </a>
          <div style={{ color: "green", fontSize: "14px" }}>
            {openGraphDetails.url}
          </div>
          <div style={{ color: "#4d5156", fontSize: "14px" }}>
            {openGraphDetails.description}
          </div>
        </div>{" "}
      </section>
    </div>
  );
};

export default GooglePreview;
