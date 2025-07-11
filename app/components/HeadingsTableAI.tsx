// @ts-nocheck
import React from "react";
import { toast } from "sonner";
import { CopyIcon } from "@radix-ui/react-icons";

type HeadingData = {
  type: string;
  text: string;
};

const HeadingsTableAI = ({
  aiHeadings = "",
  headings = [],
}: {
  aiHeadings: string;
  headings: string[];
}) => {
  if (!aiHeadings) {
    return (
      <div className="p-4">
        Click &quot;Improve Headings&quot; to generate AI-powered suggestions.
      </div>
    );
  }
  // make the string into an array of objects while filtering empties
  const headingsData = (aiHeadings || "")
    .split("\n")
    .filter((heading) => heading?.trim() !== "")
    .map((heading) => {
      const [type = "", text = ""] = (heading || "").split(": ");
      return { type, text };
    });

  function processLink(link: string) {
    if (!link) {
      return {
        headingType: "",
        headingText: "",
      };
    }

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

  const handleCopy = (text: string = "") => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Process original headings to match format
  const originalHeadingsData = (headings || [])
    .filter((h) => h?.trim() !== "")
    .map(processLink);

  // Get max length to match rows
  const maxLength = Math.max(
    originalHeadingsData?.length || 0,
    headingsData?.length || 0,
  );

  // Pad arrays to match length
  const paddedOriginal = [...(originalHeadingsData || [])];
  const paddedAI = [...(headingsData || [])];

  while (paddedOriginal.length < maxLength) {
    paddedOriginal.push({ headingType: "", headingText: "" });
  }
  while (paddedAI.length < maxLength) {
    paddedAI.push({ type: "", text: "" });
  }

  return (
    <div className="bg-white dark:bg-brand-darker rounded-lg shadow-lg overflow-auto h-[690px] border-gray-200">
      <table className="w-full border-collapse border-0">
        <thead className="sticky top-0 bg-white z-0 shadow-sm border-0 text-sm">
          <tr>
            <th className="w-10 py-3 px-2 text-brand-bright font-semibold border-b border-l text-center border-t">
              Type
            </th>
            <th className="w-1/2 py-3 px-4 font-semibold border-b text-left">
              Original Text
            </th>
            <th className="w-10 py-3 px-2 text-brand-bright font-semibold border-b border-l text-center">
              Type
            </th>
            <th className="w-1/2 py-3 px-4 font-semibold border-b border-l text-left">
              Recommended Text
            </th>
          </tr>
        </thead>
        <tbody>
          {(paddedOriginal || [])?.map((heading, index) => (
            <tr key={index} className="border-t">
              <td className="w-10 py-3 px-2 border-b border-r font-semibold text-brand-bright text-center">
                {heading?.headingType || ""}
              </td>
              <td className="w-1/2 py-3 px-4 border-b  group relative">
                {heading?.headingText || ""}
                {heading?.headingText && (
                  <button
                    onClick={() => handleCopy(heading.headingText)}
                    className="invisible group-hover:visible absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <CopyIcon className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                  </button>
                )}
              </td>
              <td className="w-10 py-3 px-2 border-b border-l font-semibold text-brand-bright text-center">
                {(paddedAI[index] || {}).type || ""}
              </td>
              <td className="w-1/2 py-3 px-4 border-b border-l group relative">
                {(paddedAI[index] || {}).text || ""}
                {(paddedAI[index] || {}).text && (
                  <button
                    onClick={() => handleCopy(paddedAI[index].text)}
                    className="invisible group-hover:visible absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <CopyIcon className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HeadingsTableAI;
