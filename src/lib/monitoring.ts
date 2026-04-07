// Simple monitoring utility for production
// Log performance metrics, errors, and usage stats

type MetricType = 'api_latency' | 'error_rate' | 'active_users' | 'call_duration';

interface Metric {
  type: MetricType;
  value: number;
  timestamp: Date;
  metadata?: Record<string, string>;
}

// In-memory metrics store (replace with real monitoring service like Sentry/DataDog in production)
const metrics: Metric[] = [];
const MAX_METRICS = 10000;

export function recordMetric(type: MetricType, value: number, metadata?: Record<string, string>) {
  metrics.push({ type, value, timestamp: new Date(), metadata });
  if (metrics.length > MAX_METRICS) metrics.shift();
}

export function getMetrics(type?: MetricType, since?: Date): Metric[] {
  return metrics.filter(m => (!type || m.type === type) && (!since || m.timestamp >= since));
}

export function getMetricsSummary() {
  return {
    totalApiCalls: metrics.filter(m => m.type === 'api_latency').length,
    avgApiLatency: average(metrics.filter(m => m.type === 'api_latency').map(m => m.value)),
    totalErrors: metrics.filter(m => m.type === 'error_rate').length,
    metricsStored: metrics.length,
    lastUpdated: metrics.length > 0 ? metrics[metrics.length - 1].timestamp : null,
  };
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length * 100) / 100;
}
