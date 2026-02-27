"use client"

import { Bell, LayoutGrid, Search } from "lucide-react"

interface Props {
  title: string
  subtitle?: string
}

export default function DashboardHeader({ title, subtitle }: Props) {
  return (
    <header
      className="h-14 flex items-center gap-4 px-6 flex-shrink-0"
      style={{
        borderBottom: "1px solid rgba(71,255,134,0.08)",
        background: "rgba(5,12,8,0.80)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Search bar */}
      <div
        className="flex items-center gap-2 flex-1 max-w-sm rounded-lg px-3 py-1.5"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(71,255,134,0.10)",
        }}
      >
        <Search style={{ width: 13, height: 13, color: "rgba(255,255,255,0.30)", flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search market data, products, or AI predictions..."
          style={{
            background: "none",
            border: "none",
            outline: "none",
            fontSize: 12,
            color: "rgba(255,255,255,0.55)",
            width: "100%",
          }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Bell */}
      <button
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(71,255,134,0.12)",
          color: "rgba(255,255,255,0.45)",
          cursor: "pointer",
        }}
        aria-label="Notifications"
      >
        <Bell style={{ width: 14, height: 14 }} />
      </button>

      {/* Grid */}
      <button
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
        style={{
          background: "rgba(71,255,134,0.10)",
          border: "1px solid rgba(71,255,134,0.20)",
          color: "#47ff86",
          cursor: "pointer",
        }}
        aria-label="Apps"
      >
        <LayoutGrid style={{ width: 14, height: 14 }} />
      </button>
    </header>
  )
}
