// @ts-nocheck
// "use client";
import useStore from "@/store/Panes";
import { BsThreeDotsVertical } from "react-icons/bs";
import useOnPageSeo from "@/store/storeOnPageSeo";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { LiaHeadingSolid } from "react-icons/lia";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { invoke } from "@tauri-apps/api/core";
import HeadingsTableAI from "./HeadingsTableAI";
import { Head } from "react-day-picker";
import { v4 as uuidv4 } from "uuid";

const HeadingsTable = ({
  headings,
  sessionUrl,
  body,
}: {
  headings: string[];
  body: string[];
  sessionUrl: string;
}) => {
  const { Visible } = useStore();
  const setRepeatedHeadings = useOnPageSeo((state) => state.setHeadings);
  const [viewAIHeadings, setViewAIHeadings] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const previousHeadingsRef = useRef<string[]>(headings);

  const aiHeadings = headings.toString();
  let headingsLen = [];

  useEffect(() => {
    const fetchAiHeadings = async () => {
      try {
        const headingsKey = aiHeadings;
        const existingUuid = sessionStorage.getItem(headingsKey);
        const storedResponse =
          existingUuid && sessionStorage.getItem(`${existingUuid}_response`);

        // If no stored response exists, fetch new headings
        if (!storedResponse) {
          const uuid = uuidv4();
          sessionStorage.setItem(headingsKey, uuid);

          const response: any = await invoke("get_headings_command", {
            aiHeadings,
          });

          if (response) {
            setViewAIHeadings(response);
            sessionStorage.setItem(
              `${uuid}_response`,
              JSON.stringify(response),
            );
          }
        } else {
          // Use stored response
          setViewAIHeadings(JSON.parse(storedResponse));
        }
      } catch (error) {
        console.error("Failed to get AI headings:", error);
      }
    };

    fetchAiHeadings();

    return () => {};
  }, [headings, aiHeadings]);

  const findDuplicates = (array: string[]) => {
    const count: Record<string, number> = {};
    const duplicates: string[] = [];

    array.forEach((element) => {
      count[element] = (count[element] || 0) + 1;
    });

    for (const element in count) {
      if (count[element] > 1) {
        duplicates.push(element);
      }
    }

    return duplicates;
  };

  const repeated: any = useMemo(() => findDuplicates(headings), [headings]);

  useEffect(() => {
    setRepeatedHeadings(repeated);
  }, [repeated, setRepeatedHeadings]);

  function processLink(link: string) {
    const firstColonIndex = link.indexOf(":");

    if (firstColonIndex === -1) {
      return {
        headingType: "Unknown",
        headingText: link,
      };
    }

    const headingType = link.substring(0, firstColonIndex).trim();
    const headingText = link.substring(firstColonIndex + 1).trim();

    return {
      headingType,
      headingText,
    };
  }

  return (
    <section
      className={`table_container relative headings ${Visible.headings ? "block" : "hidden"} `}
    >
      <h2 className="text-base text-left pl-1 pt-3 font-bold w-full text-black/60 flex items-center">
        <LiaHeadingSolid className="mr-1.5" /> Headings
      </h2>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} side="right">
        <DropdownMenu>
          <DropdownMenuTrigger className="absolute top-5 right-1">
            <BsThreeDotsVertical className="dark:text-white mr-2 z-10 cursor-pointer" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-brand-darker border dark:bg-brand-darker dark:border-brand-dark dark:text-white bg-white active:text-white p-0 text-center mr-32 mt-1">
            <DropdownMenuLabel className="w-full text-center border-b dark:border-b-white/20">
              Headings
            </DropdownMenuLabel>
            <SheetTrigger asChild>
              <DropdownMenuItem className="dark:hover:bg-brand-bright hover:text-white hover:bg-brand-highlight cursor-pointer active:text-white mt-1 text-center mx-auto flex justify-center items-center">
                Improve Headings
              </DropdownMenuItem>
            </SheetTrigger>
          </DropdownMenuContent>
        </DropdownMenu>
        <SheetContent className="z-[99999999999] overflow-hidden h-[720px] my-auto mr-2 w-[900px] max-w-[1200px] px-0 rounded-md  border-1  dark:bg-brand-darker">
          <HeadingsTableAI aiHeadings={viewAIHeadings} headings={headings} />
        </SheetContent>
      </Sheet>
      <section className="flex flex-col flex-grow">
        <table className="w-full">
          <thead className="text-xs text-left">
            <tr className="w-full">
              <th>Anchor</th>
              <th className="ml-0 w-[20px]" colSpan={8}>
                Text
              </th>
            </tr>
          </thead>
        </table>
        <div className="flex-grow custom-scrollbar overflow-auto h-[23.5rem]">
          <table className="w-full">
            <tbody>
              {headings?.map((link, index) => {
                const { headingType, headingText } = processLink(link);
                return (
                  <tr key={index}>
                    <td className="crawl-item border-r py-1 font-semibold text-apple-blue border-b w-2 pl-5 pr-6 h-full">
                      {headingType}
                    </td>
                    <td className="h-full w-full border-b crawl-item pl-8">
                      {headingText}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <footer className="border-t border-t-gray-100 dark:border-0 text-xs flex justify-end text-black/50 space-x-4 pt-2">
          <p className="text-xs">
            Headings Found:{" "}
            <span className="px-1 py-0.5 bg-gray-400 text-white rounded-md">
              {headings?.length}
            </span>
          </p>
          <p>
            Duplicates Found:{" "}
            <span className="px-1 py-0.5 bg-red-400 text-white rounded-md mr-2">
              {repeated?.length}
            </span>
          </p>
        </footer>
      </section>
    </section>
  );
};

export default HeadingsTable;
