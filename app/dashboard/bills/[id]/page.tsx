"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import DashboardHeader from "@/components/dashboard/header"
import { Printer, ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react"
import Link from "next/link"

interface BillItem { id: string; name: string; unit: string; qty: number; price: number; gst_rate: number; gst_amount: number; amount: number }
interface Bill { id: string; customer_name: string; customer_email: string | null; customer_phone: string | null; customer_address: string | null; customer_gst: string | null; subtotal: number; gst_amount: number; total: number; status: string; bill_date: string; notes: string | null }
interface Profile { business_name: string; gst_number: string | null; display_id: string; email: string; address: string | null; city: string | null; state: string | null; phone: string | null }

export default function BillDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [bill, setBill] = useState<Bill | null>(null)
  const [items, setItems] = useState<BillItem[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/bills/${id}`)
    if (!res.ok) { router.push("/dashboard/bills"); return }
    const data = await res.json()
    setBill(data.bill); setItems(data.items ?? []); setProfile(data.profile)
    setLoading(false)
  }, [id, router])

  useEffect(() => { load() }, [load])

  async function markPaid() {
    setUpdating(true)
    await fetch(`/api/bills/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "paid" }) })
    setUpdating(false); load()
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  if (!bill) return null

  const statusColor = bill.status === "paid" ? "#22c55e" : bill.status === "cancelled" ? "#f87171" : "#f59e0b"

  return (
    <>
      <DashboardHeader title={`Bill — ${bill.customer_name}`} subtitle={`${new Date(bill.bill_date).toLocaleDateString("en-IN", { dateStyle: "long" })}`} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Link href="/dashboard/bills" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-4 h-4" />All Bills</Link>
          <div className="flex-1" />
          {bill.status === "draft" && (
            <button onClick={markPaid} disabled={updating} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-all">
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}Mark as Paid
            </button>
          )}
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "rgba(0,212,255,0.9)", color: "#060d1f" }}>
            <Printer className="w-4 h-4" />Print / Save PDF
          </button>
        </div>

        {/* Printable invoice */}
        <div id="invoice" className="max-w-3xl mx-auto rounded-2xl border border-border p-8 print:shadow-none print:border-0" style={{ background: "rgba(10,18,38,0.95)" }}>
          {/* Header */}
          <div className="flex items-start justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{profile?.business_name ?? "Your Business"}</h1>
              {profile?.gst_number && <p className="text-sm text-muted-foreground mt-1">GSTIN: <span className="font-mono text-foreground">{profile.gst_number}</span></p>}
              {profile?.address && <p className="text-xs text-muted-foreground mt-0.5">{profile.address}{profile.city ? `, ${profile.city}` : ""}{profile.state ? `, ${profile.state}` : ""}</p>}
              {profile?.phone && <p className="text-xs text-muted-foreground mt-0.5">{profile.phone}</p>}
              {profile?.email && <p className="text-xs text-muted-foreground mt-0.5">{profile.email}</p>}
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">TAX INVOICE</div>
              <div className="font-mono text-sm text-foreground">{profile?.display_id ?? ""}</div>
              <div className="text-xs text-muted-foreground mt-1">{new Date(bill.bill_date).toLocaleDateString("en-IN", { dateStyle: "long" })}</div>
              <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}>
                {bill.status === "paid" ? <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />PAID</span> : bill.status === "cancelled" ? <span className="flex items-center gap-1"><XCircle className="w-3 h-3" />CANCELLED</span> : "DRAFT"}
              </span>
            </div>
          </div>

          {/* Bill to */}
          <div className="grid grid-cols-2 gap-6 mb-8 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Bill To</p>
              <p className="font-semibold text-foreground">{bill.customer_name}</p>
              {bill.customer_gst && <p className="text-sm text-muted-foreground">GSTIN: <span className="font-mono text-foreground">{bill.customer_gst}</span></p>}
              {bill.customer_address && <p className="text-sm text-muted-foreground mt-0.5">{bill.customer_address}</p>}
              {bill.customer_phone && <p className="text-sm text-muted-foreground mt-0.5">{bill.customer_phone}</p>}
              {bill.customer_email && <p className="text-sm text-muted-foreground mt-0.5">{bill.customer_email}</p>}
            </div>
          </div>

          {/* Items table */}
          <table className="w-full text-sm mb-6">
            <thead><tr className="border-b border-border">
              {["#","Item","Unit","Qty","Rate (₹)","GST %","GST (₹)","Amount (₹)"].map(h => <th key={h} className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground uppercase">{h}</th>)}
            </tr></thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="py-3 px-2 text-muted-foreground">{i + 1}</td>
                  <td className="py-3 px-2 font-medium text-foreground">{item.name}</td>
                  <td className="py-3 px-2 text-muted-foreground">{item.unit}</td>
                  <td className="py-3 px-2 text-foreground">{item.qty}</td>
                  <td className="py-3 px-2 text-foreground">₹{Number(item.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 px-2 text-muted-foreground">{item.gst_rate}%</td>
                  <td className="py-3 px-2 text-muted-foreground">₹{Number(item.gst_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 px-2 font-semibold text-foreground">₹{Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">₹{Number(bill.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total GST</span><span className="text-foreground">₹{Number(bill.gst_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border" style={{ color: "#00d4ff" }}><span>Total</span><span>₹{Number(bill.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
            </div>
          </div>

          {bill.notes && <div className="mt-6 pt-4 border-t border-border"><p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Notes</p><p className="text-sm text-muted-foreground">{bill.notes}</p></div>}

          <div className="mt-8 pt-4 border-t border-border text-center"><p className="text-xs text-muted-foreground">Thank you for your business. This is a computer-generated invoice.</p></div>
        </div>

        <style>{`@media print { body { background: white !important; color: black !important; } #invoice { background: white !important; color: black !important; border: none !important; } }`}</style>
      </main>
    </>
  )
}
