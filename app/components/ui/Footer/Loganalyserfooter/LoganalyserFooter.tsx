"use client";

import * as React from "react";

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
import { FaFolder } from "react-icons/fa";

type Status = {
  value: string;
  label: string;
};

const statuses: Status[] = [
  {
    value: "www.slimstock.com",
    label: "www.slimstock.com",
  },
  {
    value: "todo",
    label: "www.algarvewonders.com",
  },
  {
    value: "in progress",
    label: "In Progress",
  },
  {
    value: "done",
    label: "Done",
  },
  {
    value: "canceled",
    label: "Canceled",
  },
];

function LogAnalyserFooter() {
  const [open, setOpen] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState<Status | null>(
    null,
  );

  return (
    <div className="flex items-center space-x-4 text-xs mt-[1px] ml-1">
      <FaFolder className="-mr-2  text-sm   " />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="default"
            className="w-fit max-w-[200px] bg-gray-800 border border-t-gray-700 border-l-gray-700 border-r-gray-900 border-b-gray-900 rounded-sm shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)] dark:border-t-gray-600 dark:border-l-gray-600 dark:border-r-gray-900 dark:border-b-gray-900 dark:bg-brand-bright dark:text-white text-white dark:hover:bg-brand-bright/80 justify-start truncate text-[10px] px-2 m-0 h-3 transform scale-[0.98]"
          >
            {" "}
            {selectedStatus ? (
              <div className="">{selectedStatus?.label}</div>
            ) : (
              <>Select project...</>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 mb-10 absolute -bottom-6"
          side="left"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Change status..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {statuses.map((status) => (
                  <CommandItem
                    key={status.value}
                    value={status.value}
                    onSelect={(value) => {
                      setSelectedStatus(
                        statuses.find((priority) => priority.value === value) ||
                          null,
                      );
                      setOpen(false);
                    }}
                  >
                    {status.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default LogAnalyserFooter;
