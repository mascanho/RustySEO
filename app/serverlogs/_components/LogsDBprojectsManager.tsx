// @ts-nocheck
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { X, Loader2, FolderOpen, Plus, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { invoke } from "@tauri-apps/api/core";
import { FixedSizeList as List } from "react-window";
import { FaCalendarAlt, FaFolder, FaProjectDiagram } from "react-icons/fa";
import { SkeletonLoader } from "./SkeletonLoader";
import type { ProjectEntry } from "@/types/ProjectEntry";
import { IoPlayCircleOutline } from "react-icons/io5";
import {
  useAllProjects,
  useProjectsLogs,
  useSelectedProject,
} from "@/store/logFilterStore";
import { useLogAnalysis } from "@/store/ServerLogsStore";
import Spinner from "@/app/components/ui/Sidebar/checks/_components/Spinner";
import { listen } from "@tauri-apps/api/event";

// Mock data for demonstration
const mockProjectsData: ProjectEntry[] = [
  {
    id: "proj_001",
    name: "www.slimstock.com",
    status: "active",
    createdAt: "2024-01-15T10:30:00Z",
    logCount: 23,
    description: "Complete overhaul of the shopping experience",
  },
];

// Memoized Project Item Component
const ProjectItem = React.memo(({ project, onDelete, onLoad }) => {
  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return "No date";
    const date = new Date(timestamp);
    return isNaN(date.getTime())
      ? "Invalid Date"
      : date.toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  }, []);

  return (
    <div className="flex items-center justify-between p-2 rounded-md transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 border dark:border-gray-700">
      <div className="flex flex-col space-y-0.5">
        <div className="flex items-center justify-start">
          <FaProjectDiagram className="h-3 w-3 mr-1 text-blue-500 dark:text-blue-400" />
          <span className="text-xs font-medium dark:text-white truncate max-w-[120px]">
            {project?.name}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <FaCalendarAlt className="text-xs text-brand-bright" />
          <span className="text-[10px] text-black/50 dark:text-white/50">
            added: {formatTimestamp(project?.date)}
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 hover:bg-gray-200 dark:hover:bg-gray-600"
        onClick={() => onDelete(project.id)}
      >
        <X className="h-3 w-3 text-gray-500 dark:text-gray-400" />
      </Button>
    </div>
  );
});

ProjectItem.displayName = "ProjectItem";

