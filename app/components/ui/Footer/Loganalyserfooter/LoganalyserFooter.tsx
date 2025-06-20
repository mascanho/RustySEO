// @ts-nocheck
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FaFolder } from "react-icons/fa";
import { useProjectsLogs } from "@/store/logFilterStore";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";

type Project = {
  id: number;
  name: string;
};

type Status = {
  value: string;
  label: string;
};

function LogAnalyserFooter() {
  const [open, setOpen] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState<Status | null>(
    null
  );
  const [loading, setLoading] = React.useState(false);
  const [localProjects, setLocalProjects] = React.useState<Status[]>([]);
  const { setProjects } = useProjectsLogs();

  const fetchProjects = async () => {
    setLoading(true);
    try {
      console.log("Fetching projects...");
      const data = await invoke<Project[]>("get_all_projects_command");
      console.log("Received projects data:", data); // Debug log

      if (!data || !Array.isArray(data)) {
        throw new Error("Invalid projects data");
      }

      const formattedProjects = data.map((project) => ({
        value: project.id.toString(),
        label: project.name,
      }));

      console.log("Formatted projects:", formattedProjects); // Debug log

      setLocalProjects(formattedProjects);
      setProjects(formattedProjects);

      if (formattedProjects.length > 0 && !selectedStatus) {
        setSelectedStatus(formattedProjects[0]);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast.error("Failed to load projects");
      setLocalProjects([]); // Reset on error
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (open) {
      fetchProjects();
    }
  }, [open]);

  return (
    <div className="flex items-center space-x-4 text-xs mt-[1px] ml-1">
      <FaFolder className="-mr-2 text-sm" />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="default"
            className="w-fit max-w-[200px] bg-gray-800 border border-t-gray-700 border-l-gray-700 border-r-gray-900 border-b-gray-900 rounded-sm shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)] dark:border-t-gray-600 dark:border-l-gray-600 dark:border-r-gray-900 dark:border-b-gray-900 dark:bg-brand-bright dark:text-white text-white dark:hover:bg-brand-bright/80 justify-start truncate text-[10px] px-2 m-0 h-3 transform scale-[0.98]"
          >
            {selectedStatus ? (
              <div className="truncate">{selectedStatus.label}</div>
            ) : (
              "Select project..."
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 mb-10 w-[200px]"
          side="left"
          align="start"
          forceMount // Ensures content is always rendered
        >
          <Command>
            <CommandInput placeholder="Search projects..." />
            <CommandList>
              {loading ? (
                <div className="py-2 text-center text-sm">
                  Loading projects...
                </div>
              ) : localProjects.length === 0 ? (
                <div className="py-2 text-center text-sm">
                  No projects available
                </div>
              ) : (
                <>
                  <CommandEmpty>No matching projects</CommandEmpty>
                  <CommandGroup>
                    {localProjects.map((project) => (
                      <CommandItem
                        key={project.value}
                        value={project.value}
                        onSelect={(value) => {
                          const selected = localProjects.find(
                            (p) => p.value === value
                          );
                          setSelectedStatus(selected || null);
                          setOpen(false);
                        }}
                      >
                        {project.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default LogAnalyserFooter;
