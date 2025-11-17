// @ts-nocheck
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
import { useEffect, useState } from "react";
import TaxonomyManager from "./TaxonomyManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import IPManager from "./IPManager";
import DomainManager from "./DomainManager";
import LogsDBManager from "./LogsDBManager";
import { invoke } from "@tauri-apps/api/core";
import { useServerLogsStore } from "@/store/ServerLogsGlobalStore";
import { IoReload, IoTrashBin } from "react-icons/io5";
import { toast } from "sonner";
import { Tooltip } from "react-tooltip";
import { useLogAnalysis } from "@/store/ServerLogsStore";
import { FaRegTrashCan } from "react-icons/fa6";
import ProjectsDBManager from "./LogsDBprojectsManager";
import GSCuploadManager from "./GSCuploadManager";

function UploadButton() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logsFromDB, setLogsFromDB] = useState(false);
  const { setStoredLogsFromDBStore } = useServerLogsStore();
  const { resetAll } = useLogAnalysis();
  const { setServerLogsStore, setUploadedLogFiles, reset } =
    useServerLogsStore();

  const handleClearStoreLogs = async () => {
    resetAll();
    setLogsFromDB([]);
    setStoredLogsFromDBStore([]);
    reset();
    toast.success("All previous logs have been removed from cache");
  };

  return (
    <div className="flex space-x-1.5 absolute left-1/2 -translate-x-1/2 top-2 z-50 items-center">
      {/* Upload Logs Button */}
      <>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <button
              data-tooltip-id="upload-tooltip"
              className="bg-brand-bright rounded-l-2xl text-xs w-32 h-7 text-white flex justify-center items-center hover:bg-brand-bright/90 transition-colors active:scale-95"
            >
              <Plus size={18} className="text-xs mr-1 dark:text-white" />
              Upload Logs
            </button>
          </DialogTrigger>
          <DialogContent className="p-8 dark:bg-brand-darker dark:border-brand-bright">
            <FileUpload closeDialog={() => setUploadOpen(false)} />
          </DialogContent>
        </Dialog>

        {/* Tooltip must be outside Dialog component */}
        <Tooltip
          id="upload-tooltip"
          place="top"
          content="Upload or append logs"
          className="!bg-gray-800 !text-xs"
        />
      </>

      <>
        <aside
          data-tooltip-id="reload-tooltip"
          onClick={() => handleClearStoreLogs()}
          className="dark:bg-red-800  bg-red-500 w-7 h-7 flex items-center justify-center text-white rounded-sm cursor-pointer active:scale-95 p-2"
        >
          <FaRegTrashCan />
        </aside>
        <Tooltip
          id="reload-tooltip"
          place="top"
          content="Clear all logs"
          className="!bg-gray-800 !text-xs"
        />
      </>
      {/* Settings Button */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogTrigger asChild>
          <button className="bg-gray-200 dark:bg-gray-700 text-xs w-32 h-7 rounded-r-2xl text-gray-800 dark:text-white flex justify-center items-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors active:scale-95">
            <Settings size={15} className="text-xs -ml-3 mr-2" />
            Settings
          </button>
        </DialogTrigger>
        <DialogContent className="p-9 overflow-hidden pl-6 max-w-[700px] h-[660px] dark:bg-brand-darker">
          <Tabs>
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-brand-dark">
              <TabsTrigger
                className="hover:bg-brand-bright/70 hover:text-white"
                value="domain"
              >
                Domain
              </TabsTrigger>
              <TabsTrigger value="taxonomy">Content Taxonomies</TabsTrigger>
              {/* <TabsTrigger value="ips">Google IPs</TabsTrigger> */}
              <TabsTrigger value="logs">Stored Logs</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              {/* <TabsTrigger value="gsc">GSC Sync</TabsTrigger> */}
            </TabsList>

            {/* SEPARATOR */}
            {/* <div className="w-full bg-gray-700 h-[1px] hidden dark:block mt-1 mr-4" /> */}

            <TabsContent value="taxonomy" className="mt-4">
              <TaxonomyManager closeDialog={() => setSettingsOpen(false)} />
            </TabsContent>

            <TabsContent value="domain" className="mt-4">
              <DomainManager closeDialog={() => setSettingsOpen(false)} />
            </TabsContent>
            <TabsContent value="logs" className="mt-4">
              <LogsDBManager
                dbLogs={logsFromDB}
                closeDialog={() => setSettingsOpen(false)}
              />
            </TabsContent>

            <TabsContent value="projects" className="mt-4">
              <ProjectsDBManager />
            </TabsContent>

            <TabsContent value="gsc" className="mt-4">
              <GSCuploadManager />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UploadButton;
