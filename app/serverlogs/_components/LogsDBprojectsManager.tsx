// @ts-nocheck
"use client";

import React, { useEffect } from "react";
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
  {
    id: "proj_002",
    name: "www.scpclub.com",
    status: "completed",
    createdAt: "2024-01-10T14:20:00Z",
    logCount: 15,
    description: "Implement secure login and registration",
  },
  {
    id: "proj_003",
    name: "www.chainanalytics.com",
    status: "paused",
    createdAt: "2024-01-08T09:15:00Z",
    logCount: 8,
    description: "Automated migration from legacy systems",
  },
  {
    id: "proj_004",
    name: "www.algarvewonders.com",
    status: "active",
    createdAt: "2024-01-20T16:45:00Z",
    logCount: 31,
    description: "WebSocket-based messaging system",
  },
  {
    id: "proj_005",
    name: "www.rustyseo.com",
    status: "completed",
    createdAt: "2024-01-05T11:00:00Z",
    logCount: 12,
    description: "Interactive API documentation with examples",
  },
  {
    id: "proj_006",
    name: "Performance Optimization",
    status: "active",
    createdAt: "2024-01-22T13:30:00Z",
    logCount: 19,
    description: "Improve application load times and responsiveness",
  },
  {
    id: "proj_007",
    name: "Security Audit Implementation",
    status: "paused",
    createdAt: "2024-01-12T08:20:00Z",
    logCount: 6,
    description: "Address security vulnerabilities and compliance",
  },
  {
    id: "proj_008",
    name: "User Analytics Dashboard",
    status: "active",
    createdAt: "2024-01-25T15:10:00Z",
    logCount: 27,
    description: "Comprehensive user behavior tracking and insights",
  },
];

