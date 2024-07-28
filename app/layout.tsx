import "@mantine/core/styles.css";
import { Roboto } from "next/font/google";
import "./globals.css";
import { MantineProvider } from "@mantine/core";
import MenuDrawer from "./components/ui/MenuDrawer";
import TopMenuBar from "./components/ui/TopMenuBar";

import { Toaster } from "@/components/ui/sonner";
import Footer from "./components/ui/Footer";

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
        className={`relative overflow-x-visible overflow-hidden rounded-md bg-white dark:bg-brand-dark ${roboto.className}`}
      >
        <MantineProvider>
          {/* Fixed MenuDrawer */}
          <section className="mb-28">
            <TopMenuBar />
          </section>
          {/* <div className="fixed top-7 pl-6  bg-white  dark:bg-brand-darker   dark:border-gray-800  w-full overflow-hidden z-[1000]  "> */}
          {/*   <MenuDrawer /> */}
          {/* </div> */}
          <main className="mt-10   rounded-md  ">
            {children}
            <Toaster />
          </main>
          <Footer />
        </MantineProvider>
      </body>
    </html>
  );
}
