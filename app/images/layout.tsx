export const dynamic = "force-static";
import MenuDrawer from "../components/ui/MenuDrawer";
import type React from "react";
import type { Metadata } from "next";
import { Playfair_Display, Roboto, Source_Sans_3 } from "next/font/google";
import { ThemeProvider } from "./components/theme-provider";

const roboto = Roboto({
  // weight: ["400"], // Specify weights you need
  subsets: ["latin"], // Optimize for Latin characters
  display: "swap", // Improves loading performance
  variable: "--font-roboto", // Optional: CSS variable name
});

export default function ImagesLayout({ children }: any) {
  return (
    <main className={`-mt-20 h-screen flex flex-col ${roboto.className}`}>
      <div className=" w-full bg-white border-b dark:border-b-brand-dark h-11 flex-none dark:bg-brand-darker">
        <div className="pt-2">
          <MenuDrawer />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </main>
  );
}