const mockLogsData = {
  proj_001: [
    {
      id: "log_001_1",
      message: "Started frontend redesign phase",
      level: "info",
      timestamp: "2024-01-15T10:35:00Z",
    },
    {
      id: "log_001_2",
      message: "Updated shopping cart component",
      level: "info",
      timestamp: "2024-01-15T11:20:00Z",
    },
    {
      id: "log_001_3",
      message: "Fixed checkout validation error",
      level: "error",
      timestamp: "2024-01-15T14:15:00Z",
    },
    {
      id: "log_001_4",
      message: "Deployed to staging environment",
      level: "info",
      timestamp: "2024-01-15T16:30:00Z",
    },
    {
      id: "log_001_5",
      message: "Performance optimization completed",
      level: "info",
      timestamp: "2024-01-16T09:45:00Z",
    },
  ],
  proj_002: [
    {
      id: "log_002_1",
      message: "Implemented OAuth2 integration",
      level: "info",
      timestamp: "2024-01-10T14:25:00Z",
    },
    {
      id: "log_002_2",
      message: "Added biometric authentication",
      level: "info",
      timestamp: "2024-01-10T15:10:00Z",
    },
    {
      id: "log_002_3",
      message: "Security testing completed",
      level: "info",
      timestamp: "2024-01-10T16:45:00Z",
    },
  ],
  proj_003: [
    {
      id: "log_003_1",
      message: "Database schema analysis started",
      level: "info",
      timestamp: "2024-01-08T09:20:00Z",
    },
    {
      id: "log_003_2",
      message: "Migration script validation failed",
      level: "error",
      timestamp: "2024-01-08T11:30:00Z",
    },
    {
      id: "log_003_3",
      message: "Project paused pending review",
      level: "warn",
      timestamp: "2024-01-08T14:00:00Z",
    },
  ],
  proj_004: [
    {
      id: "log_004_1",
      message: "WebSocket server setup completed",
      level: "info",
      timestamp: "2024-01-20T16:50:00Z",
    },
    {
      id: "log_004_2",
      message: "Real-time message delivery tested",
      level: "info",
      timestamp: "2024-01-20T17:15:00Z",
    },
    {
      id: "log_004_3",
      message: "Connection timeout issue detected",
      level: "warn",
      timestamp: "2024-01-20T18:30:00Z",
    },
    {
      id: "log_004_4",
      message: "Implemented message encryption",
      level: "info",
      timestamp: "2024-01-21T10:20:00Z",
    },
  ],
  proj_005: [
    {
      id: "log_005_1",
      message: "API documentation structure created",
      level: "info",
      timestamp: "2024-01-05T11:05:00Z",
    },
    {
      id: "log_005_2",
      message: "Interactive examples added",
      level: "info",
      timestamp: "2024-01-05T13:20:00Z",
    },
    {
      id: "log_005_3",
      message: "Documentation portal deployed",
      level: "info",
      timestamp: "2024-01-05T15:45:00Z",
    },
  ],
  proj_006: [
    {
      id: "log_006_1",
      message: "Performance baseline established",
      level: "info",
      timestamp: "2024-01-22T13:35:00Z",
    },
    {
      id: "log_006_2",
      message: "Code splitting implementation started",
      level: "info",
      timestamp: "2024-01-22T14:20:00Z",
    },
    {
      id: "log_006_3",
      message: "Bundle size reduced by 40%",
      level: "info",
      timestamp: "2024-01-22T16:10:00Z",
    },
  ],
  proj_007: [
    {
      id: "log_007_1",
      message: "Security audit initiated",
      level: "info",
      timestamp: "2024-01-12T08:25:00Z",
    },
    {
      id: "log_007_2",
      message: "Critical vulnerability found",
      level: "error",
      timestamp: "2024-01-12T10:15:00Z",
    },
    {
      id: "log_007_3",
      message: "Audit paused for remediation",
      level: "warn",
      timestamp: "2024-01-12T11:30:00Z",
    },
  ],
  proj_008: [
    {
      id: "log_008_1",
      message: "Analytics tracking setup completed",
      level: "info",
      timestamp: "2024-01-25T15:15:00Z",
    },
    {
      id: "log_008_2",
      message: "Dashboard UI components created",
      level: "info",
      timestamp: "2024-01-25T16:30:00Z",
    },
    {
      id: "log_008_3",
      message: "Data visualization charts added",
      level: "info",
      timestamp: "2024-01-25T17:45:00Z",
    },
    {
      id: "log_008_4",
      message: "Real-time data sync implemented",
      level: "info",
      timestamp: "2024-01-26T09:20:00Z",
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
    storedProjectsFromDBStore
  );
  const [openDropdowns, setOpenDropdowns] = React.useState<Set<string>>(
    new Set()
  );

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
      })
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
      toast.success("Projects refreshed successfully");
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
        (project) => project.id !== id
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

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newProject: ProjectEntry = {
        id: `proj_${Date.now()}`,
        name: newProjectName.trim(),
        status: "active",
        createdAt: new Date().toISOString(),
        logCount: 0,
        description: "New project created",
      };

      mockProjectsData.unshift(newProject);
      setProjectsFromDB([...mockProjectsData]);
      setNewProjectName("");
      toast.success("Project created successfully");
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

  const toggleDropdown = (projectId: string) => {
    const newOpenDropdowns = new Set(openDropdowns);
    if (newOpenDropdowns.has(projectId)) {
      newOpenDropdowns.delete(projectId);
    } else {
      newOpenDropdowns.add(projectId);
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

  const handleDisplayProjects = async () => {
    try {
      const data = await invoke("get_stored_projects_command");
      console.log(data);
      toast.success("Projects have been retrieved from the database");
    } catch (error) {
      console.error(error);
      toast.error(error);
    }
  };

  return (
    <section className="w-[650px] max-w-5xl mx-auto h-[670px] pt-2">
      <CardContent className="grid grid-cols-1 gap-6 h-[380px]">
        <div className="space-y-4">
          <div className="rounded-md h-[580px] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column - Project Settings */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-2 text-left dark:text-white">
                    Project Settings
                  </h3>

                  <div className="space-y-4 p-4 border rounded-md bg-muted h-[23.1rem] dark:border-brand-dark">
                    {/* <div className="flex items-center space-x-2">
                      <Switch
                        id="save-projects"
                        checked={saveProjects}
                        onCheckedChange={setSaveProjects}
                        className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-300 dark:data-[state=checked]:bg-blue-700"
                      />
                      <Label htmlFor="save-projects" className="dark:text-white">
                        Store Projects in DB
                      </Label>
                    </div> */}
                    {/* <p className="text-xs text-muted-foreground dark:text-white/50">
                      When enabled, projects and their logs will be stored in your local database.
                    </p> */}

                    <div className="py-1">
                      <h4 className="text-sm font-medium mb-2 dark:text-white">
                        Create New Project
                      </h4>
                      <div className="space-y-2">
                        <Input
                          placeholder="Enter project name..."
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          className="text-xs"
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
                    {/* 
                    <div className="py-1">
                      <h4 className="text-sm font-medium mb-2 dark:text-white">Project retention options</h4>
                      <div className="space-y-2 dark:text-white/50 pt-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="auto-archive"
                            className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-300 dark:data-[state=checked]:bg-blue-700"
                          />
                          <Label htmlFor="auto-archive" className="text-xs">
                            Auto-archive completed projects
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="keep-recent"
                            className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-300 dark:data-[state=checked]:bg-blue-700"
                          />
                          <Label className="text-xs" htmlFor="keep-recent">
                            Keep only recent 50 projects
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="backup-logs"
                            className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-300 dark:data-[state=checked]:bg-blue-700"
                          />
                          <Label htmlFor="backup-logs" className="text-xs">
                            Backup project logs monthly
                          </Label>
                        </div>
                      </div>
                    </div> */}
                    <div className="bg-gray-200 dark:bg-brand-dark dark:text-white p-2 rounded-md mt-3 ">
                      <span className="text-xs leading-none">
                        Manage your projects and their associated logs. Each
                        project can have multiple logs assigned to track
                        progress and issues.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Project List */}
              <div>
                <h3 className="text-lg dark:text-white font-semibold text-left">
                  Local Projects
                </h3>
                <div className="border dark:border-brand-dark dark:border-brand rounded-lg h-[370px] overflow-y-auto">
                  {isLoading ? (
                    <SkeletonLoader />
                  ) : projectsFromDB.length > 0 ? (
                    projectsFromDB.map((project) => (
                      <div
                        key={project.id}
                        className="border-b dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center text-sm mb-2">
                              <FaProjectDiagram className="mr-2 text-blue-500 dark:text-blue-400" />
                              <p className="text-sm text-brand-bright font-semibold dark:text-brand-bright truncate w-full ">
                                {project?.name}
                              </p>
                              {/* <Badge className={`ml-2 text-xs ${getStatusColor(project?.status || "active")}`}>
                                {project?.status || "active"}
                              </Badge> */}
                            </div>

                            <div className="flex items-center gap-2 mb-1">
                              <FaCalendarAlt className="inline-block text-xs ml-[1px] text-black dark:text-white" />
                              <span className="text-[10px] -ml-[2px] font-mono text-gray-500">
                                {formatTimestamp(project?.createdAt)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <FaFolder className="inline-block text-xs ml-[1px] text-gray-600 dark:text-gray-400" />
                              <span className="text-[10px] -ml-[2px] text-gray-500">
                                {project?.logCount || 0} logs assigned
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleDropdown(project.id)}
                                className="h-5 w-5 p-0 ml-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                              >
                                <ChevronDown
                                  className={`h-3 w-3 transition-transform duration-200 ${
                                    openDropdowns.has(project.id)
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
                              onClick={() => handleDeleteProject(project.id)}
                            >
                              <IoPlayCircleOutline className="h-2 w-2 text-gray-500 dark:text-red-400" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Remove project"
                              disabled={isLoading}
                              className="h-6 w-6  hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
                              onClick={() => handleDeleteProject(project.id)}
                            >
                              <X className="h-4 w-4 text-gray-500 dark:text-red-400" />
                            </Button>
                          </div>
                        </div>

                        {/* Logs Dropdown */}
                        {openDropdowns.has(project.id) && (
                          <div className="px-4 pb-3 bg-gray-50 dark:bg-gray-800/50">
                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                              Project Logs (
                              {mockLogsData[project.id]?.length || 0})
                            </div>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {mockLogsData[project.id]?.map((log) => (
                                <div
                                  key={log.id}
                                  className="flex items-start gap-2 p-2 rounded text-xs border dark:border-gray-700"
                                >
                                  <Badge
                                    className={`text-[10px] px-1 py-0 ${getLogLevelColor(log.level)}`}
                                  >
                                    {log.level}
                                  </Badge>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-gray-800 dark:text-gray-200 truncate">
                                      {log.message}
                                    </p>
                                    <p className="text-gray-500 dark:text-gray-400 text-[10px]">
                                      {formatLogTimestamp(log.timestamp)}
                                    </p>
                                  </div>
                                </div>
                              )) || (
                                <p className="text-gray-500 dark:text-gray-400 text-xs italic">
                                  No logs available for this project
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      <FolderOpen className="h-8 w-8 mb-2" />
                      <p className="text-xs">No projects available.</p>
                      <p className="text-xs">
                        Enable DB storage and create your first project.
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
        {/* <Button
          variant="outline"
          onClick={handleDisplayProjects}
          className="dark:bg-brand-bright dark:border-brand-darker dark:text-white"
        >
          Display saved Projects
        </Button> */}
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
