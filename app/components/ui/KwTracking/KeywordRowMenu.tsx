import React from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname } from "next/navigation";

interface KeywordRowMenuProps {
  keywordId: string;
  removeKeyword: (id: string) => void;
  keywordIds: string[];
}

export default function KeywordRowMenu({
  keywordId,
  removeKeyword,
  keywordIds,
}: KeywordRowMenuProps) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-8 w-8" />; // Return empty space with consistent dimensions
  }

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
        className="w-[200px] dark:bg-gray-900 bg-white dark:border-brand-dark"
      >
        <DropdownMenuLabel className="text-xs dark:text-gray-400">
          Actions
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="dark:bg-gray-800" />
        <DropdownMenuItem
          onClick={() => removeKeyword(keywordId)}
          className="text-red-600 dark:text-red-400 focus:bg-blue-100 dark:focus:bg-blue-900 cursor-pointer"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
