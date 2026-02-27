"use client"

import {
    CheckCircle2, XCircle, Clock, AlertTriangle, ShieldCheck,
    Package, BarChart3, TrendingUp, Search,
} from "lucide-react"

const cardStyle = { background: "rgba(15,23,42,0.5)", borderColor: "rgba(255,255,255,0.07)" }
const accent = "#00d4ff"
const green = "#34d399"
const amber = "#f59e0b"
const red = "#ef4444"
const purple = "#a78bfa"

type KPIs = {
    totalTasks: number; totalSamples: number; defects: number
    fatalErrors: number; qualityScore: number; paidBills: number
}
type MonthlyRow = { month: string; totalTasks: number; completed: number; defects: number; pending: number; score: number }
type ProductRow = { name: string; category: string; price: number; cost: number; stock: number; margin: number | null }
type CategoryRow = { category: string; tasks: number; defects: number; score: number }
type AnalysisRow = { query: string; category: string; date: string }

interface Props {
    kpis: KPIs
    monthly: MonthlyRow[]
    productsWithMargin: ProductRow[]
    categoryBreakdown: CategoryRow[]
    recentAnalyses: AnalysisRow[]
    totalProducts: number
    totalAnalyses: number
}

function ScoreBadge({ score }: { score: number }) {
    const color = score >= 90 ? green : score >= 70 ? amber : red
    return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${color}18`, color }}>
            {score}%
        </span>
    )
}

export default function QualityDashboardClient({
    kpis, monthly, productsWithMargin, categoryBreakdown, recentAnalyses, totalProducts, totalAnalyses,
}: Props) {
    const maxScore = Math.max(...monthly.map((m) => m.totalTasks), 1)
    const scoreColor = kpis.qualityScore >= 90 ? green : kpis.qualityScore >= 70 ? amber : red

    const kpiCards = [
        {
            label: "Total Tasks", value: kpis.totalTasks, sub: "Bills created",
            icon: CheckCircle2, color: accent,
            desc: "Each bill represents a business task",
        },
        {
            label: "Total Samples", value: kpis.totalSamples, sub: "Line items across all bills",
            icon: Package, color: purple,
            desc: "Individual product entries in bills",
        },
        {
            label: "Defects", value: kpis.defects, sub: "Cancelled bills",
            icon: XCircle, color: red,
            desc: "Bills that were cancelled",
        },
        {
            label: "Fatal Errors", value: kpis.fatalErrors, sub: "Out-of-stock products",
            icon: AlertTriangle, color: "#f97316",
            desc: "Products with zero inventory",
        },
        {
            label: "Quality Score", value: `${kpis.qualityScore}%`, sub: "Overall performance",
            icon: ShieldCheck, color: scoreColor,
            desc: "Based on completion vs defect ratio",
        },
        {
            label: "Market Analyses", value: totalAnalyses, sub: "AI queries run",
            icon: Search, color: amber,
            desc: "Market intelligence operations",
        },
    ]

    return (
        <div className="flex flex-col gap-6">
            {/* Quality Score Hero */}
            <div className="rounded-xl border px-6 py-5 flex flex-col sm:flex-row items-center gap-6" style={{ ...cardStyle, borderColor: `${scoreColor}30`, background: `${scoreColor}06` }}>
                <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke={scoreColor} strokeWidth="3"
                            strokeDasharray={`${kpis.qualityScore} 100`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold" style={{ color: scoreColor }}>{kpis.qualityScore}%</span>
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-foreground">Overall Quality Score</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Computed from <strong className="text-foreground">{kpis.totalTasks}</strong> total tasks,{" "}
                        <strong className="text-foreground">{kpis.defects}</strong> defects,{" "}
                        <strong className="text-foreground">{kpis.fatalErrors}</strong> fatal errors.
                        {kpis.totalTasks === 0 && " Start creating bills to see your quality metrics."}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                        Score = (Tasks − Defects − Fatal Errors) ÷ Tasks × 100 — based on your real business data.
                    </p>
                </div>
            </div>

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
                            <p className="text-[10px] text-muted-foreground/50 mt-0.5">{k.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Quality Trend */}
                <div className="rounded-xl border p-6" style={cardStyle}>
                    <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" style={{ color: accent }} /> Monthly Quality Trend
                    </h3>
                    <p className="text-xs text-muted-foreground mb-5">Last 6 months — tasks, completed & defects</p>
                    {monthly.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">No monthly data yet</p>
                    ) : (
                        <div className="space-y-3">
                            {monthly.map((m) => (
                                <div key={m.month}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-foreground w-16">{m.month}</span>
                                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                            <span className="text-green-400">{m.completed} ✓</span>
                                            <span className="text-red-400">{m.defects} ✗</span>
                                            <span className="text-amber-400">{m.pending} ⏳</span>
                                        </div>
                                        <ScoreBadge score={m.score} />
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-secondary overflow-hidden flex">
                                        <div style={{ width: `${(m.completed / Math.max(m.totalTasks, 1)) * 100}%`, background: green }} className="h-full rounded-l-full" />
                                        <div style={{ width: `${(m.pending / Math.max(m.totalTasks, 1)) * 100}%`, background: amber }} className="h-full" />
                                        <div style={{ width: `${(m.defects / Math.max(m.totalTasks, 1)) * 100}%`, background: red }} className="h-full rounded-r-full" />
                                    </div>
                                </div>
                            ))}
                            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                                {[{ label: "Completed", color: green }, { label: "Pending", color: amber }, { label: "Defects", color: red }].map((l) => (
                                    <div key={l.label} className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                                        <span className="text-[10px] text-muted-foreground">{l.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Product Health */}
                <div className="rounded-xl border p-6" style={cardStyle}>
                    <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                        <Package className="w-4 h-4" style={{ color: purple }} /> Product Health & Margins
                    </h3>
                    <p className="text-xs text-muted-foreground mb-5">Top {productsWithMargin.length} products — margin & stock levels</p>
                    {productsWithMargin.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">No products added yet</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left text-muted-foreground font-medium pb-2">Product</th>
                                        <th className="text-right text-muted-foreground font-medium pb-2">Price</th>
                                        <th className="text-right text-muted-foreground font-medium pb-2">Stock</th>
                                        <th className="text-right text-muted-foreground font-medium pb-2">Margin</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {productsWithMargin.map((p) => (
                                        <tr key={p.name} className="hover:bg-accent/20 transition-colors">
                                            <td className="py-2 text-foreground truncate max-w-[120px]">
                                                <div>{p.name}</div>
                                                <div className="text-[10px] text-muted-foreground">{p.category}</div>
                                            </td>
                                            <td className="py-2 text-right font-mono">₹{p.price.toFixed(0)}</td>
                                            <td className="py-2 text-right">
                                                <span className="font-semibold" style={{ color: p.stock === 0 ? red : p.stock < 5 ? amber : green }}>
                                                    {p.stock}
                                                </span>
                                            </td>
                                            <td className="py-2 text-right">
                                                {p.margin !== null
                                                    ? <span className="font-semibold" style={{ color: p.margin > 30 ? green : p.margin > 10 ? amber : red }}>{p.margin}%</span>
                                                    : <span className="text-muted-foreground">—</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Breakdown */}
                <div className="rounded-xl border p-6" style={cardStyle}>
                    <h3 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" style={{ color: amber }} /> Market Analysis by Category
                    </h3>
                    {categoryBreakdown.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">Run market analyses to see category breakdown</p>
                    ) : (
                        <div className="space-y-3">
                            {categoryBreakdown.map((c) => (
                                <div key={c.category} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                                    <div>
                                        <p className="text-xs font-medium text-foreground">{c.category}</p>
                                        <p className="text-[10px] text-muted-foreground">{c.tasks} analyses</p>
                                    </div>
                                    <ScoreBadge score={c.score} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Market Analyses Audit Log */}
                <div className="rounded-xl border p-6" style={cardStyle}>
                    <h3 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2">
                        <Search className="w-4 h-4" style={{ color: green }} /> Recent Market Analyses
                    </h3>
                    {recentAnalyses.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">No market analyses run yet — try the AI Market Analysis feature</p>
                    ) : (
                        <div className="space-y-2">
                            {recentAnalyses.map((a, i) => (
                                <div key={i} className="flex gap-3 p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all">
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                        style={{ background: `${green}20`, color: green }}>
                                        <Search className="w-3 h-3" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-foreground truncate">{a.query}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${purple}20`, color: purple }}>
                                                {a.category}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">{a.date}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