// Main Component
export default function ProjectsDBManager({ closeDialog, dbProjects }) {
  // State management
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState(new Set());
  const [DBprojects, setDBprojects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState<
    Record<string, boolean>
  >({});

  // Global store
  const { allProjects, setAllProjects } = useAllProjects();
  const { setLogData, resetAll } = useLogAnalysis();
  const { setSelectedProject } = useSelectedProject();

  // Memoized filtered projects
  const filteredProjects = useMemo(() => {
    if (!inputValue.trim()) return allProjects;
    return allProjects.filter((project) =>
      project.name.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [allProjects, inputValue]);

  // Format timestamp utility
  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return "No date";
    const date = new Date(timestamp);
    return isNaN(date.getTime())
      ? "Invalid Date"
      : date.toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  }, []);

  // Optimized project fetching
  const handleGetAllProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const allProjects = await invoke("get_all_projects_command");
      setAllProjects(allProjects);

      const allProjData = await Promise.all(
        allProjects.map((proj) =>
          invoke("get_logs_by_project_name_command", { project: proj.name })
        )
      );

      setDBprojects(allProjData);
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsLoading(false);
    }
  }, [setAllProjects]);

  // Project creation
  const handleCreateProject = useCallback(
    async (projectName: string) => {
      if (!projectName.trim()) {
        toast.error("Please enter a project name");
        return;
      }

      try {
        setIsLoading(true);
        const newProject = { name: projectName.trim() };

        await invoke("create_project_command", { name: newProject.name });
        await handleGetAllProjects();

        setInputValue("");
        toast.success(`Project created: ${newProject.name}`);
      } catch (error) {
        toast.error("Failed to create project");
      } finally {
        setIsLoading(false);
      }
    },
    [handleGetAllProjects]
  );

  // Project deletion
  const handleDeleteProject = useCallback(
    async (id: string) => {
      try {
        setIsLoading(true);
        await invoke("delete_project_command", { id });
        await handleGetAllProjects();
        toast.success("Project deleted successfully");
      } catch (error) {
        toast.error("Failed to delete project");
      } finally {
        setIsLoading(false);
      }
    },
    [handleGetAllProjects]
  );

  // Toggle dropdown
  const toggleDropdown = useCallback((projectName: string) => {
    setOpenDropdowns((prev) => {
      const newSet = new Set(prev);
      newSet.has(projectName)
        ? newSet.delete(projectName)
        : newSet.add(projectName);
      return newSet;
    });
  }, []);

  // Initial data load
  useEffect(() => {
    handleGetAllProjects();
  }, [handleGetAllProjects]);

  // Log level color
  const getLogLevelColor = useCallback((level: string) => {
    switch (level) {
      case "error":
        return "text-red-500 bg-red-50 dark:bg-red-900/20";
      case "warn":
        return "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
      case "info":
        return "text-blue-500 bg-blue-50 dark:bg-blue-900/20";
      default:
        return "text-gray-500 bg-gray-50 dark:bg-gray-900/20";
    }
  }, []);

  // ###########################################
  // Handle all the logic to bring the data to the frontend
  // GET THE SELECTED LOG FROM THE PROJECT NAME TO ANALYSE THE LOGS
  const getSelectedLogForAnalysis = async (projectName: string) => {
    if (!projectName) {
      toast.error("Please select a project");
      return;
    }

    // Listen for log batches (setup BEFORE invoking the command)
    const allLogs: LogResult[] = [];
    const unlistenBatch = await listen<LogResult[]>(
      "project-logs-batch",
      (event) => {
        allLogs.push(...event.payload);
        console.log("Current batch received. Total logs:", allLogs.length);
      }
    );

    // Listen for completion/errors
    const unlistenComplete = await listen<void>("project-logs-complete", () => {
      console.log("Streaming complete. Final count:", allLogs.length);
    });

    try {
      setLoadingProjects((prev) => ({ ...prev, [projectName]: true }));
      toast.info(`Processing logs for ${projectName}...`);

      // Start streaming (use the STREAMING command, not the blocking one)
      await invoke("get_logs_by_project_name_for_processing_command", {
        project: projectName,
      });

      // Process logs ONLY after streaming finishes

      // RESET THE PREVIOUS LOGS TO LOAD THE NEW LOGS
      resetAll();

      // SEND THE LOGS TO THE BE
      await processLogs(allLogs);

      toast.success(`Project ${projectName} processed successfully`);
    } catch (err) {
      console.error("Processing failed:", err);
      toast.error(
        <section className="w-full">
          {err instanceof Error ? err.message : String(err)}
        </section>
      );
    } finally {
      // Cleanup listeners and loading state
      unlistenBatch?.();
      unlistenComplete?.();
      setLoadingProjects((prev) => ({ ...prev, [projectName]: false }));
      console.log("finished all the bull;shit");
      setSelectedProject(projectName);
    }
  };

  // Processing logs function
  const processLogs = async (logData: any[]) => {
    console.log("logDATA length", logData.length);

    const CHUNK_SIZE = 5;
    for (let i = 0; i < logData.length; i += CHUNK_SIZE) {
      const chunk = logData.slice(i, i + CHUNK_SIZE);
      try {
        await invoke<LogAnalysisResult>("check_logs_command", {
          data: {
            log_contents: chunk.map((item) => [item.project, item.log]),
          },
          storingLogs: false,
          project: "",
        });
        // Optional: Add slight delay between chunks
        await new Promise((resolve) => setTimeout(resolve, 10));
      } catch (error) {
        console.error("Failed to process chunk:", error);
        throw error; // Or handle gracefully
      }
    }
  };

  // ##############################################
  //
  //
  return (
    <section className="w-[650px] max-w-5xl mx-auto h-[670px] pt-2">
      <CardContent className="grid grid-cols-1 gap-6 h-[380px]">
        <div className="space-y-4">
          <div className="rounded-md h-[580px] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column - Project Settings */}
              <div className="space-y-6 overflow-hidden">
                <div>
                  <h3 className="text-sm font-medium mb-2 text-left dark:text-white">
                    Projects
                  </h3>

                  <div className="space-y-3 border rounded-md bg-muted h-[23.1rem] dark:border-brand-dark">
                    <div className="py-1 p-4">
                      <div className="space-y-2 mt-2">
                        <Input
                          placeholder="Enter project name..."
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          className="text-xs dark:text-white"
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleCreateProject(inputValue)
                          }
                        />
                        <Button
                          onClick={() => handleCreateProject(inputValue)}
                          size="sm"
                          className="w-full text-xs"
                          disabled={!inputValue.trim() || isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Plus className="h-3 w-3 mr-1" />
                          )}
                          Create Project
                        </Button>
                      </div>
                    </div>

                    {/* Projects List */}
                    <section className="h-full">
                      <div className="">
                        <h4 className="text-xs h-6 border-b dark:border-brand-dark shadow font-medium px-4 dark:text-white sticky bg-white dark:bg-brand-darker">
                          Your Projects ({filteredProjects.length})
                        </h4>
                        <div className="space-y-2 p-3 h-[14.5em] overflow-y-auto">
                          {filteredProjects.length > 50 ? (
                            <List
                              height={300}
                              itemCount={filteredProjects.length}
                              itemSize={60}
                              width="100%"
                            >
                              {({ index, style }) => (
                                <div style={style}>
                                  <ProjectItem
                                    project={filteredProjects[index]}
                                    onDelete={handleDeleteProject}
                                  />
                                </div>
                              )}
                            </List>
                          ) : (
                            filteredProjects.map((project) => (
                              <ProjectItem
                                key={project.id}
                                project={project}
                                onDelete={handleDeleteProject}
                              />
                            ))
                          )}
                          {filteredProjects.length === 0 && (
                            <div className="text-center py-4 text-xs text-gray-500 dark:text-gray-400">
                              {inputValue.trim()
                                ? "No matching projects"
                                : "No projects created yet"}
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>

              {/* Right Column - Project Logs */}
              <div>
                <h3 className="text-lg dark:text-white font-semibold text-left">
                  Assigned Logs
                </h3>
                <div className="border dark:border-brand-dark dark:border-brand rounded-lg h-[370px] overflow-y-auto">
                  {isLoading ? (
                    <SkeletonLoader />
                  ) : DBprojects.some((group) => group.length > 0) ? (
                    DBprojects.map((projectGroup, index) => {
                      if (projectGroup.length === 0) return null;
                      const projectName = projectGroup[0]?.project;

                      return (
                        <div
                          key={`${projectName}-${index}`}
                          className="border-b dark:border-gray-700"
                        >
                          <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200 dark:bg-slate-900/50">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center text-sm mb-2">
                                <FaProjectDiagram className="mr-2 text-blue-500 dark:text-blue-400" />
                                <p className="text-sm text-brand-bright font-semibold dark:text-brand-bright truncate w-full">
                                  {projectName}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 mb-1">
                                <FaCalendarAlt className="inline-block text-xs ml-[1px] text-black dark:text-white" />
                                <span className="text-[10px] -ml-[2px] font-mono text-gray-500">
                                  {formatTimestamp(projectGroup[0]?.date)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <FaFolder className="inline-block text-xs ml-[1px] text-gray-600 dark:text-gray-400" />
                                <span className="text-[10px] -ml-[2px] text-gray-500">
                                  {projectGroup.length} logs
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleDropdown(projectName)}
                                  className="h-5 w-5 p-0 pt-[2px] hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                  <ChevronDown
                                    className={`h-3 w-3 transition-transform duration-200 dark:text-white/50 ${
                                      openDropdowns.has(projectName)
                                        ? "rotate-180"
                                        : ""
                                    }`}
                                  />
                                </Button>
                              </div>
                            </div>

                            <div className="flex items-center">
                              {projectName !== DBprojects?.project && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
                                  onClick={() =>
                                    getSelectedLogForAnalysis(projectName)
                                  }
                                >
                                  {loadingProjects[projectName] ? (
                                    <Spinner
                                      className="h-2 w-2 text-gray-500 dark:text-brand-bright"
                                      bg-gray-200
                                    />
                                  ) : (
                                    <IoPlayCircleOutline className="h-2 w-2 text-gray-500 dark:text-brand-bright" />
                                  )}
                                </Button>
                              )}{" "}
                            </div>
                          </div>

                          {openDropdowns.has(projectName) && (
                            <div className="px-4  pt-2 pb-6 bg-gray-100 dark:bg-brand-bright/20  border-dashed border-brand-bright border-tr">
                              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Project Logs ({projectName})
                              </div>
                              <div className="space-y-2 max-h-80 overflow-y-auto pb-1 pr-1 ">
                                {projectGroup.map((log, logIndex) => (
                                  <div
                                    key={`${projectName}-log-${logIndex}`}
                                    className="flex items-center gap-2 p-1 rounded text-xs border border-black/10 dark:border-gray-700"
                                  >
                                    <Badge
                                      className={`text-[10px] px-1 dark:text-white py-0 ${getLogLevelColor(log.level || "info")}`}
                                    >
                                      {log.level || "LOG"}
                                    </Badge>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-gray-800 dark:text-gray-200 truncate">
                                        {log.filename}
                                      </p>
                                      <p className="text-gray-500 dark:text-gray-400 text-[10px]">
                                        {formatTimestamp(log.date)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      <FolderOpen className="h-8 w-8 mb-2" />
                      <p className="text-xs">No projects with logs assigned.</p>
                      <p className="text-xs px-4 text-center">
                        Enable log storage and create a new project or analyse
                        logs from an existing projects.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end mt-8">
        <div className="flex gap-2">
          <Button
            onClick={handleGetAllProjects}
            variant="secondary"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Refresh
          </Button>
        </div>
      </CardFooter>
    </section>
  );
}
