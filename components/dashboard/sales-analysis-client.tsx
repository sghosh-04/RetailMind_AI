"use client"

import {
    TrendingUp, DollarSign, FileText, Package, ShoppingCart,
    ArrowUpRight, BarChart3, CheckCircle2, XCircle, Clock,
    Percent, Users,
} from "lucide-react"

const cardStyle = { background: "rgba(15,23,42,0.5)", borderColor: "rgba(255,255,255,0.07)" }
const accent = "#00d4ff"
const green = "#34d399"
const purple = "#a78bfa"
const amber = "#f59e0b"

type Stats = {
    totalRevenue: number; totalBills: number; paidBills: number
    draftBills: number; cancelledBills: number; avgOrderValue: number
    totalUnits: number; totalGst: number; totalProducts: number
}
type MonthlyRow = { month: string; revenue: number; billCount: number; paidCount: number }
type ProductRow = { name: string; revenue: number; units: number }
type CategoryRow = { category: string; revenue: number; units: number }
type BillRow = { billNumber: string; customer: string; total: number; status: string; date: string }

interface Props {
    stats: Stats
    monthly: MonthlyRow[]
    topProducts: ProductRow[]
    byCategory: CategoryRow[]
    recentBills: BillRow[]
}

function fmt(n: number) {
    if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`
    if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`
    if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`
    return `₹${n.toFixed(2)}`
}

function StatusBadge({ status }: { status: string }) {
    const cfg: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
        paid: { color: "#34d399", bg: "rgba(52,211,153,0.12)", icon: <CheckCircle2 className="w-3 h-3" /> },
        draft: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: <Clock className="w-3 h-3" /> },
        cancelled: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: <XCircle className="w-3 h-3" /> },
    }
    const c = cfg[status] ?? cfg.draft
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize" style={{ background: c.bg, color: c.color }}>
            {c.icon}{status}
        </span>
    )
}

export default function SalesAnalysisClient({ stats, monthly, topProducts, byCategory, recentBills }: Props) {
    const conversionRate = stats.totalBills > 0 ? Math.round((stats.paidBills / stats.totalBills) * 100) : 0
    const maxRevenue = Math.max(...monthly.map((m) => m.revenue), 1)
    const maxProduct = Math.max(...topProducts.map((p) => p.revenue), 1)
    const maxCategory = Math.max(...byCategory.map((c) => c.revenue), 1)

    const kpiCards = [
        { label: "Total Revenue", value: fmt(stats.totalRevenue), sub: "From paid bills", icon: DollarSign, color: accent },
        { label: "Total Bills", value: stats.totalBills.toString(), sub: `${stats.paidBills} paid`, icon: FileText, color: green },
        { label: "Avg. Order Value", value: fmt(stats.avgOrderValue), sub: "Per paid bill", icon: TrendingUp, color: purple },
        { label: "Units Sold", value: stats.totalUnits.toString(), sub: "Total items across bills", icon: ShoppingCart, color: amber },
        { label: "Conversion Rate", value: `${conversionRate}%`, sub: "Bills converted to paid", icon: Percent, color: "#f472b6" },
        { label: "GST Collected", value: fmt(stats.totalGst), sub: "Total tax on paid bills", icon: ArrowUpRight, color: "#818cf8" },
    ]

    const hasData = stats.totalBills > 0

    return (
        <div className="flex flex-col gap-6">
            {/* Empty state */}
            {!hasData && (
                <div className="rounded-xl border p-12 flex flex-col items-center gap-4 text-center" style={cardStyle}>
                    <BarChart3 className="w-12 h-12 text-muted-foreground" />
                    <h3 className="text-lg font-semibold text-foreground">No Sales Data Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                        Start creating bills and adding products to unlock your sales analytics. All data shown here comes directly from your real business activity.
                    </p>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {kpiCards.map((k) => (
                    <div key={k.label} className="rounded-xl border p-5 flex flex-col gap-3 transition-all hover:scale-[1.02]" style={cardStyle}>
                        <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${k.color}18`, border: `1px solid ${k.color}30` }}>
                                <k.icon className="w-4 h-4" style={{ color: k.color }} />
                            </div>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{k.value}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">{k.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bill Status Summary */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Paid Bills", value: stats.paidBills, color: green, icon: CheckCircle2 },
                    { label: "Draft Bills", value: stats.draftBills, color: amber, icon: Clock },
                    { label: "Cancelled", value: stats.cancelledBills, color: "#ef4444", icon: XCircle },
                ].map((s) => (
                    <div key={s.label} className="rounded-xl border p-4 flex items-center gap-4" style={cardStyle}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
                            <s.icon className="w-5 h-5" style={{ color: s.color }} />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-foreground">{s.value}</p>
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Revenue Chart */}
                <div className="rounded-xl border p-6" style={cardStyle}>
                    <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" style={{ color: accent }} /> Monthly Revenue Trend
                    </h3>
                    <p className="text-xs text-muted-foreground mb-5">Last 6 months of billing activity</p>
                    {monthly.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">No monthly data yet</p>
                    ) : (
                        <div className="flex items-end gap-3 h-40">
                            {monthly.map((m, i) => {
                                const pct = (m.revenue / maxRevenue) * 100
                                return (
                                    <div key={`${m.month}-${i}`} className="flex-1 flex flex-col items-center gap-1">
                                        <span className="text-[9px] font-mono text-muted-foreground">{fmt(m.revenue)}</span>
                                        <div className="w-full rounded-t-lg transition-all duration-700 hover:opacity-80 relative group"
                                            style={{ height: `${Math.max(pct, 4)}%`, background: `linear-gradient(180deg, ${accent}, ${accent}60)` }}>
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                {m.billCount} bills, {m.paidCount} paid
                                            </div>
                                        </div>
                                        <span className="text-[9px] text-muted-foreground">{m.month}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Top Products */}
                <div className="rounded-xl border p-6" style={cardStyle}>
                    <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                        <Package className="w-4 h-4" style={{ color: green }} /> Top Products by Revenue
                    </h3>
                    <p className="text-xs text-muted-foreground mb-5">From paid bills only</p>
                    {topProducts.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">No product sales data yet</p>
                    ) : (
                        <div className="space-y-3">
                            {topProducts.map((p, i) => (
                                <div key={`${p.name}-${i}`} className="group">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                                                style={{ background: `${green}20`, color: green }}>
                                                {i + 1}
                                            </span>
                                            <span className="text-xs font-medium text-foreground truncate max-w-[140px]">{p.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] text-muted-foreground">{p.units} units</span>
                                            <span className="text-xs font-mono font-semibold" style={{ color: green }}>{fmt(p.revenue)}</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${(p.revenue / maxProduct) * 100}%`, background: `linear-gradient(90deg, ${green}80, ${green})` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Breakdown */}
                <div className="rounded-xl border p-6" style={cardStyle}>
                    <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" style={{ color: purple }} /> Revenue by Category
                    </h3>
                    <p className="text-xs text-muted-foreground mb-5">Product categories contributing to paid revenue</p>
                    {byCategory.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">No category data yet — ensure products have categories assigned</p>
                    ) : (
                        <div className="space-y-3">
                            {byCategory.map((c, i) => (
                                <div key={`${c.category}-${i}`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-foreground">{c.category}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] text-muted-foreground">{c.units} units</span>
                                            <span className="text-xs font-mono" style={{ color: purple }}>{fmt(c.revenue)}</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${(c.revenue / maxCategory) * 100}%`, background: `linear-gradient(90deg, ${purple}80, ${purple})` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Bills */}
                <div className="rounded-xl border p-6" style={cardStyle}>
                    <h3 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2">
                        <Users className="w-4 h-4" style={{ color: amber }} /> Recent Transactions
                    </h3>
                    {recentBills.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">No bills created yet</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left text-muted-foreground font-medium pb-2">Bill</th>
                                        <th className="text-left text-muted-foreground font-medium pb-2">Customer</th>
                                        <th className="text-right text-muted-foreground font-medium pb-2">Total</th>
                                        <th className="text-center text-muted-foreground font-medium pb-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {recentBills.map((b, i) => (
                                        <tr key={`${b.billNumber}-${i}`} className="hover:bg-accent/20 transition-colors">
                                            <td className="py-2 font-mono text-foreground/80">{b.billNumber || "—"}</td>
                                            <td className="py-2 text-foreground truncate max-w-[100px]">{b.customer}</td>
                                            <td className="py-2 text-right font-semibold" style={{ color: accent }}>{fmt(b.total)}</td>
                                            <td className="py-2 text-center"><StatusBadge status={b.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
