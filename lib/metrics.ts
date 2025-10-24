import { logger } from './monitoring'

interface MetricsData {
  timestamp: number
  metric: string
  value: number
  tags: Record<string, string>
}

class MetricsCollector {
  private metrics: MetricsData[] = []
  private flushInterval: NodeJS.Timeout
  
  constructor(private readonly flushIntervalMs: number = 60000) {
    this.flushInterval = setInterval(() => this.flush(), flushIntervalMs)
  }

  record(metric: string, value: number, tags: Record<string, string> = {}) {
    this.metrics.push({
      timestamp: Date.now(),
      metric,
      value,
      tags
    })
  }

  async flush() {
    if (this.metrics.length === 0) return

    try {
      const metrics = [...this.metrics]
      this.metrics = []

      // Log metrics batch
      logger.info({
        component: 'metrics',
        action: 'flush',
        count: metrics.length,
        metrics
      })

      // TODO: Send to monitoring system (e.g., Datadog, Prometheus)

    } catch (error) {
      logger.error({
        component: 'metrics',
        action: 'flush-error',
        error
      })
    }
  }

  stop() {
    clearInterval(this.flushInterval)
  }
}

// Create singleton instance
export const metrics = new MetricsCollector()

// Payment metrics
export function recordPaymentMetric(
  action: 'received' | 'processed' | 'reconciled' | 'failed',
  amount?: number,
  tags: Record<string, string> = {}
) {
  metrics.record(`payment.${action}`, 1, tags)
  if (amount) {
    metrics.record(`payment.amount`, amount, tags)
  }
}

// Performance metrics
export function recordLatency(
  component: string,
  operation: string,
  durationMs: number
) {
  metrics.record('latency', durationMs, {
    component,
    operation
  })
}

// Resource metrics
export function recordMemoryUsage() {
  const used = process.memoryUsage()
  
  metrics.record('memory.heapUsed', used.heapUsed)
  metrics.record('memory.heapTotal', used.heapTotal)
  metrics.record('memory.rss', used.rss)
  
  if (used.heapUsed > 0.9 * used.heapTotal) {
    logger.warn({
      component: 'memory',
      action: 'high-usage',
      usage: used
    })
  }
}