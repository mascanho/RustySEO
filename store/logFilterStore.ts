// @ts-nocheck
import { create } from "zustand";

export const useCurrentLogs = create<CurrentLogsState>((set) => ({
  currentLogs: [],
  setCurrentLogs: (logs) => set({ currentLogs: logs }),
}));

export const useProjectsLogs = create<ProjectsState>((set) => ({
  projects: [],
  setProjects: (projects) => set({ projects: projects }),
}));

// Set the current project being listed on the UI
export const useSelectedProject = create<SelectedProject>((set) => ({
  selectedProject: [],
  setSelectedProject: (name) => set({ selectedProject: name }),
}));

// GET ALL THE PROJECTS ADDED BY THE USER THAT WILL THEN BE MAPPED IN THE DROPDOWN
export const useAllProjects = create<SelectedProject>((set) => ({
  allProjects: [],
  setAllProjects: (allProjects) => set({ allProjects: allProjects }),
}));
