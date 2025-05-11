import React from "react";
import { Row } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import KeywordRowMenu from "./KeywordRowMenu";

interface KeywordRowProps {
  row: Row<any>;
  index: number;
  removeKeyword: (id: string) => void;
  keywordIds: string[];
}

export default function KeywordRow({
  row,
  index,
  removeKeyword,
  keywordIds,
}: KeywordRowProps) {
  if (!row?.original?.id) {
    console.error("Missing row data:", row);
    return null; // or a fallback row
  }

  return (
    <tr className="overflow-hidden dark:border" style={{ height: "10px" }}>
      {row?.getVisibleCells().map((cell) => (
        <td key={cell.id} className="px-6 py-0 whitespace-nowrap">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
      <td className="px-2 py-0 whitespace-nowrap ">
        <KeywordRowMenu
          keywordId={row?.original?.id || index}
          removeKeyword={removeKeyword}
          keywordIds={keywordIds}
        />
      </td>
    </tr>
  );
}
