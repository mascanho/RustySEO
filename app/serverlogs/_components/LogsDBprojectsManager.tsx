// @ts-nocheck
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Plus, ChevronDown, FolderOpen } from "lucide-react";
import { FaProjectDiagram, FaCalendarAlt, FaFolder } from "react-icons/fa";
import { FixedSizeList as List } from "react-window";
import { invoke } from "@tauri-apps/api/core";
import { IoPlayCircleOutline } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogAnalysis } from "@/store/ServerLogsStore";

// Mock types and interfaces
interface ProjectEntry {
  id: string;
  name: string;
  status?: string;
  createdAt?: string;
  logCount?: number;
  description?: string;
}

interface LogEntry {
  project: string;
  log: string;
  level?: string;
  date?: string;
  filename?: string;
}

const ProjectItem = React.memo(({ project, onDelete }) => {
  return (
    <div className="p-2 border-b dark:border-gray-700">
      <div className="flex justify-between items-center">
        <span className="text-xs">{project.name}</span>
        <button
          onClick={() => onDelete(project.id)}
          className="text-red-500 hover:text-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  );
});

ProjectItem.displayName = "ProjectItem";

const SkeletonLoader = () => (
  <div className="flex flex-col space-y-3 p-4">
    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
  </div>
);

const ProjectsDBManager = () => {
  const [allProjects, setAllProjects] = useState<ProjectEntry[]>([]);
  const [DBprojects, setDBprojects] = useState<LogEntry[][]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectEntry[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState<
    Record<string, boolean>
  >({});
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  const { setLogData } = useLogAnalysis();

  const handleGetAllProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const allProjects = await invoke<ProjectEntry[]>(
        "get_all_projects_command",
      );
      setAllProjects(allProjects);
      const allProjData = await Promise.all(
        allProjects.map((proj) =>
          invoke<LogEntry[]>("get_logs_by_project_name_command", {
            project: proj.name,
          }),
        ),
      );
      setDBprojects(allProjData);
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    [handleGetAllProjects],
  );

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
    [handleGetAllProjects],
  );

  const toggleDropdown = useCallback((projectName: string) => {
    setOpenDropdowns((prev) => {
      const newSet = new Set(prev);
      newSet.has(projectName)
        ? newSet.delete(projectName)
        : newSet.add(projectName);
      return newSet;
    });
  }, []);

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

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "No date";
    try {
      return new Date(timestamp).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Invalid date";
    }
  };

  useEffect(() => {
    handleGetAllProjects();
  }, [handleGetAllProjects]);

  const getSelectedLogForAnalysis = async (projectName: string) => {
    if (!projectName) {
      toast.error("Please select a project");
      return;
    }
    try {
      setLoadingProjects((prev) => ({ ...prev, [projectName]: true }));
      const log = await invoke(
        "get_logs_by_project_name_for_processing_command",
        {
          project: projectName,
        },
      );
      const result = await processLogs(log);

      setLogData({
        entries: result.entries || [],
        overview: result.overview || {
          message: "",
          line_count: 0,
          unique_ips: 0,
          unique_user_agents: 0,
          crawler_count: 0,
          success_rate: 0,
          totals: {
            google: 0,
            bing: 0,
            semrush: 0,
            hrefs: 0,
            moz: 0,
            uptime: 0,
            openai: 0,
            claude: 0,
            google_bot_pages: [],
            google_bot_pages_frequency: {},
          },
          log_start_time: "",
          log_finish_time: "",
        },
      });

      toast.success(`Project ${projectName} processed successfully`);
    } catch (err) {
      console.error(err);
      toast.error(String(err));
    } finally {
      setLoadingProjects((prev) => ({ ...prev, [projectName]: false }));
    }
  };

  const processLogs = async (logData: LogEntry[]) => {
    try {
      return await invoke<LogEntry[]>("check_logs_command", {
        data: {
          log_contents: logData.map((item) => [item.project, item.log]),
        },
        storingLogs: false,
        project: "your-project-name",
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return (
    <section className="w-[650px] max-w-5xl mx-auto h-[670px] pt-2">
      <div className="grid grid-cols-1 gap-6 h-[380px]">
        <div className="space-y-4">
          <div className="rounded-md h-[580px] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
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
                    <section className="h-full">
                      <div>
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
                          <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200 dark:bg-slate-900/50">
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
                              {projectName && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
                                  onClick={() =>
                                    getSelectedLogForAnalysis(projectName)
                                  }
                                >
                                  {loadingProjects[projectName] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <IoPlayCircleOutline className="h-2 w-2 text-gray-500 dark:text-brand-bright" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                          {openDropdowns.has(projectName) && (
                            <div className="px-4 pt-2 pb-6 bg-gray-100 dark:bg-brand-bright/20 border-dashed border-brand-bright border-t">
                              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Project Logs ({projectName})
                              </div>
                              <div className="space-y-2 max-h-80 overflow-y-auto pb-1">
                                {projectGroup.map((log, logIndex) => (
                                  <div
                                    key={`${projectName}-log-${logIndex}`}
                                    className="flex items-center gap-2 p-1 rounded text-xs border border-black/10 dark:border-gray-700"
                                  >
                                    <div
                                      className={`text-[10px] px-1 py-0 ${getLogLevelColor(log.level || "info")}`}
                                    >
                                      {log.level || "LOG"}
                                    </div>
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
                        Enable log storage and create a new project or analyze
                        logs from an existing project.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-8">
        <Button
          onClick={handleGetAllProjects}
          variant="secondary"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Refresh
        </Button>
      </div>
    </section>
  );
};

export default ProjectsDBManager;
