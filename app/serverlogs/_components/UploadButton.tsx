import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Settings } from "lucide-react";
import { FileUpload } from "./FileUpload";
import { useState } from "react";

function UploadButton() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex space-x-2 absolute left-1/2 -translate-x-1/2 top-2 z-50">
      {/* Upload Logs Button */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogTrigger asChild>
          <button className="bg-brand-bright text-xs w-32 h-7 rounded-sm text-white flex justify-center items-center hover:bg-brand-bright/90 transition-colors">
            <Plus size={18} className="text-xs mr-1 dark:text-white" />
            Upload Logs
          </button>
        </DialogTrigger>
        <DialogContent className="p-8">
          <FileUpload closeDialog={() => setUploadOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Settings Button */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogTrigger asChild>
          <button className="bg-gray-200 dark:bg-gray-700 text-xs w-32 h-7 rounded-sm text-gray-800 dark:text-white flex justify-center items-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            <Settings size={18} className="text-xs mr-1" />
            Settings
          </button>
        </DialogTrigger>
        <DialogContent className="p-8">
          <DialogHeader>
            <DialogTitle>Log Analysis Settings</DialogTitle>
            <DialogDescription>
              Configure your log analysis preferences
            </DialogDescription>
          </DialogHeader>
          {/* <SettingsPanel closeDialog={() => setSettingsOpen(false)} /> */}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UploadButton;
