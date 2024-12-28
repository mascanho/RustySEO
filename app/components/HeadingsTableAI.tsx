import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type HeadingData = {
  type: string;
  text: string;
};

const HeadingsTableAI = ({
  aiHeadings,
  headings,
}: {
  aiHeadings: string;
  headings: string[];
}) => {
  // make the string into an array of objects
  const headingsData = aiHeadings.split("\n").map((heading) => {
    const [type, text] = heading.split(": ");
    return { type, text };
  });

  console.log(headingsData, "headingsData Fixed");

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
    <div className="flex bg-white rounded-lg  shadow-md overflow-auto h-[690px] border-0 -mt-6 ">
      <div className="rounded-lg bg-white border dark:border-brand-darker flex ">
        <Table className="text-xs headings_table relative">
          <TableHeader className="sticky top-0 bg-white  z-10">
            <TableRow>
              <TableHead className="py-0 text-brand-bright font-semibold">
                Type
              </TableHead>
              <TableHead className="py-0">Original Text</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {headings.map((heading, index) => {
              const processedHeading = processLink(heading);
              return (
                <TableRow key={index} className="h-1">
                  <TableCell className="font-medium text-brand-bright py-0 max-w-1 border-0">
                    {processedHeading.headingType}
                  </TableCell>
                  <TableCell className="py-0 w-full text-[9px] border-0">
                    {processedHeading.headingText}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <Table className="text-xs headings_table relative">
          <TableHeader className="sticky top-0 bg-white  z-10">
            <TableRow>
              <TableHead className="py-0 text-brand-bright font-semibold">
                Type
              </TableHead>
              <TableHead className="py-0">Recomended Text</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {headingsData.map((heading, index) => (
              <TableRow key={index} className="h-1">
                <TableCell className="font-medium py-0 max-w-1 border-0 text-brand-bright">
                  {heading.type}
                </TableCell>
                <TableCell className="py-0 w-full text-[9px] border-0">
                  {heading.text}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default HeadingsTableAI;
