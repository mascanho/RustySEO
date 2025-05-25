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
    <div className="flex  w-full h-full pb-8">
      <Sidebar>
        <SidebarHeader className=" dark:border-brand-dark">
          <div className="flex items-center px-2 py-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary dark:bg-brand-bright flex items-center justify-center text-primary-foreground font-bold">
                A
              </div>
              <div className="font-semibold text-lg">Ad Generator</div>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
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
                isActive={
                  activeView === "ads" &&
                  !onViewChange.toString().includes("setSidebarView")
                }
                onClick={() => {
                  onViewChange("ads");
                  // If there's a selected ad in the parent component, we need to clear it
                  if (typeof window !== "undefined") {
                    // Dispatch a custom event that the parent can listen for
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
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activeView === "settings"}
                onClick={() => onViewChange("settings")}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activeView === "help"}
                onClick={() => onViewChange("help")}
              >
                <HelpCircle className="h-4 w-4" />
                <span>Help</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t dark:border-brand-dark">
          <div className="p-2 pt-1">
            {onAddNew && (
              <Button
                className="w-full bg-brand-bright dark:bg-brand-bright dark:text-white"
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
      <div className="flex-1 overflow-auto w-full mt-[4.45rem]">
        <div className="flex h-[4.8rem] items-center border-b dark:border-brand-dark px-4 -mt-2">
          <SidebarTrigger className="ml-2 dark:text-white/50" />
          <div className="ml-4 font-medium dark:text-white/50">
            Google Ads Generator
          </div>
        </div>
        <main className="p-4 md:p-6  ">{children}</main>
      </div>
    </div>
  );
}
