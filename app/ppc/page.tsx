// @ts-nocheck
"use client";
export const dynamic = "force-static";
import { AiOutlineCluster } from "react-icons/ai";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { invoke } from "@/lib/invoke";
import MenuDrawer from "../components/ui/MenuDrawer";
import { FaChevronDown } from "react-icons/fa";
import Loader from "@/components/Loader/Loader";
import { CiGlobe } from "react-icons/ci";
import { IoIosClose } from "react-icons/io";
import { AdDashboard } from "./_components/ad-dashboard";
import { SidebarProvider } from "@/components/ui/sidebar";

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  return (
    <section className="h-full overflow-y-clip flex">
      <Loader />

      {/* Fixed Input and Crawl Button */}
      <div className="fixed top-[28px] left-0 right-0 z-[2000] h-11 border-b  bg-white dark:bg-brand-darker flex items-center px-4 dark:border-b-brand-dark">
        <MenuDrawer />
        {/* SEARCH STARTS HERE  */}
        {/* <section className="flex items-center justify-end mx-auto relative w-full max-w-[42.8rem] border-r border-l pl-4 dark:border-l-brand-dark dark:border-r-brand-dark h-full pr-4"> */}
        {/*   <div className="flex items-center w-full"></div> */}
        {/* </section> */}
      </div>
      <main className="overflow-hidden w-full">
        <SidebarProvider>
          <AdDashboard />
        </SidebarProvider>
      </main>
    </section>
  );
};

export default Home;
