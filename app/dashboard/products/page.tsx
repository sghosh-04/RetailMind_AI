"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import DashboardHeader from "@/components/dashboard/header"
import {
  Plus, Pencil, Trash2, Loader2, X, Package, AlertCircle,
  Upload, Download, FileText, CheckCircle2, XCircle, ChevronDown,
  ChevronRight, Search, Filter, Grid3X3, List, RefreshCw,
  TableProperties, Sparkles, ClipboardList, Info
} from "lucide-react"
import * as XLSX from "xlsx"
import Papa from "papaparse"

interface Product {
  id: string; name: string; sku: string | null; category: string | null
  unit: string; price: number; cost_price: number; gst_rate: number
  stock_qty: number; description: string | null
}

interface ParsedProduct {
  name: string; sku: string; category: string; unit: string
  price: string; cost_price: string; gst_rate: string; stock_qty: string; description: string
  _error?: string
}

type ImportResult = { name: string; status: "inserted" | "skipped" | "error"; reason?: string }

const EMPTY = { name: "", sku: "", category: "", unit: "pcs", price: "", cost_price: "", gst_rate: "18", stock_qty: "0", description: "" }
const GST_RATES = [0, 5, 12, 18, 28]
const UNITS = ["pcs", "kg", "g", "litre", "ml", "box", "pack", "dozen", "meter", "sqft"]
const inp = "w-full px-3 py-2 rounded-lg text-sm outline-none transition-all bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50"
const accent = "#00d4ff"; const green = "#16a34a"; const amber = "#f59e0b"; const red = "#ef4444"
const PAGE_SIZE = 15

// ── CSV Template headers
const CSV_TEMPLATE = `name,sku,category,unit,price,cost_price,gst_rate,stock_qty,description
Basmati Rice 5kg,RICE-5KG,Groceries,kg,450,300,5,100,Premium basmati rice
Surf Excel 1kg,SURF-1KG,Household,pcs,220,150,18,50,Detergent powder
`

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" })
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob)
  a.download = "products_template.csv"; a.click()
}

// ── Parse CSV/Excel file client-side
function parseCSV(text: string): ParsedProduct[] {
  const result = Papa.parse<Record<string, string>>(text.trim(), { header: true, skipEmptyLines: true })
  return result.data.map(row => {
    const name = (row.name || row.Name || row.PRODUCT || row["Product Name"] || "").trim()
    const sku = (row.sku || row.SKU || row.Sku || "").trim()
    const category = (row.category || row.Category || row.CATEGORY || row.Zone || row.zone || "").trim()
    const unit = (row.unit || row.Unit || "pcs").trim()
    const price = (row.price || row.Price || row["Selling Price"] || row["Sale Price"] || "0").trim()
    const cost_price = (row.cost_price || row["Cost Price"] || row.CostPrice || "0").trim()
    const gst_rate = (row.gst_rate || row.GST || row["GST Rate"] || "18").trim()
    const stock_qty = (row.stock_qty || row.Stock || row.Quantity || row.Qty || "0").trim()
    const description = (row.description || row.Description || "").trim()
    const _error = !name ? "Missing name" : !price || isNaN(Number(price)) ? "Invalid price" : undefined
    return { name, sku, category, unit, price, cost_price, gst_rate, stock_qty, description, _error }
  })
}

function parseExcel(buffer: ArrayBuffer): ParsedProduct[] {
  const wb = XLSX.read(buffer, { type: "array" })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" })
  return rows.map(row => {
    const name = String(row.name || row.Name || row.PRODUCT || row["Product Name"] || "").trim()
    const sku = String(row.sku || row.SKU || row.Sku || "").trim()
    const category = String(row.category || row.Category || row.Zone || row.zone || "").trim()
    const unit = String(row.unit || row.Unit || "pcs").trim()
    const price = String(row.price || row.Price || row["Selling Price"] || "0").trim()
    const cost_price = String(row.cost_price || row["Cost Price"] || "0").trim()
    const gst_rate = String(row.gst_rate || row.GST || "18").trim()
    const stock_qty = String(row.stock_qty || row.Stock || row.Quantity || row.Qty || "0").trim()
    const description = String(row.description || row.Description || "").trim()
    const _error = !name ? "Missing name" : !price || isNaN(Number(price)) ? "Invalid price" : undefined
    return { name, sku, category, unit, price, cost_price, gst_rate, stock_qty, description, _error }
  })
}

