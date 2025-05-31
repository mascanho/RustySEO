// @ts-nocheck
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { FaClipboard, FaRegClipboard } from "react-icons/fa6";
import { GoSearch } from "react-icons/go";
import {
  IoLogoGoogle,
  IoLogoMicrosoft,
  IoLogoYoutube,
  IoLogoTwitter,
  IoLogoReddit,
  IoLogoGithub,
  IoLogoLinkedin,
  IoEarthSharp,
} from "react-icons/io5";
import { PiGooglePodcastsLogo } from "react-icons/pi";
import { SiAskfm, SiBrave, SiDuckduckgo, SiEcosia } from "react-icons/si";
import { toast } from "sonner";
import { DiYahooSmall } from "react-icons/di";

export default function ContextTableMenu({ children, data }) {
  function handleCopyToClipboard() {
    navigator.clipboard.writeText(data);
    toast.success("Copied to clipboard");
  }

  const gscURL = `https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3A${data}&page=*${data}`;

  // Search engine URLs
  const searchEngines = [
    {
      name: "Google",
      icon: <IoLogoGoogle className="mr-2" />,
      url: `https://www.google.com/search?q=${data}`,
    },
    {
      name: "Bing",
      icon: <IoLogoMicrosoft className="mr-2" />,
      url: `https://www.bing.com/search?q=${data}`,
    },
    {
      name: "DuckDuckGo",
      icon: <SiDuckduckgo className="mr-2" />,
      url: `https://duckduckgo.com/?q=${data}`,
    },
    {
      name: "Yahoo",
      icon: <DiYahooSmall className="mr-2" />,
      url: `https://search.yahoo.com/search?p=${data}`,
    },
    {
      name: "Ecosia",
      icon: <SiEcosia className="mr-2" />,
      url: `https://www.ecosia.org/search?q=${data}`,
    },
    {
      name: "Brave",
      icon: <SiBrave className="mr-2" />,
      url: `https://search.brave.com/search?q=${data}`,
    },
    {
      name: "Ask",
      icon: <SiAskfm className="mr-2" />,
      url: `https://www.ask.com/web?q=${data}`,
    },
    {
      name: "GitHub",
      icon: <IoLogoGithub className="mr-2" />,
      url: `https://github.com/search?q=${data}`,
    },
    {
      name: "LinkedIn",
      icon: <IoLogoLinkedin className="mr-2" />,
      url: `https://www.linkedin.com/search/results/all/?keywords=${data}`,
    },
    {
      name: "Wayback Machine",
      icon: <IoEarthSharp className="mr-2" />,
      url: `https://web.archive.org/web/*/${data}`,
    },
  ];

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="text-xs rounded-sm p-0 m-0 dark:bg-brand-darker dark:border-brand-dark w-44">
        <ContextMenuItem onClick={handleCopyToClipboard} className="text-xs">
          <FaRegClipboard className="mr-2" /> Copy URL
        </ContextMenuItem>

        <ContextMenuSeparator className="p-0 m-0 dark:bg-brand-dark" />

        <a
          className="flex items-center text-xs w-full"
          href={data}
          target="_blank"
          rel="noreferrer"
        >
          <ContextMenuItem className="text-xs cursor-pointer w-full">
            <PiGooglePodcastsLogo className="mr-2" /> Open URL
          </ContextMenuItem>
        </a>

        <ContextMenuSub>
          <ContextMenuSubTrigger className="text-xs">
            <GoSearch className="mr-2" /> Search on...
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 text-xs dark:bg-brand-darker dark:border-brand-dark">
            {searchEngines.map((engine, index) => (
              <a
                key={index}
                className="flex items-center w-full cursor-pointer hover:bg-gray-100 dark:hover:bg-brand-dark"
                href={engine.url}
                target="_blank"
                rel="noreferrer"
              >
                <ContextMenuItem className="text-xs w-full cursor-pointer">
                  {engine.icon}
                  {engine.name}
                </ContextMenuItem>
              </a>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator className="p-0 m-0 dark:bg-brand-dark" />

        <ContextMenuItem className="text-xs">
          <a
            className="flex items-center"
            href={gscURL}
            target="_blank"
            rel="noreferrer"
          >
            <PiGooglePodcastsLogo className="mr-2" /> Open in Search Console
          </a>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
