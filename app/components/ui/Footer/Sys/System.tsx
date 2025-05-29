import ConsoleLog from "@/app/global/_components/Sidebar/ConsoleLog/ConsoleLog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { GiGearStickPattern } from "react-icons/gi";

function System() {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger onClick={() => setOpen(!open)}>
        {" "}
        <GiGearStickPattern className={`${open ? "text-brand-bright" : ""}`} />
      </PopoverTrigger>
      <PopoverContent className="m-0 mb-3 mr-2 p-1 min-w-80 dark:bg-brand-darker">
        <ConsoleLog />
      </PopoverContent>
    </Popover>
  );
}

export default System;
