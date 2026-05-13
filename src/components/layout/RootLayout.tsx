import { Outlet } from 'react-router-dom'

export default function RootLayout() {
  return (
    <>
      {/* Canvas mounts here in Phase 2 — persistent, never unmounts */}
      <div id="canvas-root" style={{ position: 'fixed', inset: 0, zIndex: 0 }} />
      <div id="overlay-root" style={{ position: 'relative', zIndex: 1 }}>
        <Outlet />
      </div>
    </>
  )
}
