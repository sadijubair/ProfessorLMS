import type { UserRole } from "@/lib/auth/rbac"

export type SessionPayload = {
  userId: string
  studentId: string | null
  role: UserRole
  portal: "student" | "admin"
  iat: number
  exp: number
}

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60

function getSecret() {
  const secret =
    process.env.AUTH_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!secret) {
    throw new Error("Missing AUTH_SESSION_SECRET")
  }

  return secret
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ""

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "")
}

function base64UrlToBytes(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/")
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "="
  )
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function encodeJson(value: unknown) {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)))
}

function decodeJson<T>(value: string) {
  const json = new TextDecoder().decode(base64UrlToBytes(value))
  return JSON.parse(json) as T
}

async function getSigningKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
}

async function signValue(value: string) {
  const key = await getSigningKey()
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  )

  return bytesToBase64Url(new Uint8Array(signature))
}

async function verifySignature(value: string, signature: string) {
  const key = await getSigningKey()

  return crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToBytes(signature),
    new TextEncoder().encode(value)
  )
}

export function createSessionPayload(
  payload: Omit<SessionPayload, "iat" | "exp">
): SessionPayload {
  const now = Math.floor(Date.now() / 1000)

  return {
    ...payload,
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
  }
}

export async function signSession(payload: SessionPayload) {
  const encodedPayload = encodeJson(payload)
  const signature = await signValue(encodedPayload)

  return `${encodedPayload}.${signature}`
}

export async function verifySession(token?: string) {
  if (!token) return null

  const [encodedPayload, signature] = token.split(".")

  if (!encodedPayload || !signature) return null

  const valid = await verifySignature(encodedPayload, signature)

  if (!valid) return null

  const payload = decodeJson<SessionPayload>(encodedPayload)

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    return null
  }

  return payload
}

export async function signCaptchaAnswer(answer: string) {
  const now = Math.floor(Date.now() / 1000)
  const payload = encodeJson({
    answer,
    exp: now + 5 * 60,
  })
  const signature = await signValue(payload)

  return `${payload}.${signature}`
}

export async function verifyCaptchaAnswer(token: string, answer: string) {
  const [payload, signature] = token.split(".")

  if (!payload || !signature) return false

  const valid = await verifySignature(payload, signature)

  if (!valid) return false

  const decoded = decodeJson<{ answer: string; exp: number }>(payload)

  if (decoded.exp < Math.floor(Date.now() / 1000)) {
    return false
  }

  return decoded.answer === answer.trim()
}
