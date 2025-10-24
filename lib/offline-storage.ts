"use client"

// Offline storage utilities using localStorage
export interface OfflineAction {
  id: string
  type: string
  payload: any
  timestamp: number
  synced: boolean
}

const OFFLINE_QUEUE_KEY = "rentflow_offline_queue"
const OFFLINE_DATA_KEY = "rentflow_offline_data"

export function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine
}

export function addToOfflineQueue(action: Omit<OfflineAction, "id" | "timestamp" | "synced">): void {
  if (typeof window === "undefined") return

  const queue = getOfflineQueue()
  const newAction: OfflineAction = {
    ...action,
    id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    synced: false,
  }

  queue.push(newAction)
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
}

export function getOfflineQueue(): OfflineAction[] {
  if (typeof window === "undefined") return []

  try {
    const queue = localStorage.getItem(OFFLINE_QUEUE_KEY)
    return queue ? JSON.parse(queue) : []
  } catch {
    return []
  }
}

export function clearOfflineQueue(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(OFFLINE_QUEUE_KEY)
}

export function markActionSynced(actionId: string): void {
  if (typeof window === "undefined") return

  const queue = getOfflineQueue()
  const updatedQueue = queue.map((action) => (action.id === actionId ? { ...action, synced: true } : action))

  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue))
}

export function removeFromOfflineQueue(actionId: string): void {
  if (typeof window === "undefined") return

  const queue = getOfflineQueue()
  const updatedQueue = queue.filter((action) => action.id !== actionId)

  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue))
}

export function cacheData(key: string, data: any): void {
  if (typeof window === "undefined") return

  try {
    const cache = getOfflineCache()
    cache[key] = {
      data,
      timestamp: Date.now(),
    }
    localStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(cache))
  } catch (error) {
    console.error("[v0] Failed to cache data:", error)
  }
}

export function getCachedData(key: string, maxAge = 5 * 60 * 1000): any | null {
  if (typeof window === "undefined") return null

  try {
    const cache = getOfflineCache()
    const cached = cache[key]

    if (!cached) return null

    const age = Date.now() - cached.timestamp
    if (age > maxAge) {
      delete cache[key]
      localStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(cache))
      return null
    }

    return cached.data
  } catch {
    return null
  }
}

function getOfflineCache(): Record<string, { data: any; timestamp: number }> {
  if (typeof window === "undefined") return {}

  try {
    const cache = localStorage.getItem(OFFLINE_DATA_KEY)
    return cache ? JSON.parse(cache) : {}
  } catch {
    return {}
  }
}

export function clearOfflineCache(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(OFFLINE_DATA_KEY)
}
