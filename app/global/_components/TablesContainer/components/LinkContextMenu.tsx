// @ts-nocheck
// SEO-focused context menu for From/To link cells, shared by the Inlinks and
// Outlinks subtables. Opens on click (Mantine's default Menu trigger) right
// where the link was clicked.
import React from "react";
import { Menu, Divider } from "@mantine/core";
import {
  IconCopy,
  IconExternalLink,
  IconEye,
  IconSearch,
  IconBrandGoogle,
  IconBrandFacebook,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconShare,
  IconShieldCheck,
  IconCircleCheck,
  IconCode,
  IconArchive,
  IconQuote,
  IconDeviceMobile,
  IconLock,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { open as openExternalUrl } from "@tauri-apps/plugin-shell";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";

interface LinkContextMenuProps {
  url?: string | null;
  role: "source" | "target"; // "source" = From column, "target" = To column
  anchorText?: string | null;
  statusCode?: number | string | null;
  // Set when the parent row is highlighted with a blue background (e.g. the
  // clicked/selected row in LinksTable). The default hover state tints the
  // link brand-blue, which becomes unreadable against that background, so
  // this forces white text instead of the usual hover color.
  forceWhiteText?: boolean;
  children: React.ReactNode;
}

const statusColor = (code: number | null) => {
  if (code === null) return "text-gray-400";
  if (code === 200) return "text-green-500";
  if (code === 429) return "text-red-500";
  if (code >= 300 && code < 400) return "text-amber-500";
  if (code >= 400) return "text-red-500";
  return "text-gray-400";
};

const parseStatus = (raw: number | string | null | undefined): number | null => {
  if (raw === null || raw === undefined) return null;
  const n = typeof raw === "number" ? raw : parseInt(String(raw), 10);
  return Number.isNaN(n) ? null : n;
};

const LinkContextMenu: React.FC<LinkContextMenuProps> = ({
  url,
  role,
  anchorText,
  statusCode,
  forceWhiteText = false,
  children,
}) => {
  const actions = useGlobalCrawlStore((state) => state.actions);
  const { selectURL } = actions.data;
  const { setDeepCrawlTab } = actions.ui;

  const code = parseStatus(statusCode);
  const hostname = (() => {
    try {
      return url ? new URL(url).hostname : "";
    } catch {
      return "";
    }
  })();

  const openExternal = async (link: string) => {
    try {
      await openExternalUrl(link);
    } catch (err) {
      toast.error(`Failed to open: ${err}`);
    }
  };

  const handleCopyURL = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const handleCopyAnchor = () => {
    if (!anchorText) return;
    navigator.clipboard.writeText(anchorText);
    toast.success("Anchor text copied to clipboard");
  };

  const handleOpenInBrowser = () => {
    if (!url) return;
    openExternal(url);
  };

  const handleViewInTable = () => {
    if (!url) return;
    selectURL(url);
    setDeepCrawlTab("crawledPages");
    toast.success("Page focused in crawl table");
  };

  if (!url) return <>{children}</>;

  const encoded = encodeURIComponent(url);
  const gscUrl = hostname
    ? `https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3A${hostname}&page=*${encoded}`
    : null;

  return (
    <Menu
      shadow="md"
      width={230}
      position="bottom-start"
      withArrow
      transitionProps={{ transition: "pop", duration: 150 }}
    >
      <Menu.Target>
        {/* div (not span) so block-level children, like TruncatedCell in the
            big Internal/External Links tables, nest without invalid HTML. */}
        <div
          className={
            forceWhiteText
              ? "cursor-pointer hover:underline decoration-dotted text-white"
              : "cursor-pointer hover:underline hover:text-brand-bright decoration-dotted"
          }
        >
          {children}
        </div>
      </Menu.Target>

      <Menu.Dropdown className="dark:bg-brand-dark dark:border-brand-dark p-1 z-[300]">
        {/* Contextual info header */}
        {code !== null && (
          <div className="px-2 pt-1 pb-1.5 mb-1 border-b dark:border-brand-darker">
            <span className={`text-[10px] font-semibold ${statusColor(code)}`}>
              {code}
            </span>
          </div>
        )}

        <Menu.Item
          leftSection={<IconExternalLink size={14} className="text-blue-500" />}
          onClick={handleOpenInBrowser}
          className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs py-1.5"
        >
          Open in Browser
        </Menu.Item>

        <Menu.Item
          leftSection={<IconEye size={14} className="text-emerald-500" />}
          onClick={handleViewInTable}
          className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs py-1.5"
        >
          View Page Details
        </Menu.Item>

        <Menu.Item
          leftSection={<IconCopy size={14} className="text-gray-400" />}
          onClick={handleCopyURL}
          className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs py-1.5"
        >
          Copy URL
        </Menu.Item>

        {anchorText && (
          <Menu.Item
            leftSection={<IconQuote size={14} className="text-gray-400" />}
            onClick={handleCopyAnchor}
            className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs py-1.5"
          >
            Copy Anchor Text
          </Menu.Item>
        )}

        <Divider className="my-1 dark:border-brand-darker" />

        <Menu.Item
          leftSection={<IconSearch size={14} className="text-blue-400" />}
          onClick={() =>
            openExternal(`https://www.google.com/search?q=site:${encoded}`)
          }
          className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs py-1.5"
        >
          Check Indexing (site:)
        </Menu.Item>

        {gscUrl && (
          <Menu.Item
            leftSection={<IconBrandGoogle size={14} className="text-red-500" />}
            onClick={() => openExternal(gscUrl)}
            className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs py-1.5"
          >
            Search Console Performance
          </Menu.Item>
        )}

        <Divider className="my-1 dark:border-brand-darker" />

        <Menu
          shadow="xs"
          width={190}
          trigger="hover"
          position="right-start"
          portalProps={{ className: "z-[310]" }}
        >
          <Menu.Target>
            <Menu.Item
              leftSection={<IconCircleCheck size={14} className="text-amber-500" />}
              className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs py-1.5"
            >
              Validate &amp; Test
            </Menu.Item>
          </Menu.Target>
          <Menu.Dropdown className="dark:bg-brand-dark dark:border-brand-dark dark:text-gray-200 p-1">
            <Menu.Item
              leftSection={<IconBrandGoogle size={14} className="text-red-500" />}
              onClick={() =>
                openExternal(`https://pagespeed.web.dev/analysis?url=${encoded}`)
              }
              className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs"
            >
              PageSpeed Insights
            </Menu.Item>
            <Menu.Item
              leftSection={<IconSearch size={14} className="text-blue-400" />}
              onClick={() =>
                openExternal(
                  `https://search.google.com/test/rich-results?url=${encoded}`,
                )
              }
              className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs"
            >
              Rich Results Test
            </Menu.Item>
            <Menu.Item
              leftSection={<IconDeviceMobile size={14} className="text-green-500" />}
              onClick={() =>
                openExternal(
                  `https://search.google.com/test/mobile-friendly?url=${encoded}`,
                )
              }
              className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs"
            >
              Mobile-Friendly Test
            </Menu.Item>
            <Menu.Item
              leftSection={<IconCode size={14} className="text-amber-500" />}
              onClick={() =>
                openExternal(`https://validator.schema.org/#url=${encoded}`)
              }
              className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs"
            >
              Schema Validator
            </Menu.Item>
            <Menu.Item
              leftSection={<IconCode size={14} className="text-blue-500" />}
              onClick={() => openExternal(`https://validator.w3.org/nu/?doc=${encoded}`)}
              className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs"
            >
              W3C HTML Validator
            </Menu.Item>
            <Menu.Item
              leftSection={<IconShieldCheck size={14} className="text-purple-500" />}
              onClick={() =>
                openExternal(
                  `https://securityheaders.com/?q=${encoded}&followRedirects=on`,
                )
              }
              className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs"
            >
              Security Headers
            </Menu.Item>
            <Menu.Item
              leftSection={<IconLock size={14} className="text-emerald-500" />}
              onClick={() =>
                openExternal(
                  `https://www.ssllabs.com/ssltest/analyze.html?d=${hostname}`,
                )
              }
              className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs"
              disabled={!hostname}
            >
              SSL Server Test
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>

        <Menu
          shadow="xs"
          width={190}
          trigger="hover"
          position="right-start"
          portalProps={{ className: "z-[310]" }}
        >
          <Menu.Target>
            <Menu.Item
              leftSection={<IconShare size={14} className="text-indigo-400" />}
              className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs py-1.5"
            >
              Social Previews
            </Menu.Item>
          </Menu.Target>
          <Menu.Dropdown className="dark:bg-brand-dark dark:border-brand-dark dark:text-gray-200 p-1">
            <Menu.Item
              leftSection={<IconEye size={14} className="text-gray-400" />}
              onClick={() => openExternal(`https://www.opengraph.xyz/url/${encoded}`)}
              className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs"
            >
              OpenGraph Debugger
            </Menu.Item>
            <Menu.Item
              leftSection={<IconCode size={14} className="text-gray-400" />}
              onClick={() => openExternal(`https://metatags.io/?url=${encoded}`)}
              className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs"
            >
              Meta Tags Checker
            </Menu.Item>
            <Menu.Item
              leftSection={<IconBrandFacebook size={14} className="text-blue-600" />}
              onClick={() =>
                openExternal(
                  `https://developers.facebook.com/tools/debug/?q=${encoded}`,
                )
              }
              className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs"
            >
              Facebook Debugger
            </Menu.Item>
            <Menu.Item
              leftSection={<IconBrandTwitter size={14} className="text-sky-400" />}
              onClick={() => openExternal(`https://cards-dev.twitter.com/validator`)}
              className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs"
            >
              X / Twitter Card Validator
            </Menu.Item>
            <Menu.Item
              leftSection={<IconBrandLinkedin size={14} className="text-blue-700" />}
              onClick={() =>
                openExternal(
                  `https://www.linkedin.com/post-inspector/inspect/${encoded}`,
                )
              }
              className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs"
            >
              LinkedIn Post Inspector
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>

        <Menu.Item
          leftSection={<IconArchive size={14} className="text-gray-400" />}
          onClick={() => openExternal(`https://web.archive.org/web/*/${encoded}`)}
          className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs py-1.5"
        >
          Wayback Machine
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};

export default LinkContextMenu;
