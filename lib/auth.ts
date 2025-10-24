import { neon } from "@neondatabase/serverless"
import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"


const sql = neon(process.env.DATABASE_URL!)

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

export type UserRole = "admin" | "manager" | "accountant" | "viewer"

export interface User {
  id: number
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
}

export interface Session {
  user: User
  expires: string
}

// Create JWT token
export async function createToken(user: User): Promise<string> {
  return await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET)
}

// Verify JWT token
export async function verifyToken(token: string): Promise<Session | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    return verified.payload as unknown as Session
  } catch (error) {
    return null
  }
}

// Get current session
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value

  if (!token) return null

  return await verifyToken(token)
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()
  if (!session?.user) return null

  const user = session.user
  return {
    ...user,
    id: typeof user.id === "string" ? Number.parseInt(user.id, 10) : user.id,
  }
}

// Set session cookie
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  })
}

// Clear session cookie
export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}

// Check if user has required role
export function hasRole(user: User | null, allowedRoles: UserRole[]): boolean {
  if (!user) return false
  return allowedRoles.includes(user.role)
}

// Role hierarchy for permissions
export const roleHierarchy: Record<UserRole, number> = {
  admin: 4,
  manager: 3,
  accountant: 2,
  viewer: 1,
}

// Check if user has minimum role level
export function hasMinimumRole(user: User | null, minimumRole: UserRole): boolean {
  if (!user) return false
  return roleHierarchy[user.role] >= roleHierarchy[minimumRole]
}

// Verify password (simple comparison - in production use bcrypt)
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  // For demo purposes, we're using a simple comparison
  // In production, use bcrypt.compare(plainPassword, hashedPassword)
  return plainPassword === "demo123"
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await sql`
    SELECT id, email, full_name, role, is_active, password_hash
    FROM users
    WHERE email = ${email} AND is_active = true
    LIMIT 1
  `

  if (result.length === 0) return null

  const { password_hash, ...user } = result[0]
  return {
    ...user,
    id: Number(user.id),
  } as User
}

// Authenticate user
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const result = await sql`
    SELECT id, email, full_name, role, is_active, password_hash
    FROM users
    WHERE email = ${email} AND is_active = true
    LIMIT 1
  `

  if (result.length === 0) return null

  const { password_hash, ...user } = result[0]

  // Verify password
  const isValid = await verifyPassword(password, password_hash as string)
  if (!isValid) return null

  return {
    ...user,
    id: Number(user.id),
  } as User
}

// Verify JWT (additional function)
export async function verifyJWT(token: string): Promise<any> {
  try {
    // Reuse existing verifyToken which returns Session | null
    const session = await verifyToken(token)
    return session
  } catch {
    return null;
  }
}



