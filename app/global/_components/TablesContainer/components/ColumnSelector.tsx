import React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Column } from "../types/table";

interface ColumnSelectorProps {
  columns: Column[];
  visibleColumns: string[];
  setVisibleColumns: (columns: string[]) => void;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  columns,
  visibleColumns,
  setVisibleColumns,
}) => {
  const [open, setOpen] = React.useState(false);

  const toggleColumn = (columnId: string) => {
    if (visibleColumns.includes(columnId)) {
      setVisibleColumns(visibleColumns.filter((id) => id !== columnId));
    } else {
      setVisibleColumns([...visibleColumns, columnId]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-fit p-0 h-6 pl-2 border justify-end dark:bg-brand-darker dark:text-white/50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 mr-2"
          >
            <path d="M3 3h7v7H3z" />
            <path d="M14 3h7v7h-7z" />
            <path d="M14 14h7v7h-7z" />
            <path d="M3 14h7v7H3z" />
          </svg>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] dark:bg-brand-darker dark:text-white/50 p-0">
        <Command>
          <CommandInput placeholder="Search columns..." />
          <CommandList>
            <CommandEmpty>No column found.</CommandEmpty>
            <CommandGroup>
              {columns.map((column) => (
                <CommandItem
                  key={column.accessor}
                  onSelect={() => toggleColumn(column.accessor)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      visibleColumns.includes(column.accessor)
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {column.Header}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ColumnSelector;
