"use client"

import { useState } from "react"
import {
    Layers,
    Users,
    CreditCard,
    ShoppingCart,
    DollarSign,
    BarChart3,
    ArrowRight,
    Sparkles,
    Target,
    PieChart,
    Info,
    Github,
    Brain,
} from "lucide-react"

const cardStyle = { background: "rgba(15,23,42,0.5)", borderColor: "rgba(255,255,255,0.07)" }
const accentColor = "#a78bfa"

const featureFields = [
    { name: "balance", label: "Balance", step: 0.001, format: "%.6f", placeholder: "e.g. 40.900749", type: "number" },
    { name: "balance_frequency", label: "Balance Frequency", step: 0.001, format: "%.6f", placeholder: "e.g. 0.818182", type: "number" },
    { name: "purchases", label: "Purchases", step: 0.01, format: "%.2f", placeholder: "e.g. 95.40", type: "number" },
    { name: "oneoff_purchases", label: "OneOff Purchases", step: 0.01, format: "%.2f", placeholder: "e.g. 0.00", type: "number" },
    { name: "installments_purchases", label: "Installments Purchases", step: 0.01, format: "%.2f", placeholder: "e.g. 95.40", type: "number" },
    { name: "cash_advance", label: "Cash Advance", step: 0.01, format: "%.6f", placeholder: "e.g. 0.000000", type: "number" },
    { name: "purchases_frequency", label: "Purchases Frequency", step: 0.01, format: "%.6f", placeholder: "e.g. 0.166667", type: "number" },
    { name: "oneoff_purchases_frequency", label: "OneOff Purchases Frequency", step: 0.1, format: "%.6f", placeholder: "e.g. 0.000000", type: "number" },
    { name: "purchases_installment_frequency", label: "Purchases Installment Frequency", step: 0.1, format: "%.6f", placeholder: "e.g. 0.083333", type: "number" },
    { name: "cash_advance_frequency", label: "Cash Advance Frequency", step: 0.1, format: "%.6f", placeholder: "e.g. 0.000000", type: "number" },
    { name: "cash_advance_trx", label: "Cash Advance TRX", step: 1, placeholder: "e.g. 0", type: "number" },
    { name: "purchases_trx", label: "Purchases TRX", step: 1, placeholder: "e.g. 2", type: "number" },
    { name: "credit_limit", label: "Credit Limit", step: 0.1, placeholder: "e.g. 1000.0", type: "number" },
    { name: "payments", label: "Payments", step: 0.01, format: "%.6f", placeholder: "e.g. 201.802084", type: "number" },
    { name: "minimum_payments", label: "Minimum Payments", step: 0.01, placeholder: "e.g. 139.509787", type: "number" },
    { name: "prc_full_payment", label: "PRC Full Payment", step: 0.01, placeholder: "e.g. 0.000000", type: "number" },
    { name: "tenure", label: "Tenure", step: 1, placeholder: "e.g. 12", type: "number" },
]

const clusterInfo: Record<number, { name: string; description: string; color: string; icon: React.ElementType }> = {
    0: { name: "Low Activity", description: "Customers with low balances and minimal transactions. Typically new or inactive users.", color: "#64748b", icon: Users },
    1: { name: "Cash Advance Heavy", description: "Customers relying on cash advances with moderate purchases. Higher financial risk segment.", color: "#f59e0b", icon: CreditCard },
    2: { name: "Balanced Buyers", description: "Active customers with balanced purchase patterns, moderate credit usage and regular payments.", color: "#34d399", icon: ShoppingCart },
    3: { name: "High Spenders", description: "Premium customers with high purchase volumes and excellent payment records.", color: "#00d4ff", icon: DollarSign },
}

const inp = "w-full px-3 py-2 rounded-lg text-sm outline-none transition-all bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50"

