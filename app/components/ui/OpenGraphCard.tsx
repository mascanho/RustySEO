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
    <div className="border p-5 flex flex-col rounded-md items-center justify-center bg-white">
      <div className="flex justify-between w-full items-center pb-3 h-10">
        <h2 className="w-full ">
          When this link is shared content will look like this:
        </h2>
        <span
          className="px-3 hover:border-black transition-all duration-300 active:border-2 hover:bg-apple-spaceGray/40 py-1 text-sm w-fit flex flex-nowrap bg-apple-silver rounded-md text-right cursor-pointer font-semibold"
          onClick={() => openBrowserWindow(linkedInInspect)}
        >
          Inspect
        </span>
      </div>
      <div>
        <img
          src={openGraphDetails?.image}
          alt="OpenGraph Image"
          className="rounded-md"
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

      <table className="mt-4">
        <thead>
          <tr>
            <th>Property</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(openGraphDetails).map(
            ([key, value]: [string, any]) => (
              <tr key={key}>
                <td>{key}</td>
                <td>{value}</td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OpenGraphCard;
