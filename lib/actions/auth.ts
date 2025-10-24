"use server"

import { authenticateUser, createToken, setSessionCookie, clearSessionCookie, getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const user = await authenticateUser(email, password)

  if (!user) {
    return { error: "Invalid email or password" }
  }

  // Create session token
  const token = await createToken(user)
  await setSessionCookie(token)

  // Log audit trail
  await sql`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
    VALUES (${user.id}, 'login', 'user', ${user.id}, ${JSON.stringify({ email: user.email })})
  `

  redirect("/dashboard")
}

export async function logoutAction() {
  const user = await getCurrentUser()

  if (user) {
    // Log audit trail
    await sql`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
      VALUES (${user.id}, 'logout', 'user', ${user.id})
    `
  }

  await clearSessionCookie()
  redirect("/login")
}

export async function getCurrentUserAction() {
  return await getCurrentUser()
}
