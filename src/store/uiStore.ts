import { create } from 'zustand';

interface UiState {
  tocOpen: boolean;
  toggleToc: () => void;
  closeToc: () => void;

  settingsOpen: boolean;
  toggleSettings: () => void;
  closeSettings: () => void;
}

/** Visibility of the reader's side panels. Kept apart from book state so
 *  opening a panel never re-renders anything that touches epub.js. */
export const useUiStore = create<UiState>((set) => ({
  tocOpen: false,
  toggleToc: () => set((state) => ({ tocOpen: !state.tocOpen })),
  closeToc: () => set({ tocOpen: false }),

  settingsOpen: false,
  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),
  closeSettings: () => set({ settingsOpen: false }),
}));
