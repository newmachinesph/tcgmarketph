import { create } from "zustand";

interface UIStore {
  // Mobile nav
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
  toggleNav: () => void;

  // Global modal (e.g. image lightbox, confirm dialog)
  modal: { id: string; data?: unknown } | null;
  openModal: (id: string, data?: unknown) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  navOpen: false,
  setNavOpen: (open) => set({ navOpen: open }),
  toggleNav: () => set((s) => ({ navOpen: !s.navOpen })),

  modal: null,
  openModal: (id, data) => set({ modal: { id, data } }),
  closeModal: () => set({ modal: null }),
}));
