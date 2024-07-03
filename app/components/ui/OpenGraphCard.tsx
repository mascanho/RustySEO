import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import React from "react";

export const OpenGraphCard = ({
  openGraphDetails,
  linkedInInspect,
}: {
  openGraphDetails: any;
  linkedInInspect: string | undefined;
}) => {
  return (
    <div
      className={`border p-4  flex flex-col rounded-md items-center justify-center ${openGraphDetails.length === 0 ? "bg-white/40 h-full" : "bg-white h-full"}`}
    >
      <span
        className="absolute right-3 px-3 hover:border-black transition-all duration-300 active:border-2 hover:bg-apple-spaceGray py-1 text-xs w-fit flex flex-nowrap bg-apple-silver rounded-md text-right cursor-pointer"
        onClick={() => openBrowserWindow(linkedInInspect)}
      >
        Inspect
      </span>
      <div>
        <img
          src={openGraphDetails?.image}
          alt="OpenGraph Image"
          className="rounded-md w-2/4 h-auto ml-0"
        />
      </div>
      <div
        onClick={() => openBrowserWindow(openGraphDetails.url)}
        className="flex flex-col flex-wrap cursor-pointer py-2"
      >
        <span className="font-bold">{openGraphDetails.title}</span>
        <span>{openGraphDetails.description}</span>
        <span className="text-sm mt-1 text-apple-spaceGray/70">
          {openGraphDetails.url}
        </span>
      </div>
    </div>
  );
};

export default OpenGraphCard;
