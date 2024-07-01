import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import React from "react";

export const OpenGraphCard = ({
  openGraphDetails,
}: {
  openGraphDetails: any;
}) => {
  return (
    <div>
      <div
        className="cursor-pointer"
        onClick={() => openBrowserWindow(openGraphDetails.url)}
      >
        <img
          src={openGraphDetails?.image}
          alt="OpenGraph Image"
          className="rounded-md"
        />
      </div>
      <div className="flex flex-col flex-wrap">
        <span className="font-bold">{openGraphDetails.title}</span>
        <span>{openGraphDetails.description}</span>
        <span>{openGraphDetails[2]}</span>
      </div>
    </div>
  );
};

export default OpenGraphCard;
