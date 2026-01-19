import React, { useMemo } from "react";
import { Tree, Group, Text } from "@mantine/core";
import { IconChevronRight, IconChevronDown, IconFolder, IconFileText, IconWorld, IconHierarchy2 } from "@tabler/icons-react";
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

    const treeData = useMemo(() => {
        if (!crawlData || crawlData.length === 0) return [];

        const root: TreeNode = { value: "root", label: "Website Root", children: [] };

        crawlData.forEach((item) => {
            try {
                const url = new URL(item.url);
                const pathSegments = url.pathname.split("/").filter(Boolean);

                let currentNode = root;
                let currentPath = "root";

                if (pathSegments.length === 0) {
                    root.value = item.url;
                    root.url = item.url;
                    root.isPage = true;
                    return;
                }

                pathSegments.forEach((segment, index) => {
                    currentPath += `/${segment}`;
                    let nextNode = currentNode.children?.find((child) => child.label === segment);

                    if (!nextNode) {
                        nextNode = {
                            value: currentPath,
                            label: segment,
                            children: [],
                            isPage: index === pathSegments.length - 1,
                            url: index === pathSegments.length - 1 ? item.url : undefined,
                        };
                        currentNode.children?.push(nextNode);
                    } else if (index === pathSegments.length - 1) {
                        nextNode.isPage = true;
                        nextNode.url = item.url;
                    }

                    currentNode = nextNode;
                });
            } catch (e) {
                console.error("Invalid URL in tree parsing:", item.url);
            }
        });

        return [root];
    }, [crawlData]);

    if (!crawlData || crawlData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full dark:text-gray-400 gap-4">
                <IconHierarchy2 size={48} className="text-gray-300 dark:text-gray-600 animate-pulse" />
                <Text size="sm" className="font-medium">No crawl data available to generate tree.</Text>
            </div>
        );
    }

    return (
        <div className="p-3 h-full overflow-auto bg-white dark:bg-brand-darker custom-scrollbar">
            <div className="mb-4 border-b dark:border-brand-dark pb-2">
                <h2 className="text-base font-bold dark:text-white flex items-center gap-2 mb-1">
                    <IconWorld size={20} className="text-blue-500" />
                    Site Architecture
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Visual hierarchy of the URL structure.
                </p>
            </div>

            <Tree
                data={treeData}
                levelOffset={18}
                renderNode={({ node, expanded, hasChildren, elementProps }) => {
                    const customNode = node as any as TreeNode;
                    return (
                        <TreeNodeContextMenu
                            url={customNode.url}
                            label={customNode.label || "/"}
                            isPage={customNode.isPage || false}
                        >
                            <Group gap={8} {...elementProps} className="hover:bg-gray-100 dark:hover:bg-brand-dark/50 rounded-md cursor-pointer py-1.5 px-2 transition-colors duration-200">
                                {hasChildren && (
                                    <div className="text-gray-400">
                                        {expanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                                    </div>
                                )}

                                {!hasChildren && <div style={{ width: 16 }} />}

                                {hasChildren ? (
                                    <IconFolder size={18} className="text-amber-400 fill-amber-400/20" />
                                ) : (
                                    <IconFileText size={18} className="text-blue-400 fill-blue-400/20" />
                                )}

                                <div className="flex flex-col">
                                    <Text size="sm" className={`dark:text-gray-200 ${customNode.isPage ? 'font-medium' : ''}`}>
                                        {customNode.label || "/"}
                                    </Text>
                                    {customNode.isPage && customNode.url && (
                                        <Text size="10px" className="text-gray-400 font-mono truncate max-w-[400px]">
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
    );
};

export default URLTreeContainer;
