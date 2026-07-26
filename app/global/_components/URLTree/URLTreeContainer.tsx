// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Tree, Group, Text, Tooltip, TextInput, ActionIcon, useTree } from "@mantine/core";
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
  IconSearch,
  IconX,
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconEyeOff,
} from "@tabler/icons-react";
import useGlobalCrawlStore, { useCrawlDataVersion } from "@/store/GlobalCrawlDataStore";
import TreeNodeContextMenu from "./TreeNodeContextMenu";

interface TreeNode {
  label: string;
  value: string;
  children?: TreeNode[];
  url?: string;
  isPage?: boolean;
  status?: number;
  indexable?: boolean;
}

const statusDotColor = (status?: number) => {
  if (!status) return "bg-gray-300 dark:bg-gray-600";
  if (status >= 200 && status < 300) return "bg-emerald-500";
  if (status >= 300 && status < 400) return "bg-amber-500";
  if (status >= 400) return "bg-red-500";
  return "bg-gray-300 dark:bg-gray-600";
};

// Keeps a node when it (or any descendant) matches the query; folders survive
// as long as at least one child still matches after filtering.
const filterNodes = (nodes: TreeNode[], query: string): TreeNode[] => {
  const q = query.toLowerCase();
  return nodes.reduce<TreeNode[]>((acc, node) => {
    const selfMatch =
      node.label?.toLowerCase().includes(q) || node.url?.toLowerCase().includes(q);
    const filteredChildren = node.children ? filterNodes(node.children, query) : undefined;
    if (selfMatch || (filteredChildren && filteredChildren.length > 0)) {
      acc.push({ ...node, children: filteredChildren && filteredChildren.length > 0 ? filteredChildren : node.children && node.children.length > 0 ? [] : undefined });
    }
    return acc;
  }, []);
};

const countMatches = (nodes: TreeNode[]): number =>
  nodes.reduce(
    (sum, node) => sum + (node.isPage ? 1 : 0) + (node.children ? countMatches(node.children) : 0),
    0,
  );

