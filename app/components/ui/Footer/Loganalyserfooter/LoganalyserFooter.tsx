// @ts-nocheck
"use client";

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
import { FaFolder, FaProjectDiagram } from "react-icons/fa";
import {
  useCurrentProject,
  useProjectsLogs,
  useSelectedProject,
} from "@/store/logFilterStore";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

type Project = {
  id: number;
  name: string;
};

type Status = {
  value: string;
  label: string;
};

function LogAnalyserFooter() {
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [localProjects, setLocalProjects] = useState<Status[]>([]);
  const { setProjects } = useProjectsLogs();
  const { selectedProject, setSelectedProject } = useSelectedProject();

  const fetchProjects = async () => {
    setLoading(true);
    try {
      console.log("Fetching projects...");
      const data = await invoke<Project[]>("get_all_projects_command");
      console.log("Received projects data:", data);

      if (!data || !Array.isArray(data)) {
        throw new Error("Invalid projects data");
      }

      const formattedProjects = data.map((project) => ({
        value: project.id.toString(),
        label: project.name,
      }));

      console.log("Formatted projects:", formattedProjects);

      setLocalProjects(formattedProjects);
      setProjects(formattedProjects);

      // Check localStorage after projects are loaded
      const savedProject = localStorage.getItem("selectedProject");
      if (savedProject) {
        const found = formattedProjects.find((p) => p.label === savedProject);
        if (found) {
          setSelectedStatus(found);
          setSelectedProject(found.label);
          return; // Exit early if we found a saved project
        }
      }

      // Fallback to first project if no saved project found
      if (formattedProjects.length > 0) {
        setSelectedStatus(formattedProjects[0]);
        setSelectedProject(formattedProjects[0].label);
      }

      if (formattedProjects.length === 0) {
        setSelectedStatus("No projects found");
        setSelectedProject("");
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast.error("Failed to load projects");
      setLocalProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchProjects();
    }
  }, [open]);

  // Initial load when component mounts
  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCurrentProjectActions = (projectName: string) => {
    localStorage.setItem("selectedProject", projectName);
    setSelectedProject(projectName);
    console.log("Selected project:", projectName);
  };

  return (
    <div className="flex items-center  text-xs mt-[1px] ml-2 pr-3">
      <div className="w-6 bg-brand-bright px-1 h-[16px] border-r-brand-dark ">
        <FaProjectDiagram className=" text-[10px] ml-[3px] mt-[3px] text-white" />
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="default"
            className="w-fit max-w-[200px] bg-brand-bright rounded-r-full     dark:bg-brand-bright dark:text-white text-white dark:hover:bg-brand-bright/80 justify-start truncate text-[10px] px-2 pr-3 m-0 h-3 transform scale-[0.98] "
          >
            {selectedProject || selectedStatus?.label || "Select project..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 mb-10 w-[200px] absolute -bottom-8 z-[9999999999]"
          side="left"
          align="start"
          forceMount
        >
          <Command shouldFilter={true}>
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
                        value={`${project.label} ${project.value}`}
                        onSelect={() => {
                          setSelectedStatus(project);
                          handleCurrentProjectActions(project.label);
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
