import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { FileUpload } from "./FileUpload";
import { useState } from "react";

function UploadButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        asChild
        className=" space-x-2 absolute bg-brand-bright text-xs w-32 h-7 rounded-sm text-white flex justify-center items-center left-1/2 -translate-x-1/2 top-2 z-50"
      >
        <div className="flex items-center cursor-pointer">
          <Plus size={18} className="text-xs mr-1 dark:text-white" />
          Upload Logs
        </div>
      </DialogTrigger>
      <DialogContent className="p-8">
        <FileUpload closeDialog={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export default UploadButton;
