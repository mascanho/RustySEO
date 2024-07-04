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
    <div className="shadow overflow-hidden rounded-md">
      <h2 className=" bg-apple-spaceGray font-semibold text-white p-1 relative px-2 rounded-t-md w-full  text-center pt-2">
        Social Media Preview
      </h2>
      <section className="mx-auto h-96 w-full rounded-md overflow-auto relative bg-white/40">
        <div
          className={`border p-4  flex flex-col rounded-md items-center justify-center ${openGraphDetails.length === 0 ? "bg-white/40 h-96" : "bg-white h-96"}`}
        >
          <span
            className="absolute right-4 px-3 hover:border-black transition-all duration-300 active:border-2 hover:bg-apple-spaceGray py-1 text-xs w-fit flex flex-nowrap bg-apple-silver rounded-md text-right cursor-pointer top-4"
            onClick={() => openBrowserWindow(linkedInInspect)}
          >
            Inspect
          </span>
          {openGraphDetails.length !== 0 && (
            <div>
              <img
                src={openGraphDetails?.image}
                alt="OpenGraph Image"
                className="rounded-md w-2/4 h-auto ml-0"
              />
            </div>
          )}
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
      </section>
    </div>
  );
};

export default OpenGraphCard;
