"use client"

import { useChat } from "ai/react"
import { useRef, useEffect } from "react"
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react"

const SUGGESTIONS = [
  "What GST rate applies to mobile phones?",
  "How to improve my profit margins in retail?",
  "Best e-commerce platforms to sell in India",
  "How to handle slow-moving inventory?",
  "Explain GSTR-1 filing process",
  "Tips for negotiating with suppliers",
]

export default function CopilotChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, append, error } = useChat({
    api: "/api/chat",
  })
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-4">
        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            Error: {error.message || "Failed to connect to chat API"}
          </div>
        )}
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.25)" }}
            >
              <Bot className="w-8 h-8" style={{ color: "#47ff86" }} />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-foreground">RetailIQ Copilot</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Your AI assistant for Indian retail business — GST, market intelligence, pricing, and growth strategies.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full max-w-2xl">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => append({ role: "user", content: s })}
                  className="px-3 py-2.5 rounded-lg text-xs text-left border transition-all hover:scale-[1.01]"
                  style={{
                    background: "rgba(15, 42, 34, 0.6)",
                    borderColor: "rgba(0, 255, 179, 0.15)",
                    color: "rgba(148,163,184,0.9)",
                  }}
                >
                  <Sparkles className="w-3 h-3 inline mr-1.5 opacity-60" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={
                    m.role === "user"
                      ? { background: "rgba(0,212,255,0.2)", border: "1px solid rgba(0,212,255,0.3)" }
                      : { background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.25)" }
                  }
                >
                  {m.role === "user"
                    ? <User className="w-4 h-4" style={{ color: "#47ff86" }} />
                    : <Bot className="w-4 h-4" style={{ color: "#47ff86" }} />
                  }
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                  style={
                    m.role === "user"
                      ? { background: "rgba(0,212,255,0.15)", color: "#e2e8f0", border: "1px solid rgba(0,212,255,0.2)" }
                      : { background: "rgba(15,23,42,0.8)", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.07)" }
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.25)" }}>
                  <Bot className="w-4 h-4" style={{ color: "#a78bfa" }} />
                </div>
                <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-3 pt-4 border-t border-border">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask anything about your retail business…"
          className="flex-1 px-4 py-3 rounded-xl text-sm bg-input border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 transition-all"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
          style={{ background: "#47ff86", color: "#06432e" }}
          aria-label="Send message"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  )
}
