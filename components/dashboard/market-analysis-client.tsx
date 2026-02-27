"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search, Loader2, TrendingUp, TrendingDown, Minus, AlertTriangle,
  ChevronDown, ChevronUp, RefreshCw, BarChart3, MapPin,
  Target, Zap, CheckCircle2, XCircle, ShoppingBag, Rocket, BookOpen,
  Scale, Globe, Store, Package, ArrowRight, Sparkles, IndianRupee,
  ExternalLink, TrendingUp as TU, Star, Cpu, Layers,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, PieChart, Pie, Cell, Legend,
  ReferenceLine,
} from "recharts"

// ─── Types ──────────────────────────────────────────────────────────────────
type PlatformLink = { store: string; url: string; directUrl: boolean; price: number | null; variant?: string; category: string; favicon: string }
type PlatformPrice = { platform: string; price: number; vs_avg_percent: number; trend: string; reason: string }
type TrendPoint = { month: string; price_index: number; event: string }
type ChannelRow = { channel: string; avg_price: number; margin_percent: number; competition: string; recommended: boolean; reason: string }
type CostBreakdown = { product_cost_percent: number; marketing_percent: number; logistics_percent: number; platform_fees_percent: number; profit_percent: number; labels: string[] }
type PriceRec = { suggested_retail_price: number; min_viable_price: number; premium_price: number; reasoning: string; platform_strategy: string; expected_margin_percent: number }
type Spec = { feature: string; details: string }
type Variant = { name: string; price: number; description: string }

type FullResult = {
  product_overview: { name: string; description: string; market_size_india: string; growth_rate: string; category: string }
  specifications?: Spec[]
  variants?: Variant[]
  price_analysis: { min: number; max: number; average: number; wholesale_price: number; retail_price: number; online_price: number; currency: string; real_time_data?: boolean }
  price_recommendation?: PriceRec
  cost_breakdown?: CostBreakdown
  platform_price_analysis?: PlatformPrice[]
  price_trend_data?: TrendPoint[]
  profit_analysis: { gross_margin_percent: number; net_margin_percent: number; markup_percent: number; breakeven_units_monthly: number; estimated_monthly_profit_small: number; estimated_monthly_profit_medium: number; roi_percent: number }
  channel_comparison?: ChannelRow[]
  local_market: { demand_level: string; demand_score: number; local_competitors: { name: string; type: string; price_range: string; strength: string }[]; nearby_business_count: string; market_saturation: string; best_selling_areas: string[] }
  market_trends: { trend: string; trend_percentage: number; yoy_growth: string; peak_seasons: string[]; off_seasons: string[]; emerging_opportunities: string[] }
  business_insights: { summary: string; key_insights: string[]; target_customers: string[]; usp_suggestions: string[]; risks: string[]; risk_level: string }
  want_to_start: { recommended: boolean; reason: string; startup_cost_min: number; startup_cost_max: number; time_to_profit_months: number }
  business_strategy: { phase1: { title: string; steps: string[] }; phase2: { title: string; steps: string[] }; phase3: { title: string; steps: string[] }; online_strategy: string[]; offline_strategy: string[]; sourcing_tips: string[]; legal_requirements: string[]; recommended_platforms: string[] }
  platform_links?: PlatformLink[]
  buy_links?: PlatformLink[]
  product_image_url?: string | null
}
type HistoryItem = { id: string; query: string; category: string; created_at: string; result: FullResult }

// ─── Constants ───────────────────────────────────────────────────────────────
const CATEGORIES = ["", "Electronics", "FMCG", "Apparel", "Furniture", "Stationery", "Food & Beverage", "Pharma", "Auto Parts", "Jewellery", "Cosmetics", "Sports", "Toys", "Agriculture"]
const card = { background: "rgba(10,20,14,0.70)", borderColor: "rgba(71,255,134,0.10)", backdropFilter: "blur(16px)" } as const
const accent = "#47ff86"
const cyan = "#22d3ee"
const green = "#47ff86"
const red = "#f87171"
const amber = "#f59e0b"
const purple = "#a78bfa"
const PIE_COLORS = [accent, cyan, amber, purple, "#34d399"]

const CATEGORY_LABELS: Record<string, string> = {
  ecommerce: "E-Commerce",
  grocery: "Grocery",
  quick_commerce: "Quick Commerce",
  fashion: "Fashion",
  brand: "Brand Store",
}

function fmt(n: number, currency = "INR") {
  if (!n || isNaN(n)) return "N/A"
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`
  return `₹${Math.round(n).toLocaleString("en-IN")}`
}

function Badge({ label, color }: { label: string; color: string }) {
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>{label}</span>
}

function Section({ title, icon: Icon, color = accent, children, className = "" }: { title: string; icon: React.ElementType; color?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-4 ${className}`} style={{ ...card, borderColor: `${color}15` }}>
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        {title}
      </h3>
      {children}
    </div>
  )
}

