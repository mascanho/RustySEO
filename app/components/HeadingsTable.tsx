// @ts-nocheck
"use client";
import useStore from "@/store/Panes";
import { BsThreeDotsVertical } from "react-icons/bs";
import useOnPageSeo from "@/store/storeOnPageSeo";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { LiaHeadingSolid } from "react-icons/lia";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { invoke } from "@tauri-apps/api/core";
import HeadingsTableAI from "./HeadingsTableAI";
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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false); // State for custom dropdown

  const [aiHeadings, setAiHeadings] = useState(null);

  useEffect(() => {
    if (dialogOpen && !aiHeadings) {
      const fetchAiHeadings = async () => {
        try {
          const headingsKey = headings.toString();
          const existingUuid = sessionStorage.getItem(headingsKey);
          const storedResponse =
            existingUuid && sessionStorage.getItem(`${existingUuid}_response`);

          if (!storedResponse) {
            const uuid = uuidv4();
            sessionStorage.setItem(headingsKey, uuid);

            const response: any = await invoke("get_headings_command", {
              aiHeadings: headings.toString(),
            });

            if (response) {
              setAiHeadings(response);
              sessionStorage.setItem(
                `${uuid}_response`,
                JSON.stringify(response),
              );
            }
          } else {
            setAiHeadings(JSON.parse(storedResponse));
          }
        } catch (error) {
          console.error("Failed to get AI headings:", error);
        }
      };

      fetchAiHeadings();
    }
  }, [dialogOpen, headings, aiHeadings]);

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

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.querySelector(".custom-dropdown");
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <section
      className={`table_container relative headings ${Visible.headings ? "block" : "hidden"} `}
    >
      <h2 className="text-base text-left pl-1 pt-3 font-bold w-full text-black/60 flex items-center">
        <LiaHeadingSolid className="mr-1.5" /> Headings
      </h2>

      {/* Custom Dropdown Trigger */}
      <button
        onClick={toggleDropdown}
        className="absolute top-5 right-1 focus:outline-none"
      >
        <BsThreeDotsVertical className="dark:text-white mr-2 z-10 cursor-pointer" />
      </button>

      {/* Custom Dropdown Menu */}
      {dropdownOpen && (
        <div className="custom-dropdown absolute right-4 mt-2 w-[8rem] bg-white z-10 dark:bg-brand-darker border border-gray-300 dark:border-brand-dark shadow">
          <div className="p-1">
            <p className="text-xs font-semibold text-gray-700 dark:text-white px-2 py-1 border-b dark:border-b-white/20">
              Headings
            </p>
            <button
              onClick={() => {
                setDialogOpen(true);
                setDropdownOpen(false);
              }}
              className="w-full text-left px-2 py-1 text-xs text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-brand-dark cursor-pointer rounded-sm"
            >
              Improve Headings
            </button>
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="z-[99999999999] overflow-hidden h-[720px] my-auto mr-2 w-[900px] max-w-[1200px] px-0 rounded-md border-1 dark:bg-brand-darker"
          onEscapeKeyDown={() => setDialogOpen(false)}
          onPointerDownOutside={() => setDialogOpen(false)}
        >
          {/* Add custom styles to the close button */}
          {/* <button */}
          {/*   onClick={() => setDialogOpen(false)} */}
          {/*   className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none z-50" */}
          {/* > */}
          {/*   <svg */}
          {/*     xmlns="http://www.w3.org/2000/svg" */}
          {/*     className="h-6 w-6" */}
          {/*     fill="none" */}
          {/*     viewBox="0 0 24 24" */}
          {/*     stroke="currentColor" */}
          {/*   > */}
          {/*     <path */}
          {/*       strokeLinecap="round" */}
          {/*       strokeLinejoin="round" */}
          {/*       strokeWidth={2} */}
          {/*       d="M6 18L18 6M6 6l12 12" */}
          {/*     /> */}
          {/*   </svg> */}
          {/* </button> */}
          <HeadingsTableAI aiHeadings={aiHeadings} headings={headings} />
        </DialogContent>
      </Dialog>

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
