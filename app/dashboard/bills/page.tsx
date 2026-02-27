"use client"

import { useState, useEffect, useCallback } from "react"
import DashboardHeader from "@/components/dashboard/header"
import { Plus, Eye, Trash2, Loader2, FileText, CheckCircle2, XCircle, Clock } from "lucide-react"
import Link from "next/link"

interface Bill {
  id: string; customer_name: string; customer_email: string | null
  total: number; subtotal: number; gst_amount: number
  status: "draft" | "paid" | "cancelled"; bill_date: string
}

const STATUS = {
  draft:     { label: "Draft",     Icon: Clock,        cls: "bg-yellow-500/15 text-yellow-400" },
  paid:      { label: "Paid",      Icon: CheckCircle2, cls: "bg-green-500/15 text-green-400"  },
  cancelled: { label: "Cancelled", Icon: XCircle,      cls: "bg-red-500/15 text-red-400"      },
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch("/api/bills"); const d = await r.json()
    setBills(d.bills ?? []); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  async function markPaid(id: string) {
    setUpdatingId(id)
    await fetch(`/api/bills/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "paid" }) })
    setUpdatingId(null); load()
  }
  async function deleteBill(id: string) {
    if (!confirm("Delete this bill permanently?")) return
    setDeletingId(id)
    await fetch(`/api/bills/${id}`, { method: "DELETE" })
    setDeletingId(null); load()
  }

  const revenue = bills.filter(b => b.status === "paid").reduce((s, b) => s + Number(b.total), 0)

  return (
    <>
      <DashboardHeader title="Bill Generation" subtitle="Create and manage GST invoices" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">{bills.length} bill{bills.length !== 1 ? "s" : ""}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Revenue (paid): <span className="font-semibold" style={{ color: "#22c55e" }}>₹{revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></p>
          </div>
          <Link href="/dashboard/bills/new" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#47ff86", color: "#060d1f" }}>
            <Plus className="w-4 h-4" /> New Bill
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : bills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)" }}><FileText className="w-8 h-8 text-primary" /></div>
            <p className="font-semibold text-foreground">No bills yet</p>
            <p className="text-sm text-muted-foreground">Create your first GST invoice</p>
            <Link href="/dashboard/bills/new" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#47ff86", color: "#060d1f" }}><Plus className="w-4 h-4" />New Bill</Link>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden border border-border">
            <table className="w-full text-sm">
              <thead><tr style={{ background: "rgba(15,23,42,0.8)" }}>
                {["Customer","Date","Subtotal","GST","Total","Status","Actions"].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>)}
              </tr></thead>
              <tbody>
                {bills.map((b, i) => {
                  const sc = STATUS[b.status]; const { Icon } = sc
                  return (
                    <tr key={b.id} className="border-t border-border hover:bg-accent/30 transition-colors" style={{ background: i % 2 === 0 ? "rgba(15,23,42,0.4)" : "rgba(15,23,42,0.2)" }}>
                      <td className="px-4 py-3"><p className="font-medium text-foreground">{b.customer_name}</p>{b.customer_email && <p className="text-xs text-muted-foreground">{b.customer_email}</p>}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(b.bill_date).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-3 text-foreground">₹{Number(b.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-muted-foreground">₹{Number(b.gst_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: "#00d4ff" }}>₹{Number(b.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.cls}`}><Icon className="w-3 h-3" />{sc.label}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/dashboard/bills/${b.id}`} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all" aria-label="View"><Eye className="w-3.5 h-3.5" /></Link>
                          {b.status === "draft" && <button onClick={() => markPaid(b.id)} disabled={updatingId === b.id} className="p-1.5 rounded-lg hover:bg-green-500/10 text-muted-foreground hover:text-green-400 transition-all" title="Mark Paid">{updatingId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}</button>}
                          <button onClick={() => deleteBill(b.id)} disabled={deletingId === b.id} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all" aria-label="Delete">{deletingId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  )
}
