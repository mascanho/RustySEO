import { TagIcon } from "lucide-react";
import { Collapse, Box, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { BsArrowsCollapse } from "react-icons/bs";

export const HeadAnalysis = ({
  pageTitle,
  pageDescription,
  canonical,
  hreflangs,
  pageSchema,
  openGraphDetails,
  url,
  tagManager,
  favicon_url,
}: any) => {
  // Mantine Collapse
  const [opened, { toggle }] = useDisclosure(false);
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
    <div className="flex w-full gap-x-7 transition-all overflow-x-clip">
      <section
        className={`mb-10 flex-wrap  w-full h-full shadow bg-white ${pageTitle[0]?.length > 0 ? "" : "bg-opacity-40"} p-4 rounded-b-md relative`}
      >
        <div
          onDoubleClick={() => {
            setHidden(!hidden);
            if (typeof localStorage !== "undefined") {
              localStorage.setItem("HeadIsHidden", JSON.stringify(!hidden));
            }
          }}
          className="w-full bg-apple-spaceGray left-0 -top-5 rounded-t-md h-8 absolute flex items-center justify-center"
        >
          <h2 className="text-center font-semibold text-white w-fit relative">
            Head
          </h2>
          <BsArrowsCollapse
            onClick={() => {
              setHidden(!hidden);
              if (typeof localStorage !== "undefined") {
                localStorage.setItem("HeadIsHidden", JSON.stringify(!hidden));
              }
            }}
            className="right-3 text-white text-xs absolute cursor-pointer"
          />
        </div>
        <section
          className={`${hidden && "hidden"} transition-all ease-in delay-300 `}
        >
          <div className="flex items-center mt-4">
            <div
              className={`flex justify-center items-center w-10 h-10 rounded-full ${favicon_url.length > 0 ? "bg-green-500 text-white" : "bg-gray-200"} 
              ${favicon_url.length <= 0 && pageTitle?.length > 0 ? "bg-red-500 text-white" : ""}
`}
            >
              <TagIcon />
            </div>
            <span className={`flex font-semibold  text-black/60 ml-2 `}>
              Favicon:
            </span>
            <span className="flex ml-2 text-black text-lg font-black mr-3">
              {favicon_url.length > 0 && (
                <img
                  src={favicon_url[0]}
                  alt="Favicon"
                  className="w-10 h-10 p-1 -mt-1 border rounded-md"
                />
              )}
            </span>
            {favicon_url.length === 0 && pageTitle[0] && (
              <span className="text-red-500 -ml-3">No favicon found</span>
            )}
          </div>
          <div className="flex items-center mt-2 ">
            <div
              className={`flex justify-center items-center  ${pageTitle[0]?.length > 60 ? "bg-red-500 text-white" : pageTitle[0]?.length < 60 && pageTitle[0]?.length !== 0 ? "bg-green-500 text-white" : "bg-gray-200"} w-10 h-10 rounded-full`}
            >
              <TagIcon />
            </div>
            <span className={`flex font-semibold  text-black/60 ml-2 `}>
              Page Title:
            </span>
            <span className="flex ml-2 text-black text-lg font-black">
              {pageTitle[0]}
            </span>
            {pageTitle.length > 0 && (
              <span
                className={`bg-gray-100 text-xs px-2 py-1 rounded-md items-center flex ml-4 ${pageTitle[0].length > 60 ? "text-red-500" : "text-green-600"}`}
              >
                {pageTitle[0].length} / 60
              </span>
            )}
          </div>

          <div className="flex items-center mt-2">
            <div
              className={`flex justify-center items-center min-w-10  ${pageDescription[0]?.length > 160 ? "bg-red-500 text-white" : pageDescription[0]?.length < 160 && pageDescription[0]?.length !== 0 ? "bg-green-500 text-white" : "bg-gray-200"} w-10 h-10 rounded-full`}
            >
              <TagIcon />
            </div>
            <span
              className={`flex items-center font-semibold ml-2 text-black/60`}
            >
              Description:
            </span>
            <span className="text-black text-lg font-black ml-2">
              {pageDescription[0]}
            </span>
            {pageDescription[0]?.length > 0 && (
              <span
                className={`bg-gray-100 text-xs px-2 py-1 rounded-md items-center flex ml-4 ${pageDescription[0].length > 160 ? "text-red-500" : "text-green-500"}`}
              >
                {pageDescription[0].length} / 160
              </span>
            )}
          </div>

          <div className="flex items-center mt-2">
            <div
              className={`flex justify-center items-center text-black  ${!canonical || canonical[0] === "No canonical URL found" ? "bg-red-500 text-white" : canonical[0]?.length > 1 ? "bg-green-500 text-white" : "bg-gray-200"} w-10 h-10 rounded-full`}
            >
              <TagIcon />
            </div>
            <span className="flex items-start ml-2 font-semibold text-black/60">
              Canonical URL:
            </span>
            <span className="ml-2 text-blue-600">{canonical || ""}</span>
          </div>

          <div className="flex items-center mt-2">
            <div
              className={`flex justify-center items-center  ${hreflangs[0] === "No hreflang found" ? "bg-red-500 text-white" : hreflangs?.length > 1 && "bg-green-500 text-white"} w-10 h-10 rounded-full bg-gray-200`}
            >
              <TagIcon />
            </div>{" "}
            <span className="font-semibold  ml-2 rounded-md text-black/60">
              Hreflangs:
            </span>
            <div className="flex">
              {hreflangs[0] === "No hreflang found" ? (
                <span className="ml-2">No hreflang found</span>
              ) : (
                hreflangs.map((hreflang: any, index: any) => (
                  <div key={index}>
                    <span
                      className="flex ml-2  text-black p-1 border px-2 bg-gray-100 rounded-md"
                      key={index}
                    >
                      {hreflang?.lang}
                    </span>
                  </div>
                ))
              )}
              {hreflangs.length > 1 && (
                <Group justify="center" mb={5}>
                  <div className="bg-brand-highlight flex ml-2 rounded-md px-3 py-1 text-xs items-center">
                    <span>{hreflangs.length}</span>
                    <IconChevronDown
                      onClick={toggle}
                      className={`text-[6px] transition-all animate duration-100 ease-in ${opened && "rotate-180"}`}
                    />
                  </div>
                </Group>
              )}
            </div>
          </div>
          <Box className="mt-1" mx="0">
            <Collapse in={opened}>
              <span className="text-left m-2 pt-3">
                <div className="bg-gray-200 rounded-md">
                  {hreflangs?.map((hreflang: any, index: any) => (
                    <span
                      className="flex ml-2 items-center space-x-2 text-black p-2  px-2   border-b border-white"
                      key={index}
                    >
                      <a
                        className="underline text-blue-500"
                        href={hreflang?.href}
                      >
                        {hreflang?.href}
                      </a>
                      <span className="border px-2 py-1 text-xs text-white bg-black/50 rounded-md w-fit h-6 items-center flex justify-center">
                        {hreflang?.lang}
                      </span>
                    </span>
                  ))}
                </div>
              </span>
            </Collapse>
          </Box>
          <div className="flex items-center mt-2">
            <div
              className={`flex items-center justify-center rounded-full w-10 h-10 ${
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
${url === "" && openGraphDetails?.image === null && "bg-gray-200"} }
${openGraphDetails && "bg-gray-200"}
`}
            >
              <TagIcon />
            </div>
            <span
              className={`flex text-black/60 ml-2 items-center font-semibold`}
            >
              OpenGraph:
            </span>
            <span className="text-black ml-2">
              {openGraphDetails.image === null && (
                <span className="text-red-500">Not Found</span>
              )}
              {openGraphDetails.image !== null && pageTitle?.length > 0 && (
                <span className="text-green-500">OG Found in your markup</span>
              )}
            </span>
          </div>
          <div className="flex items-center mt-2">
            <div
              className={`flex rounded-full items-center justify-center h-10 w-10 ${pageSchema.length > 0 && "bg-green-500 text-white"} ${!url && pageSchema.length === 0 && "bg-gray-200"}
                        ${pageTitle.length > 0 && pageSchema.length === 0 && "bg-red-500 text-white"} ${pageTitle?.length === 0 && "bg-gray-200"}
`}
            >
              <TagIcon />
            </div>{" "}
            <span className={`font-semibold ml-2 text-black/60`}>
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
              className={`flex rounded-full items-center justify-center h-10 w-10 ${tagManager.length > 0 && "bg-green-500 text-white"} ${!url && pageSchema.length === 0 && "bg-gray-200"}
                        ${pageTitle.length > 0 && tagManager.length === 0 && "bg-red-500 text-white"} ${pageTitle?.length === 0 && "bg-gray-200"}
`}
            >
              <TagIcon />
            </div>{" "}
            <span className={`font-semibold ml-2 text-black/60`}>
              Tag Container:
            </span>
            <span className="text-black/80 ml-2">
              {tagManager.length > 0 && pageTitle?.length > 0 && (
                <a href="#sd">
                  <span className="text-black text-lg font-black">
                    {tagManager}
                  </span>
                </a>
              )}
              {tagManager.length === 0 && pageTitle?.length > 0 && (
                <span className="text-red-500">No container Found</span>
              )}
            </span>
          </div>
          <div className="flex items-center mt-2">
            <div
              className={`flex rounded-full items-center justify-center h-10 w-10 ${pageSchema.length > 0 && "bg-green-500 text-white"} ${!url && pageSchema.length === 0 && "bg-gray-200"}
                        ${pageTitle.length > 0 && pageSchema.length === 0 && "bg-red-500 text-white"} ${pageTitle?.length === 0 && "bg-gray-200"}
`}
            >
              <TagIcon />
            </div>{" "}
            <span className={`font-semibold ml-2 text-black/60`}>Scripts</span>
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
        </section>
      </section>
    </div>
  );
};

export default HeadAnalysis;
