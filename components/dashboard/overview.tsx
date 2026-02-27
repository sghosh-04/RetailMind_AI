"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Package, FileText, TrendingUp, Bot, Search,
  IndianRupee, RefreshCw, AlertTriangle, CheckCircle2,
  Clock, XCircle, ArrowUpRight, ShoppingCart, BarChart3,
} from "lucide-react"

const EMERALD = "#47ff86"
const CYAN = "#22d3ee"
const PURPLE = "#a78bfa"
const AMBER = "#f59e0b"
const RED = "#f87171"

const REFRESH_INTERVAL = 30_000 // 30 seconds

interface Stats {
  products: number
  lowStock: number
  paidBills: number
  draftBills: number
  cancelledBills: number
  totalBills: number
  revenue: number
  analyses: number
  todayRevenue: number
  todayBills: number
  businessName: string
  displayId: string
  gstNumber: string
  recentBills: { id: string; customer: string; total: number; status: string; date: string }[]
  lowStockItems: { name: string; stock: number; unit: string }[]
  monthly: { month: string; revenue: number; bills: number }[]
  fetchedAt: string
}

const quickLinks = [
  { label: "Add Product", href: "/dashboard/products", icon: Package, color: EMERALD },
  { label: "Create Bill", href: "/dashboard/bills/new", icon: FileText, color: CYAN },
  { label: "Market Analysis", href: "/dashboard/market-analysis", icon: TrendingUp, color: EMERALD },
  { label: "Search Products", href: "/dashboard/search", icon: Search, color: PURPLE },
  { label: "AI Copilot", href: "/dashboard/copilot", icon: Bot, color: AMBER },
]

function fmt(n: number) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
}

function StatusDot({ status }: { status: string }) {
  const cfg: Record<string, { color: string; icon: React.ReactNode }> = {
    paid: { color: EMERALD, icon: <CheckCircle2 className="w-3 h-3" /> },
    draft: { color: AMBER, icon: <Clock className="w-3 h-3" /> },
    cancelled: { color: RED, icon: <XCircle className="w-3 h-3" /> },
  }
  const c = cfg[status] ?? cfg.draft
  return <span style={{ color: c.color, display: "flex", alignItems: "center", gap: 3 }}>{c.icon}</span>
}

interface Props {
  initialStats: Stats
}

