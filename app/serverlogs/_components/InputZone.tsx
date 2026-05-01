// @ts-nocheck
"use client";
import MenuDrawer from "@/app/components/ui/MenuDrawer";
import React from "react";
import UploadButton from "./UploadButton";

interface InputZoneProps {
  handleDomainCrawl: (url: string) => void; // Fixed prop type
}

const InputZone = ({ handleDomainCrawl }: InputZoneProps) => {
  return (
    <div className="fixed top-[28px] left-0 right-0 z-[2000] h-11 border-b  bg-white dark:bg-brand-darker flex items-center px-4 dark:border-b-brand-dark">
      <MenuDrawer />
      <UploadButton />
    </div>
  );
};

export default InputZone;
