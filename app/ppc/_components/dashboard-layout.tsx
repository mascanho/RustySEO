"use client";

import type React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  LayoutDashboard,
  FileText,
  Settings,
  HelpCircle,
  Eye,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onAddNew?: () => void;
  activeView: string;
  onViewChange: (view: string) => void;
}

export function DashboardLayout({
  children,
  onAddNew,
  activeView,
  onViewChange,
}: DashboardLayoutProps) {
  return (
    <div className="flex flex-col h-screen w-full">
      {" "}
      {/* Changed to flex-col and h-screen */}
      {/* Fixed Top Header */}
      <header className="h-14 border-b dark:border-brand-dark bg-white dark:bg-brand-darker flex items-center px-4 z-10">
        <SidebarTrigger className="mr-4 dark:text-white/50" />{" "}
        {/* Moved trigger here */}
        <div className="font-bold text-lg text-brand-bright">
          Google Ads Simulator
        </div>
        {/* Add more header elements here if needed, e.g., user profile, notifications */}
      </header>
      {/* Main content area: Sidebar + Children */}
      <div className="flex flex-1 overflow-hidden">
        {" "}
        {/* flex-1 to take remaining height, overflow-hidden for internal scrolling */}
        <Sidebar>
          <SidebarHeader className="dark:border-brand-dark">
            <div className="flex items-center px-2 py-3">
              <div className="flex items-center gap-2">
                {/* <div className="h-8 w-8 rounded-full bg-primary dark:bg-brand-bright flex items-center justify-center text-primary-foreground font-bold"> */}
                {/*   A */}
                {/* </div> */}
                {/* This was moved to the main header */}
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="pl-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === "dashboard"}
                  onClick={() => onViewChange("dashboard")}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === "ads"} // Simplified isActive logic
                  onClick={() => {
                    onViewChange("ads");
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new CustomEvent("clearSelectedAd"));
                    }
                  }}
                >
                  <FileText className="h-4 w-4" />
                  <span>My Ads</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === "previews"}
                  onClick={() => onViewChange("previews")}
                >
                  <Eye className="h-4 w-4" />
                  <span>Previews</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* <SidebarMenuItem> */}
              {/*   <SidebarMenuButton */}
              {/*     isActive={activeView === "settings"} */}
              {/*     onClick={() => onViewChange("settings")} */}
              {/*   > */}
              {/*     <Settings className="h-4 w-4" /> */}
              {/*     <span>Settings</span> */}
              {/*   </SidebarMenuButton> */}
              {/* </SidebarMenuItem> */}
              {/* <SidebarMenuItem> */}
              {/*   <SidebarMenuButton */}
              {/*     isActive={activeView === "help"} */}
              {/*     onClick={() => onViewChange("help")} */}
              {/*   > */}
              {/*     <HelpCircle className="h-4 w-4" /> */}
              {/*     <span>Help</span> */}
              {/*   </SidebarMenuButton> */}
              {/* </SidebarMenuItem> */}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t dark:border-brand-dark">
            <div className="p-2 pt-1">
              {onAddNew && (
                <Button
                  className="w-full dark:hover:bg-brand-bright/80 bg-brand-bright dark:bg-brand-bright dark:text-white"
                  size="sm"
                  onClick={onAddNew}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Ad
                </Button>
              )}
            </div>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {" "}
          {/* flex-1 to take remaining width, overflow-auto for content scrolling */}
          {children}
        </main>
      </div>
    </div>
  );
}
