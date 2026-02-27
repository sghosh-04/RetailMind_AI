"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
    Search, Package, TrendingUp, TrendingDown, Minus,
    AlertTriangle, BarChart3, IndianRupee, ShoppingCart,
    ArrowRight, RefreshCw, Loader2, Plus, Boxes,
} from "lucide-react"
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, AreaChart, Area, PieChart, Pie, Cell, Legend,
} from "recharts"

// ─── Types ────────────────────────────────────────────────────────────────────
type Product = {
    id: string
    name: string
    sku: string
    category: string
    unit: string
    price: number
    cost_price: number
    gst_rate: number
    stock_qty: number
    total_sold: number
    total_revenue: number
    bill_count: number
}

type MonthlySale = {
    product_id: string
    month: string
    month_key: string
    qty_sold: number
    revenue: number
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const accent = "#00d4ff"
const green = "#34d399"
const red = "#f87171"
const amber = "#f59e0b"
const purple = "#a78bfa"
const card = { background: "rgba(15,23,42,0.6)", borderColor: "rgba(255,255,255,0.08)" }
const PIE_COLORS = [accent, green, purple, amber, red, "#60a5fa", "#fb7185", "#f472b6"]

function fmt(n: number) {
    if (!n || isNaN(n)) return "₹0"
    if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`
    if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`
    if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`
    return `₹${Math.round(n).toLocaleString("en-IN")}`
}

function StockBadge({ qty, unit }: { qty: number; unit: string }) {
    const color = qty === 0 ? red : qty < 10 ? amber : green
    const label = qty === 0 ? "Out of Stock" : qty < 10 ? "Low Stock" : "In Stock"
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: `${color}18`, color }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color }} />
            {qty} {unit} · {label}
        </span>
    )
}

function ChartTip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="rounded-lg border px-3 py-2 text-xs" style={{ background: "rgba(6,13,31,0.97)", borderColor: "rgba(255,255,255,0.12)" }}>
            <p className="text-white font-semibold mb-1">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} style={{ color: p.color }}>
                    {p.name}: <strong>{p.name?.toLowerCase().includes("revenue") ? fmt(p.value) : p.value}</strong>
                </p>
            ))}
        </div>
    )
}

// ─── Product Detail Card (shown when a single product is selected) ────────────
function ProductDetail({ product, monthlySales }: { product: Product; monthlySales: MonthlySale[] }) {
    const margin = product.cost_price > 0
        ? Math.round(((product.price - product.cost_price) / product.price) * 100)
        : null
    const profit = product.cost_price > 0
        ? (product.price - product.cost_price) * product.total_sold
        : null

    const chartData = monthlySales.map(m => ({
        month: m.month,
        "Units Sold": m.qty_sold,
        "Revenue": Number(m.revenue),
    }))

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="rounded-xl border p-5" style={{ background: `${accent}06`, borderColor: `${accent}22` }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h2 className="text-lg font-bold text-white">{product.name}</h2>
                            {product.sku && <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.07)", color: "#94a3b8" }}>{product.sku}</span>}
                            {product.category && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${accent}18`, color: accent }}>{product.category}</span>}
                        </div>
                        <StockBadge qty={product.stock_qty} unit={product.unit} />
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-white">₹{Number(product.price).toLocaleString("en-IN")}</p>
                        <p className="text-xs text-muted-foreground">selling price · GST {product.gst_rate}%</p>
                    </div>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Stock Left", value: `${product.stock_qty} ${product.unit}`, color: product.stock_qty < 10 ? red : green, icon: Boxes },
                    { label: "Total Units Sold", value: `${product.total_sold} ${product.unit}`, color: accent, icon: ShoppingCart },
                    { label: "Total Revenue", value: fmt(Number(product.total_revenue)), color: purple, icon: IndianRupee },
                    { label: "Bills Appeared In", value: `${product.bill_count} bills`, color: amber, icon: BarChart3 },
                ].map(m => (
                    <div key={m.label} className="rounded-xl border p-4" style={card}>
                        <m.icon className="w-4 h-4 mb-2" style={{ color: m.color }} />
                        <p className="text-lg font-bold" style={{ color: m.color }}>{m.value}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">{m.label}</p>
                    </div>
                ))}
            </div>

            {/* Margin cards */}
            {(margin !== null || profit !== null) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border p-4" style={card}>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Cost Price</p>
                        <p className="text-lg font-bold text-white">₹{Number(product.cost_price).toLocaleString("en-IN")}</p>
                    </div>
                    <div className="rounded-xl border p-4" style={{ ...card, borderColor: `${green}30` }}>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Gross Margin</p>
                        <p className="text-lg font-bold" style={{ color: green }}>{margin}%</p>
                        <p className="text-[10px] text-muted-foreground">₹{(product.price - product.cost_price).toFixed(2)} per unit</p>
                    </div>
                    <div className="rounded-xl border p-4" style={{ ...card, borderColor: `${purple}30` }}>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Total Profit Earned</p>
                        <p className="text-lg font-bold" style={{ color: purple }}>{fmt(profit!)}</p>
                        <p className="text-[10px] text-muted-foreground">from {product.total_sold} units sold</p>
                    </div>
                </div>
            )}

            {/* Monthly sales chart */}
            {chartData.length > 0 ? (
                <div className="rounded-xl border p-5" style={card}>
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" style={{ color: green }} />Sales History (Monthly)
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={purple} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={purple} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="qtyGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={accent} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={accent} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} />
                            <YAxis yAxisId="left" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} />
                            <YAxis yAxisId="right" orientation="right" tickFormatter={v => fmt(v)} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} width={60} />
                            <Tooltip content={<ChartTip />} />
                            <Area yAxisId="left" type="monotone" dataKey="Units Sold" stroke={accent} fill="url(#qtyGrad)" strokeWidth={2} dot={{ fill: accent, r: 3 }} />
                            <Area yAxisId="right" type="monotone" dataKey="Revenue" stroke={purple} fill="url(#revenueGrad)" strokeWidth={2} dot={{ fill: purple, r: 3 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-4 mt-2 justify-center text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded" style={{ background: accent }} />Units Sold</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded" style={{ background: purple }} />Revenue</span>
                    </div>
                </div>
            ) : (
                <div className="rounded-xl border p-6 text-center" style={card}>
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No sales recorded yet for this product.</p>
                    <p className="text-xs text-muted-foreground mt-1">Start creating bills to track sales history here.</p>
                </div>
            )}
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InventorySearchClient() {
    const router = useRouter()
    const [query, setQuery] = useState("")
    const [loading, setLoading] = useState(false)
    const [allProducts, setAllProducts] = useState<Product[]>([])
    const [results, setResults] = useState<Product[] | null>(null)
    const [monthlySales, setMonthlySales] = useState<MonthlySale[]>([])
    const [selected, setSelected] = useState<Product | null>(null)
    const [loadingAll, setLoadingAll] = useState(true)

    // Load all products on mount for overview stats
    const loadAll = useCallback(async () => {
        setLoadingAll(true)
        try {
            const res = await fetch("/api/inventory-search")
            const data = await res.json()
            setAllProducts(data.products || [])
        } catch { }
        finally { setLoadingAll(false) }
    }, [])

    useEffect(() => { loadAll() }, [loadAll])

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        const q = query.trim()
        if (!q) { setResults(null); setSelected(null); setMonthlySales([]); return }
        setLoading(true); setSelected(null); setResults(null)
        try {
            const res = await fetch(`/api/inventory-search?q=${encodeURIComponent(q)}`)
            const data = await res.json()
            setResults(data.products || [])
            setMonthlySales(data.monthlySales || [])
        } catch { }
        finally { setLoading(false) }
    }

    // Overview analytics from allProducts
    const totalStock = allProducts.reduce((s, p) => s + (p.stock_qty || 0), 0)
    const totalSold = allProducts.reduce((s, p) => s + (p.total_sold || 0), 0)
    const totalRev = allProducts.reduce((s, p) => s + Number(p.total_revenue || 0), 0)
    const lowStock = allProducts.filter(p => p.stock_qty > 0 && p.stock_qty < 10)
    const outOfStock = allProducts.filter(p => p.stock_qty === 0)

    // Category breakdown for pie chart
    const catMap: Record<string, number> = {}
    for (const p of allProducts) {
        const cat = p.category || "Uncategorised"
        catMap[cat] = (catMap[cat] || 0) + Number(p.total_revenue || 0)
    }
    const catData = Object.entries(catMap)
        .map(([name, value]) => ({ name, value: Math.round(value) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)

    // Top sellers bar chart
    const topSellers = [...allProducts]
        .sort((a, b) => b.total_sold - a.total_sold)
        .slice(0, 8)
        .map(p => ({ name: p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name, "Units Sold": p.total_sold, Revenue: Number(p.total_revenue) }))

    const displayList = results ?? allProducts

    return (
        <div className="flex flex-col gap-5">
            {/* ── Search Bar ── */}
            <form onSubmit={handleSearch} className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input value={query} onChange={e => setQuery(e.target.value)}
                        placeholder={`Search inventory by product name, SKU, or category…`}
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm bg-input border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                </div>
                <button type="submit" disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: accent, color: "#060d1f" }}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {loading ? "Searching…" : "Search"}
                </button>
                {results !== null && (
                    <button type="button" onClick={() => { setQuery(""); setResults(null); setSelected(null) }}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm border transition-all hover:opacity-80"
                        style={{ borderColor: "rgba(255,255,255,0.12)", color: "#94a3b8" }}>
                        <RefreshCw className="w-3.5 h-3.5" />Clear
                    </button>
                )}
            </form>

            {/* ── Add product CTA ── */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    {loadingAll ? "Loading…" : `${allProducts.length} products in inventory`}
                    {outOfStock.length > 0 && <span className="text-xs px-2 py-0.5 rounded-full font-semibold ml-1" style={{ background: `${red}18`, color: red }}>⚠ {outOfStock.length} out of stock</span>}
                    {lowStock.length > 0 && <span className="text-xs px-2 py-0.5 rounded-full font-semibold ml-1" style={{ background: `${amber}18`, color: amber }}>↓ {lowStock.length} low stock</span>}
                </p>
                <button onClick={() => router.push("/dashboard/products")}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                    style={{ background: green, color: "#060d1f" }}>
                    <Plus className="w-4 h-4" />Add / Manage Products
                </button>
            </div>

            {/* ── Overview Stats (shown when not searching) ── */}
            {results === null && !loadingAll && allProducts.length > 0 && (
                <>
                    {/* KPI row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: "Total SKUs", value: allProducts.length, color: accent, suffix: "products" },
                            { label: "Total Stock", value: totalStock, color: green, suffix: "units" },
                            { label: "Total Units Sold", value: totalSold, color: purple, suffix: "units" },
                            { label: "Total Revenue", value: fmt(totalRev), color: amber, suffix: "" },
                        ].map(m => (
                            <div key={m.label} className="rounded-xl border p-4" style={card}>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{m.label}</p>
                                <p className="text-xl font-bold" style={{ color: m.color }}>{m.value}</p>
                                {m.suffix && <p className="text-[10px] text-muted-foreground mt-0.5">{m.suffix}</p>}
                            </div>
                        ))}
                    </div>

                    {/* Charts row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Top Sellers Bar Chart */}
                        {topSellers.length > 0 && (
                            <div className="rounded-xl border p-5" style={card}>
                                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" style={{ color: accent }} />Top Selling Products
                                </h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={topSellers} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                        <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} />
                                        <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} width={90} />
                                        <Tooltip content={<ChartTip />} />
                                        <Bar dataKey="Units Sold" fill={accent} radius={[0, 4, 4, 0]} opacity={0.85} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Revenue by Category Pie Chart */}
                        {catData.length > 0 && (
                            <div className="rounded-xl border p-5" style={card}>
                                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4" style={{ color: purple }} />Revenue by Category
                                </h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={catData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                                            {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={(val: any) => [fmt(val), "Revenue"]} contentStyle={{ background: "rgba(6,13,31,0.97)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, fontSize: 12 }} />
                                        <Legend formatter={v => <span style={{ color: "#94a3b8", fontSize: 11 }}>{v}</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Low/Out of Stock Alerts */}
                    {(lowStock.length > 0 || outOfStock.length > 0) && (
                        <div className="rounded-xl border p-5 flex flex-col gap-3" style={{ ...card, borderColor: `${amber}25` }}>
                            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" style={{ color: amber }} />Stock Alerts
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {outOfStock.map(p => (
                                    <div key={p.id} onClick={() => setSelected(p)} className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors" style={{ background: `${red}08`, border: `1px solid ${red}20` }}>
                                        <div><p className="text-sm font-medium text-white">{p.name}</p><p className="text-xs text-muted-foreground">{p.sku || p.category}</p></div>
                                        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: `${red}20`, color: red }}>OUT OF STOCK</span>
                                    </div>
                                ))}
                                {lowStock.map(p => (
                                    <div key={p.id} onClick={() => setSelected(p)} className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors" style={{ background: `${amber}08`, border: `1px solid ${amber}20` }}>
                                        <div><p className="text-sm font-medium text-white">{p.name}</p><p className="text-xs text-muted-foreground">{p.sku || p.category}</p></div>
                                        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: `${amber}20`, color: amber }}>Only {p.stock_qty} left</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── No products in inventory ── */}
            {!loadingAll && allProducts.length === 0 && (
                <div className="rounded-xl border p-12 flex flex-col items-center gap-3 text-center" style={card}>
                    <Package className="w-12 h-12 text-muted-foreground" />
                    <h3 className="font-semibold text-white">No products in inventory</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">Add your products first from the Products page. Once you have products and generate bills, you'll see full inventory analytics here.</p>
                    <button onClick={() => router.push("/dashboard/products")}
                        className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold"
                        style={{ background: green, color: "#060d1f" }}>
                        <Plus className="w-4 h-4" />Go to Products Page <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* ── Search results list ── */}
            {results !== null && (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            {results.length === 0 ? `No products found for "${query}"` : `${results.length} product${results.length !== 1 ? "s" : ""} found for "${query}"`}
                        </p>
                        {results.length === 0 && (
                            <button onClick={() => router.push("/dashboard/products")}
                                className="flex items-center gap-1.5 text-sm font-medium" style={{ color: accent }}>
                                <Plus className="w-3.5 h-3.5" />Add this product <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    {results.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {results.map(p => (
                                <button key={p.id} onClick={() => setSelected(selected?.id === p.id ? null : p)}
                                    className="text-left rounded-xl border p-4 transition-all hover:scale-[1.02] cursor-pointer"
                                    style={{ ...card, borderColor: selected?.id === p.id ? accent : "rgba(255,255,255,0.08)" }}>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <p className="font-semibold text-white text-sm leading-snug">{p.name}</p>
                                        {p.category && <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${accent}16`, color: accent }}>{p.category}</span>}
                                    </div>
                                    <StockBadge qty={p.stock_qty} unit={p.unit} />
                                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                                        <div><p className="text-muted-foreground">Sold</p><p className="font-bold text-white">{p.total_sold} {p.unit}</p></div>
                                        <div><p className="text-muted-foreground">Revenue</p><p className="font-bold" style={{ color: purple }}>{fmt(Number(p.total_revenue))}</p></div>
                                        <div><p className="text-muted-foreground">Price</p><p className="font-bold text-white">₹{Number(p.price).toLocaleString("en-IN")}</p></div>
                                        <div><p className="text-muted-foreground">Bills</p><p className="font-bold text-white">{p.bill_count}</p></div>
                                    </div>
                                    {selected?.id === p.id && <p className="text-[10px] mt-2 font-medium" style={{ color: accent }}>↓ Expand below for full analytics</p>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Selected product detail ── */}
            {selected && (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 py-1">
                        <div className="flex-1 h-px" style={{ background: `${accent}25` }} />
                        <span className="text-xs text-muted-foreground px-2">Analytics for: <strong className="text-white">{selected.name}</strong></span>
                        <div className="flex-1 h-px" style={{ background: `${accent}25` }} />
                    </div>
                    <ProductDetail
                        product={selected}
                        monthlySales={monthlySales.filter(m => m.product_id === selected.id)}
                    />
                </div>
            )}

            {/* ── Full inventory table ── */}
            {results === null && !loadingAll && allProducts.length > 0 && (
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                    <div className="flex items-center justify-between px-4 py-3" style={{ background: "rgba(15,23,42,0.8)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Boxes className="w-4 h-4" style={{ color: accent }} />Full Inventory</h3>
                        <p className="text-xs text-muted-foreground">Click a row to see analytics</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ background: "rgba(15,23,42,0.6)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                    {["Product", "SKU", "Category", "Price", "Stock", "Sold", "Revenue", "Margin"].map(h => (
                                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {allProducts.map(p => {
                                    const margin = p.cost_price > 0 ? Math.round(((p.price - p.cost_price) / p.price) * 100) : null
                                    const isSelected = selected?.id === p.id
                                    return (
                                        <tr key={p.id} onClick={() => setSelected(isSelected ? null : p)} className="border-t cursor-pointer transition-colors hover:bg-white/03"
                                            style={{ borderColor: "rgba(255,255,255,0.05)", background: isSelected ? `${accent}08` : undefined }}>
                                            <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.sku || "—"}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{p.category || "—"}</td>
                                            <td className="px-4 py-3 text-white">₹{Number(p.price).toLocaleString("en-IN")}</td>
                                            <td className="px-4 py-3">
                                                <span className="font-medium" style={{ color: p.stock_qty === 0 ? red : p.stock_qty < 10 ? amber : green }}>
                                                    {p.stock_qty} {p.unit}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-white">{p.total_sold}</td>
                                            <td className="px-4 py-3 font-medium" style={{ color: purple }}>{fmt(Number(p.total_revenue))}</td>
                                            <td className="px-4 py-3">{margin !== null ? <span className="font-medium" style={{ color: green }}>{margin}%</span> : <span className="text-muted-foreground">—</span>}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Selected detail in table context */}
            {selected && results === null && (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 py-1">
                        <div className="flex-1 h-px" style={{ background: `${accent}25` }} />
                        <span className="text-xs text-muted-foreground px-2">Analytics: <strong className="text-white">{selected.name}</strong></span>
                        <div className="flex-1 h-px" style={{ background: `${accent}25` }} />
                    </div>
                    <ProductDetail product={selected} monthlySales={[]} />
                </div>
            )}
        </div>
    )
}
