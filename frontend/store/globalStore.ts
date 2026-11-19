import { create } from "zustand";

type GlobalState = {
  year: string | null;
  setYear: (y: string | null) => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  year: null,
  setYear: (y: string | null) => set({ year: y }),
}));
