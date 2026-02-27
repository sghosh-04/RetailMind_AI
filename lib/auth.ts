import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { sql } from "./db"

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "retailiq-super-secret-key-change-in-production"
)
const COOKIE_NAME = "retailiq_session"

export type SessionUser = {
  id: string
  email: string
  display_id: string
  business_name: string
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getUserById(id: string) {
  const rows = await sql`
    SELECT u.id, u.email, u.display_id,
           bp.business_name, bp.gst_number, bp.business_reg_no,
           bp.pan_number, bp.owner_name, bp.phone, bp.address,
           bp.city, bp.state, bp.pincode
    FROM public.users u
    LEFT JOIN public.business_profiles bp ON bp.user_id = u.id
    WHERE u.id = ${id}
    LIMIT 1
  `
  return rows[0] || null
}
