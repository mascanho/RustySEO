import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import { FaLinkedin } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const OpenGraphCard = ({
  openGraphDetails,
  linkedInInspect,
}: {
  openGraphDetails: any;
  linkedInInspect: string | undefined;
}) => {
  return (
    <div className="shadow naked_table overflow-hidden">
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
      <section className="mx-auto h-full w-full overflow-auto relative bg-white/40 -mt-10 -z-1">
        <div
          className={`px-10  flex flex-col  items-center justify-center ${openGraphDetails.length === 0 ? "bg-white/40 h-full dark:bg-brand-darker" : "bg-white dark:bg-brand-darker h-full"}`}
        >
          {openGraphDetails?.image?.length > 0 ? (
            <div className="flex flex-col flex-wrap justify-start items-start">
              <img
                src={openGraphDetails?.image}
                alt="OpenGraph Image"
                className="rounded-md w-[] h-auto   object-cover ml-0"
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
