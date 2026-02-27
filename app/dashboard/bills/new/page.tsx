"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ShoppingCart,
  User,
  AlignLeft,
  FileText,
} from "lucide-react"

interface Product {
  id: string
  name: string
  price: number
  gst_rate: number
  unit: string
}
interface LineItem {
  product_id: string
  name: string
  unit: string
  qty: number
  price: number
  gst_rate: number
}

const GST = [0, 5, 12, 18, 28]

const inp =
  "w-full px-3 py-2 rounded-lg text-sm outline-none transition-all placeholder:text-muted-foreground focus:ring-1 focus:ring-emerald-500/40"

const inputStyle = {
  background: "rgba(10,22,14,0.7)",
  border: "1px solid rgba(71,255,134,0.13)",
  color: "#e8f5ec",
}

const selectStyle = {
  background: "rgba(10,22,14,0.85)",
  border: "1px solid rgba(71,255,134,0.15)",
  color: "#e8f5ec",
}

const sectionStyle = {
  background: "rgba(8,18,12,0.7)",
  border: "1px solid rgba(71,255,134,0.10)",
  borderRadius: 14,
}

export default function NewBillPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    gst: "",
  })
  const [items, setItems] = useState<LineItem[]>([
    { product_id: "", name: "", unit: "pcs", qty: 1, price: 0, gst_rate: 18 },
  ])
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
  }, [])

  function addItem() {
    setItems((p) => [
      ...p,
      { product_id: "", name: "", unit: "pcs", qty: 1, price: 0, gst_rate: 18 },
    ])
  }
  function removeItem(i: number) {
    setItems((p) => p.filter((_, idx) => idx !== i))
  }
  function setItem<K extends keyof LineItem>(i: number, k: K, v: LineItem[K]) {
    setItems((p) => p.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)))
  }
  function pickProduct(i: number, pid: string) {
    const p = products.find((pr) => pr.id === pid)
    if (p)
      setItems((prev) =>
        prev.map((it, idx) =>
          idx === i
            ? { ...it, product_id: p.id, name: p.name, price: p.price, gst_rate: p.gst_rate, unit: p.unit }
            : it
        )
      )
    else setItem(i, "product_id", pid)
  }

  const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0)
  const cgst = subtotal * 0.09
  const sgst = subtotal * 0.09
  const totalGst = items.reduce((s, it) => s + (it.qty * it.price * it.gst_rate) / 100, 0)
  const total = subtotal + totalGst

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customer.name.trim()) {
      setError("Customer name is required.")
      return
    }
    if (items.some((it) => !it.name.trim())) {
      setError("All items must have a name.")
      return
    }
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customer.name,
          customer_email: customer.email || null,
          customer_phone: customer.phone || null,
          customer_address: customer.address || null,
          customer_gst: customer.gst || null,
          notes: notes || null,
          bill_date: billDate,
          items,
        }),
      })
      // Safely parse — server may return an empty body on unhandled crashes
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      if (!res.ok) {
        setError(data.error || `Server error (${res.status})`)
        setSaving(false)
        return
      }
      router.push(`/dashboard/bills/${data.bill.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error — please try again.")
      setSaving(false)
    }
  }

  const labelCls = "block text-xs font-medium mb-1.5"
  const labelStyle = { color: "rgba(200,230,210,0.65)" }

  return (
    <>
      {/* Top header bar — "Create New Bill" */}
      <header
        className="h-14 flex items-center gap-3 px-6 flex-shrink-0"
        style={{
          borderBottom: "1px solid rgba(71,255,134,0.08)",
          background: "rgba(5,12,8,0.90)",
          backdropFilter: "blur(20px)",
        }}
      >
        <Link
          href="/dashboard/bills"
          className="flex items-center justify-center w-7 h-7 rounded-md transition-colors hover:bg-white/5"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1
          className="text-base font-bold tracking-tight"
          style={{ color: "#fff" }}
        >
          Create New Bill
        </h1>


      </header>

      {/* Page body */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Page title */}
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: "#fff" }}>
            Invoice Details
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "rgba(180,215,195,0.55)" }}>
            Generate a GST compliant invoice for your customer
          </p>
        </div>

        {error && (
          <div
            className="mb-5 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
            style={{
              background: "rgba(239,68,68,0.10)",
              border: "1px solid rgba(239,68,68,0.28)",
              color: "#f87171",
            }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* ─── CUSTOMER DETAILS ─── */}
          <section style={sectionStyle} className="p-5">
            <div className="flex items-center gap-2 mb-5">
              <User
                className="w-4 h-4"
                style={{ color: "#47ff86" }}
              />
              <span
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: "#47ff86" }}
              >
                Customer Details
              </span>
            </div>

            {/* Row 1: Name | Email | Phone */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className={labelCls} style={labelStyle}>
                  Customer Name *
                </label>
                <input
                  className={inp}
                  style={inputStyle}
                  value={customer.name}
                  onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>
                  Email Address
                </label>
                <input
                  type="email"
                  className={inp}
                  style={inputStyle}
                  value={customer.email}
                  onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
                  placeholder="customer@email.com"
                />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>
                  Phone Number
                </label>
                <input
                  className={inp}
                  style={inputStyle}
                  value={customer.phone}
                  onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
                  placeholder="+91 00000 00000"
                />
              </div>
            </div>

            {/* Row 2: GST | Bill Date | Billing Address */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls} style={labelStyle}>
                  Customer GST No.
                </label>
                <input
                  className={`${inp} uppercase font-mono`}
                  style={inputStyle}
                  value={customer.gst}
                  onChange={(e) => setCustomer((c) => ({ ...c, gst: e.target.value }))}
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>
                  Bill Date
                </label>
                <input
                  type="date"
                  className={inp}
                  style={inputStyle}
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>
                  Billing Address
                </label>
                <input
                  className={inp}
                  style={inputStyle}
                  value={customer.address}
                  onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))}
                  placeholder="Street, City, State, Zip"
                />
              </div>
            </div>
          </section>

          {/* ─── LINE ITEMS ─── */}
          <section style={sectionStyle} className="overflow-hidden">
            {/* Section header */}
            <div
              className="flex items-center gap-2 px-5 py-4"
              style={{ borderBottom: "1px solid rgba(71,255,134,0.08)" }}
            >
              <ShoppingCart className="w-4 h-4" style={{ color: "#47ff86" }} />
              <span
                className="text-xs font-bold tracking-widest uppercase flex-1"
                style={{ color: "#47ff86" }}
              >
                Line Items
              </span>
            </div>

            {/* Table head */}
            <div
              className="grid px-5 py-3 text-xs font-bold uppercase tracking-wider"
              style={{
                gridTemplateColumns: "1fr 100px 120px 100px 120px 40px",
                color: "rgba(180,215,195,0.50)",
                borderBottom: "1px solid rgba(71,255,134,0.07)",
              }}
            >
              <div>Product / Item Name</div>
              <div className="text-center">Qty</div>
              <div className="text-right">Price (₹)</div>
              <div className="text-center">GST %</div>
              <div className="text-right">Amount (₹)</div>
              <div />
            </div>

            {/* Items */}
            <div className="flex flex-col">
              {items.map((item, i) => {
                const lineTotal = item.qty * item.price
                const lineGst = (lineTotal * item.gst_rate) / 100
                const lineAmount = lineTotal + lineGst
                return (
                  <div
                    key={i}
                    className="grid items-center gap-3 px-5 py-3"
                    style={{
                      gridTemplateColumns: "1fr 100px 120px 100px 120px 40px",
                      borderBottom: i < items.length - 1 ? "1px solid rgba(71,255,134,0.05)" : "none",
                    }}
                  >
                    {/* Product select */}
                    <div>
                      <select
                        className={inp}
                        style={selectStyle}
                        value={item.product_id}
                        onChange={(e) => pickProduct(i, e.target.value)}
                      >
                        <option value="">Select Product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      {!item.product_id && (
                        <input
                          className={`${inp} mt-1`}
                          style={inputStyle}
                          value={item.name}
                          onChange={(e) => setItem(i, "name", e.target.value)}
                          placeholder="Custom item name"
                          required
                        />
                      )}
                    </div>

                    {/* Qty */}
                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      className={inp}
                      style={{ ...inputStyle, textAlign: "center" }}
                      value={item.qty}
                      onChange={(e) => setItem(i, "qty", Number(e.target.value))}
                    />

                    {/* Price */}
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inp}
                      style={{ ...inputStyle, textAlign: "right" }}
                      value={item.price}
                      onChange={(e) => setItem(i, "price", Number(e.target.value))}
                    />

                    {/* GST */}
                    <select
                      className={inp}
                      style={{ ...selectStyle, textAlign: "center" }}
                      value={item.gst_rate}
                      onChange={(e) => setItem(i, "gst_rate", Number(e.target.value))}
                    >
                      {GST.map((r) => (
                        <option key={r} value={r}>
                          {r}%
                        </option>
                      ))}
                    </select>

                    {/* Amount */}
                    <div
                      className="text-right text-sm font-medium"
                      style={{ color: "#e8f5ec" }}
                    >
                      {lineAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>

                    {/* Remove */}
                    <div className="flex justify-center">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                          style={{ color: "rgba(255,255,255,0.30)" }}
                        >
                          <Trash2 className="w-3.5 h-3.5 hover:text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Add Item */}
            <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(71,255,134,0.07)" }}>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 text-sm font-semibold transition-colors"
                style={{ color: "#47ff86" }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(71,255,134,0.15)", border: "1px solid rgba(71,255,134,0.30)" }}
                >
                  <Plus className="w-3 h-3" />
                </span>
                Add Item
              </button>
            </div>
          </section>

          {/* ─── NOTES & SUMMARY (side-by-side) ─── */}
          <div className="grid grid-cols-2 gap-5">
            {/* Notes & Terms */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlignLeft className="w-4 h-4" style={{ color: "rgba(180,215,195,0.55)" }} />
                <span className="text-sm font-semibold" style={{ color: "rgba(200,230,210,0.75)" }}>
                  Notes &amp; Terms
                </span>
              </div>
              <textarea
                className={`${inp} resize-none`}
                style={{ ...inputStyle, minHeight: 150 }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add payment instructions, terms or internal notes..."
              />
            </div>

            {/* Summary card */}
            <div
              className="rounded-xl p-5 flex flex-col gap-3"
              style={{
                background: "rgba(8,18,12,0.70)",
                border: "1px solid rgba(71,255,134,0.10)",
              }}
            >
              <div className="flex justify-between text-sm" style={{ color: "rgba(180,215,195,0.70)" }}>
                <span>Subtotal</span>
                <span style={{ color: "#e8f5ec" }}>
                  ₹ {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm" style={{ color: "rgba(180,215,195,0.70)" }}>
                <span>CGST (9%)</span>
                <span style={{ color: "#e8f5ec" }}>
                  ₹ {cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm" style={{ color: "rgba(180,215,195,0.70)" }}>
                <span>SGST (9%)</span>
                <span style={{ color: "#e8f5ec" }}>
                  ₹ {sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div
                className="pt-3 mt-1 flex justify-between items-center"
                style={{ borderTop: "1px solid rgba(71,255,134,0.10)" }}
              >
                <span className="text-base font-bold" style={{ color: "#e8f5ec" }}>
                  Total Amount
                </span>
                <span
                  className="text-xl font-extrabold"
                  style={{ color: "#47ff86", textShadow: "0 0 16px rgba(71,255,134,0.40)" }}
                >
                  ₹ {total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* ─── ACTION BUTTONS ─── */}
          <div
            className="flex justify-end gap-3 pt-4"
            style={{ borderTop: "1px solid rgba(71,255,134,0.07)" }}
          >
            <Link
              href="/dashboard/bills"
              className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all text-center"
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "rgba(220,240,228,0.75)",
              }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
              style={{
                background: saving ? "rgba(71,255,134,0.55)" : "#47ff86",
                color: "#050f08",
                boxShadow: saving ? "none" : "0 0 18px rgba(71,255,134,0.35)",
              }}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {saving ? "Creating…" : "Create Bill"}
            </button>
          </div>
        </form>
      </main>
    </>
  )
}