export default function DashboardOverview({ initialStats }: Props) {
  const [stats, setStats] = useState<Stats>(initialStats)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000)
  const [error, setError] = useState("")

  const fetchStats = useCallback(async (manual = false) => {
    if (manual) setLoading(true)
    try {
      const res = await fetch("/api/dashboard/stats")
      if (!res.ok) throw new Error("Failed")
      const data: Stats = await res.json()
      setStats(data)
      setLastUpdated(new Date())
      setCountdown(REFRESH_INTERVAL / 1000)
      setError("")
    } catch {
      setError("Could not refresh data")
    } finally {
      if (manual) setLoading(false)
    }
  }, [])

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchStats(), REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchStats])

  // Countdown ticker
  useEffect(() => {
    const tick = setInterval(() => setCountdown((c) => (c <= 1 ? REFRESH_INTERVAL / 1000 : c - 1)), 1000)
    return () => clearInterval(tick)
  }, [])

  const maxRevenue = Math.max(...stats.monthly.map((m) => m.revenue), 1)

  const metricCards = [
    {
      label: "Total Products", value: stats.products.toLocaleString(),
      icon: Package, href: "/dashboard/products", color: EMERALD,
      sub: stats.lowStock > 0 ? `${stats.lowStock} low stock` : "All stocked",
      subColor: stats.lowStock > 0 ? RED : EMERALD,
    },
    {
      label: "Total Revenue", value: fmt(stats.revenue),
      icon: IndianRupee, href: "/dashboard/bills", color: EMERALD,
      sub: `${fmt(stats.todayRevenue)} today`, subColor: CYAN,
    },
    {
      label: "Total Bills", value: stats.totalBills.toLocaleString(),
      icon: FileText, href: "/dashboard/bills", color: CYAN,
      sub: `${stats.paidBills} paid · ${stats.draftBills} draft`, subColor: "rgba(255,255,255,0.40)",
    },
    {
      label: "Market Analyses", value: stats.analyses.toLocaleString(),
      icon: TrendingUp, href: "/dashboard/market-analysis", color: PURPLE,
      sub: "AI-powered insights", subColor: "rgba(255,255,255,0.40)",
    },
    {
      label: "Today's Bills", value: stats.todayBills.toLocaleString(),
      icon: ShoppingCart, href: "/dashboard/bills", color: AMBER,
      sub: "Created today", subColor: "rgba(255,255,255,0.40)",
    },
    {
      label: "Paid Bills", value: stats.paidBills.toLocaleString(),
      icon: BarChart3, href: "/dashboard/bills", color: EMERALD,
      sub: stats.totalBills > 0 ? `${Math.round((stats.paidBills / stats.totalBills) * 100)}% conversion` : "No bills yet",
      subColor: EMERALD,
    },
  ]

  const cardStyle = {
    background: "rgba(10,20,14,0.70)",
    borderColor: "rgba(71,255,134,0.10)",
    backdropFilter: "blur(16px)",
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", margin: 0 }}>
            Live Dashboard
          </h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.40)", marginTop: 4 }}>
            Real-time metrics from your business operations
          </p>
        </div>
        {/* Refresh controls */}
        <div className="flex items-center gap-3">
          {error && (
            <span className="flex items-center gap-1 text-xs" style={{ color: RED }}>
              <AlertTriangle className="w-3 h-3" /> {error}
            </span>
          )}
          <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            <span
              className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: EMERALD, boxShadow: `0 0 6px ${EMERALD}` }}
            />
            Live · refreshes in {countdown}s
          </div>
          <button
            onClick={() => fetchStats(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
            style={{ background: "rgba(71,255,134,0.10)", border: "1px solid rgba(71,255,134,0.20)", color: EMERALD }}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing…" : "Refresh Now"}
          </button>
        </div>
      </div>

      {/* Last updated pill */}
      <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
        <CheckCircle2 className="w-3 h-3" style={{ color: EMERALD }} />
        Last updated: {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>

      {/* KPI metric cards — 3 cols */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border p-5 flex flex-col gap-3 transition-all card-hover group"
            style={{ ...cardStyle, textDecoration: "none", borderColor: "rgba(71,255,134,0.10)" }}
          >
            <div className="flex items-center justify-between">
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)", margin: 0 }}>
                {card.label}
              </p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${card.color}18`, border: `1px solid ${card.color}30` }}>
                <card.icon style={{ width: 14, height: 14, color: card.color }} />
              </div>
            </div>
            <div>
              <p style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", margin: 0, lineHeight: 1 }}>
                {card.value}
              </p>
              <span style={{ fontSize: 11, marginTop: 5, display: "flex", alignItems: "center", gap: 3, color: card.subColor }}>
                <ArrowUpRight style={{ width: 10, height: 10 }} /> {card.sub}
              </span>
            </div>
            <div style={{ height: 2, borderRadius: 1, background: `linear-gradient(90deg, ${card.color}60 0%, transparent 100%)` }} />
          </Link>
        ))}
      </div>

      {/* Revenue trend + Recent Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Revenue Bar Chart */}
        <div className="rounded-xl border p-5" style={cardStyle}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: "0 0 4px" }}>Monthly Revenue</h3>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 20 }}>Last 6 months · paid bills only</p>
          {stats.monthly.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No billing data yet</p>
          ) : (
            <div className="flex items-end gap-2 h-28">
              {stats.monthly.map((m, i) => {
                const pct = (m.revenue / maxRevenue) * 100
                return (
                  <div key={`${m.month}-${i}`} className="flex-1 flex flex-col items-center gap-1 group">
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
                      {m.revenue > 0 ? fmt(m.revenue) : ""}
                    </span>
                    <div
                      className="w-full rounded-t-md relative"
                      style={{
                        height: `${Math.max(pct, 4)}%`,
                        background: `linear-gradient(180deg, ${EMERALD}, ${EMERALD}50)`,
                        transition: "height 0.5s ease",
                      }}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] bg-white/10 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap" style={{ color: "#fff" }}>
                        {m.bills} bills
                      </div>
                    </div>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.40)" }}>{m.month}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Bills */}
        <div className="rounded-xl border p-5" style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0 }}>Recent Bills</h3>
            <Link href="/dashboard/bills" style={{ fontSize: 11, color: EMERALD, textDecoration: "none" }}>View all →</Link>
          </div>
          {stats.recentBills.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No bills yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.recentBills.map((b, i) => (
                <Link
                  key={`${b.id}-${i}`}
                  href={`/dashboard/bills/${b.id}`}
                  className="flex items-center justify-between py-2 px-3 rounded-lg transition-colors hover:bg-white/5"
                  style={{ textDecoration: "none", borderBottom: "1px solid rgba(71,255,134,0.06)" }}
                >
                  <div className="flex items-center gap-2">
                    <StatusDot status={b.status} />
                    <span style={{ fontSize: 12, color: "#e8f5ec", fontWeight: 500 }}>{b.customer}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.40)" }}>{b.date}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: EMERALD, fontFamily: "monospace" }}>{fmt(b.total)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockItems.length > 0 && (
        <div className="rounded-xl border p-5" style={{ background: "rgba(248,113,113,0.05)", borderColor: "rgba(248,113,113,0.18)" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" style={{ color: RED }} />
            <h3 style={{ fontSize: 13, fontWeight: 600, color: RED, margin: 0 }}>Low Stock Alert</h3>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "rgba(248,113,113,0.12)", color: RED }}>
              {stats.lowStockItems.length} items
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {stats.lowStockItems.map((item, i) => (
              <div
                key={`${item.name}-${i}`}
                className="rounded-lg px-3 py-2"
                style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)" }}
              >
                <p style={{ fontSize: 11, fontWeight: 600, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                <p style={{ fontSize: 11, color: RED, marginTop: 2 }}>{item.stock} {item.unit} left</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 12 }}>Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-xl border p-4 flex flex-col items-center gap-2.5 text-center transition-all card-hover"
              style={{ background: "rgba(10,20,14,0.65)", borderColor: "rgba(71,255,134,0.10)", backdropFilter: "blur(12px)", textDecoration: "none" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${link.color}15`, border: `1px solid ${link.color}25` }}>
                <link.icon style={{ width: 18, height: 18, color: link.color }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.55)" }}>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Empty onboarding */}
      {stats.products === 0 && stats.totalBills === 0 && (
        <div className="rounded-xl border p-6 text-center" style={{ background: "rgba(71,255,134,0.04)", borderColor: "rgba(71,255,134,0.14)" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0 }}>Welcome to RetailMind AI!</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4, marginBottom: 16 }}>
            Start by adding your products, then generate bills and analyse your market.
          </p>
          <Link href="/dashboard/products" className="btn-emerald" style={{ textDecoration: "none", display: "inline-flex" }}>
            <Package size={15} /> Add Your First Product
          </Link>
        </div>
      )}
    </div>
  )
}
