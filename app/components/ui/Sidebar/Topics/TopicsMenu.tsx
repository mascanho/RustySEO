import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import { FaGoogle, FaYahoo, FaSearch } from "react-icons/fa";
import { FiTrendingUp } from "react-icons/fi";
import { SiMicrosoftbing, SiDuckduckgo } from "react-icons/si";

const TopicsMenu = ({ children, entry }: { children: any; entry: any }) => {
  const keyword = encodeURIComponent(entry?.keyword || "");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className="bg-brand-darker border shadow shadow-lg  px-0.5 bg-white dark:bg-brand-darker  dark:border-brand-dark dark:text-white mt-1.5 mr-6 w-fit text-xs">
        <DropdownMenuLabel className="font-semibold text-xs">
          Check Keyword
        </DropdownMenuLabel>

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
          <SiMicrosoftbing className="mr-2" /> Bing
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

        <DropdownMenuSeparator />

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
