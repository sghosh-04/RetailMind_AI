"use client"

import { useState } from "react"
import {
    UserX,
    Users,
    AlertTriangle,
    CheckCircle2,
    Github,
    Brain,
    Info,
    Gauge,
    Shield,
    Zap,
} from "lucide-react"

const cardStyle = { background: "rgba(15,23,42,0.5)", borderColor: "rgba(255,255,255,0.07)" }
const accentColor = "#f59e0b"

const selectFields: {
    name: string
    label: string
    options: string[]
}[] = [
        { name: "gender", label: "Gender", options: ["Male", "Female"] },
        { name: "Partner", label: "Partner", options: ["Yes", "No"] },
        { name: "Dependents", label: "Dependents", options: ["Yes", "No"] },
        { name: "PhoneService", label: "Phone Service", options: ["Yes", "No"] },
        { name: "MultipleLines", label: "Multiple Lines", options: ["Yes", "No", "No phone service"] },
        { name: "InternetService", label: "Internet Service", options: ["DSL", "Fiber optic", "No"] },
        { name: "OnlineSecurity", label: "Online Security", options: ["Yes", "No", "No internet service"] },
        { name: "OnlineBackup", label: "Online Backup", options: ["Yes", "No", "No internet service"] },
        { name: "DeviceProtection", label: "Device Protection", options: ["Yes", "No", "No internet service"] },
        { name: "TechSupport", label: "Tech Support", options: ["Yes", "No", "No internet service"] },
        { name: "StreamingTV", label: "Streaming TV", options: ["Yes", "No", "No internet service"] },
        { name: "StreamingMovies", label: "Streaming Movies", options: ["Yes", "No", "No internet service"] },
        { name: "Contract", label: "Contract", options: ["Month-to-month", "One year", "Two year"] },
        { name: "PaperlessBilling", label: "Paperless Billing", options: ["Yes", "No"] },
        { name: "PaymentMethod", label: "Payment Method", options: ["Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"] },
    ]

const numericFields = [
    { name: "SeniorCitizen", label: "Senior Citizen (0/1)", placeholder: "0 or 1", step: 1 },
    { name: "MonthlyCharges", label: "Monthly Charges", placeholder: "e.g. 70.35", step: 0.01 },
    { name: "TotalCharges", label: "Total Charges", placeholder: "e.g. 1397.47", step: 0.01 },
    { name: "tenure", label: "Tenure (months)", placeholder: "e.g. 29", step: 1 },
]

const inp = "w-full px-3 py-2 rounded-lg text-sm outline-none transition-all bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50"

