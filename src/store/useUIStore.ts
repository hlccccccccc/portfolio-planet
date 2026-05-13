import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  audioEnabled: boolean
  reducedMotion: boolean
  gpuTier: number | null
  toggleAudio: () => void
  setGpuTier: (tier: number) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      audioEnabled: false,
      reducedMotion: typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false,
      gpuTier: null,
      toggleAudio: () => set((s: UIStore) => ({ audioEnabled: !s.audioEnabled })),
      setGpuTier: (tier: number) => set({ gpuTier: tier }),
    }),
    {
      name: 'portfolio-planet-ui',
      partialize: (s: UIStore) => ({ audioEnabled: s.audioEnabled }),
    },
  ),
)
