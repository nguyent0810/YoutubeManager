import { create } from "zustand"

interface UiState {
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
  toggleMobileNav: () => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  toggleMobileNav: () =>
    set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}))