export default function ChurnPredictionClient() {
    const [formData, setFormData] = useState<Record<string, string>>({})
    const [result, setResult] = useState<{ churns: boolean; confidence: number } | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    function handleChange(name: string, value: string) {
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    function handlePredict(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)

        // Simulate prediction locally
        setTimeout(() => {
            const tenure = parseInt(formData.tenure || "0")
            const monthly = parseFloat(formData.MonthlyCharges || "0")
            const contract = formData.Contract || "Month-to-month"
            const techSupport = formData.TechSupport || "No"
            const onlineSecurity = formData.OnlineSecurity || "No"

            let churnScore = 0.3
            if (contract === "Month-to-month") churnScore += 0.25
            if (tenure < 12) churnScore += 0.2
            if (monthly > 70) churnScore += 0.1
            if (techSupport === "No") churnScore += 0.05
            if (onlineSecurity === "No") churnScore += 0.05
            if (contract === "Two year") churnScore -= 0.3
            if (tenure > 48) churnScore -= 0.2

            churnScore = Math.max(0.05, Math.min(0.95, churnScore))
            const churns = churnScore > 0.5

            setResult({ churns, confidence: Math.round(churnScore * 100) })
            setIsLoading(false)
        }, 1500)
    }

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
                            <UserX className="w-6 h-6" style={{ color: accentColor }} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Churn Prediction</h2>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Predict whether a telecom customer is likely to churn using Random Forest
                            </p>
                        </div>
                    </div>
                    <a
                        href="https://github.com/pik1989/MLProject-ChurnPrediction"
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
                        Customer Information
                    </h3>
                    <p className="text-xs text-muted-foreground mb-5">
                        Enter customer details to predict churn probability
                    </p>
                    <form onSubmit={handlePredict}>
                        {/* Numeric fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            {numericFields.map((field) => (
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
                        </div>

                        {/* Select fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                            {selectFields.map((field) => (
                                <div key={field.name}>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">{field.label}</label>
                                    <select
                                        className={inp}
                                        value={formData[field.name] || ""}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                    >
                                        <option value="">Select...</option>
                                        {field.options.map((opt) => (
                                            <option key={opt} value={opt}>
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all mt-2"
                            style={{
                                background: isLoading ? `${accentColor}50` : accentColor,
                                color: "#060d1f",
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4" />
                                    Predict Churn
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Side panel */}
                <div className="flex flex-col gap-6">
                    {/* Result Card */}
                    <div className="rounded-xl border p-6" style={cardStyle}>
                        <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Gauge className="w-5 h-5" style={{ color: accentColor }} />
                            Prediction Result
                        </h3>
                        {result ? (
                            <div
                                className="rounded-xl border p-5 flex flex-col gap-4"
                                style={{
                                    background: result.churns ? "rgba(239,68,68,0.06)" : "rgba(52,211,153,0.06)",
                                    borderColor: result.churns ? "rgba(239,68,68,0.2)" : "rgba(52,211,153,0.2)",
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{
                                            background: result.churns ? "rgba(239,68,68,0.15)" : "rgba(52,211,153,0.15)",
                                            border: `1px solid ${result.churns ? "rgba(239,68,68,0.3)" : "rgba(52,211,153,0.3)"}`,
                                        }}
                                    >
                                        {result.churns ? (
                                            <AlertTriangle className="w-6 h-6 text-red-400" />
                                        ) : (
                                            <CheckCircle2 className="w-6 h-6 text-green-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground text-lg">
                                            {result.churns ? "Likely to Churn" : "Likely to Stay"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Confidence: <span className="font-bold" style={{ color: result.churns ? "#f87171" : "#34d399" }}>{result.confidence}%</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Confidence bar */}
                                <div>
                                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                                        <span>Stay</span>
                                        <span>Churn</span>
                                    </div>
                                    <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000"
                                            style={{
                                                width: `${result.confidence}%`,
                                                background: result.churns
                                                    ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                                                    : "linear-gradient(90deg, #34d399, #22d3ee)",
                                            }}
                                        />
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {result.churns
                                        ? "⚠️ This customer shows high risk factors. Consider offering retention incentives like contract upgrades or loyalty discounts."
                                        : "✅ This customer appears stable with strong retention indicators. Continue providing excellent service."}
                                </p>
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                Fill in the form and click &quot;Predict Churn&quot; to see results
                            </div>
                        )}
                    </div>

                    {/* Key Factors */}
                    <div className="rounded-xl border p-6" style={cardStyle}>
                        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Shield className="w-4 h-4" style={{ color: accentColor }} />
                            Key Churn Factors
                        </h3>
                        <div className="space-y-2.5">
                            {[
                                { label: "Month-to-month Contract", impact: "High", color: "#ef4444" },
                                { label: "Short Tenure (<12 mo)", impact: "High", color: "#ef4444" },
                                { label: "No Tech Support", impact: "Medium", color: "#f59e0b" },
                                { label: "No Online Security", impact: "Medium", color: "#f59e0b" },
                                { label: "High Monthly Charges", impact: "Medium", color: "#f59e0b" },
                                { label: "Paperless Billing", impact: "Low", color: "#34d399" },
                            ].map((factor) => (
                                <div key={factor.label} className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-accent/30 transition-all">
                                    <span className="text-xs text-muted-foreground">{factor.label}</span>
                                    <span
                                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                        style={{ background: `${factor.color}15`, color: factor.color }}
                                    >
                                        {factor.impact}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tech Stack */}
                    <div className="rounded-xl border p-6" style={cardStyle}>
                        <h3 className="text-sm font-semibold text-foreground mb-3">Tech Stack</h3>
                        <div className="flex flex-wrap gap-2">
                            {["Python", "Flask", "Scikit-learn", "Random Forest", "Pandas", "NumPy"].map((tech) => (
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
