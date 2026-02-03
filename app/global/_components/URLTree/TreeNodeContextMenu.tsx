import React, { useState } from "react";
import { Menu, Divider } from "@mantine/core";
import {
  IconCopy,
  IconExternalLink,
  IconEye,
  IconFilter,
  IconChartBar,
  IconSearch,
  IconShare,
  IconShieldCheck,
  IconCode,
  IconArchive,
  IconCircleCheck,
  IconBrandGoogle,
  IconBrandFacebook,
  IconBrandTwitter,
  IconBrandLinkedin,
} from "@tabler/icons-react";
import { toast } from "sonner";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { open as openExternalUrl } from "@tauri-apps/plugin-shell";

interface TreeNodeContextMenuProps {
  url?: string;
  label: string;
  isPage: boolean;
  children: React.ReactNode;
}

const TreeNodeContextMenu: React.FC<TreeNodeContextMenuProps> = ({
  url,
  label,
  isPage,
  children,
}) => {
  const [opened, setOpened] = useState(false);
  const { actions } = useGlobalCrawlStore();
  const { selectURL } = actions.data;
  const { setDeepCrawlTab } = actions.ui;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpened(true);
  };

  const handleCopyURL = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success("URL copied to clipboard");
    } else {
      toast.error("No URL available for this folder");
    }
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(label);
    toast.success("Path copied to clipboard");
  };

  const handleOpenInNewTab = async () => {
    if (url) {
      try {
        await openExternalUrl(url);
      } catch (err) {
        toast.error("Failed to open URL in browser");
      }
    } else {
      toast.error("No URL available for this folder");
    }
  };

  const handleViewInTable = () => {
    if (url) {
      selectURL(url);
      setDeepCrawlTab("crawledPages");
      toast.success("Focusing page in HTML table");
    } else {
      toast.error("No URL available for this folder");
    }
  };

  const handleAnalyze = () => {
    if (url) {
      selectURL(url);
      setDeepCrawlTab("crawledPages");
      toast.success("Analysis on Details tab");
    } else {
      toast.error("No detailed data found for this URL");
    }
  };

  const openExternal = async (link: string) => {
    if (url) {
      try {
        const finalUrl = link.replace("${url}", encodeURIComponent(url));
        await openExternalUrl(finalUrl);
      } catch (err) {
        console.error("Failed to open external tool:", err);
        toast.error(`Failed to open external tool: ${err}`);
      }
    }
  };

  return (
    <Menu
      shadow="md"
      width={220}
      position="right-start"
      opened={opened}
      onChange={setOpened}
      withArrow
      transitionProps={{ transition: "pop", duration: 150 }}
    >
      <Menu.Target>
        <div onContextMenu={handleContextMenu}>{children}</div>
      </Menu.Target>

      <Menu.Dropdown className="dark:bg-brand-dark dark:border-brand-dark p-1 z-[300]">
        <Menu.Label className="dark:text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">
          {isPage ? "Page Actions" : "Folder Actions"}
        </Menu.Label>

        {isPage && url && (
          <>
            <Menu.Item
              leftSection={
                <IconExternalLink size={14} className="text-blue-500" />
              }
              onClick={handleOpenInNewTab}
              className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs py-1.5"
            >
              Open in Browser
            </Menu.Item>

            <Menu.Item
              leftSection={<IconEye size={14} className="text-emerald-500" />}
              onClick={handleViewInTable}
              className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs py-1.5"
            >
              View in Table
            </Menu.Item>

            <Menu.Item
              leftSection={
                <IconChartBar size={14} className="text-amber-500" />
              }
              onClick={handleAnalyze}
              className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs py-1.5"
            >
              Quick Audit
            </Menu.Item>

            <Divider className="my-1 dark:border-brand-darker" />

            <Menu.Item
              leftSection={
                <IconBrandGoogle size={14} className="text-red-500" />
              }
              onClick={() =>
                openExternal('https://pagespeed.web.dev/analysis?url=${url}')
              }
              className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs py-1.5"
            >
              PageSpeed Insights
            </Menu.Item>

            <Menu.Item
              leftSection={<IconSearch size={14} className="text-blue-400" />}
              onClick={() =>
                openExternal(
                  'https://search.google.com/test/rich-results?url=${url}',
                )
              }
              className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs py-1.5"
            >
              Rich Results Test
            </Menu.Item>

            <Menu.Item
              leftSection={
                <IconShieldCheck size={14} className="text-purple-500" />
              }
              onClick={() =>
                openExternal(
                  'https://securityheaders.com/?q=${url}&followRedirects=on',
                )
              }
              className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs py-1.5"
            >
              Security Headers
            </Menu.Item>

            <Menu
              shadow="xs"
              width={180}
              trigger="hover"
              position="right-start"
              portalProps={{ className: "z-[310]" }}
            >
              <Menu.Target>
                <Menu.Item
                  leftSection={
                    <IconShare size={14} className="text-indigo-400" />
                  }
                  className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs py-1.5"
                >
                  Social Debuggers
                </Menu.Item>
              </Menu.Target>
              <Menu.Dropdown className="dark:bg-brand-dark dark:border-brand-dark dark:text-gray-200 p-1">
                <Menu.Item
                  leftSection={
                    <IconBrandFacebook size={14} className="text-blue-600" />
                  }
                  onClick={() =>
                    openExternal(
                      'https://developers.facebook.com/tools/debug/?q=${url}',
                    )
                  }
                  className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs"
                >
                  Facebook
                </Menu.Item>
                <Menu.Item
                  leftSection={
                    <IconBrandTwitter size={14} className="text-sky-400" />
                  }
                  onClick={() =>
                    openExternal('https://cards-dev.twitter.com/validator')
                  }
                  className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs"
                >
                  X / Twitter
                </Menu.Item>
                <Menu.Item
                  leftSection={
                    <IconBrandLinkedin size={14} className="text-blue-700" />
                  }
                  onClick={() =>
                    openExternal(
                      'https://www.linkedin.com/post-inspector/inspect/${url}',
                    )
                  }
                  className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs"
                >
                  LinkedIn
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>

            <Menu
              shadow="xs"
              width={180}
              trigger="hover"
              position="right-start"
              portalProps={{ className: "z-[310]" }}
            >
              <Menu.Target>
                <Menu.Item
                  leftSection={
                    <IconCircleCheck size={14} className="text-emerald-400" />
                  }
                  className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs py-1.5"
                >
                  Validation
                </Menu.Item>
              </Menu.Target>
              <Menu.Dropdown className="dark:bg-brand-dark dark:border-brand-dark dark:text-gray-200 p-1">
                <Menu.Item
                  leftSection={
                    <IconCode size={14} className="text-amber-500" />
                  }
                  onClick={() =>
                    openExternal('https://validator.schema.org/#url=${url}')
                  }
                  className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs"
                >
                  Schema Validator
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconCode size={14} className="text-blue-500" />}
                  onClick={() =>
                    openExternal('https://validator.w3.org/nu/?doc=${url}')
                  }
                  className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs"
                >
                  W3C HTML
                </Menu.Item>
                <Menu.Item
                  leftSection={
                    <IconArchive size={14} className="text-gray-400" />
                  }
                  onClick={() =>
                    openExternal('https://web.archive.org/web/*/${url}')
                  }
                  className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs"
                >
                  Wayback Machine
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>

            <Divider className="my-1 dark:border-brand-darker" />
          </>
        )}

        <Menu.Item
          leftSection={<IconCopy size={14} className="text-gray-400" />}
          onClick={handleCopyURL}
          className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs py-1.5"
          disabled={!url}
        >
          Copy URL
        </Menu.Item>

        <Menu.Item
          leftSection={<IconCopy size={14} className="text-gray-400" />}
          onClick={handleCopyPath}
          className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs py-1.5"
        >
          Copy Path Segment
        </Menu.Item>

        {!isPage && (
          <>
            <Divider className="my-1 dark:border-brand-darker" />
            <Menu.Item
              leftSection={<IconFilter size={14} className="text-blue-400" />}
              onClick={() =>
                toast.info("Filtering by folder path coming soon...")
              }
              className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs py-1.5"
            >
              Filter by Folder
            </Menu.Item>
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  );
};

export default TreeNodeContextMenu;
