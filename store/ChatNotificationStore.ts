import { create } from "zustand";

interface ChatNotificationState {
  hasUnread: boolean;
  markUnread: () => void;
  markRead: () => void;
}

export const useChatNotificationStore = create<ChatNotificationState>(
  (set) => ({
    hasUnread: false,
    markUnread: () => set({ hasUnread: true }),
    markRead: () => set({ hasUnread: false }),
  }),
);
