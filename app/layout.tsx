import "@mantine/core/styles.css";
import { Roboto } from "next/font/google";
import "./globals.css";
import { MantineProvider } from "@mantine/core";
import MenuDrawer from "./components/ui/MenuDrawer";
import TopMenuBar from "./components/ui/TopMenuBar";

import { Toaster } from "@/components/ui/sonner";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-roboto",
});

// export const metadata: Metadata = {
//   title: "Create Next App",
//   description: "Generated by create next app",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="min-w-[600px]">
      <body
        className={`relative overflow-x-hidden overflow-y-scroll rounded-md bg-white dark:bg-[#636363] ${roboto.className}`}
      >
        <MantineProvider>
          {/* Fixed MenuDrawer */}

          <TopMenuBar />
          <div className="fixed top-7 pl-6  bg-apple-silver h-10 overflow-hidden   border-b shadow w-full overflow-x-hidden z-[1000]  ">
            <MenuDrawer />
          </div>
          {/* Main Content Area */}
          <main className="mt-16 p-6 rounded-md  bg-brand-gradient ">
            {children}
            <Toaster />
          </main>
        </MantineProvider>
      </body>
    </html>
  );
}
