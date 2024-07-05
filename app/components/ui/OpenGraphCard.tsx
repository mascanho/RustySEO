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
    <div className="shadow overflow-hidden rounded-md h-full">
      <h2 className=" bg-apple-spaceGray font-semibold text-white p-2 relative px-2 rounded-t-md w-full  text-center ">
        Social Media Preview
      </h2>
      <section className="mx-auto h-full w-full rounded-md overflow-auto relative bg-white/40">
        <div
          className={`border p-10  flex flex-col rounded-md items-center justify-center ${openGraphDetails.length === 0 ? "bg-white/40 h-[25em]" : "bg-white h-[25em]"}`}
        >
          <span
            className="absolute right-4 px-3 hover:border-black hover:text-white transition-all duration-300 active:border-2 hover:bg-apple-spaceGray py-1 text-xs w-fit flex flex-nowrap bg-apple-silver rounded-md text-right cursor-pointer top-3"
            onClick={() => openBrowserWindow(linkedInInspect)}
          >
            Inspect
          </span>
          {openGraphDetails.length !== 0 && (
            <div className="flex flex-col flex-wrap justify-start items-start">
              <img
                src={openGraphDetails?.image}
                alt="OpenGraph Image"
                className="rounded-md w-full  max-h-52 object-cover ml-0"
              />
            </div>
          )}
          <div
            onClick={() => openBrowserWindow(openGraphDetails.url)}
            className="flex flex-col flex-wrap cursor-pointer py-2"
          >
            <span className="font-bold">{openGraphDetails.title}</span>
            <span className="w-11/12 break-words">
              {openGraphDetails.description}
            </span>
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