const URLTreeContainer = () => {
  const crawlDataLength = useGlobalCrawlStore((state) => state.crawlData.length);
  const crawlDataVersion = useCrawlDataVersion();
  const [search, setSearch] = useState("");
  const tree = useTree();

  const { treeData, stats } = useMemo(() => {
    const crawlData = useGlobalCrawlStore.getState().crawlData;
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
        const status = item.status_code;
        const indexable = (item.indexability?.indexability ?? 0.5) >= 0.5;

        let currentNode = root;
        let currentPath = "root";
        const depth = pathSegments.length;
        maxDepth = Math.max(maxDepth, depth);

        if (pathSegments.length === 0) {
          root.value = item.url;
          root.url = item.url;
          root.isPage = true;
          root.status = status;
          root.indexable = indexable;
          totalPages++;
          return;
        }

        pathSegments.forEach((segment, index) => {
          currentPath += `/${segment}`;
          let nextNode = currentNode.children?.find(
            (child) => child.label === segment,
          );

          const isLast = index === pathSegments.length - 1;

          if (!nextNode) {
            nextNode = {
              value: currentPath,
              label: segment,
              children: [],
              isPage: isLast,
              url: isLast ? item.url : undefined,
              status: isLast ? status : undefined,
              indexable: isLast ? indexable : undefined,
            };
            currentNode.children?.push(nextNode);

            if (isLast) {
              totalPages++;
            } else {
              totalFolders++;
            }
          } else if (isLast) {
            // If node already exists and it's a page, ensure it's marked as a page and count it
            if (!nextNode.isPage) {
              // Only increment if it wasn't already counted as a page
              totalPages++;
            }
            nextNode.isPage = true;
            nextNode.url = item.url;
            nextNode.status = status;
            nextNode.indexable = indexable;
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
  }, [crawlDataVersion]);

  const filteredTreeData = useMemo(() => {
    if (!search.trim()) return treeData;
    return treeData.map((node) => ({
      ...node,
      children: node.children ? filterNodes(node.children, search.trim()) : node.children,
    }));
  }, [treeData, search]);

  const matchCount = useMemo(
    () => (search.trim() ? countMatches(filteredTreeData) : null),
    [filteredTreeData, search],
  );

  // Reveal matches by auto-expanding while a search is active.
  useEffect(() => {
    if (search.trim()) {
      tree.expandAllNodes();
    }
  }, [search, filteredTreeData]);

  const handleFilterByFolder = (nodeValue: string) => {
    const relativePath = nodeValue.startsWith("root/") ? nodeValue.slice(5) : nodeValue;
    setSearch(relativePath);
  };

  if (crawlDataLength === 0) {
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
      <div className="flex-none px-3 py-2 border-b dark:border-brand-dark bg-gray-50/50 dark:bg-brand-dark/20 z-10">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-sm font-bold dark:text-white flex items-center gap-1.5">
              <IconWorld size={16} className="text-blue-500" />
              Site Tree
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip label="Total pages" position="bottom" withArrow>
              <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-500/30">
                <IconFiles size={10} className="text-blue-500" />
                <span className="font-bold text-[10px] text-blue-600 dark:text-blue-400">
                  {stats.totalPages}
                </span>
              </div>
            </Tooltip>

            <Tooltip label="Total folders" position="bottom" withArrow>
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-500/30">
                <IconFolders size={10} className="text-amber-500" />
                <span className="font-bold text-[10px] text-amber-600 dark:text-amber-400">
                  {stats.totalFolders}
                </span>
              </div>
            </Tooltip>

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

        <div className="flex items-center gap-1.5 mt-2">
          <TextInput
            size="xs"
            placeholder="Filter by path or URL..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            leftSection={<IconSearch size={12} className="text-gray-400" />}
            rightSection={
              search ? (
                <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => setSearch("")}>
                  <IconX size={12} />
                </ActionIcon>
              ) : null
            }
            className="flex-1"
            classNames={{
              input: "dark:bg-brand-dark dark:border-brand-dark dark:text-white text-xs h-6 min-h-6",
            }}
          />

          <Tooltip label="Expand all" position="bottom" withArrow>
            <ActionIcon
              size="sm"
              variant="subtle"
              color="gray"
              onClick={() => tree.expandAllNodes()}
              className="dark:text-gray-400 dark:hover:bg-brand-dark"
            >
              <IconArrowsMaximize size={13} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Collapse all" position="bottom" withArrow>
            <ActionIcon
              size="sm"
              variant="subtle"
              color="gray"
              onClick={() => tree.collapseAllNodes()}
              className="dark:text-gray-400 dark:hover:bg-brand-dark"
            >
              <IconArrowsMinimize size={13} />
            </ActionIcon>
          </Tooltip>
        </div>

        {matchCount !== null && (
          <div className="mt-1.5 text-[10px] text-gray-500 dark:text-gray-400">
            {matchCount} matching page{matchCount === 1 ? "" : "s"}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar py-2">
        <Tree
          data={filteredTreeData}
          tree={tree}
          levelOffset={32}
          selectOnClick
          renderNode={({ node, expanded, hasChildren, selected, elementProps }) => {
            const customNode = node as any as TreeNode;
            return (
              <TreeNodeContextMenu
                url={customNode.url}
                label={customNode.label || "/"}
                isPage={customNode.isPage || false}
                onFilterByFolder={
                  !customNode.isPage ? () => handleFilterByFolder(customNode.value) : undefined
                }
                {...elementProps}
                className={`hover:bg-blue-50/50 dark:hover:bg-blue-900/10 rounded cursor-pointer transition-all duration-200 group relative ${
                  selected ? "bg-blue-100/70 dark:bg-blue-900/30" : ""
                }`}
                style={{
                  ...elementProps.style,
                  position: "relative",
                  marginBottom: "1px",
                }}
              >
                {/* Hierarchy Guide Line */}
                {(elementProps as any)["data-level"] > 0 && (
                  <div className="absolute left-[-16px] top-0 bottom-0 w-px bg-gray-300/30 dark:bg-brand-dark/40 group-hover:bg-blue-400/50 transition-colors" />
                )}

                <Group gap={8} wrap="nowrap" className="py-1 px-1">
                  {hasChildren && (
                    <div className="text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                      {expanded ? (
                        <IconChevronDown size={14} stroke={2.5} />
                      ) : (
                        <IconChevronRight size={14} stroke={2.5} />
                      )}
                    </div>
                  )}

                  {!hasChildren && <div style={{ width: 14 }} />}

                  {hasChildren ? (
                    <IconFolder
                      size={18}
                      className="text-amber-500 fill-amber-500/10"
                    />
                  ) : (
                    <IconFileText
                      size={16}
                      className="text-blue-400 fill-blue-400/10"
                    />
                  )}

                  <div className="flex flex-col min-w-0 flex-1">
                    <Text
                      size="xs"
                      className={`truncate ${!customNode.isPage ? "font-semibold text-gray-800 dark:text-gray-100" : "font-normal text-gray-600 dark:text-gray-400"}`}
                    >
                      {customNode.label || "/"}
                    </Text>
                    {customNode.isPage && customNode.url && (
                      <Text
                        size="9px"
                        className="text-gray-400/70 font-mono truncate"
                      >
                        {new URL(customNode.url).pathname}
                      </Text>
                    )}
                  </div>

                  {customNode.isPage && (
                    <div className="flex items-center gap-1 flex-none pr-1">
                      {customNode.indexable === false && (
                        <Tooltip label="Not indexable" position="top" withArrow>
                          <IconEyeOff size={11} className="text-red-400" />
                        </Tooltip>
                      )}
                      {!!customNode.status && (
                        <Tooltip label={`Status ${customNode.status}`} position="top" withArrow>
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${statusDotColor(customNode.status)}`}
                          />
                        </Tooltip>
                      )}
                    </div>
                  )}
                </Group>
              </TreeNodeContextMenu>
            );
          }}
        />

        {filteredTreeData[0]?.children?.length === 0 && search.trim() && (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400 dark:text-gray-500">
            <IconSearch size={28} className="opacity-40" />
            <Text size="xs">No pages match "{search}"</Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default URLTreeContainer;
