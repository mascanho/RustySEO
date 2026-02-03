import React, { useMemo } from "react";
import { Tree, Group, Text, Tooltip } from "@mantine/core";
import {
  IconChevronRight,
  IconChevronDown,
  IconFolder,
  IconFileText,
  IconWorld,
  IconHierarchy2,
  IconFiles,
  IconFolders,
  IconArrowsVertical,
} from "@tabler/icons-react";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import TreeNodeContextMenu from "./TreeNodeContextMenu";

interface TreeNode {
  label: string;
  value: string;
  children?: TreeNode[];
  url?: string;
  isPage?: boolean;
}

const URLTreeContainer = () => {
  const { crawlData } = useGlobalCrawlStore();

  const { treeData, stats } = useMemo(() => {
    if (!crawlData || crawlData.length === 0)
      return {
        treeData: [],
        stats: { totalPages: 0, totalFolders: 0, maxDepth: 0 },
      };

    const root: TreeNode = {
      value: "root",
      label: "Website Root",
      children: [],
    };
    let totalPages = 0;
    let totalFolders = 0;
    let maxDepth = 0;

    crawlData.forEach((item) => {
      try {
        const url = new URL(item.url);
        const pathSegments = url.pathname.split("/").filter(Boolean);

        let currentNode = root;
        let currentPath = "root";
        const depth = pathSegments.length;
        maxDepth = Math.max(maxDepth, depth);

        if (pathSegments.length === 0) {
          root.value = item.url;
          root.url = item.url;
          root.isPage = true;
          totalPages++;
          return;
        }

        pathSegments.forEach((segment, index) => {
          currentPath += `/${segment}`;
          let nextNode = currentNode.children?.find(
            (child) => child.label === segment,
          );

          if (!nextNode) {
            nextNode = {
              value: currentPath,
              label: segment,
              children: [],
              isPage: index === pathSegments.length - 1,
              url: index === pathSegments.length - 1 ? item.url : undefined,
            };
            currentNode.children?.push(nextNode);

            if (index === pathSegments.length - 1) {
              totalPages++;
            } else {
              totalFolders++;
            }
          } else if (index === pathSegments.length - 1) {
            // If node already exists and it's a page, ensure it's marked as a page and count it
            if (!nextNode.isPage) {
              // Only increment if it wasn't already counted as a page
              totalPages++;
            }
            nextNode.isPage = true;
            nextNode.url = item.url;
          }

          currentNode = nextNode;
        });
      } catch (e) {
        console.error("Invalid URL in tree parsing:", item.url);
      }
    });

    return {
      treeData: [root],
      stats: { totalPages, totalFolders, maxDepth },
    };
  }, [crawlData]);

  if (!crawlData || crawlData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full dark:text-gray-400 gap-4">
        <IconHierarchy2
          size={48}
          className="text-gray-300 dark:text-gray-600 animate-pulse"
        />
        <Text size="sm" className="font-medium">
          No crawl data available to generate tree.
        </Text>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-brand-darker overflow-hidden">
      <div className="flex-none p-3 border-b dark:border-brand-dark bg-gray-50/50 dark:bg-brand-dark/20 z-10">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-sm font-bold dark:text-white flex items-center gap-1.5">
              <IconWorld size={16} className="text-blue-500" />
              Site Tree
            </h2>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              Visualizing {stats.totalPages} pages in {stats.totalFolders} folders
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip label="Maximum depth" position="bottom" withArrow>
              <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-500/30">
                <IconArrowsVertical size={10} className="text-emerald-500" />
                <span className="font-bold text-[10px] text-emerald-600 dark:text-emerald-400">
                  {stats.maxDepth}
                </span>
              </div>
            </Tooltip>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar py-3">
        <Tree
          data={treeData}
          levelOffset={16}
          renderNode={({ node, expanded, hasChildren, elementProps }) => {
            const customNode = node as any as TreeNode;
            return (
              <TreeNodeContextMenu
                url={customNode.url}
                label={customNode.label || "/"}
                isPage={customNode.isPage || false}
              >
                <Group
                  gap={6}
                  {...elementProps}
                  className="hover:bg-gray-100 dark:hover:bg-brand-dark/50 rounded cursor-pointer py-1 px-1.5 transition-colors duration-200"
                >
                  {hasChildren && (
                    <div className="text-gray-400">
                      {expanded ? (
                        <IconChevronDown size={14} />
                      ) : (
                        <IconChevronRight size={14} />
                      )}
                    </div>
                  )}

                  {!hasChildren && <div style={{ width: 14 }} />}

                  {hasChildren ? (
                    <IconFolder
                      size={16}
                      className="text-amber-400 fill-amber-400/20"
                    />
                  ) : (
                    <IconFileText
                      size={16}
                      className="text-blue-400 fill-blue-400/20"
                    />
                  )}

                  <div className="flex flex-col min-w-0">
                    <Text
                      size="xs"
                      className={`dark:text-gray-200 truncate ${customNode.isPage ? "font-medium" : ""}`}
                    >
                      {customNode.label || "/"}
                    </Text>
                    {customNode.isPage && customNode.url && (
                      <Text
                        size="9px"
                        className="text-gray-400 font-mono truncate"
                      >
                        {new URL(customNode.url).pathname}
                      </Text>
                    )}
                  </div>
                </Group>
              </TreeNodeContextMenu>
            );
          }}
        />
      </div>
    </div>
  );
};

export default URLTreeContainer;
