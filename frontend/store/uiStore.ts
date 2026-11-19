import { create } from "zustand";

type UIState = {
  sidebarOpen: boolean;
  setSidebar: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  setSidebar: (open: boolean) => set({ sidebarOpen: open })
}));
