import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

function UploadButton() {
  return (
    <Dialog>
      <DialogTrigger className=" space-x-2 absolute bg-brand-bright text-xs w-32 h-7 rounded-sm text-white flex justify-center items-center left-1/2 -translate-x-1/2 top-2 z-50">
        <Plus size={18} className="text-xs mr-1" />
        Upload Logs
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

export default UploadButton;
