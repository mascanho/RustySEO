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

export const useCurrentLogs = create<CurrentLogsState>((set) => ({
  currentLogs: [],
  setCurrentLogs: (logs) => set({ currentLogs: logs }),
}));

export const useProjectsLogs = create<ProjectsState>((set) => ({
  projects: [],
  setProjects: (projects) => set({ prohects: projects }),
}));
