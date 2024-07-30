import { Tabs } from "@mantine/core";
import React from "react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import RedirectsTable from "../RedirectsTable";

const SidebarContainer = ({ pageSpeed }: { pageSpeed: any }) => {
  return (
    <aside className="w-[30rem] h-screen border-l border-2 overflow-y-auto overflow-x-hidden flex flex-col ">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel size={200}>
          <Tabs __size="xs" defaultValue="first" className="text-xs aside-tabs">
            <Tabs.List justify="center" className="dark:text-white text-xs">
              <Tabs.Tab className="text-xs" value="first">
                {" "}
                Diagnostics
              </Tabs.Tab>
              <Tabs.Tab value="third">Improvements</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel size={200}>
          <Tabs __size="xs" defaultValue="first" className="text-xs aside-tabs">
            <Tabs.List justify="center" className="dark:text-white text-xs">
              <Tabs.Tab className="text-xs" value="first">
                {" "}
                Diagnostics
              </Tabs.Tab>
              <Tabs.Tab value="third">Improvements</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="first">
              <RedirectsTable pageSpeed={pageSpeed} />
            </Tabs.Panel>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </aside>
  );
};

export default SidebarContainer;
