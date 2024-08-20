import { TagIcon } from "lucide-react";
import { Collapse, Box, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { BsArrowsCollapse } from "react-icons/bs";
import StampEl from "./Stamp/Stamp";
import { AiFillTag, AiFillTags } from "react-icons/ai";

export const HeadAnalysis = ({
  pageTitle,
  pageDescription,
  canonical,
  hreflangs,
  pageSchema,
  openGraphDetails,
  // url,
  tagManager,
  favicon_url,
  indexation,
  charset,
}: any) => {
  // Mantine Collapse
  const [opened, { toggle }] = useDisclosure(false);
  const [openedCode, { toggle: toggleCode }] = useDisclosure(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      const value = localStorage.getItem("HeadIsHidden");
      if (value) {
        setHidden(JSON.parse(value));
      }
    }
  }, []);

  return (
    <div
      onDoubleClick={() => {
        setHidden(!hidden);
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("HeadIsHidden", JSON.stringify(!hidden));
        }
      }}
      className="  dark:border-brand-darker  bg-white p-1 dark:bg-brand-darker shadow rounded-md mb-5 pb-5 overflow-hidden border relative -mt-5"
    >
      {/* <StampEl indexation={indexation} hidden={hidden} /> */}
      <h2 className="flex items-center text-center font-semibold text-gray-400 w-fit relative p-4 mx-auto text-xl">
        <AiFillTag className="mr-1.5" /> Head
      </h2>
      <section
        className={`${hidden && "hidden"} transition-all ease-in delay-300 text-xs px-3 -mt-8 block xl:flex`}
      >
        <aside className="lg:w-9/12">
          <div className="flex items-center mt-4">
            <div
              className={`flex justify-center items-center w-8 h-8 p-1.5 rounded-full ${favicon_url.length > 0 ? "bg-green-500 text-white" : "bg-gray-200"} 
              ${favicon_url.length <= 0 && pageTitle?.length > 0 ? "bg-red-500 text-white" : ""}
`}
            >
              <TagIcon />
            </div>
            <span
              className={`flex font-semibold  text-black/60 dark:text-white/50 ml-2 `}
            >
              Favicon:
            </span>
            <span className="flex ml-2 text-black text-lg font-black mr-3">
              {favicon_url.length > 0 && (
                <img
                  src={favicon_url[0]}
                  alt="Favicon"
                  className="w-10 h-10 p-1 -mt-1 rounded-md"
                />
              )}
            </span>
            {favicon_url.length === 0 && pageTitle[0] && (
              <span className="text-red-500 -ml-3">No favicon found</span>
            )}
          </div>
          <div className="flex items-center mt-2 ">
            <div
              className={`flex justify-center items-center ${pageTitle[0]?.length <= 60 && "bg-green-500 text-white"}  ${pageTitle[0]?.length > 60 ? "bg-red-500 text-white" : pageTitle[0]?.length < 60 && pageTitle[0]?.length !== 0 ? "bg-green-500 text-white" : "bg-gray-200"} w-8 h-8 p-1.5 rounded-full`}
            >
              <TagIcon />
            </div>
            <span
              className={`flex font-semibold  text-black/60 ml-2 dark:text-white/50`}
            >
              Page Title:
            </span>
            <span
              onClick={() => {
                if (pageTitle[0]) {
                  navigator?.clipboard.writeText(pageTitle[0]);
                }
              }}
              className="flex items-center text-base ml-2 text-black dark:text-white  font-black"
            >
              {pageTitle[0]}{" "}
            </span>
            {pageTitle[0] && (
              <span className="text-black/20 dark:text-white/20 ml-2 text-[9px]">
                ({pageTitle[0]?.length} / 60)
              </span>
            )}
          </div>

          <div className="flex items-center mt-2">
            <div
              className={`flex justify-center items-center min-w-8 ${pageDescription[0]?.length > 160 || (!pageDescription[0] && pageTitle.length > 0) ? "bg-red-500 text-white" : pageDescription[0]?.length < 160 && pageDescription[0]?.length !== 0 ? "bg-green-500 text-white" : "bg-gray-200"} w-8 h-8 p-1.5 rounded-full`}
            >
              <TagIcon />
            </div>
            <span
              className={`flex items-center font-semibold ml-2 text-black/60 dark:text-white/50`}
            >
              Description:
            </span>
            <div className="flex items-center">
              {pageDescription[0] && (
                <span className=" text-black text-sm  items-center font-black ml-2 dark:text-white max-w-[calc(100% - 100px)] break-words relative">
                  {pageDescription[0]}
                  {pageDescription[0] && (
                    <p className=" text-black/20 dark:text-white/20 ml-2 text-[9px]  inline-flex items-center m-auto">
                      ({pageDescription[0]?.length} / 160)
                    </p>
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center mt-2">
            <div
              className={`flex justify-center items-center p-1.5  text-black  ${!canonical || canonical[0] === "No canonical URL found" ? "bg-red-500 text-white" : canonical[0]?.length > 1 ? "bg-green-500 text-white" : "bg-gray-200"} w-8 h-8 rounded-full`}
            >
              <TagIcon />
            </div>
            <span className="flex items-start ml-2 font-semibold text-black/60 dark:text-white/50">
              Canonical URL:
            </span>
            <span className="ml-2 text-blue-600">{canonical || ""}</span>
          </div>

          <div className="flex items-center mt-2">
            <div
              className={`flex justify-center items-center  ${hreflangs[0] === "No hreflang found" ? "bg-red-500 text-white" : hreflangs?.length > 1 && "bg-green-500 text-white"} w-8 h-8 p-1.5 rounded-full bg-gray-200`}
            >
              <TagIcon />
            </div>{" "}
            <span className="font-semibold  ml-2 rounded-md text-black/60 dark:text-white/50">
              Hreflangs:
            </span>
            <div className="flex flex-wrap items-center">
              {hreflangs[0] === "No hreflang found" ? (
                <span className="ml-2">No hreflang found</span>
              ) : (
                hreflangs.map((hreflang: any, index: any) => (
                  <div key={index}>
                    <span
                      className="flex ml-1 text-[10px]  text-black py-0.5 border px-2 bg-gray-100 rounded-md"
                      key={index}
                    >
                      {hreflang?.lang}
                    </span>
                  </div>
                ))
              )}
              {hreflangs.length > 1 && (
                <Group justify="center" mb={5} className="mt-1">
                  <div className="bg-brand-highlight  flex ml-2 rounded-md pl-1.5 h-[19px]  text-xs items-center">
                    <span className="text-xs">{hreflangs.length}</span>
                    <IconChevronDown
                      onClick={toggle}
                      className={`transition-all text-xs py-1 animate duration-100 ease-in ${opened && "rotate-180 text-xs"}`}
                    />
                  </div>
                </Group>
              )}
            </div>
          </div>
          <Box className="mt-1" mx="0">
            <Collapse in={opened}>
              <span className="text-left m-2 pt-3">
                <div className="bg-gray-100 dark:bg-black/60 rounded-md">
                  {hreflangs?.map((hreflang: any, index: any) => (
                    <span
                      className="flex ml-2 items-center space-x-2 text-black p-2  px-2   border-b border-white dark:border-b-white/5"
                      key={index}
                    >
                      <a
                        className="underline text-blue-500"
                        href={hreflang?.href}
                      >
                        {hreflang?.href}
                      </a>
                      <span className="border px-2 py-1 text-xs text-white bg-black/50 dark:bg-brand-dark  rounded-md w-fit h-6 items-center flex justify-center">
                        {hreflang?.lang}
                      </span>
                    </span>
                  ))}
                </div>
              </span>
            </Collapse>
          </Box>
        </aside>
        <aside className="xl:pl-5 xl:ml-5 xl:border-l dark:border-l-brand-dark/40 block">
          <div className="flex items-center mt-2 mt-0 sm:mt-0 xl:mt-4">
            <div
              className={`flex items-center justify-center rounded-full w-8 h-8 p-1.5 ${
                openGraphDetails?.title?.length > 0 &&
                openGraphDetails?.image !== null &&
                "bg-green-500 text-white"
              } ${
                openGraphDetails?.title?.length > 0 &&
                openGraphDetails?.image === null &&
                "bg-red-500 text-white"
              }
                ${openGraphDetails?.title?.length > 0 && openGraphDetails?.image === null && "bg-gray-200"}
                ${openGraphDetails?.title === null && openGraphDetails?.image === null && "bg-red-500 text-white"}
${openGraphDetails?.image === null && "bg-gray-200"} }
${openGraphDetails && "bg-gray-200"}
`}
            >
              <TagIcon />
            </div>
            <span
              className={`flex text-black/60 ml-2 items-center font-semibold dark:text-white/50`}
            >
              OpenGraph:
            </span>
            <span className="text-black ml-2">
              {openGraphDetails.image === null && (
                <a href="/#og" className="text-red-500">
                  Not Found
                </a>
              )}
              {openGraphDetails.image !== null && pageTitle?.length > 0 && (
                <span className="text-green-500">OG Found in your markup</span>
              )}
            </span>
          </div>

          <div className="flex items-center mt-2">
            <div
              className={`flex rounded-full items-center justify-center h-8 w-8 p-1.5 ${pageSchema.length > 0 && "bg-green-500 text-white"} ${pageSchema.length === 0 && "bg-gray-200"}
                        ${pageTitle.length > 0 && pageSchema.length === 0 && "bg-red-500 text-white"} ${pageTitle?.length === 0 && "bg-gray-200"}
`}
            >
              <TagIcon />
            </div>{" "}
            <span
              className={`font-semibold ml-2 text-black/60 dark:text-white/50`}
            >
              Structured Data:
            </span>
            <span className="text-black/80 ml-2">
              {pageSchema.length > 0 && pageTitle?.length > 0 && (
                <a href="#sd">
                  <span className="text-green-500">
                    This page has structured data
                  </span>
                </a>
              )}
              {!pageSchema[0] && pageTitle?.length > 0 && (
                <span className="text-red-500">Not Found</span>
              )}
            </span>
          </div>

          <div className="flex items-center mt-2">
            <div
              className={`flex rounded-full items-center justify-center h-8 w-8 p-1.5 ${tagManager.length > 0 && "bg-green-500 text-white"} ${pageSchema.length === 0 && "bg-gray-200"}
                        ${pageTitle.length > 0 && tagManager.length === 0 && "bg-red-500 text-white"} ${pageTitle?.length === 0 && "bg-gray-200"}
`}
            >
              <TagIcon />
            </div>{" "}
            <span
              className={`font-semibold ml-2 text-black/60 dark:text-white/50`}
            >
              Tag Container:
            </span>
            <span className="text-black/80 ml-2">
              {tagManager.length > 0 && pageTitle?.length > 0 && (
                <a href="#sd">
                  <span className="text-black text-xs font-black dark:text-white">
                    {tagManager}
                  </span>
                </a>
              )}
              {tagManager.length === 0 && pageTitle?.length > 0 && (
                <span className="text-red-500">Missing container</span>
              )}
            </span>
          </div>

          <div className="flex items-center mt-2">
            <div
              className={`flex rounded-full items-center justify-center h-8 w-8 p-1.5  ${charset && pageTitle.length > 0 && "bg-green-500 text-white"} bg-gray-200  text-white"} 
                      
`}
            >
              <TagIcon />
            </div>{" "}
            <span
              className={`font-semibold ml-2 text-black/60 dark:text-white/50`}
            >
              Charset:
            </span>
            <span className="text-black/80 ml-2">
              {indexation.length > 0 && (
                <a href="#sd">
                  <span
                    className={`text-black text-xs font-black ${charset[0] ? "text-green-500 " : "text-red-500"}`}
                  >
                    {charset && charset[0]}
                  </span>
                </a>
              )}
              {charset.length === 0 && pageTitle?.length > 0 && (
                <span className="text-red-500">Not Found</span>
              )}
            </span>
          </div>
          <div className="flex items-center mt-2">
            <div
              className={`flex rounded-full items-center justify-center h-8 w-8 p-1.5 ${indexation[0] === "Indexable" && "bg-green-500 text-white"} ${indexation[0] === "Not Indexable" && "bg-red-500 text-white"}  bg-gray-200
`}
            >
              <TagIcon />
            </div>{" "}
            <span
              className={`font-semibold ml-2 text-black/60 dark:text-white/50`}
            >
              Indexability:
            </span>
            <span className="text-black/80 ml-2">
              {indexation.length > 0 && pageTitle?.length > 0 && (
                <a href="#sd">
                  <span
                    className={`text-black text-xs font-black ${indexation[0] === "Indexable" ? "text-green-500 " : "text-red-500"}`}
                  >
                    {indexation[0]}
                  </span>
                </a>
              )}
              {indexation.length === 0 && pageTitle?.length > 0 && (
                <span className="text-red-500">No container Found</span>
              )}
            </span>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default HeadAnalysis;
