export const dynamic = "force-static";
import MenuDrawer from "../components/ui/MenuDrawer";
import type React from "react";
import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import { ThemeProvider } from "./components/theme-provider";

export default function ImagesLayout({ children }: any) {
  return (
    <main className="-mt-20 h-full">
      <div className="dark:bg-brand-darker w-full bg-white border-b dark:border-b-brand-dark h-11">
        <div className="pt-2">
          <MenuDrawer />
        </div>
      </div>
      {children}
    </main>
  );
}