// ── Bulk row editor (spreadsheet-style)
function BulkEditor({ onImport }: { onImport: (rows: ParsedProduct[]) => void }) {
  const [rows, setRows] = useState<ParsedProduct[]>([{ ...EMPTY }])
  const addRow = () => setRows(r => [...r, { ...EMPTY }])
  const removeRow = (i: number) => setRows(r => r.filter((_, j) => j !== i))
  const setCell = (i: number, k: keyof ParsedProduct, v: string) =>
    setRows(r => r.map((row, j) => j === i ? { ...row, [k]: v } : row))

  const valid = rows.filter(r => r.name.trim() && r.price && !isNaN(Number(r.price)))

  const thCls = "px-2 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
  const tdInp = "px-1.5 py-1 rounded text-xs bg-secondary border border-border text-foreground outline-none focus:border-primary/50 w-full"

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Fill in product details row-by-row. Required: Name & Price.</p>
        <div className="flex gap-2">
          <button onClick={addRow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
            style={{ background: "rgba(0, 255, 170, 0.12)", color: accent, border: `1px solid ${accent}30` }}>
            <Plus className="w-3 h-3" /> Add Row
          </button>
          <button disabled={valid.length === 0} onClick={() => onImport(valid)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: green, color: "#060d1f" }}>
            <CheckCircle2 className="w-3 h-3" /> Import {valid.length > 0 ? `(${valid.length})` : ""}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <table className="text-sm w-full">
          <thead style={{ background: "rgba(15,23,42,0.8)" }}>
            <tr>
              {["#", "Name *", "SKU", "Category", "Unit", "Price ₹ *", "Cost ₹", "GST %", "Stock", ""].map(h => (
                <th key={h} className={thCls}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-border" style={{ background: i % 2 === 0 ? "rgba(15,23,42,0.4)" : "rgba(15,23,42,0.2)" }}>
                <td className="px-2 text-xs text-muted-foreground">{i + 1}</td>
                <td className="px-1 py-1 min-w-[140px]"><input className={tdInp} value={row.name} onChange={e => setCell(i, "name", e.target.value)} placeholder="Product name" /></td>
                <td className="px-1 py-1 min-w-[90px]"><input className={tdInp} value={row.sku} onChange={e => setCell(i, "sku", e.target.value)} placeholder="SKU-001" /></td>
                <td className="px-1 py-1 min-w-[100px]"><input className={tdInp} value={row.category} onChange={e => setCell(i, "category", e.target.value)} placeholder="Category" /></td>
                <td className="px-1 py-1 min-w-[70px]">
                  <select className={tdInp} value={row.unit} onChange={e => setCell(i, "unit", e.target.value)}>
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </td>
                <td className="px-1 py-1 min-w-[80px]"><input type="number" className={tdInp} value={row.price} onChange={e => setCell(i, "price", e.target.value)} placeholder="0.00" /></td>
                <td className="px-1 py-1 min-w-[80px]"><input type="number" className={tdInp} value={row.cost_price} onChange={e => setCell(i, "cost_price", e.target.value)} placeholder="0.00" /></td>
                <td className="px-1 py-1 min-w-[65px]">
                  <select className={tdInp} value={row.gst_rate} onChange={e => setCell(i, "gst_rate", e.target.value)}>
                    {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </td>
                <td className="px-1 py-1 min-w-[65px]"><input type="number" className={tdInp} value={row.stock_qty} onChange={e => setCell(i, "stock_qty", e.target.value)} placeholder="0" /></td>
                <td className="px-2"><button onClick={() => removeRow(i)} className="text-muted-foreground hover:text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 5 && (
        <p className="text-xs text-muted-foreground text-center">{rows.length} rows · {valid.length} valid · {rows.length - valid.length} incomplete</p>
      )}
    </div>
  )
}

// ── Import Preview with category grouping
function ImportPreview({
  products, onConfirm, onBack, importing
}: {
  products: ParsedProduct[]
  onConfirm: () => void
  onBack: () => void
  importing: boolean
}) {
  const valid = products.filter(p => !p._error)
  const invalid = products.filter(p => p._error)
  const catMap: Record<string, ParsedProduct[]> = {}
  for (const p of valid) {
    const cat = p.category || "Uncategorised"
    catMap[cat] = [...(catMap[cat] || []), p]
  }
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(Object.keys(catMap).map(c => [c, true]))
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 justify-between flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-white">Review Import</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span style={{ color: green }}>{valid.length} valid</span>
            {invalid.length > 0 && <span style={{ color: amber }}> · {invalid.length} will be skipped (errors)</span>}
            {" "}· grouped by category
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onBack} disabled={importing}
            className="px-3 py-1.5 rounded-lg text-xs border text-muted-foreground hover:text-foreground transition-all"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            ← Back
          </button>
          <button onClick={onConfirm} disabled={importing || valid.length === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
            style={{ background: green, color: "#060d1f" }}>
            {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            {importing ? "Importing…" : `Confirm Import (${valid.length})`}
          </button>
        </div>
      </div>

      {/* Category groups */}
      <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
        {Object.entries(catMap).map(([cat, items]) => (
          <div key={cat} className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <button
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/5"
              style={{ background: "rgba(15,23,42,0.7)" }}
              onClick={() => setExpanded(e => ({ ...e, [cat]: !e[cat] }))}>
              <div className="flex items-center gap-2">
                {expanded[cat] ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                <span style={{ color: accent }}>{cat}</span>
                <span className="text-xs font-normal text-muted-foreground">({items.length} products)</span>
              </div>
            </button>
            {expanded[cat] && (
              <table className="w-full text-xs">
                <thead><tr style={{ background: "rgba(15,23,42,0.5)" }}>
                  {["Name", "SKU", "Price", "Cost", "GST", "Stock", "Unit"].map(h => (
                    <th key={h} className="px-3 py-1.5 text-left text-[10px] font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {items.map((p, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-2 font-medium text-white">{p.name}</td>
                      <td className="px-3 py-2 text-muted-foreground font-mono">{p.sku || "—"}</td>
                      <td className="px-3 py-2" style={{ color: accent }}>₹{p.price}</td>
                      <td className="px-3 py-2 text-muted-foreground">₹{p.cost_price || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{p.gst_rate}%</td>
                      <td className="px-3 py-2 text-white">{p.stock_qty}</td>
                      <td className="px-3 py-2 text-muted-foreground">{p.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
        {invalid.length > 0 && (
          <div className="rounded-xl border p-3" style={{ borderColor: `${amber}30`, background: `${amber}08` }}>
            <p className="text-xs font-semibold mb-2" style={{ color: amber }}>⚠ Skipped rows ({invalid.length})</p>
            {invalid.map((p, i) => (
              <p key={i} className="text-xs text-muted-foreground">• {p.name || "(unnamed)"} — {p._error}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Import Results summary
function ImportResults({ results, onDone }: { results: ImportResult[]; onDone: () => void }) {
  const inserted = results.filter(r => r.status === "inserted")
  const skipped = results.filter(r => r.status === "skipped")
  const errors = results.filter(r => r.status === "error")
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Imported", count: inserted.length, color: green, icon: CheckCircle2 },
          { label: "Skipped", count: skipped.length, color: amber, icon: Info },
          { label: "Errors", count: errors.length, color: red, icon: XCircle },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-4 text-center" style={{ borderColor: `${s.color}25`, background: `${s.color}08` }}>
            <s.icon className="w-5 h-5 mx-auto mb-1" style={{ color: s.color }} />
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      {skipped.length > 0 && (
        <div className="rounded-lg p-3 text-xs" style={{ background: `${amber}08`, border: `1px solid ${amber}20` }}>
          <p className="font-semibold mb-1" style={{ color: amber }}>Skipped (duplicate SKU or invalid):</p>
          {skipped.map((r, i) => <p key={i} className="text-muted-foreground">• {r.name} — {r.reason}</p>)}
        </div>
      )}
      <button onClick={onDone} className="py-2 rounded-lg text-sm font-semibold" style={{ background: green, color: "#060d1f" }}>
        ✓ Done
      </button>
    </div>
  )
}

// ── Main Page
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Import state
  const [importMode, setImportMode] = useState<"none" | "upload" | "bulk" | "preview" | "results">("none")
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([])
  const [importResults, setImportResults] = useState<ImportResult[]>([])
  const [importing, setImporting] = useState(false)
  const [fileLoading, setFileLoading] = useState(false)
  const [aiParsing, setAiParsing] = useState(false)
  const [uploadError, setUploadError] = useState("")

  // Table state
  const [search, setSearch] = useState("")
  const [filterCat, setFilterCat] = useState("")
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch("/api/products"); const d = await r.json()
    setProducts(d.products ?? []); setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() { setEditing(null); setForm(EMPTY); setError(""); setShowModal(true) }
  function openEdit(p: Product) {
    setEditing(p)
    setForm({ name: p.name, sku: p.sku ?? "", category: p.category ?? "", unit: p.unit, price: String(p.price), cost_price: String(p.cost_price), gst_rate: String(p.gst_rate), stock_qty: String(p.stock_qty), description: p.description ?? "" })
    setError(""); setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.price) { setError("Name and price are required."); return }
    setSaving(true); setError("")
    const body = { ...form, price: Number(form.price), cost_price: Number(form.cost_price), gst_rate: Number(form.gst_rate), stock_qty: Number(form.stock_qty) }
    const res = await fetch(editing ? `/api/products/${editing.id}` : "/api/products", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    const data = await res.json()
    if (!res.ok) { setError(data.error || "Save failed"); setSaving(false); return }
    setShowModal(false); load(); setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return
    setDeletingId(id)
    await fetch(`/api/products/${id}`, { method: "DELETE" })
    setDeletingId(null); load()
  }

  // ── File Upload Handler
  async function handleFileUpload(file: File) {
    setUploadError(""); setFileLoading(true)
    const ext = file.name.split(".").pop()?.toLowerCase()

    try {
      if (ext === "csv") {
        const text = await file.text()
        const parsed = parseCSV(text)
        setParsedProducts(parsed); setImportMode("preview")
      } else if (ext === "xlsx" || ext === "xls") {
        const buffer = await file.arrayBuffer()
        const parsed = parseExcel(buffer)
        setParsedProducts(parsed); setImportMode("preview")
      } else if (ext === "pdf" || ext === "doc" || ext === "docx" || ext === "txt") {
        // For PDF/DOC: read as text (works for txt/doc), then send to AI
        setAiParsing(true)
        let text = ""
        try { text = await file.text() } catch { text = `File: ${file.name}` }
        const res = await fetch("/api/products/parse-file", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, filename: file.name })
        })
        const data = await res.json()
        setAiParsing(false)
        if (!res.ok || !data.products) { setUploadError(data.error || "AI parsing failed"); setFileLoading(false); return }
        const mapped: ParsedProduct[] = data.products.map((p: any) => ({
          name: String(p.name || ""), sku: String(p.sku || ""), category: String(p.category || ""),
          unit: String(p.unit || "pcs"), price: String(p.price || ""), cost_price: String(p.cost_price || "0"),
          gst_rate: String(p.gst_rate || "18"), stock_qty: String(p.stock_qty || "0"), description: String(p.description || ""),
          _error: !p.name ? "Missing name" : (!p.price || isNaN(Number(p.price))) ? "Invalid price" : undefined
        }))
        setParsedProducts(mapped); setImportMode("preview")
      } else {
        setUploadError("Unsupported file type. Use CSV, XLSX, XLS, PDF, DOC, DOCX, or TXT.")
      }
    } catch (err: any) {
      setUploadError(err?.message || "Failed to parse file")
    }
    setFileLoading(false)
  }

  // ── Confirm Bulk Import
  async function confirmImport(rows: ParsedProduct[]) {
    setImporting(true)
    const body = rows.map(r => ({
      name: r.name, sku: r.sku || null, category: r.category || null, unit: r.unit || "pcs",
      price: Number(r.price), cost_price: Number(r.cost_price) || 0,
      gst_rate: Number(r.gst_rate) || 18, stock_qty: Number(r.stock_qty) || 0, description: r.description || null
    }))
    const res = await fetch("/api/products/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ products: body }) })
    const data = await res.json()
    setImportResults(data.results || [])
    setImporting(false); setImportMode("results"); load()
  }

  // ── Filtered/paginated list
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[]
  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    const matchQ = !q || p.name.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q)
    const matchCat = !filterCat || p.category === filterCat
    return matchQ && matchCat
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetImport = () => { setImportMode("none"); setParsedProducts([]); setImportResults([]); setUploadError("") }

  return (
    <>
      <DashboardHeader title="Products" subtitle="Manage your product catalog" />
      <main className="flex-1 overflow-y-auto p-6">

        {/* ── Import Panel */}
        {importMode !== "none" && (
          <div className="mb-6 rounded-2xl border p-5" style={{ background: "rgba(6,13,31,0.95)", borderColor: `${accent}22` }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                {importMode === "upload" && <><Upload className="w-4 h-4" style={{ color: accent }} /> Upload & Auto-Import</>}
                {importMode === "bulk" && <><TableProperties className="w-4 h-4" style={{ color: accent }} /> Bulk Add (Spreadsheet)</>}
                {importMode === "preview" && <><ClipboardList className="w-4 h-4" style={{ color: accent }} /> Preview Before Import</>}
                {importMode === "results" && <><CheckCircle2 className="w-4 h-4" style={{ color: green }} /> Import Complete</>}
              </h2>
              <button onClick={resetImport} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>

            {/* Upload mode */}
            {importMode === "upload" && (
              <div className="flex flex-col gap-4">
                <div
                  className="rounded-xl border-2 border-dashed p-10 flex flex-col items-center gap-3 cursor-pointer transition-all hover:border-primary/50"
                  style={{ borderColor: "rgba(0,212,255,0.2)", background: "rgba(0,212,255,0.03)" }}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f) }}>
                  {fileLoading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin" style={{ color: accent }} />
                      <p className="text-sm text-muted-foreground">{aiParsing ? "🤖 AI is reading your file…" : "Parsing file…"}</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,212,255,0.08)", border: `1px solid ${accent}25` }}>
                        <Upload className="w-7 h-7" style={{ color: accent }} />
                      </div>
                      <p className="font-semibold text-white">Drop your file here or click to browse</p>
                      <p className="text-xs text-muted-foreground text-center">
                        Supports <span className="font-semibold text-white">CSV, Excel (.xlsx/.xls)</span> — parsed instantly client-side<br />
                        <span className="font-semibold text-white">PDF, DOC, DOCX, TXT</span> — parsed by <span style={{ color: accent }}>🤖 AI</span> automatically
                      </p>
                      <div className="flex items-center gap-2 flex-wrap justify-center">
                        {["CSV", "XLSX", "XLS", "PDF", "DOC", "DOCX", "TXT"].map(ext => (
                          <span key={ext} className="px-2 py-0.5 rounded text-[10px] font-mono font-bold" style={{ background: "rgba(255,255,255,0.07)", color: "#94a3b8" }}>.{ext}</span>
                        ))}
                      </div>
                    </>
                  )}
                  <input ref={fileRef} type="file" className="hidden"
                    accept=".csv,.xlsx,.xls,.pdf,.doc,.docx,.txt"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = "" }} />
                </div>
                {uploadError && (
                  <div className="px-3 py-2.5 rounded-lg text-xs flex items-center gap-2" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                    <AlertCircle className="w-3.5 h-3.5" /> {uploadError}
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex-1 h-px bg-border" />
                  <span>Need a template?</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <button onClick={downloadTemplate}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-all hover:bg-white/5"
                  style={{ borderColor: "rgba(255,255,255,0.1)", color: "#94a3b8" }}>
                  <Download className="w-4 h-4" /> Download CSV Template
                </button>
                <div className="rounded-xl p-4 text-xs" style={{ background: "rgba(0, 255, 179, 0.04)", border: `1px solid ${accent}15` }}>
                  <p className="font-semibold mb-2 flex items-center gap-1" style={{ color: accent }}><Sparkles className="w-3 h-3" /> How AI Parsing Works</p>
                  <p className="text-muted-foreground">For PDF/DOC/TXT files, our AI reads the document and automatically extracts product names, prices, quantities, categories, and other details — even from unstructured text or invoices. It will group products by category/zone automatically.</p>
                </div>
              </div>
            )}

            {/* Bulk editor mode */}
            {importMode === "bulk" && (
              <BulkEditor onImport={rows => { setParsedProducts(rows); setImportMode("preview") }} />
            )}

            {/* Preview mode */}
            {importMode === "preview" && (
              <ImportPreview
                products={parsedProducts}
                importing={importing}
                onBack={() => setImportMode(parsedProducts.length > 0 ? "upload" : "bulk")}
                onConfirm={() => confirmImport(parsedProducts.filter(p => !p._error))}
              />
            )}

            {/* Results mode */}
            {importMode === "results" && (
              <ImportResults results={importResults} onDone={resetImport} />
            )}
          </div>
        )}

        {/* ── Toolbar */}
        {importMode === "none" && (
          <div className="flex flex-col gap-3 mb-6">
            {/* Top row */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-muted-foreground">{products.length} product{products.length !== 1 ? "s" : ""}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {/* View toggle */}
                <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                  <button onClick={() => setViewMode("table")} className={`px-2.5 py-1.5 transition-colors ${viewMode === "table" ? "text-white" : "text-muted-foreground hover:text-white"}`} style={viewMode === "table" ? { background: "rgba(0,212,255,0.15)" } : {}}>
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setViewMode("grid")} className={`px-2.5 py-1.5 transition-colors ${viewMode === "grid" ? "text-white" : "text-muted-foreground hover:text-white"}`} style={viewMode === "grid" ? { background: "rgba(0,212,255,0.15)" } : {}}>
                    <Grid3X3 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button onClick={() => { resetImport(); setImportMode("upload") }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: "rgba(0,212,255,0.12)", color: accent, border: `1px solid ${accent}30` }}>
                  <Upload className="w-4 h-4" /> Import File
                </button>
                <button onClick={() => { resetImport(); setImportMode("bulk") }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: "rgba(163,230,53,0.1)", color: "#47ff86", border: "1px solid rgba(163,230,53,0.25)" }}>
                  <TableProperties className="w-4 h-4" /> Bulk Add
                </button>
                <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: green, color: "#060d1f" }}>
                  <Plus className="w-4 h-4" /> Add Single
                </button>
              </div>
            </div>
            {/* Search + filter row */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Search by name, SKU, category…"
                  className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50" />
              </div>
              {categories.length > 0 && (
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1) }}
                    className="pl-9 pr-8 py-2 rounded-lg text-sm bg-secondary border border-border text-foreground outline-none appearance-none focus:border-primary/50">
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              )}
              {(search || filterCat) && (
                <button onClick={() => { setSearch(""); setFilterCat(""); setPage(1) }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border text-muted-foreground hover:text-foreground transition-all"
                  style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                  <RefreshCw className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Product List */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(71,255,134,0.08)", border: "1px solid rgba(71,255,134,0.25)" }}>
              <Package className="w-8 h-8" style={{ color: "#47ff86" }} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">No products yet</p>
              <p className="text-sm text-muted-Green mt-1">Add your first product or import from a file</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: green, color: "#060d1f" }}>
                <Plus className="w-4 h-4" /> Add Single Product
              </button>
              <button onClick={() => { resetImport(); setImportMode("upload") }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "rgba(0, 255, 162, 0.12)", color: accent, border: `1px solid ${accent}30` }}>
                <Upload className="w-4 h-4" /> Import from File
              </button>
              <button onClick={() => { resetImport(); setImportMode("bulk") }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border text-muted-foreground hover:text-foreground"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                <TableProperties className="w-4 h-4" /> Bulk Add
              </button>
            </div>
            <button onClick={downloadTemplate} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-white transition-colors">
              <Download className="w-3.5 h-3.5" /> Download CSV Template
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">No products match your search.</p>
            <button onClick={() => { setSearch(""); setFilterCat("") }} className="mt-2 text-xs" style={{ color: accent }}>Clear filters</button>
          </div>
        ) : viewMode === "table" ? (
          <>
            <div className="rounded-xl overflow-hidden border border-border">
              <table className="w-full text-sm">
                <thead><tr style={{ background: "rgba(15,23,42,0.8)" }}>
                  {["Name", "SKU", "Category", "Unit", "Price (₹)", "GST %", "Stock", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {paginated.map((p, i) => (
                    <tr key={p.id} className="border-t border-border hover:bg-accent/30 transition-colors" style={{ background: i % 2 === 0 ? "rgba(15,23,42,0.4)" : "rgba(15,23,42,0.2)" }}>
                      <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.sku || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.category || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.unit}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: "#00d4ff" }}>₹{Number(p.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.gst_rate}%</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${Number(p.stock_qty) > 0 ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>{p.stock_qty}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-accent transition-all text-muted-foreground hover:text-foreground" aria-label="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all" aria-label="Delete">
                            {deletingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-muted-foreground">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
                <div className="flex items-center gap-1.5">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-2.5 py-1 rounded text-xs border text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all" style={{ borderColor: "rgba(255,255,255,0.1)" }}>←</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1).map((n, i, arr) => (
                    <span key={n}>
                      {i > 0 && arr[i - 1] !== n - 1 && <span className="text-xs text-muted-foreground px-1">…</span>}
                      <button onClick={() => setPage(n)} className="min-w-[28px] py-1 rounded text-xs border transition-all" style={{ borderColor: "rgba(255,255,255,0.1)", background: page === n ? accent : "transparent", color: page === n ? "#060d1f" : "#94a3b8" }}>{n}</button>
                    </span>
                  ))}
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-2.5 py-1 rounded text-xs border text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all" style={{ borderColor: "rgba(255,255,255,0.1)" }}>→</button>
                </div>
              </div>
            )}
          </>
        ) : (
          // Grid view
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginated.map(p => (
              <div key={p.id} className="rounded-xl border p-4 flex flex-col gap-3 transition-all hover:scale-[1.01]" style={{ background: "rgba(15,23,42,0.5)", borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white text-sm leading-snug">{p.name}</p>
                    {p.sku && <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{p.sku}</p>}
                  </div>
                  {p.category && <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-medium" style={{ background: "rgba(0,212,255,0.12)", color: accent }}>{p.category}</span>}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><p className="text-muted-foreground">Price</p><p className="font-bold text-white">₹{Number(p.price).toLocaleString("en-IN")}</p></div>
                  <div><p className="text-muted-foreground">GST</p><p className="font-bold text-white">{p.gst_rate}%</p></div>
                  <div><p className="text-muted-foreground">Stock</p><span className={`font-bold ${Number(p.stock_qty) > 0 ? "text-green-400" : "text-red-400"}`}>{p.stock_qty} {p.unit}</span></div>
                  {p.cost_price > 0 && <div><p className="text-muted-foreground">Margin</p><p className="font-bold" style={{ color: "#34d399" }}>{Math.round(((p.price - p.cost_price) / p.price) * 100)}%</p></div>}
                </div>
                <div className="flex gap-2 pt-1 border-t border-border">
                  <button onClick={() => openEdit(p)} className="flex-1 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all flex items-center justify-center gap-1"><Pencil className="w-3 h-3" /> Edit</button>
                  <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} className="flex-1 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center gap-1">
                    {deletingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Trash2 className="w-3 h-3" /> Delete</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Stats bar at bottom */}
        {products.length > 0 && importMode === "none" && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Products", value: products.length, color: accent },
              { label: "Total Stock Value", value: `₹${products.reduce((s, p) => s + p.price * p.stock_qty, 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, color: "#a78bfa" },
              { label: "Low Stock (<10)", value: products.filter(p => p.stock_qty > 0 && p.stock_qty < 10).length, color: amber },
              { label: "Out of Stock", value: products.filter(p => p.stock_qty === 0).length, color: red },
            ].map(s => (
              <div key={s.label} className="rounded-xl border p-4" style={{ background: "rgba(15,23,42,0.5)", borderColor: "rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{s.label}</p>
                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Single Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-lg rounded-2xl border p-6 backdrop-blur-xl max-h-[90vh] overflow-y-auto" style={{ background: "rgba(6,13,31,0.97)", borderColor: "rgba(22,163,74,0.35)", boxShadow: "0 0 40px rgba(22,163,74,0.15)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-foreground">{editing ? "Edit Product" : "Add Product"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            {error && <div className="mb-4 px-3 py-2.5 rounded-lg text-xs flex items-center gap-2" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}><AlertCircle className="w-3.5 h-3.5" />{error}</div>}
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="block text-xs font-medium text-white mb-1">Product Name *</label><input className={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Basmati Rice 5kg" required /></div>
              <div><label className="block text-xs font-medium text-white mb-1">SKU</label><input className={inp} value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="RICE-5KG" /></div>
              <div><label className="block text-xs font-medium text-white mb-1">Category</label><input className={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Groceries" /></div>
              <div><label className="block text-xs font-medium text-white mb-1">Sale Price (₹) *</label><input type="number" min="0" step="0.01" className={inp} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" required /></div>
              <div><label className="block text-xs font-medium text-white mb-1">Cost Price (₹)</label><input type="number" min="0" step="0.01" className={inp} value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))} placeholder="0.00" /></div>
              <div><label className="block text-xs font-medium text-white mb-1">GST Rate</label><select className={inp} value={form.gst_rate} onChange={e => setForm(f => ({ ...f, gst_rate: e.target.value }))}>{GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}</select></div>
              <div><label className="block text-xs font-medium text-white mb-1">Unit</label><select className={inp} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>{UNITS.map(u => <option key={u}>{u}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-white mb-1">Stock Qty</label><input type="number" min="0" className={inp} value={form.stock_qty} onChange={e => setForm(f => ({ ...f, stock_qty: e.target.value }))} /></div>
              <div className="col-span-2"><label className="block text-xs font-medium text-white mb-1">Description</label><input className={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" /></div>
              <div className="col-span-2 flex gap-3 mt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-accent">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2" style={{ background: saving ? "rgba(0,212,255,0.4)" : green, color: "#060d1f" }}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? "Saving…" : editing ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