// ─── Custom Tooltip for charts ────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border px-3 py-2 text-xs" style={{ background: "rgba(5,12,8,0.95)", borderColor: "rgba(71,255,134,0.20)", backdropFilter: "blur(12px)" }}>
      <p className="text-white font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{typeof p.value === "number" && p.name?.toLowerCase().includes("price") ? fmt(p.value) : p.value}</strong></p>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MarketAnalysisClient({ userCity, userState }: { userCity: string; userState: string }) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FullResult | null>(null)
  const [currentQuery, setCurrentQuery] = useState("")
  const [error, setError] = useState("")
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [wantToStart, setWantToStart] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "pricing" | "profit" | "local" | "strategy">("overview")

  const loadHistory = useCallback(async () => {
    try { const res = await fetch("/api/market-analysis"); const data = await res.json(); setHistory(data.analyses || []) } catch { }
  }, [])
  useEffect(() => { loadHistory() }, [loadHistory])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    setError(""); setLoading(true); setResult(null); setWantToStart(null); setActiveTab("overview")
    setCurrentQuery(trimmed); setQuery("")
    try {
      const res = await fetch("/api/market-analysis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: trimmed, category: category || "", userCity, userState }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Analysis failed."); return }
      setResult(data.result); loadHistory()
    } catch { setError("Network error — please try again.") }
    finally { setLoading(false) }
  }

  const trendColor = result?.market_trends?.trend === "Growing" ? green : result?.market_trends?.trend === "Declining" ? red : "#94a3b8"
  const TrendIcon = result?.market_trends?.trend === "Growing" ? TrendingUp : result?.market_trends?.trend === "Declining" ? TrendingDown : Minus
  const satColor = result?.local_market?.market_saturation === "Low" ? green : result?.local_market?.market_saturation === "High" ? red : amber
  const riskColor = result?.business_insights?.risk_level === "Low" ? green : result?.business_insights?.risk_level === "High" ? red : amber

  const TABS = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "pricing", label: "Pricing & Platforms", icon: IndianRupee },
    { id: "profit", label: "Profit Analysis", icon: TU },
    { id: "local", label: "Local Market", icon: MapPin },
    { id: "strategy", label: "Strategy", icon: Rocket },
  ] as const

  // ── Platform price bar chart data
  const platformBarData = result?.buy_links?.filter(l => l.price && l.price > 0).map(l => ({
    name: l.store.replace(" India", "").replace(" Digital", ""),
    price: l.price ?? 0,
    variant: l.variant,
  })).sort((a, b) => a.price - b.price) ?? []

  // ── Price trend data
  const trendData = result?.price_trend_data ?? []

  // ── Cost breakdown pie data
  const costData = result?.cost_breakdown
    ? [
      { name: "Product Cost", value: result.cost_breakdown.product_cost_percent },
      { name: "Marketing", value: result.cost_breakdown.marketing_percent },
      { name: "Logistics", value: result.cost_breakdown.logistics_percent },
      { name: "Platform Fees", value: result.cost_breakdown.platform_fees_percent },
      { name: "Profit", value: result.cost_breakdown.profit_percent },
    ]
    : []

  return (
    <div className="flex flex-col gap-5">
      {/* ── Search Bar ── */}
      <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(71,255,134,0.35)" }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search any product — "LED bulbs", "cotton sarees", "organic honey"…`}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all"
            style={{ background: "rgba(10,20,14,0.70)", border: "1px solid rgba(71,255,134,0.15)", color: "#e8f5ec", backdropFilter: "blur(12px)" }}
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2.5 rounded-lg text-sm outline-none" style={{ background: "rgba(10,20,14,0.70)", border: "1px solid rgba(71,255,134,0.15)", color: "#e8f5ec" }}>
          <option value="">All Categories</option>
          {CATEGORIES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit" disabled={loading || !query.trim()} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "rgba(71,255,134,0.15)", border: "1px solid rgba(71,255,134,0.30)", color: accent, boxShadow: `0 0 16px rgba(71,255,134,0.10)` }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Analysing…" : "Analyse"}
        </button>
      </form>

      {userCity && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><MapPin className="w-3 h-3" style={{ color: accent }} />Localised for <span className="text-foreground font-medium">{userCity}{userState ? `, ${userState}` : ""}</span></p>}

      {error && <div className="rounded-lg px-4 py-3 text-sm flex items-center gap-2 border" style={{ background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.25)", color: red }}><AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}</div>}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-5 rounded-xl border" style={{ ...card, borderColor: "rgba(71,255,134,0.15)" }}>
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full animate-ping" style={{ background: `${accent}08`, border: `2px solid ${accent}20` }} />
            <div className="absolute inset-2 rounded-full animate-pulse" style={{ background: `${accent}06`, border: `1px solid ${accent}15` }} />
            <Loader2 className="w-20 h-20 animate-spin absolute" style={{ color: `${accent}25` }} />
            <Loader2 className="w-20 h-20 animate-spin absolute" style={{ color: accent, animationDuration: "0.6s" }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">Scanning 15+ Indian platforms for</p>
            <p className="text-lg font-bold mt-1" style={{ color: accent }}>"{currentQuery}"</p>
            <div className="flex flex-col gap-1.5 mt-4">
              <p className="text-xs font-medium" style={{ color: red }}>🔴 Fetching live prices — Amazon · Flipkart · Blinkit · Myntra · Zepto…</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>Building profit analysis · local market · business strategy…</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {result && !loading && (
        <div className="flex flex-col gap-5">

          {/* Hero */}
          <div className="rounded-xl border p-6 relative overflow-hidden" style={{ background: "rgba(10,20,14,0.80)", borderColor: "rgba(71,255,134,0.18)", borderLeft: `3px solid ${accent}`, backdropFilter: "blur(16px)" }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full" style={{ background: `radial-gradient(circle, ${accent}06 0%, transparent 70%)` }} />
            <div className="flex items-start gap-5 flex-wrap relative">
              {result.product_image_url && (
                <div className="w-24 h-24 rounded-xl flex-shrink-0 overflow-hidden border" style={{ borderColor: `${accent}25`, background: "rgba(0,0,0,0.3)" }}>
                  <img src={result.product_image_url} alt={result.product_overview.name} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />
                  <h2 className="text-xl font-bold text-white tracking-tight">{result.product_overview.name}</h2>
                  <Badge label={result.product_overview.category} color={accent} />
                  {result.price_analysis.real_time_data && <Badge label="🔴 LIVE PRICES" color={red} />}
                </div>
                <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.50)" }}>{result.product_overview.description}</p>
                <div className="flex flex-wrap gap-4 text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
                  <span>🇮🇳 Market: <strong className="text-white">{result.product_overview.market_size_india}</strong></span>
                  <span>📈 Growth: <strong className="text-white">{result.product_overview.growth_rate}</strong></span>
                  <span>📊 Trend: <strong style={{ color: trendColor }}>{result.market_trends?.trend || "N/A"} +{result.market_trends?.trend_percentage ?? 0}%</strong></span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <Badge label={result.market_trends?.trend || "N/A"} color={trendColor} />
                <Badge label={`Risk: ${result.business_insights?.risk_level || "N/A"}`} color={riskColor} />
                <Badge label={`Demand: ${result.local_market?.demand_level || "N/A"}`} color={result.local_market?.demand_level === "High" ? green : amber} />
              </div>
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Average Market Price ( VARIENTS DEPENDS )", value: fmt(result.price_analysis.min), sub: `Max: ${fmt(result.price_analysis.max)}`, color: accent, live: result.price_analysis.real_time_data },
              { label: "Gross Margin", value: `${result.profit_analysis.gross_margin_percent}%`, sub: `Net: ${result.profit_analysis.net_margin_percent}%`, color: green },
              { label: "Monthly Profit", value: fmt(result.profit_analysis.estimated_monthly_profit_small), sub: `ROI: ${result.profit_analysis.roi_percent}%`, color: purple },
              { label: "Platforms Listed", value: `${(result.platform_links?.length || result.buy_links?.length || 15)} sites`, sub: `Avg: ${fmt(result.price_analysis.average)}`, color: amber },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border p-4 relative overflow-hidden" style={{ ...card, borderColor: `${m.color}12` }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>{m.label}</p>
                  {(m as any).live && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse" style={{ background: "rgba(239,68,68,0.12)", color: red, border: "1px solid rgba(239,68,68,0.25)" }}>🔴 LIVE</span>}
                </div>
                <p className="text-xl font-bold" style={{ color: m.color }}>{m.value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{m.sub}</p>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, borderRadius: 1, background: `linear-gradient(90deg, ${m.color}60 0%, transparent 100%)` }} />
              </div>
            ))}
          </div>

          {/* ── PLATFORM LINKS — Always Visible, Always Clickable ── */}
          {(result.platform_links?.length || 0) > 0 && (
            <div className="rounded-xl border p-5 flex flex-col gap-4" style={{ background: "rgba(71,255,134,0.03)", borderColor: "rgba(71,255,134,0.15)" }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4" style={{ color: accent }} />
                    View &ldquo;{result.product_overview.name}&rdquo; on these platforms
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Click any link below — opens the product directly in a new tab ↗</p>
                </div>
                {result.price_analysis.real_time_data && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full animate-pulse" style={{ background: "rgba(239,68,68,0.15)", color: red }}>🔴 LIVE PRICES</span>
                )}
              </div>
              {(["ecommerce", "quick_commerce", "grocery", "fashion"] as const).map(cat => {
                const catLinks = (result.platform_links || []).filter((l: any) => (l.category || "ecommerce") === cat)
                if (!catLinks.length) return null
                const catMeta: Record<string, { label: string; color: string }> = {
                  ecommerce: { label: "🛒 E-Commerce & Electronics", color: accent },
                  quick_commerce: { label: "⚡ Quick Commerce", color: red },
                  grocery: { label: "🥦 Grocery", color: green },
                  fashion: { label: "👗 Fashion & Lifestyle", color: purple },
                }
                const { label, color } = catMeta[cat]
                return (
                  <div key={cat}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color }}>{label}</p>
                    <div className="flex flex-wrap gap-2">
                      {catLinks.map((link: any, i: number) => (
                        <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all hover:scale-[1.05] active:scale-95 hover:shadow-md"
                          style={{ background: link.directUrl ? `${color}14` : "rgba(255,255,255,0.04)", borderColor: link.directUrl ? `${color}50` : "rgba(255,255,255,0.14)", color: "#e2e8f0", cursor: "pointer", textDecoration: "none" }}>
                          <img src={link.favicon} alt="" className="w-4 h-4 rounded-sm flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                          <span className="font-semibold">{link.store}</span>
                          {link.price && (
                            <span className="px-1.5 py-0.5 rounded-md text-[11px] font-bold" style={{ background: `${color}22`, color }}>{fmt(link.price)}</span>
                          )}
                          <span className="text-[11px] font-bold" style={{ color: link.directUrl ? green : "#94a3b8" }}>
                            {link.directUrl ? "LIVE ↗" : "↗"}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl border overflow-x-auto" style={{ background: "rgba(5,12,8,0.80)", borderColor: "rgba(71,255,134,0.10)" }}>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="flex-shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                style={activeTab === t.id ? { background: "rgba(71,255,134,0.12)", color: accent, border: "1px solid rgba(71,255,134,0.25)", boxShadow: "0 0 10px rgba(71,255,134,0.08)" } : { color: "rgba(255,255,255,0.45)", border: "1px solid transparent" }}>
                <t.icon className="w-3.5 h-3.5" />{t.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Overview ── */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Section title="Key Business Insights" icon={BookOpen} color={accent}>
                <ul className="flex flex-col gap-2">
                  {(result.business_insights?.key_insights || []).map((ins, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${accent}18`, color: accent }}>{i + 1}</span>{ins}
                    </li>
                  ))}
                </ul>
              </Section>
              {result.specifications && result.specifications.length > 0 && (
                <Section title="Product Specifications" icon={Cpu} color={accent}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                    {result.specifications.map((s, i) => (
                      <div key={i} className="flex justify-between border-b border-white/5 py-1.5 last:border-0 text-sm"><span className="text-muted-foreground">{s.feature}</span><span className="font-medium text-white text-right">{s.details}</span></div>
                    ))}
                  </div>
                </Section>
              )}
              {result.market_trends && (
                <Section title="Market Trends" icon={TrendIcon} color={trendColor}>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">YoY Growth</span><span className="font-semibold" style={{ color: trendColor }}>{result.market_trends.yoy_growth}</span></div>
                    <div><p className="text-xs text-muted-foreground mb-1.5">🌞 Peak Seasons</p><div className="flex flex-wrap gap-1.5">{(result.market_trends.peak_seasons || []).map((s) => <Badge key={s} label={s} color={green} />)}</div></div>
                    <div><p className="text-xs text-muted-foreground mb-1.5">❄️ Off Seasons</p><div className="flex flex-wrap gap-1.5">{(result.market_trends.off_seasons || []).map((s) => <Badge key={s} label={s} color={red} />)}</div></div>
                    <div><p className="text-xs text-muted-foreground mb-1.5">🚀 Opportunities</p>
                      <div className="flex flex-col gap-1">{(result.market_trends.emerging_opportunities || []).map((o, i) => <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground"><Zap className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: amber }} />{o}</div>)}</div>
                    </div>
                  </div>
                </Section>
              )}
              <Section title="Target Customers" icon={Target} color={purple}>
                <div className="flex flex-wrap gap-2">{(result.business_insights?.target_customers || []).map((c, i) => <Badge key={i} label={c} color={purple} />)}</div>
              </Section>
              <Section title="Risks" icon={AlertTriangle} color={riskColor}>
                {(result.business_insights?.risks || []).map((r, i) => <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: red }} />{r}</div>)}
              </Section>
            </div>
          )}

          {/* ── Tab: Pricing & Platforms ── */}
          {activeTab === "pricing" && (
            <div className="flex flex-col gap-5">
              {/* Optimal Price Recommendation */}
              {result.price_recommendation && (
                <div className="rounded-xl border p-5" style={{ background: `${green}08`, borderColor: `${green}25` }}>
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Star className="w-4 h-4" style={{ color: green }} />AI Optimal Pricing Recommendation
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    {[
                      { label: "Min Viable Price", value: fmt(result.price_recommendation.min_viable_price), desc: "Break-even + small margin", color: amber },
                      { label: "✨ Suggested Price", value: fmt(result.price_recommendation.suggested_retail_price), desc: `${result.price_recommendation.expected_margin_percent}% expected margin`, color: green },
                      { label: "Premium Price", value: fmt(result.price_recommendation.premium_price), desc: "For high perceived value", color: purple },
                    ].map((p) => (
                      <div key={p.label} className="text-center py-4 px-3 rounded-xl" style={{ background: p.label.includes("✨") ? `${green}15` : "rgba(255,255,255,0.03)", border: p.label.includes("✨") ? `1px solid ${green}40` : "1px solid rgba(255,255,255,0.06)" }}>
                        <p className="text-2xl font-bold" style={{ color: p.color }}>{p.value}</p>
                        <p className="text-xs font-medium text-white mt-1">{p.label}</p>
                        <p className="text-[10px] text-muted-foreground">{p.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg p-3 text-sm text-muted-foreground" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <p className="font-medium text-white mb-1 text-xs">💡 Reasoning</p>{result.price_recommendation.reasoning}
                  </div>
                  {result.price_recommendation.platform_strategy && (
                    <div className="rounded-lg p-3 text-sm text-muted-foreground mt-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <p className="font-medium text-white mb-1 text-xs">🛒 Platform Strategy</p>{result.price_recommendation.platform_strategy}
                    </div>
                  )}
                </div>
              )}

              {/* Variant Pricing */}
              {result.variants && result.variants.length > 0 && (
                <Section title="Variant Price Breakdown" icon={Layers} color={amber}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {result.variants.map((v, i) => (
                      <div key={i} className="p-3 rounded-lg border bg-white/5 flex justify-between items-center" style={{ borderColor: "rgba(255,255,255,0.1)" }}><div><p className="text-sm font-bold text-white">{v.name}</p><p className="text-[10px] text-muted-foreground">{v.description}</p></div><p className="text-sm font-bold" style={{ color: accent }}>{fmt(v.price)}</p></div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Platform Cards — with prices when available */}
              {result.buy_links && result.buy_links.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: accent }}>
                    <ExternalLink className="w-3.5 h-3.5" />Prices Found on {result.buy_links.length} Platforms
                    {result.price_analysis.real_time_data && <Badge label="🔴 Real-Time" color={red} />}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {result.buy_links.map((link, i) => {
                      const isCheapest = link.price === result.price_analysis.min
                      const isExpensive = link.price === result.price_analysis.max
                      const avg = result.price_analysis.average
                      const diff = link.price && avg ? Math.round(((link.price - avg) / avg) * 100) : 0
                      return (
                        <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 rounded-xl border transition-all hover:scale-[1.02] group"
                          style={{ background: isCheapest ? `${green}0a` : "rgba(255,255,255,0.02)", borderColor: isCheapest ? `${green}40` : isExpensive ? `${red}30` : "rgba(255,255,255,0.08)" }}>
                          <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                            <img src={`https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=32`} alt={link.store} className="w-6 h-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-white truncate">{link.store}</p>
                              {isCheapest && <Badge label="CHEAPEST" color={green} />}
                              {isExpensive && <Badge label="HIGHEST" color={red} />}
                            </div>
                            {link.variant && <p className="text-[10px] text-muted-foreground mt-0.5">{link.variant}</p>}
                            {link.price && <p className="text-[10px] mt-0.5" style={{ color: diff < -2 ? green : diff > 2 ? red : amber }}>{diff === 0 ? "≈ avg" : diff > 0 ? `+${diff}% vs avg` : `${diff}% vs avg`}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-base font-bold" style={{ color: isCheapest ? green : isExpensive ? red : accent }}>{link.price ? fmt(link.price) : "—"}</p>
                            <ExternalLink className="w-3 h-3 ml-auto mt-1" style={{ color: accent }} />
                          </div>
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ALL Platform Links — guaranteed 15 platforms grouped by category */}
              {(() => {
                const links: any[] = result.platform_links || []
                if (links.length === 0) return null
                const groups: Record<string, any[]> = {}
                for (const l of links) { const cat = l.category || "ecommerce"; if (!groups[cat]) groups[cat] = []; groups[cat].push(l) }
                const catOrder = ["ecommerce", "quick_commerce", "grocery", "fashion", "brand"]
                const catColors: Record<string, string> = { ecommerce: accent, quick_commerce: red, grocery: green, fashion: purple, brand: amber }
                const catNames: Record<string, string> = { ecommerce: "🛒 E-Commerce & Electronics", quick_commerce: "⚡ Quick Commerce", grocery: "🥦 Grocery & Essentials", fashion: "👗 Fashion & Lifestyle", brand: "🏷️ Brand Stores" }
                const directCount = links.filter((l: any) => l.directUrl).length
                return (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5" style={{ color: accent }}>
                        <Globe className="w-3.5 h-3.5" />View on {links.length} Platforms
                      </p>
                      <div className="flex items-center gap-2 text-[10px]">
                        {directCount > 0 && <span className="px-2 py-0.5 rounded-full font-semibold" style={{ background: `${green}18`, color: green }}>✓ {directCount} direct product page{directCount > 1 ? "s" : ""}</span>}
                        <span className="text-muted-foreground">{links.length - directCount} search pages (always work)</span>
                      </div>
                    </div>
                    {catOrder.filter(c => groups[c]?.length).map(cat => (
                      <div key={cat}>
                        <p className="text-[11px] font-semibold mb-2 uppercase tracking-wide" style={{ color: catColors[cat] }}>{catNames[cat]}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                          {groups[cat].map((link: any, i: number) => (
                            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                              className="flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all hover:scale-[1.05] cursor-pointer"
                              style={{ background: link.directUrl ? `${catColors[cat]}08` : "rgba(255,255,255,0.015)", borderColor: link.directUrl ? `${catColors[cat]}30` : "rgba(255,255,255,0.07)" }}
                              title={link.directUrl ? `View ${link.store} product page` : `Search ${link.store} for this product`}>
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                                <img src={link.favicon || `https://www.google.com/s2/favicons?domain=${link.store.toLowerCase()}.com&sz=32`} alt={link.store} className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                              </div>
                              <p className="text-xs font-medium text-white leading-tight">{link.store}</p>
                              {link.price
                                ? <p className="text-xs font-bold" style={{ color: catColors[cat] }}>{fmt(link.price)}</p>
                                : <p className="text-[9px] text-muted-foreground">{link.directUrl ? "View product" : "Search here"}</p>}
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: link.directUrl ? `${green}20` : "rgba(255,255,255,0.06)", color: link.directUrl ? green : "#64748b" }}>
                                {link.directUrl ? "📌 DIRECT" : "🔍 SEARCH"}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}

              {/* Price Comparison Bar Chart */}
              {platformBarData.length > 0 && (
                <Section title="Price Comparison Across Platforms" icon={BarChart3} color={accent}>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={platformBarData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} />
                      <YAxis tickFormatter={(v) => fmt(v)} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} width={70} />
                      <Tooltip content={<ChartTooltip />} />
                      <ReferenceLine y={result.price_analysis.average} stroke={amber} strokeDasharray="4 4" label={{ value: "Avg", fill: amber, fontSize: 10 }} />
                      <Bar dataKey="price" name="Price" radius={[6, 6, 0, 0]}>
                        {platformBarData.map((entry, index) => (
                          <Cell key={index} fill={entry.price === result.price_analysis.min ? green : entry.price === result.price_analysis.max ? red : accent} opacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground justify-center">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: green }} />Cheapest</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: accent }} />Mid-range</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: red }} />Most Expensive</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-1 inline-block" style={{ background: amber, borderTop: `2px dashed ${amber}` }} />Market Avg</span>
                  </div>
                </Section>
              )}

              {/* Platform Price Indicator / Trend Chart */}
              {trendData.length > 0 && (
                <Section title="Price Trend Over the Year (Index: 100 = Average)" icon={TrendingUp} color={trendColor}>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={trendColor} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={trendColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} />
                      <YAxis domain={["auto", "auto"]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} />
                      <Tooltip content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        const d = trendData.find(t => t.month === label)
                        return (
                          <div className="rounded-lg border px-3 py-2 text-xs max-w-[200px]" style={{ background: "rgba(5,12,8,0.95)", borderColor: "rgba(71,255,134,0.20)" }}>
                            <p className="text-white font-semibold">{label}</p>
                            <p style={{ color: trendColor }}>Index: <strong>{payload[0].value}</strong></p>
                            {d?.event && <p className="text-muted-foreground mt-1">{d.event}</p>}
                          </div>
                        )
                      }} />
                      <ReferenceLine y={100} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
                      <Area type="monotone" dataKey="price_index" name="Price Index" stroke={trendColor} fill="url(#trendGrad)" strokeWidth={2} dot={{ fill: trendColor, r: 3 }} activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <p className="text-[10px] text-muted-foreground text-center">Index 100 = average market price. Above 100 = prices rise; below 100 = prices drop. Hover each month to see the reason.</p>
                </Section>
              )}

              {/* Platform Price Analysis table */}
              {result.platform_price_analysis && result.platform_price_analysis.length > 0 && (
                <Section title="Platform-by-Platform Price Analysis" icon={Store} color={purple}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/10">
                          {["Platform", "Price", "vs Market Avg", "Trend", "Why"].map(h => <th key={h} className="text-left py-2 px-2 text-muted-foreground font-medium">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {result.platform_price_analysis.map((p, i) => (
                          <tr key={i} className="border-b border-white/05 hover:bg-white/03">
                            <td className="py-2.5 px-2 text-white font-medium">{p.platform}</td>
                            <td className="py-2.5 px-2 font-bold" style={{ color: accent }}>{fmt(p.price)}</td>
                            <td className="py-2.5 px-2">
                              <span style={{ color: p.vs_avg_percent < -2 ? green : p.vs_avg_percent > 2 ? red : amber }}>
                                {p.vs_avg_percent > 0 ? "+" : ""}{p.vs_avg_percent}%
                              </span>
                            </td>
                            <td className="py-2.5 px-2"><Badge label={p.trend} color={p.trend === "cheaper" ? green : p.trend === "pricier" ? red : amber} /></td>
                            <td className="py-2.5 px-2 text-muted-foreground max-w-xs">{p.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
              )}
            </div>
          )}

          {/* ── Tab: Profit ── */}
          {activeTab === "profit" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Section title="Price Breakdown" icon={IndianRupee} color={green}>
                {result.price_analysis.real_time_data && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: red }}>
                    🔴 Live prices fetched from {result.buy_links?.length || 0} real Indian e-commerce platforms
                  </div>
                )}
                {[
                  { label: "Wholesale Price", value: fmt(result.price_analysis.wholesale_price), color: accent },
                  { label: "Retail Price (Offline)", value: fmt(result.price_analysis.retail_price), color: green },
                  { label: "Online Price", value: fmt(result.price_analysis.online_price), color: purple },
                  { label: "Market Average", value: fmt(result.price_analysis.average), color: amber },
                ].map((p) => (
                  <div key={p.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-sm text-muted-foreground">{p.label}</span>
                    <span className="font-bold text-base" style={{ color: p.color }}>{p.value}</span>
                  </div>
                ))}
              </Section>

              <Section title="Profit Margins" icon={BarChart3} color={purple}>
                {[
                  { label: "Gross Margin", value: result.profit_analysis.gross_margin_percent, color: green },
                  { label: "Net Margin", value: result.profit_analysis.net_margin_percent, color: accent },
                  { label: "ROI", value: result.profit_analysis.roi_percent, color: purple },
                  { label: "Markup", value: result.profit_analysis.markup_percent, color: amber },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">{m.label}</span><span className="font-bold" style={{ color: m.color }}>{m.value}%</span></div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(m.value, 100)}%`, background: m.color }} /></div>
                  </div>
                ))}
              </Section>

              {/* Cost Breakdown Pie */}
              {costData.length > 0 && (
                <Section title="Cost Structure Breakdown" icon={BarChart3} color={accent}>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={costData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value">
                        {costData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(val: any) => [`${val}%`, ""]} contentStyle={{ background: "rgba(5,12,8,0.95)", border: "1px solid rgba(71,255,134,0.20)", borderRadius: 8, fontSize: 12 }} />
                      <Legend formatter={(v) => <span style={{ color: "#94a3b8", fontSize: 11 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </Section>
              )}

              {/* Monthly earnings */}
              <div className="rounded-xl border p-5" style={{ background: `${green}06`, borderColor: `${green}25` }}>
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><IndianRupee className="w-4 h-4" style={{ color: green }} />Monthly Earnings Potential</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Small Setup", value: fmt(result.profit_analysis.estimated_monthly_profit_small), desc: "Home/kiosk", color: accent },
                    { label: "Medium Setup", value: fmt(result.profit_analysis.estimated_monthly_profit_medium), desc: "Shop + online", color: green },
                    { label: "Breakeven", value: `${result.profit_analysis.breakeven_units_monthly} units`, desc: "Per month", color: amber },
                  ].map((e) => (
                    <div key={e.label} className="text-center p-3 rounded-xl bg-white/5">
                      <p className="text-xl font-bold" style={{ color: e.color }}>{e.value}</p>
                      <p className="text-xs font-semibold text-white mt-1">{e.label}</p>
                      <p className="text-[10px] text-muted-foreground">{e.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Local Market ── */}
          {activeTab === "local" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Section title={`Competition ${userCity ? `· ${userCity}` : ""}`} icon={MapPin} color={accent}>
                <div className="flex gap-4 text-xs mb-2">
                  <span>🏪 Nearby: <strong className="text-white">{result.local_market.nearby_business_count}</strong></span>
                  <span>Saturation: <Badge label={result.local_market.market_saturation} color={satColor} /></span>
                </div>
                {result.local_market.local_competitors.map((c) => (
                  <div key={c.name} className="flex items-start justify-between py-2.5 border-b border-white/5 last:border-0 gap-3">
                    <div><p className="text-sm font-medium text-white">{c.name}</p><p className="text-xs text-muted-foreground mt-0.5">{c.strength}</p></div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-mono" style={{ color: accent }}>{c.price_range}</p>
                      <Badge label={c.type} color={c.type === "Online" ? purple : c.type === "Both" ? amber : green} />
                    </div>
                  </div>
                ))}
              </Section>
              <Section title="Best Selling Areas" icon={Store} color={green}>
                {result.local_market.best_selling_areas.map((area, i) => (
                  <div key={i} className="flex items-center gap-2.5 py-1.5 px-3 rounded-lg bg-white/5">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: `${green}20`, color: green }}>{i + 1}</span>
                    <span className="text-sm text-white">{area}</span>
                  </div>
                ))}
              </Section>
              <Section title="Demand Gauge" icon={Target} color={accent}>
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke={result.local_market.demand_level === "High" ? green : amber} strokeWidth="3" strokeDasharray={`${result.local_market.demand_score} 100`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-white">{result.local_market.demand_score}</span>
                      <span className="text-[10px] text-muted-foreground">/ 100</span>
                    </div>
                  </div>
                  <Badge label={`Demand: ${result.local_market.demand_level}`} color={result.local_market.demand_level === "High" ? green : amber} />
                </div>
              </Section>
              <Section title="Unique Selling Points" icon={Sparkles} color={purple}>
                {result.business_insights.usp_suggestions.map((usp, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: purple }} />{usp}</div>
                ))}
              </Section>
            </div>
          )}

          {/* ── Tab: Strategy ── */}
          {activeTab === "strategy" && (
            <div className="flex flex-col gap-5">
              {/* Channel Comparison Table */}
              {result.channel_comparison && result.channel_comparison.length > 0 && (
                <Section title="Selling Channel Comparison" icon={Globe} color={accent}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/10">
                          {["Channel", "Avg Price", "Margin %", "Competition", "Recommended", "Why"].map(h => <th key={h} className="text-left py-2 px-2 text-muted-foreground font-medium">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {result.channel_comparison.map((c, i) => (
                          <tr key={i} className="border-b border-white/05 hover:bg-white/03">
                            <td className="py-3 px-2 text-white font-medium">{c.channel}</td>
                            <td className="py-3 px-2 font-bold" style={{ color: accent }}>{fmt(c.avg_price)}</td>
                            <td className="py-3 px-2" style={{ color: green }}>{c.margin_percent}%</td>
                            <td className="py-3 px-2"><Badge label={c.competition} color={c.competition === "Low" ? green : c.competition === "High" ? red : amber} /></td>
                            <td className="py-3 px-2">{c.recommended ? <CheckCircle2 className="w-4 h-4" style={{ color: green }} /> : <XCircle className="w-4 h-4" style={{ color: "#475569" }} />}</td>
                            <td className="py-3 px-2 text-muted-foreground max-w-xs">{c.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
              )}

              {wantToStart === null && (
                <div className="rounded-xl border p-6 text-center" style={{ background: "rgba(10,20,14,0.70)", borderColor: "rgba(71,255,134,0.18)", backdropFilter: "blur(16px)" }}>
                  <ShoppingBag className="w-10 h-10 mx-auto mb-3" style={{ color: accent }} />
                  <h3 className="text-lg font-bold text-white mb-1">Interested in starting a <span style={{ color: accent }}>{result.product_overview.name}</span> business?</h3>
                  <p className="text-sm mb-4 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>{result.want_to_start.reason}</p>
                  <div className="flex flex-wrap items-center justify-center gap-4 text-xs mb-5" style={{ color: "rgba(255,255,255,0.40)" }}>
                    <span>💰 Startup: <strong className="text-white">{fmt(result.want_to_start.startup_cost_min)} – {fmt(result.want_to_start.startup_cost_max)}</strong></span>
                    <span>⏱️ Profit in: <strong className="text-white">{result.want_to_start.time_to_profit_months} months</strong></span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => setWantToStart(true)} className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold hover:scale-105 transition-all" style={{ background: "rgba(71,255,134,0.15)", border: "1px solid rgba(71,255,134,0.35)", color: accent, boxShadow: "0 0 16px rgba(71,255,134,0.12)" }}>
                      <CheckCircle2 className="w-4 h-4" />Yes, show me how!
                    </button>
                    <button onClick={() => setWantToStart(false)} className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium border transition-all" style={{ borderColor: "rgba(71,255,134,0.12)", color: "rgba(255,255,255,0.45)" }}>Not now</button>
                  </div>
                </div>
              )}

              {wantToStart === false && (
                <div className="rounded-xl border p-5 text-center text-muted-foreground" style={card}>
                  That's fine! The analysis above still gives you great market intelligence.
                  <button onClick={() => setWantToStart(null)} className="block mx-auto mt-3 text-xs underline" style={{ color: accent }}>Show business strategy</button>
                </div>
              )}

              {wantToStart === true && (
                <div className="flex flex-col gap-5">
                  {[result.business_strategy.phase1, result.business_strategy.phase2, result.business_strategy.phase3].map((phase, pi) => {
                    const colors = [accent, green, purple]
                    const icons = [Target, Rocket, TrendingUp]
                    const PhaseIcon = icons[pi]
                    return (
                      <div key={pi} className="rounded-xl border p-5" style={{ ...card, borderLeft: `3px solid ${colors[pi]}` }}>
                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                          <PhaseIcon className="w-4 h-4" style={{ color: colors[pi] }} />
                          <span style={{ color: colors[pi] }}>Phase {pi + 1}:</span>{phase.title}
                        </h3>
                        {phase.steps.map((step, i) => (
                          <div key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground mb-2">
                            <ArrowRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: colors[pi] }} />{step}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <Section title="Online Strategy" icon={Globe} color={accent}>
                      {result.business_strategy.online_strategy.map((s, i) => <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: accent }} />{s}</div>)}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">{result.business_strategy.recommended_platforms.map((p) => <Badge key={p} label={p} color={accent} />)}</div>
                    </Section>
                    <Section title="Offline Strategy" icon={Store} color={green}>
                      {result.business_strategy.offline_strategy.map((s, i) => <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: green }} />{s}</div>)}
                    </Section>
                    <Section title="Sourcing Tips" icon={Package} color={amber}>
                      {result.business_strategy.sourcing_tips.map((s, i) => <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><Zap className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: amber }} />{s}</div>)}
                    </Section>
                    <Section title="Legal Requirements" icon={Scale} color={red}>
                      {result.business_strategy.legal_requirements.map((s, i) => <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: red }} />{s}</div>)}
                    </Section>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="rounded-xl border mt-2" style={{ ...card, borderColor: "rgba(71,255,134,0.10)" }}>
          <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center justify-between p-4 text-sm font-semibold text-white">
            <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4" style={{ color: "rgba(255,255,255,0.35)" }} />Recent Analyses ({history.length})</span>
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showHistory && (
            <div style={{ borderTop: "1px solid rgba(71,255,134,0.08)" }}>
              {history.map((h) => (
                <button key={h.id} onClick={() => { setResult(h.result); setWantToStart(null); setActiveTab("overview") }}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors last:border-0 hover:bg-white/[0.03]"
                  style={{ borderBottom: "1px solid rgba(71,255,134,0.06)" }}>
                  <span className="text-white font-medium">{h.query}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {h.category && <Badge label={h.category} color={accent} />}
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{new Date(h.created_at).toLocaleDateString("en-IN")}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
