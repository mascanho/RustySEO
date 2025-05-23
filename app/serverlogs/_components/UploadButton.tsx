import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Menu, Plus, Settings } from "lucide-react";
import { FileUpload } from "./FileUpload";
import { useState } from "react";
import TaxonomyManager from "./TaxonomyManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import IPManager from "./IPManager";
import DomainManager from "./DomainManager";

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
        <DialogContent className="p-8 dark:bg-brand-darker dark:border-brand-bright ">
          <FileUpload closeDialog={() => setUploadOpen(false)} />
        </DialogContent>
      </Dialog>

      <Menu className="hidden" />

      {/* Settings Button */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogTrigger asChild>
          <button className="bg-gray-200 dark:bg-gray-700 text-xs w-32 h-7 rounded-r-2xl text-gray-800 dark:text-white flex justify-center items-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            <Settings size={15} className="text-xs -ml-3 mr-2" />
            Settings
          </button>
        </DialogTrigger>
        <DialogContent className="p-8 max-w-[700px] h-[540px] dark:bg-brand-darker">
          <Tabs>
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-brand-darker">
              <TabsTrigger value="domain">Domain</TabsTrigger>
              <TabsTrigger value="taxonomy">Content Taxonomies</TabsTrigger>
              <TabsTrigger value="ips">Google IPs</TabsTrigger>
            </TabsList>

            <TabsContent value="taxonomy" className="mt-4">
              <TaxonomyManager closeDialog={() => setSettingsOpen(false)} />
            </TabsContent>

            <TabsContent value="ips" className="mt-4">
              {/* Add your settings content here */}
              <IPManager closeDialog={() => setSettingsOpen(false)} />
            </TabsContent>

            <TabsContent value="domain" className="mt-4">
              <DomainManager closeDialog={() => setSettingsOpen(false)} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UploadButton;
