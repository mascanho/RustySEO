// @ts-nocheck
import { create } from "zustand";

interface CurrentLogsState {
  currentLogs: LogEntry[]; // Replace LogEntry with your actual type
  setCurrentLogs: (logs: LogEntry[]) => void;
}

interface ProjectsState {
  projects: [];
  setProjects: (projects: []) => void;
}

interface SelectedProject {
  selectedProject: [];
  setSelectedProject: (name: []) => void;
}

export const useCurrentLogs = create<CurrentLogsState>((set) => ({
  currentLogs: [],
  setCurrentLogs: (logs) => set({ currentLogs: logs }),
}));

export const useProjectsLogs = create<ProjectsState>((set) => ({
  projects: [],
  setProjects: (projects) => set({ projects: projects }),
}));

export const useSelectedProject = create<SelectedProject>((set) => ({
  selectedProject: [],
  setSelectedProject: (name) => set({ selectedProject: name }),
}));
