import React from "react";
import { Row } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import KeywordRowMenu from "./KeywordRowMenu";

interface KeywordRowProps {
  row: Row<any>;
  index: number;
  removeKeyword: (id: string) => void;
}

export default function KeywordRow({
  row,
  index,
  removeKeyword,
}: KeywordRowProps) {
  return (
    <tr className="hover:bg-gray-100">
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
      <td className="px-6 py-4 whitespace-nowrap">
        <KeywordRowMenu
          keywordId={row.original.id}
          removeKeyword={removeKeyword}
        />
      </td>
    </tr>
  );
}
