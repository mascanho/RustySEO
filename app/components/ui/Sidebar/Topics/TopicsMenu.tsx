import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";

const TopicsMenu = ({ children, entry }: { children: any; entry: any }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className="bg-brand-darker border shadow shadow-lg  px-0.5 bg-white dark:bg-brand-darker  dark:border-brand-dark dark:text-white mt-1.5 mr-6 w-fit text-xs">
        <DropdownMenuLabel className="font-semibold text-xs">
          Check Keyword
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            openBrowserWindow(
              `https://www.google.com/search?q=${encodeURIComponent(entry?.keyword || "")}`,
            )
          }
          className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight text-xs cursor-pointer"
        >
          Google
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            openBrowserWindow(
              `https://www.bing.com/search?q=${encodeURIComponent(entry?.keyword || "")}`,
            )
          }
          className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight text-xs cursor-pointer"
        >
          Bing
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            openBrowserWindow(
              `https://search.yahoo.com/search?p=${encodeURIComponent(entry?.keyword || "")}`,
            )
          }
          className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight text-xs cursor-pointer"
        >
          Yahoo
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            openBrowserWindow(
              `https://yandex.com/search/?text=${encodeURIComponent(entry?.keyword || "")}`,
            )
          }
          className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight text-xs cursor-pointer"
        >
          Yandex
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            openBrowserWindow(
              `https://trends.google.com/trends/explore?q=${encodeURIComponent(entry?.keyword || "")}`,
            )
          }
          className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight text-xs cursor-pointer"
        >
          Google Trends
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            openBrowserWindow(
              `https://duckduckgo.com/?q=${encodeURIComponent(entry?.keyword || "")}`,
            )
          }
          className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight text-xs cursor-pointer"
        >
          DuckDuckGo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TopicsMenu;
