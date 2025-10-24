import pino from 'pino'
import { env } from './env'

// Create a logger instance
export const logger = pino({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
})

// Error monitoring interface
export interface ErrorMetadata {
  code?: string
  component?: string
  action?: string
  [key: string]: any
}

export function logError(error: Error, metadata: ErrorMetadata = {}) {
  logger.error({
    error: {
      message: error.message,
      stack: error.stack,
      ...metadata
    }
  })
}

// Payment specific logging
export function logPaymentError(error: Error, paymentId: string, action: string) {
  logError(error, {
    component: 'payment',
    paymentId,
    action
  })
}

// Monitor memory usage
export function monitorMemoryUsage() {
  const used = process.memoryUsage()
  
  if (used.heapUsed > env.MAX_ALLOC_BYTES) {
    logger.warn({
      component: 'system',
      action: 'memory-warning',
      heapUsed: used.heapUsed,
      heapTotal: used.heapTotal,
      maxAllowed: env.MAX_ALLOC_BYTES
    })
  }
  
  return used
}

// Monitor webhook health
export interface WebhookMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  lastError?: Error
}

class WebhookMonitor {
  private metrics: WebhookMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0
  }

  recordSuccess() {
    this.metrics.totalRequests++
    this.metrics.successfulRequests++
  }

  recordFailure(error: Error) {
    this.metrics.totalRequests++
    this.metrics.failedRequests++
    this.metrics.lastError = error

    logger.error({
      component: 'webhook',
      action: 'request-failed',
      error: error.message,
      metrics: this.metrics
    })
  }

  getMetrics(): WebhookMetrics {
    return { ...this.metrics }
  }
}

export const webhookMonitor = new WebhookMonitor()