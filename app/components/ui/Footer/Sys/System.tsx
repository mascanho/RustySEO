import ConsoleLog from "@/app/global/_components/Sidebar/ConsoleLog/ConsoleLog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { GiGearStickPattern } from "react-icons/gi";
import SystemInfo from "./SystemInfo";

function System() {
  const [open, setOpen] = useState(false);

  async function handleClick() {
    const sys = await invoke("get_system", {});

    console.log(sys);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger onClick={() => setOpen(!open)}>
        {" "}
        <GiGearStickPattern className={`${open ? "text-brand-bright" : ""}`} />
      </PopoverTrigger>
      <PopoverContent className="m-0 mb-3 mr-2 p-1 min-w-80  h-[390px] overflow-hidden dark:bg-brand-darker">
        <Tabs>
          <TabsList className="border dark:border-brand-dark w-fit flex justify-around">
            <TabsTrigger className="active:bg-brand-bright" value="logs">
              Logs
            </TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="logs">
            <ConsoleLog />
          </TabsContent>

          <TabsContent
            value="system"
            className="overflow-hidden m-0 p-0 w-full"
          >
            <SystemInfo />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

export default System;
