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
import TaxonomyManager from "./TaxonomyManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function UploadButton() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex space-x-2 absolute left-1/2 -translate-x-1/2 top-2 z-50">
      {/* Upload Logs Button */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogTrigger asChild>
          <button className="bg-brand-bright rounded-l-2xl  text-xs w-32 h-7 text-white flex justify-center items-center hover:bg-brand-bright/90 transition-colors">
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
          <button className="bg-gray-200 dark:bg-gray-700 text-xs w-32 h-7 rounded-r-2xl text-gray-800 dark:text-white flex justify-center items-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            <Settings size={18} className="text-xs mr-1" />
            Settings
          </button>
        </DialogTrigger>
        <DialogContent className="p-8 max-w-[700px] h-[540px]">
          <Tabs>
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-brand-darker">
              <TabsTrigger value="taxonomy">Content Taxonomies</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="taxonomy" className="mt-4">
              <TaxonomyManager closeDialog={() => setSettingsOpen(false)} />
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              {/* Add your settings content here */}
              <div className="p-4 text-center">
                <p>Settings content goes here</p>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UploadButton;
