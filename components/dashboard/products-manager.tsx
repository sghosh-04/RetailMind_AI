"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Loader2, X, Package } from "lucide-react"

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
  description: string
}

const emptyForm = {
  name: "",
  sku: "",
  category: "",
  description: "",
  unit: "pcs",
  price: "",
  cost_price: "",
  gst_rate: "18",
  stock_qty: "0",
}

const GST_RATES = ["0", "5", "12", "18", "28"]

export default function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function load() {
    setLoading(true)
    const res = await fetch("/api/products")
    const data = await res.json()
    setProducts(data.products || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  function openEdit(p: Product) {
    setEditId(p.id)
    setForm({
      name: p.name,
      sku: p.sku || "",
      category: p.category || "",
      description: p.description || "",
      unit: p.unit || "pcs",
      price: String(p.price),
      cost_price: String(p.cost_price || ""),
      gst_rate: String(p.gst_rate),
      stock_qty: String(p.stock_qty),
    })
    setShowForm(true)
    setError("")
  }

  function openAdd() {
    setEditId(null)
    setForm(emptyForm)
    setShowForm(true)
    setError("")
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.price) { setError("Name and price are required"); return }
    setSaving(true)
    setError("")
    const body = {
      ...form,
      price: parseFloat(form.price),
      cost_price: parseFloat(form.cost_price || "0"),
      gst_rate: parseFloat(form.gst_rate),
      stock_qty: parseInt(form.stock_qty || "0"),
    }
    const res = await fetch(editId ? `/api/products/${editId}` : "/api/products", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || "Failed to save"); setSaving(false); return }
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return
    await fetch(`/api/products/${id}`, { method: "DELETE" })
    load()
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 transition-all"
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1"

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{products.length} product{products.length !== 1 ? "s" : ""}</p>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "#16a34a", color: "#060d1f" }}
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <div
          className="rounded-xl border p-12 flex flex-col items-center gap-3 text-center"
          style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(15,23,42,0.4)" }}
        >
          <Package className="w-10 h-10 text-muted-foreground" />
          <p className="font-medium text-foreground">No products yet</p>
          <p className="text-sm text-muted-foreground">Add your first product to get started.</p>
          <button
            onClick={openAdd}
            className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "#16a34a", color: "#060d1f" }}
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(15,23,42,0.8)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Name", "SKU", "Category", "Price", "GST", "Stock", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-t transition-colors hover:bg-accent/20"
                  style={{ borderColor: "rgba(255,255,255,0.05)" }}
                >
                  <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.sku || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category || "—"}</td>
                  <td className="px-4 py-3 text-foreground">
                    ₹{Number(p.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.gst_rate}%</td>
                  <td className="px-4 py-3 text-foreground">{p.stock_qty} {p.unit}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                        aria-label="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div
            className="w-full max-w-lg rounded-2xl border p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: "rgba(6,13,31,0.97)", borderColor: "rgba(0,212,255,0.18)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-foreground">
                {editId ? "Edit Product" : "Add Product"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={labelClass}>Name *</label>
                  <input value={form.name} onChange={set("name")} required placeholder="Product Name" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>SKU</label>
                  <input value={form.sku} onChange={set("sku")} placeholder="SKU-001" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Category</label>
                  <input value={form.category} onChange={set("category")} placeholder="Electronics" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Selling Price (₹) *</label>
                  <input type="number" step="0.01" min="0" value={form.price} onChange={set("price")} required placeholder="0.00" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Cost Price (₹)</label>
                  <input type="number" step="0.01" min="0" value={form.cost_price} onChange={set("cost_price")} placeholder="0.00" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>GST Rate</label>
                  <select value={form.gst_rate} onChange={set("gst_rate")} className={inputClass}>
                    {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Unit</label>
                  <input value={form.unit} onChange={set("unit")} placeholder="pcs" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Stock Qty</label>
                  <input type="number" min="0" value={form.stock_qty} onChange={set("stock_qty")} placeholder="0" className={inputClass} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium border text-muted-foreground hover:text-foreground transition-all"
                  style={{ borderColor: "rgba(255,255,255,0.1)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ background: "#16a34a", color: "#060d1f" }}
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? "Saving..." : editId ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
