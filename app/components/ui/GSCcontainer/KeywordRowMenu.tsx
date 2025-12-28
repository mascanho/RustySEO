import React from "react";
import { MoreHorizontal, Edit, Trash2, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { invoke } from "@/lib/invoke";
import { emit } from "@/lib/tauri-compat";
import { toast } from "sonner";

interface KeywordRowMenuProps {
  keywordId: string;
  removeKeyword: (id: string) => void;
  keywordIds: string[];
}

// Just adding a comment here....

export default function KeywordRowMenu({
  keywordId,
  removeKeyword,
  keywordIds,
}: KeywordRowMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 focus:ring-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[200px] dark:bg-gray-900 bg-white"
      >
        <DropdownMenuLabel className="text-xs dark:text-gray-400">
          Actions
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => console.log("Edit keyword", keywordId)}
          className="focus:bg-blue-100 dark:focus:bg-blue-900 cursor-pointer"
        >
          <Edit className="mr-2 h-4 w-4" />
          <span className="dark:text-gray-200">Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => console.log("View details", keywordId)}
          className="focus:bg-blue-100 dark:focus:bg-blue-900 cursor-pointer"
        >
          <BarChart2 className="mr-2 h-4 w-4" />
          <span className="dark:text-gray-200">View Details</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="dark:bg-gray-800" />
        <DropdownMenuItem
          onClick={() => removeKeyword(keywordId.toString())}
          className="text-red-600 dark:text-red-400 focus:bg-blue-100 dark:focus:bg-blue-900 cursor-pointer"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