export default function MarketSegmentationClient() {
    const [formData, setFormData] = useState<Record<string, string>>({})
    const [predictedCluster, setPredictedCluster] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    function handleChange(name: string, value: string) {
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    function handlePredict(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)

        // Simulate cluster prediction locally (heuristic based on the K-Means model logic)
        setTimeout(() => {
            const balance = parseFloat(formData.balance || "0")
            const purchases = parseFloat(formData.purchases || "0")
            const cashAdvance = parseFloat(formData.cash_advance || "0")
            const creditLimit = parseFloat(formData.credit_limit || "0")

            let cluster = 0
            if (cashAdvance > 500) cluster = 1
            else if (purchases > 500 && creditLimit > 3000) cluster = 3
            else if (purchases > 100 || balance > 500) cluster = 2
            else cluster = 0

            setPredictedCluster(cluster)
            setIsLoading(false)
        }, 1200)
    }

    const info = predictedCluster !== null ? clusterInfo[predictedCluster] : null

    return (
        <div className="flex flex-col gap-6">
            {/* Project Info Banner */}
            <div
                className="rounded-xl px-6 py-5 border"
                style={{ background: `${accentColor}08`, borderColor: `${accentColor}20` }}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}35` }}
                        >
                            <Layers className="w-6 h-6" style={{ color: accentColor }} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Market Segmentation</h2>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Customer clustering using K-Means algorithm on credit card data
                            </p>
                        </div>
                    </div>
                    <a
                        href="https://github.com/pik1989/MarketSegmentation"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-all hover:opacity-80"
                        style={{ borderColor: `${accentColor}30`, color: accentColor, background: `${accentColor}10` }}
                    >
                        <Github className="w-3.5 h-3.5" />
                        View on GitHub
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Prediction Form */}
                <div className="lg:col-span-2 rounded-xl border p-6" style={cardStyle}>
                    <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
                        <Brain className="w-5 h-5" style={{ color: accentColor }} />
                        Predict Customer Segment
                    </h3>
                    <p className="text-xs text-muted-foreground mb-5">
                        Enter customer credit card features to predict which cluster they belong to
                    </p>
                    <form onSubmit={handlePredict} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {featureFields.map((field) => (
                            <div key={field.name}>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">{field.label}</label>
                                <input
                                    className={inp}
                                    type="number"
                                    step={field.step}
                                    placeholder={field.placeholder}
                                    value={formData[field.name] || ""}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                />
                            </div>
                        ))}
                        <div className="sm:col-span-2 mt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                                style={{
                                    background: isLoading ? `${accentColor}50` : accentColor,
                                    color: "#060d1f",
                                }}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        Predicting...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Predict Segment
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Side panel */}
                <div className="flex flex-col gap-6">
                    {/* Result Card */}
                    <div className="rounded-xl border p-6" style={cardStyle}>
                        <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Target className="w-5 h-5" style={{ color: accentColor }} />
                            Prediction Result
                        </h3>
                        {info ? (
                            <div
                                className="rounded-xl border p-5 flex flex-col gap-3"
                                style={{ background: `${info.color}08`, borderColor: `${info.color}25` }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ background: `${info.color}20`, border: `1px solid ${info.color}35` }}
                                    >
                                        <info.icon className="w-5 h-5" style={{ color: info.color }} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground">Cluster {predictedCluster}</p>
                                        <p className="text-xs font-medium" style={{ color: info.color }}>{info.name}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">{info.description}</p>
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                Fill in the form and click &quot;Predict Segment&quot; to see results
                            </div>
                        )}
                    </div>

                    {/* Cluster Overview */}
                    <div className="rounded-xl border p-6" style={cardStyle}>
                        <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                            <PieChart className="w-5 h-5" style={{ color: accentColor }} />
                            Cluster Overview
                        </h3>
                        <div className="flex flex-col gap-2.5">
                            {Object.entries(clusterInfo).map(([key, cluster]) => (
                                <div
                                    key={key}
                                    className="flex items-center gap-3 p-2.5 rounded-lg transition-all hover:bg-accent/30"
                                    style={{
                                        background: predictedCluster === Number(key) ? `${cluster.color}10` : "transparent",
                                        borderLeft: predictedCluster === Number(key) ? `3px solid ${cluster.color}` : "3px solid transparent",
                                    }}
                                >
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ background: cluster.color }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-foreground">{cluster.name}</p>
                                        <p className="text-[10px] text-muted-foreground truncate">{cluster.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tech Stack */}
                    <div className="rounded-xl border p-6" style={cardStyle}>
                        <h3 className="text-sm font-semibold text-foreground mb-3">Tech Stack</h3>
                        <div className="flex flex-wrap gap-2">
                            {["Python", "Scikit-learn", "K-Means", "Pandas", "Seaborn", "Matplotlib", "Streamlit"].map((tech) => (
                                <span
                                    key={tech}
                                    className="px-2.5 py-1 rounded-full text-[10px] font-medium border"
                                    style={{ borderColor: `${accentColor}25`, color: accentColor, background: `${accentColor}08` }}
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
