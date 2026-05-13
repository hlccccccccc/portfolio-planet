import { create } from 'zustand'

interface SceneStore {
  hoveredItem: string | null
  activeItem: string | null
  cameraTarget: [number, number, number]
  setHoveredItem: (id: string | null) => void
  setActiveItem: (id: string | null) => void
  setCameraTarget: (target: [number, number, number]) => void
}

export const useSceneStore = create<SceneStore>((set) => ({
  hoveredItem: null,
  activeItem: null,
  cameraTarget: [0, 6, 0],
  setHoveredItem: (id) => set({ hoveredItem: id }),
  setActiveItem: (id) => set({ activeItem: id }),
  setCameraTarget: (target) => set({ cameraTarget: target }),
}))
