// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import { X, Loader2, FolderOpen, Plus, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { invoke } from "@tauri-apps/api/core";
import {
  FaCalendarAlt,
  FaFolder,
  FaPlay,
  FaProjectDiagram,
} from "react-icons/fa";
import { SkeletonLoader } from "./SkeletonLoader";
import type { ProjectEntry } from "@/types/ProjectEntry"; // Declare ProjectEntry here
import { MdDownloading } from "react-icons/md";
import { IoPlayCircleOutline } from "react-icons/io5";
import { forEach } from "lodash";
import {
  useAllProjects,
  useProjectsLogs,
  useSelectedProject,
} from "@/store/logFilterStore";

// Mock data for demonstration
const mockProjectsData: ProjectEntry[] = [
  {
    id: "proj_001",
    name: "www.slimstock.comn",
    status: "active",
    createdAt: "2024-01-15T10:30:00Z",
    logCount: 23,
    description: "Complete overhaul of the shopping experience",
  },
];

const mockLogsData = {
  proj_001: [
    {
      id: "log_001_5",
      message: "Performance optimization completed",
      level: "info",
      timestamp: "2024-01-16T09:45:00Z",
    },
  ],
};

// Mock store hook
const useMockProjectsStore = () => ({
  setStoringProjects: (value: boolean) =>
    console.log("Setting storing projects:", value),
  storedProjectsFromDBStore: mockProjectsData,
});

const formatTimestamp = (timestamp) => {
  if (!timestamp || typeof timestamp !== "string") {
    return "Invalid Timestamp";
  }

  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour24: true,
    });
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "Invalid Timestamp";
  }
};

