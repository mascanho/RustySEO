import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import { FaLinkedin } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useEffect } from "react";

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
}: {
  openGraphDetails: any;
  linkedInInspect: string | undefined;
}) => {
  const { Visible } = useStore();

  const setSeoOpenGraph = useOnPageSeo((state) => state.setSeoOpenGraph);

  // Log the openGraphDetails for debugging
  console.log(openGraphDetails, "---- OG card -----");

  // useEffect to set SEO Open Graph data when component mounts
  useEffect(() => {
    if (openGraphDetails) {
      setSeoOpenGraph(openGraphDetails);
    }
  }, [openGraphDetails]);

  console.log(openGraphDetails, "---- OG card -----");

  useEffect(() => {
    setSeoOpenGraph(openGraphDetails);
  }, []);

  return (
    <div
      className={`opengraph shadow naked_table overflow-hidden ${Visible.opengraph ? "block" : "hidden"} `}
    >
      <div className="flex items-center justify-between">
        <h2 className="flex items-center z-10">
          <FaLinkedin className="mr-1.5 " /> Social Media Preview
        </h2>
        <div className="relative z-10">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <BsThreeDotsVertical className="dark:text-white mr-2 z-10" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-brand-darker border bg-white dark:bg-brand-darker  dark:border-brand-dark dark:text-white mr-36">
              <DropdownMenuLabel>Social Previews</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => openBrowserWindow(linkedInInspect)}
                className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight cursor-pointer"
              >
                LinkedIn
              </DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Team</DropdownMenuItem>
              <DropdownMenuItem>Subscription</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <section className="mx-auto h-full w-full relative overflow-hidden rounded-lg bg-white/40  -z-1">
        <div
          className={`px-10 m-auto w-10/12  flex flex-col -mt-10  items-center justify-center ${openGraphDetails.length === 0 ? "bg-white/40 h-full dark:bg-brand-darker" : "bg-white dark:bg-brand-darker h-full"}`}
        >
          {openGraphDetails?.image?.length > 0 ? (
            <div className="flex flex-col flex-wrap justify-start items-start h-19/12">
              <img
                src={openGraphDetails?.image}
                alt="OpenGraph Image"
                className="rounded-md w-full   object-cover ml-0 max-h-72"
              />
            </div>
          ) : (
            <span className="text-black/50 dark:text-white/50">
              No opengraph found
            </span>
          )}
          <div
            onClick={() => openBrowserWindow(openGraphDetails.url)}
            className="flex flex-col flex-wrap cursor-pointer py-2"
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
