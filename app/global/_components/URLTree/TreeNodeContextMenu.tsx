import React, { useState } from "react";
import { Menu } from "@mantine/core";
import {
    IconCopy,
    IconExternalLink,
    IconEye,
    IconFilter,
    IconChartBar
} from "@tabler/icons-react";
import { toast } from "sonner";

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
    children
}) => {
    const [opened, setOpened] = useState(false);

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
        setOpened(false);
    };

    const handleCopyPath = () => {
        navigator.clipboard.writeText(label);
        toast.success("Path copied to clipboard");
        setOpened(false);
    };

    const handleOpenInNewTab = () => {
        if (url) {
            window.open(url, "_blank");
        } else {
            toast.error("No URL available for this folder");
        }
        setOpened(false);
    };

    const handleViewInTable = () => {
        if (url) {
            // This would trigger filtering the main table to show this URL
            toast.info("View in table functionality - to be implemented");
        } else {
            toast.error("No URL available for this folder");
        }
        setOpened(false);
    };

    const handleAnalyze = () => {
        if (url) {
            toast.info("Analysis functionality - to be implemented");
        } else {
            toast.error("No URL available for this folder");
        }
        setOpened(false);
    };

    return (
        <Menu shadow="md" width={200} position="right-start" opened={opened} onChange={setOpened}>
            <Menu.Target>
                <div onContextMenu={handleContextMenu}>
                    {children}
                </div>
            </Menu.Target>

            <Menu.Dropdown className="dark:bg-brand-dark dark:border-brand-dark">
                <Menu.Label className="dark:text-gray-400 text-xs">
                    {isPage ? "Page Actions" : "Folder Actions"}
                </Menu.Label>

                {isPage && url && (
                    <>
                        <Menu.Item
                            leftSection={<IconExternalLink size={14} />}
                            onClick={handleOpenInNewTab}
                            className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs"
                        >
                            Open in New Tab
                        </Menu.Item>

                        <Menu.Item
                            leftSection={<IconEye size={14} />}
                            onClick={handleViewInTable}
                            className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs"
                        >
                            View in Table
                        </Menu.Item>

                        <Menu.Item
                            leftSection={<IconChartBar size={14} />}
                            onClick={handleAnalyze}
                            className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs"
                        >
                            Analyze Page
                        </Menu.Item>

                        <Menu.Divider className="dark:border-brand-darker" />
                    </>
                )}

                <Menu.Item
                    leftSection={<IconCopy size={14} />}
                    onClick={handleCopyURL}
                    className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs"
                    disabled={!url}
                >
                    Copy URL
                </Menu.Item>

                <Menu.Item
                    leftSection={<IconCopy size={14} />}
                    onClick={handleCopyPath}
                    className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs"
                >
                    Copy Path
                </Menu.Item>

                {!isPage && (
                    <>
                        <Menu.Divider className="dark:border-brand-darker" />
                        <Menu.Item
                            leftSection={<IconFilter size={14} />}
                            onClick={() => toast.info("Filter by folder - to be implemented")}
                            className="dark:text-gray-200 dark:hover:bg-brand-darker text-xs"
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
