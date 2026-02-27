import axios from "axios"
import * as cheerio from "cheerio"

const SCRAPE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-IN,en;q=0.9",
}

async function fetchAmazonPrice(query: string): Promise<number | null> {
  try {
    const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`
    const { data } = await axios.get(url, {
      headers: SCRAPE_HEADERS,
      timeout: 8000,
    })
    const $ = cheerio.load(data)
    const priceText = $(".a-price-whole").first().text()
    if (!priceText) return null
    return Number(priceText.replace(/,/g, ""))
  } catch (err) {
    console.warn("Amazon price fetch failed (non-fatal):", (err as Error).message)
    return null
  }
}

async function fetchFlipkartPrice(query: string): Promise<number | null> {
  try {
    const url = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`
    const { data } = await axios.get(url, {
      headers: SCRAPE_HEADERS,
      timeout: 8000,
    })
    const $ = cheerio.load(data)
    const priceText = $("._30jeq3").first().text()
    if (!priceText) return null
    return Number(priceText.replace(/[₹,]/g, ""))
  } catch (err) {
    console.warn("Flipkart price fetch failed (non-fatal):", (err as Error).message)
    return null
  }
}
import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

// ─── GET: fetch analysis history ─────────────────────────────────────────────
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const rows = await sql`
      SELECT id, query, category, created_at, result
      FROM public.market_analyses
      WHERE user_id = ${session.id}
      ORDER BY created_at DESC
      LIMIT 20
    `
    return NextResponse.json({ analyses: rows })
  } catch (err) {
    console.error("GET /api/market-analysis error:", err)
    return NextResponse.json({ analyses: [] })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { query, category } = body

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      )
    }

    /* ==============================
      REAL-TIME PRICE FETCH — parallel
    ================================ */

    const [amazonPrice, flipkartPrice] = await Promise.all([
      fetchAmazonPrice(query),
      fetchFlipkartPrice(query),
    ])

    const prices = [amazonPrice, flipkartPrice].filter(
      (p): p is number => p !== null
    )

    const lowestPrice =
      prices.length > 0 ? Math.min(...prices) : null

    /* ============================== */

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const prompt = `
  You are a retail market intelligence expert.

  Analyze the product: "${query}".

  ==============================
  REAL MARKET DATA (LIVE FETCHED)
  ==============================

  Amazon India Price: ₹${amazonPrice ?? "Not found"}
  Flipkart Price: ₹${flipkartPrice ?? "Not found"}
  Lowest Market Price: ₹${lowestPrice ?? "Unknown"}

  IMPORTANT:
  - These prices were fetched live from real e-commerce platforms.
  - You MUST treat them as ground truth.
  - DO NOT estimate or invent lower prices.
  - DO NOT use MRP values.
  - All pricing analysis MUST revolve around the lowest real price above.

  Focus on the Indian market (INR).

  CRITICAL PRICING RULES:

  1. FIND THE LOWEST DEAL PRICE  
    Use the provided lowest market price as the baseline.

  2. IGNORE MRP  
    Always analyze selling price, not listed MRP.

  3. REAL PRODUCT ASSUMPTION  
    Assume the product already exists and is actively sold.

  4. COMPETITIVE SELLING PRICE  
    Suggested pricing should slightly beat or match the lowest market price logically.

  5. CONSISTENCY RULE  
    price_analysis.min MUST equal the Lowest Market Price above.
    price_analysis.average should stay very close to it.

  Generate a JSON response strictly following this schema.
  Return ONLY valid JSON.
  Do NOT include markdown.
  Do NOT include explanations outside JSON.

  {
    "product_overview": {
      "name": "${query}",
      "description": "Brief professional description",
      "market_size_india": "e.g. ₹500 Cr",
      "growth_rate": "e.g. 12% YoY",
      "category": "Category Name"
    },

    "price_analysis": {
      "min": Number,
      "max": Number,
      "average": Number,
      "wholesale_price": Number,
      "retail_price": Number,
      "online_price": Number,
      "currency": "INR",
      "real_time_data": true
    },

    "price_recommendation": {
      "suggested_retail_price": Number,
      "min_viable_price": Number,
      "premium_price": Number,
      "reasoning": "Explain recommendation using the real lowest price",
      "platform_strategy": "Short strategy",
      "expected_margin_percent": Number
    },

    "cost_breakdown": {
      "product_cost_percent": Number,
      "marketing_percent": Number,
      "logistics_percent": Number,
      "platform_fees_percent": Number,
      "profit_percent": Number,
      "labels": ["Product Cost", "Marketing", "Logistics", "Platform Fees", "Profit"]
    },

    "platform_price_analysis": [
      {
        "platform": "Amazon India",
        "price": Number,
        "vs_avg_percent": Number,
        "trend": "cheaper" | "pricier" | "average",
        "reason": "String"
      },
      {
        "platform": "Flipkart",
        "price": Number,
        "vs_avg_percent": Number,
        "trend": "cheaper" | "pricier" | "average",
        "reason": "String"
      }
    ],

    "price_trend_data": [
      {
        "month": "Month",
        "price_index": Number,
        "event": "Reason"
      }
    ],

    "profit_analysis": {
      "gross_margin_percent": Number,
      "net_margin_percent": Number,
      "markup_percent": Number,
      "breakeven_units_monthly": Number,
      "estimated_monthly_profit_small": Number,
      "estimated_monthly_profit_medium": Number,
      "roi_percent": Number
    },

    "local_market": {
      "demand_level": "High" | "Medium" | "Low",
      "demand_score": Number,
      "local_competitors": [
        {
          "name": "String",
          "type": "Online" | "Offline" | "Both",
          "price_range": "String",
          "strength": "String"
        }
      ],
      "nearby_business_count": "String",
      "market_saturation": "High" | "Medium" | "Low",
      "best_selling_areas": ["String"]
    },

    "market_trends": {
      "trend": "Growing" | "Stable" | "Declining",
      "trend_percentage": Number,
      "yoy_growth": "String",
      "peak_seasons": ["String"],
      "off_seasons": ["String"],
      "emerging_opportunities": ["String"]
    },

    "business_insights": {
      "summary": "String",
      "key_insights": ["String"],
      "target_customers": ["String"],
      "usp_suggestions": ["String"],
      "risks": ["String"],
      "risk_level": "Low" | "Medium" | "High"
    },

    "want_to_start": {
      "recommended": Boolean,
      "reason": "String",
      "startup_cost_min": Number,
      "startup_cost_max": Number,
      "time_to_profit_months": Number
    },

    "business_strategy": {
      "phase1": { "title": "String", "steps": ["String"] },
      "phase2": { "title": "String", "steps": ["String"] },
      "phase3": { "title": "String", "steps": ["String"] },
      "online_strategy": ["String"],
      "offline_strategy": ["String"],
      "sourcing_tips": ["String"],
      "legal_requirements": ["String"],
      "recommended_platforms": ["String"]
    },

    "platform_links": [
      {
        "store": "Platform Name (e.g. Amazon, Flipkart, Myntra, Blinkit, Zepto, JioMart, BigBasket, Meesho, Snapdeal, Tata CLiQ, Nykaa, Ajio, Croma, Reliance Digital, IndiaMART)",
        "url": "REAL search URL for this product on this platform, e.g. https://www.amazon.in/s?k=LED+bulbs or https://www.flipkart.com/search?q=LED+bulbs",
        "directUrl": false,
        "price": null,
        "category": "ecommerce | quick_commerce | grocery | fashion",
        "favicon": "https://www.google.com/s2/favicons?domain=amazon.in&sz=32"
      }
    ],

    "buy_links": [
      {
        "store": "Platform Name",
        "url": "REAL search/product URL on this platform",
        "directUrl": false,
        "price": "Number or null — use the real scraped price for Amazon/Flipkart if available",
        "variant": "String or null — variant description if applicable",
        "category": "ecommerce | quick_commerce | grocery | fashion",
        "favicon": "https://www.google.com/s2/favicons?domain=example.com&sz=32"
      }
    ],
    "product_image_url": null
  }

  CRITICAL INSTRUCTIONS FOR platform_links AND buy_links:
  - Generate AT LEAST 10-15 real Indian platform links
  - Use REAL search URLs — e.g. https://www.amazon.in/s?k={product}, https://www.flipkart.com/search?q={product}
  - The URL MUST be a valid, working search URL for that platform
  - Group platforms by category: "ecommerce" (Amazon, Flipkart, Snapdeal, Meesho, Tata CLiQ, Croma, Reliance Digital, IndiaMART), "quick_commerce" (Blinkit, Zepto, Swiggy Instamart), "grocery" (JioMart, BigBasket, DMart), "fashion" (Myntra, Ajio, Nykaa)
  - Set favicon to: https://www.google.com/s2/favicons?domain={platform_domain}&sz=32
  - For Amazon and Flipkart buy_links, set "price" to the real scraped price provided above (Amazon: ${amazonPrice ?? "null"}, Flipkart: ${flipkartPrice ?? "null"})
  - Set directUrl to false for search URLs, true only if you provide a direct product page URL
  - buy_links should include at least 5-8 platforms with price estimates where possible
  `

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    })
    const response = await result.response
    const text = response.text().replace(/```json/g, "").replace(/```/g, "")
    const data = JSON.parse(text)

    // Save to database (fire-and-forget)
    sql`INSERT INTO public.market_analyses (user_id, query, category, result)
        VALUES (${session.id}, ${query}, ${category || null}, ${JSON.stringify(data)})
    `.catch((e: unknown) => console.warn("Failed to save analysis:", e))

    return NextResponse.json({ result: data })
  } catch (error) {
    console.error("Market Analysis Error:", error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}