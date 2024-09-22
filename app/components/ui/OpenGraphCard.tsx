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
        <h2 className="flex items-center z-10">
          {getPreviewIcon()} {currentPreview} Preview
        </h2>
        <div className="relative z-10">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <BsThreeDotsVertical className="dark:text-white mr-2 z-10 cursor-pointer" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-brand-darker border  dark:bg-brand-darker  dark:border-brand-dark dark:text-white mr-36 bg-white active:text-white">
              <DropdownMenuLabel>Social Previews</DropdownMenuLabel>
              <DropdownMenuSeparator />
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
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
    </div>
  );
};

export default OpenGraphCard;
