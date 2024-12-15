import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import { FaGoogle, FaYahoo, FaSearch, FaCopy } from "react-icons/fa";
import { FiTrendingUp } from "react-icons/fi";
import { SiDuckduckgo } from "react-icons/si";
import { toast } from "sonner";

import { BiLogoBing } from "react-icons/bi";

const TopicsMenu = ({ children, entry }: { children: any; entry: any }) => {
  const keyword = encodeURIComponent(entry?.keyword || "");

  const copyKeyword = () => {
    navigator.clipboard.writeText(decodeURIComponent(keyword));
    toast.success("Keyword copied to clipboard");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className="relative bg-brand-darker border shadow-lg px-0.5 bg-white dark:bg-brand-darker dark:border-brand-dark dark:text-white mt-1.5 mr-6 w-fit text-xs z-[999999]">
        <div
          className="absolute -top-1.5 left-2  w-3 h-2 dark:bg-white bg-black/50 border-t border-l border-inherit"
          style={{ transformOrigin: "center" }}
        />
        <DropdownMenuLabel className="font-semibold text-xs">
          Check Keyword
        </DropdownMenuLabel>

        <DropdownMenuItem
          onClick={copyKeyword}
          className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight text-xs cursor-pointer"
        >
          <FaCopy className="mr-2" /> Copy Keyword
        </DropdownMenuItem>

        <DropdownMenuSeparator className="dark:bg-white/20 bg-black/20" />

        <DropdownMenuItem
          onClick={() =>
            openBrowserWindow(`https://www.google.com/search?q=${keyword}`)
          }
          className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight text-xs cursor-pointer"
        >
          <FaGoogle className="mr-2" /> Google
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            openBrowserWindow(`https://www.bing.com/search?q=${keyword}`)
          }
          className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight text-xs cursor-pointer"
        >
          <BiLogoBing className="mr-2" /> Bing
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            openBrowserWindow(`https://search.yahoo.com/search?p=${keyword}`)
          }
          className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight text-xs cursor-pointer"
        >
          <FaYahoo className="mr-2" /> Yahoo
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            openBrowserWindow(`https://yandex.com/search/?text=${keyword}`)
          }
          className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight text-xs cursor-pointer"
        >
          <FaSearch className="mr-2" /> Yandex
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            openBrowserWindow(
              `https://trends.google.com/trends/explore?q=${keyword}`,
            )
          }
          className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight text-xs cursor-pointer"
        >
          <FiTrendingUp className="mr-2" /> Google Trends
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            openBrowserWindow(`https://duckduckgo.com/?q=${keyword}`)
          }
          className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight text-xs cursor-pointer"
        >
          <SiDuckduckgo className="mr-2" /> DuckDuckGo
        </DropdownMenuItem>

        <DropdownMenuSeparator className="dark:bg-white/20 bg-black/20" />

        <DropdownMenuItem
          onClick={() =>
            openBrowserWindow(
              `https://search.google.com/search-console/performance/search-analytics?query=${keyword}`,
            )
          }
          className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight text-xs cursor-pointer"
        >
          <FaGoogle className="mr-2" /> Search Console
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            openBrowserWindow(
              `https://app.neilpatel.com/en/ubersuggest/keyword/${keyword}`,
            )
          }
          className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight text-xs cursor-pointer"
        >
          <FaSearch className="mr-2" /> Ubersuggest
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            openBrowserWindow(
              `https://www.semrush.com/analytics/overview/?q=${keyword}`,
            )
          }
          className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight text-xs cursor-pointer"
        >
          <FaSearch className="mr-2" /> SEMrush
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            openBrowserWindow(
              `https://ahrefs.com/keywords-explorer/google/search-volume?q=${keyword}`,
            )
          }
          className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight text-xs cursor-pointer"
        >
          <FiTrendingUp className="mr-2" /> Ahrefs
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TopicsMenu;
