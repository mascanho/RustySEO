import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import { FaLinkedin, FaFacebook } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useEffect, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useStore from "@/store/Panes";
import useOnPageSeo from "@/store/storeOnPageSeo";

export const OpenGraphCard = ({
  openGraphDetails,
  linkedInInspect,
  facebookInspect,
}: {
  openGraphDetails: any;
  linkedInInspect: string | undefined;
  facebookInspect: string | undefined;
}) => {
  const { Visible } = useStore();
  const [currentPreview, setCurrentPreview] = useState<string>("LinkedIn");
  const [viewDetails, setViewDetails] = useState(false);
  const setSeoOpenGraph = useOnPageSeo((state) => state.setSeoOpenGraph);

  useEffect(() => {
    if (openGraphDetails) {
      setSeoOpenGraph(openGraphDetails);
    }
  }, [openGraphDetails, setSeoOpenGraph]);

  useEffect(() => {
    setSeoOpenGraph(openGraphDetails);
  }, []);

  console.log(openGraphDetails, "This is the openGraphDetails");

  const getPreviewIcon = () => {
    switch (currentPreview) {
      case "LinkedIn":
        return <FaLinkedin className="mr-1.5" />;
      case "Facebook":
        return <FaFacebook className="mr-1.5" />;
      default:
        return <FaLinkedin className="mr-1.5" />;
    }
  };

  const getPreviewLink = () => {
    switch (currentPreview) {
      case "LinkedIn":
        return linkedInInspect;
      case "Facebook":
        return `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(openGraphDetails.url)}`;
      default:
        return linkedInInspect;
    }
  };

  return (
    <div
      className={`opengraph shadow naked_table overflow-hidden ${Visible.opengraph ? "block" : "hidden"} `}
    >
      <div className="flex items-center justify-between">
        <h2 className="flex items-center z-10">Social Media Preview</h2>
        <div className="relative z-10">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <BsThreeDotsVertical className="dark:text-white mr-2 z-10 cursor-pointer" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-brand-darker border  dark:bg-brand-darker  dark:border-brand-dark dark:text-white mr-36 bg-white active:text-white">
              <DropdownMenuLabel>Social Previews</DropdownMenuLabel>
              {["LinkedIn", "Facebook"].map((platform) => (
                <DropdownMenuItem
                  key={platform}
                  onClick={() => {
                    setCurrentPreview(platform);
                    openBrowserWindow(getPreviewLink());
                  }}
                  className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight cursor-pointer active:text-white"
                >
                  {platform}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight cursor-pointer active:text-white"
                onClick={() => setViewDetails(!viewDetails)}
              >
                {viewDetails ? "Hide Details" : "View Details"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {viewDetails && Object.keys(openGraphDetails).length > 0 ? (
        <div className="h-auto w-11/12 ml-4 mt-4 flex flex-col flex-wrap justify-start items-start m-auto space-y-2  overflow-y-auto rounded-lg overflow-hidden">
          <div className="flex flex-col w-full overflow-hidden ml-2 bg-white dark:bg-gray-700 rounded-md">
            <span className="font-bold text-blue-600 dark:text-blue-400 text-xs mb-1 flex items-center">
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                ></path>
              </svg>
              OG Title:
            </span>
            <span className="dark:text-white/70 text-xs break-words">
              {openGraphDetails?.title}
            </span>
          </div>
          <div className="flex flex-col w-full bg-white dark:bg-gray-700 p-2 rounded-md">
            <span className="font-bold text-green-600 dark:text-green-400 text-xs mb-1 flex items-center">
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                ></path>
              </svg>
              OG Description:
            </span>
            <span className="dark:text-white/70 text-xs break-words">
              {openGraphDetails?.description}
            </span>
          </div>
          <div className="flex flex-col w-full bg-white dark:bg-gray-700 p-2 rounded-md">
            <span className="font-bold text-purple-600 dark:text-purple-400 text-xs mb-1 flex items-center">
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                  clipRule="evenodd"
                ></path>
              </svg>
              OG URL:
            </span>
            <span className="text-xs text-apple-spaceGray/70 break-all">
              {openGraphDetails?.url}
            </span>
          </div>
          <div className="flex flex-col w-full bg-white dark:bg-gray-700 p-2 rounded-md">
            <span className="font-bold text-red-600 dark:text-red-400 text-xs mb-1 flex items-center">
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                ></path>
              </svg>
              OG Image:
            </span>
            <span className="text-xs text-apple-spaceGray/70 break-all">
              {openGraphDetails?.image}
            </span>
          </div>
          <div className="flex flex-col w-full bg-white dark:bg-gray-700 p-2 rounded-md">
            <span className="font-bold text-yellow-600 dark:text-yellow-400 text-xs mb-1 flex items-center">
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                ></path>
              </svg>
              OG Type:
            </span>
            <span className="dark:text-white/70 text-xs">
              {openGraphDetails?.type}
            </span>
          </div>
          <div className="flex flex-col w-full bg-white dark:bg-gray-700 p-2 rounded-md">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs mb-1 flex items-center">
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10.496 2.132a1 1 0 00-.992 0l-7 4A1 1 0 003 8v7a1 1 0 100 2h14a1 1 0 100-2V8a1 1 0 00.496-1.868l-7-4zM6 9a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1zm3 1a1 1 0 012 0v3a1 1 0 11-2 0v-3zm5-1a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1z"
                  clipRule="evenodd"
                ></path>
              </svg>
              OG Site Name:
            </span>
            <span className="dark:text-white/70 text-xs">
              {openGraphDetails?.site_name}
            </span>
          </div>
        </div>
      ) : (
        <section className="h-full w-full relative overflow-hidden rounded-lg  -z-1">
          <div
            className={`px-10 m-auto w-10/12  flex flex-col mt-2   items-start justify-start ${openGraphDetails.length === 0 ? "bg-white/40 h-full dark:bg-brand-darker" : "bg-white dark:bg-brand-darker h-full"}`}
          >
            {openGraphDetails && openGraphDetails?.image?.length > 0 && (
              <div className="flex flex-col flex-wrap justify-start items-start h-19/12">
                <img
                  src={openGraphDetails?.image}
                  alt="OpenGraph Image"
                  className="rounded-md w-full   object-cover ml-0 max-h-72"
                />
              </div>
            )}
            <div
              onClick={() => openBrowserWindow(openGraphDetails.url)}
              className="flex flex-col flex-wrap cursor-pointer py-2 justify-start ml-0 w-full"
            >
              <span className="font-bold dark:text-white/50 bg-red-5000 text-xs">
                {openGraphDetails.title}
              </span>
              <span className="w-11/12 break-words dark:text-white/50 text-xs">
                {openGraphDetails.description}
              </span>
              <span className="text-xs mt-1 text-apple-spaceGray/70">
                {openGraphDetails.url}
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default OpenGraphCard;
