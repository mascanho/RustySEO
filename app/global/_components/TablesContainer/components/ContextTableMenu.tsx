// @ts-nocheck
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { toast } from "sonner";

export default function ContextTableMenu({ children, data }) {
  function handleCopyToClipboard() {
    navigator.clipboard.writeText(data);
    toast.success("Copied to clipboard");
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="text-xs">
        <ContextMenuItem onClick={handleCopyToClipboard} className="text-xs">
          Copy URL
        </ContextMenuItem>
        <ContextMenuItem className="text-xs">Billing</ContextMenuItem>
        <ContextMenuItem className="text-xs">Team</ContextMenuItem>
        <ContextMenuItem className="text-xs">Subscription</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
