interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private enabled: boolean = process.env.NODE_ENV === 'development';

  startTimer(name: string): void {
    if (!this.enabled) return;

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
    });

    console.log(`🚀 Performance: Started timer for "${name}"`);
  }

  endTimer(name: string): number | null {
    if (!this.enabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`⚠️ Performance: Timer "${name}" not found`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    console.log(`⏱️ Performance: "${name}" took ${metric.duration.toFixed(2)}ms`);

    // Log slow operations
    if (metric.duration > 1000) {
      console.warn(`🐌 Slow operation detected: "${name}" took ${metric.duration.toFixed(2)}ms`);
    }

    return metric.duration;
  }

  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter((m) => m.duration !== undefined);
  }

  clearMetrics(): void {
    this.metrics.clear();
  }

  // Convenience method for async operations
  async measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    this.startTimer(name);
    try {
      const result = await operation();
      this.endTimer(name);
      return result;
    } catch (error) {
      this.endTimer(name);
      throw error;
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();