export default function ProjectsDBManager({ closeDialog, dbProjects }: any) {
  const [saveProjects, setSaveProjects] = React.useState(() => {
    const projectsStorageValue = localStorage.getItem("projectsStorage");
    return projectsStorageValue ? JSON.parse(projectsStorageValue) : false;
  });
  const [projects, setProjects] = React.useState<ProjectEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [newProjectName, setNewProjectName] = React.useState("");
  const { setStoringProjects, storedProjectsFromDBStore } =
    useMockProjectsStore();
  const [projectsFromDB, setProjectsFromDB] = React.useState<ProjectEntry[]>(
    storedProjectsFromDBStore,
  );
  const [openDropdowns, setOpenDropdowns] = React.useState<Set<string>>(
    new Set(),
  );

  // DATA FROM DB
  const [DBprojects, setDBprojects] = useState([]);

  // GLOBAL STORE
  const projectsFromStore = useProjectsLogs((state) => state.projects);
  const setProjectsFromStore = useProjectsLogs((state) => state.setProjects);
  const { selectedProject } = useSelectedProject((state) => state);
  const { allProjects, setAllProjects } = useAllProjects(); // STORE THE NAMES ONLY OF PROJECTS

  useEffect(() => {
    const storedProjects = localStorage.getItem("projectsData");
    if (storedProjects) {
      setProjects(JSON.parse(storedProjects));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("projectsStorage", JSON.stringify(saveProjects));
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "projectsStorage",
        newValue: JSON.stringify(saveProjects),
      }),
    );

    if (saveProjects) {
      localStorage.setItem("projectsData", JSON.stringify(projects));
    } else {
      localStorage.removeItem("projectsData");
    }

    setStoringProjects(saveProjects);
  }, [saveProjects, projects]);

  const handleRemoveAllProjects = async () => {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      mockProjectsData.length = 0;
      setProjectsFromDB([]);
      toast.success("All projects have been removed from database");
    } catch (error) {
      console.error(error);
      toast.error("Failed to clear database");
    }
  };

  const handleRefreshProjects = async () => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProjectsFromDB(mockProjectsData);
      // toast.success("Projects refreshed successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to refresh projects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      const updatedProjects = mockProjectsData.filter(
        (project) => project.id !== id,
      );
      mockProjectsData.length = 0;
      mockProjectsData.push(...updatedProjects);
      setProjectsFromDB([...mockProjectsData]);
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete project");
    }
  };

  // CREATE PROJECT LOGIC
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newProject: ProjectEntry = {
        name: newProjectName.trim(),
      };

      // CALL THE BACKEND
      await invoke("create_project_command", {
        name: newProject.name,
      });

      handleGetAllProjects();

      mockProjectsData.unshift(newProject);
      setProjectsFromDB([...mockProjectsData]);
      setNewProjectName("");
      // toast.success("Project created successfully");
      toast.success(<>Project created: {newProject.name}</>);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create project");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "paused":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const toggleDropdown = (projectName: string) => {
    const newOpenDropdowns = new Set(openDropdowns);
    if (newOpenDropdowns.has(projectName)) {
      newOpenDropdowns.delete(projectName);
    } else {
      newOpenDropdowns.add(projectName);
    }
    setOpenDropdowns(newOpenDropdowns);
  };

  const getLogLevelColor = (level: string) => {
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
  };

  const formatLogTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleRefreshProjects();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // GET ALL THE PROJECTS NAMES ONLY FROM THE DATABASED
  // const handleDisplayProjects = async () => {
  //   try {
  //     const data = await invoke("get_stored_projects_command");
  //     console.log(data, "Display Projects");
  //     // toast.success("Projects have been retrieved from the database");
  //   } catch (error) {
  //     console.error(error);
  //     toast.error(error);
  //   }
  // };

  const handleFindProject = async (project) => {
    try {
      const data = await invoke("get_logs_by_project_name_command", {
        name,
      });
      console.log(data);
      // toast.success("Projects have been retrieved from the database");
    } catch (error) {
      console.error(error);
      toast.error(error);
    }
  };

  const handleGetAllProjects = async () => {
    try {
      const allProjects = await invoke("get_all_projects_command");
      console.log(allProjects);
      setAllProjects(allProjects);

      const allProjData = [];

      for (const proj of allProjects) {
        const data = await invoke("get_logs_by_project_name_command", {
          project: proj.name,
        });
        console.log(data, "data");
        allProjData.push(data); // Accumulate data
      }

      console.log(allProjData, "All proj Data");
      setDBprojects(allProjData); // Update state once after collecting all data
      // toast.success("Projects have been retrieved from the database");
    } catch (error) {
      console.error(error);
      toast.error(String(error));
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleGetAllProjects();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  console.log(allProjects, "#########################");

  const handleCheckLogs = async () => {
    try {
      const logs = DBprojects.some((arr) => arr.length > 0);
      console.log(logs, "SOME LOGS ===============");
    } catch (err) {
      console.error(err);
    }
  };

  handleCheckLogs();

  const handleLoadProject = (data) => {
    toast.info(<>{data}</>);
  };

  // DEBOUNCE THE INPUT
  // Add debounce function
  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  };

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
                    Add projects
                  </h3>

                  <div className="space-y-3 border rounded-md bg-muted h-[23.1rem] dark:border-brand-dark">
                    <div className="py-1 p-4">
                      <div className="space-y-2 mt-2">
                        <Input
                          placeholder="Enter project name..."
                          value={newProjectName}
                          onChange={(e) =>
                            debounce(setNewProjectName, 1000)(e.target.value)
                          }
                          className="text-xs dark:text-white"
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleCreateProject()
                          }
                        />
                        <Button
                          onClick={handleCreateProject}
                          size="sm"
                          className="w-full text-xs"
                          disabled={!newProjectName.trim()}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Create Project
                        </Button>
                      </div>
                    </div>

                    {/* PROJECTS AVAILABLE - IMPROVED SECTION */}
                    <section className="h-full">
                      <div className="">
                        <h4 className="text-xs h-6 border-b dark:border-brand-dark shadow  font-medium  px-4 dark:text-white sticky bg-white dark:bg-brand-darker">
                          Your Projects ({allProjects.length})
                        </h4>
                        <div className="space-y-2 p-3 h-[14.5em]  overflow-y-auto">
                          {allProjects.map((project) => (
                            <div
                              key={project.id}
                              className="flex items-center justify-between p-2 rounded-md transition-colors duration-200
                          hover:bg-gray-100 dark:hover:bg-gray-700 border dark:border-gray-700"
                            >
                              <div className="flex flex-col  space-y-0.5 ">
                                <div className="flex items-center justify-start">
                                  <FaProjectDiagram className="h-3 w-3 mr-1 text-blue-500 dark:text-blue-400" />
                                  <div>
                                    <span className="text-xs font-medium dark:text-white truncate max-w-[120px]">
                                      {project?.name}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <FaCalendarAlt className="text-xs text-brand-bright" />
                                  <span className="text-[10px]  text-black/50 dark:text-white/50">
                                    added: {formatTimestamp(project?.date)}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 hover:bg-gray-200 dark:hover:bg-gray-600"
                                onClick={() =>
                                  handleDeleteProject(project.name)
                                }
                              >
                                <X className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                              </Button>
                            </div>
                          ))}
                          {allProjects.length === 0 && (
                            <div className="text-center py-4 text-xs text-gray-500 dark:text-gray-400">
                              No projects created yet
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>

              {/* Right Column - Project List (unchanged) */}
              <div>
                <h3 className="text-lg dark:text-white font-semibold text-left">
                  Assigned Logs
                </h3>
                <div className="border dark:border-brand-dark dark:border-brand rounded-lg h-[370px] overflow-y-auto">
                  {isLoading ? (
                    <SkeletonLoader />
                  ) : DBprojects.some(
                      (projectGroup) => projectGroup.length > 0,
                    ) ? (
                    DBprojects.map((projectGroup, index) => {
                      if (projectGroup.length === 0) return null;
                      const projectName = projectGroup[0]?.project;
                      return (
                        <div
                          key={`${projectName}-${index}`}
                          className="border-b dark:border-gray-700"
                        >
                          <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200 dark:bg-slate-900/50">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center text-sm mb-2">
                                <FaProjectDiagram className="mr-2 text-blue-500 dark:text-blue-400" />
                                <p className="text-sm text-brand-bright font-semibold dark:text-brand-bright truncate w-full ">
                                  {projectName}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 mb-1">
                                <FaCalendarAlt className="inline-block text-xs ml-[1px] text-black dark:text-white" />
                                <span className="text-[10px] -ml-[2px] font-mono text-gray-500">
                                  {projectGroup[0]?.date
                                    ? formatTimestamp(projectGroup[0].date)
                                    : "No date"}
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
                                  className="h-5 w-5 p-0 ml-2 hover:bg-gray-200 dark:hover:bg-gray-700"
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

                            <div className="flex items-center ">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Remove project"
                                disabled={isLoading}
                                className="h-6 w-6 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors duration-200 "
                                onClick={() => handleLoadProject(projectName)}
                              >
                                <IoPlayCircleOutline className="h-2 w-2 text-gray-500 dark:text-red-400" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Remove project"
                                disabled={isLoading}
                                className="h-6 w-6  hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
                                onClick={() => handleDeleteProject(projectName)}
                              >
                                <X className="h-4 w-4 text-gray-500 dark:text-red-400" />
                              </Button>
                            </div>
                          </div>

                          {/* Logs Dropdown */}
                          {openDropdowns.has(projectName) && (
                            <div className="px-4 pb-3 bg-gray-50 dark:bg-slate-900/40">
                              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Project Logs ({projectName})
                              </div>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {projectGroup.map((log, logIndex) => (
                                  <div
                                    key={`${projectName}-log-${logIndex}`}
                                    className="flex items-start gap-2 p-2 rounded text-xs border dark:border-gray-700"
                                  >
                                    <Badge
                                      className={`text-[10px] px-1 py-0 ${getLogLevelColor("info")}`}
                                    >
                                      info
                                    </Badge>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-gray-800 dark:text-gray-200 truncate">
                                        {log.filename}
                                      </p>
                                      <p className="text-gray-500 dark:text-gray-400 text-[10px]">
                                        {log.date
                                          ? formatLogTimestamp(log.date)
                                          : "No timestamp"}
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
                      <p className="text-xs">
                        No projects with logs available.
                      </p>
                      <p className="text-xs px-4 text-center">
                        Enable log storage and create a new project.
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
            onClick={handleRefreshProjects}
            variant="secondary"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Refresh
          </Button>
          <Button onClick={handleRemoveAllProjects} variant="destructive">
            Clear database
          </Button>
        </div>
      </CardFooter>
    </section>
  );
}
