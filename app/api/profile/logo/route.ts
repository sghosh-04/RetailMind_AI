import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

// Max 2 MB
const MAX_SIZE = 2 * 1024 * 1024

export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const formData = await req.formData()
        const file = formData.get("logo") as File | null
        if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

        // Validate type
        if (!file.type.startsWith("image/"))
            return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })

        // Validate size
        if (file.size > MAX_SIZE)
            return NextResponse.json({ error: "File too large (max 2 MB)" }, { status: 400 })

        const ext = file.name.split(".").pop()?.toLowerCase() || "png"
        const filename = `logo_${session.id}.${ext}`
        const uploadDir = path.join(process.cwd(), "public", "logos")
        await mkdir(uploadDir, { recursive: true })

        const bytes = await file.arrayBuffer()
        await writeFile(path.join(uploadDir, filename), Buffer.from(bytes))

        const logoUrl = `/logos/${filename}`

        await sql`
      UPDATE public.business_profiles
      SET logo_url = ${logoUrl}, updated_at = NOW()
      WHERE user_id = ${session.id}
    `

        return NextResponse.json({ logo_url: logoUrl })
    } catch (err) {
        console.error("[POST /api/profile/logo]", err)
        return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 })
    }
}
