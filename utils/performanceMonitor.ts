// Enhanced Performance Monitor for SkillUp Center
// Tracks loading times, user interactions, and system performance

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'navigation' | 'api' | 'interaction' | 'render';
}

interface LoadingStages {
  appStart: number;
  authComplete: number;
  dashboardReady: number;
  dataLoaded: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private loadingStages: Partial<LoadingStages> = {};
  private apiCallTimes: Map<string, number> = new Map();
  private renderTimes: Map<string, number> = new Map();
  private enabled: boolean = true;

  constructor() {
    this.initializePerformanceObserver();
    this.markStage('appStart');
  }

  // Mark loading stages for cold start optimization
  markStage(stage: keyof LoadingStages): void {
    const timestamp = performance.now();
    this.loadingStages[stage] = timestamp;
    
    this.addMetric({
      name: `stage_${stage}`,
      value: timestamp,
      timestamp: Date.now(),
      type: 'navigation'
    });

    console.log(`Performance: ${stage} completed at ${timestamp.toFixed(2)}ms`);
    
    // Calculate time from app start
    if (stage !== 'appStart' && this.loadingStages.appStart) {
      const timeFromStart = timestamp - this.loadingStages.appStart;
      console.log(`Performance: ${stage} took ${timeFromStart.toFixed(2)}ms from app start`);
    }
  }

  // Track API call performance
  startApiCall(endpoint: string): string {
    const callId = `${endpoint}_${Date.now()}`;
    this.apiCallTimes.set(callId, performance.now());
    return callId;
  }

  endApiCall(callId: string, success: boolean = true): void {
    const startTime = this.apiCallTimes.get(callId);
    if (startTime) {
      const duration = performance.now() - startTime;
      const endpoint = callId.split('_')[0];
      
      this.addMetric({
        name: `api_${endpoint}`,
        value: duration,
        timestamp: Date.now(),
        type: 'api'
      });

      console.log(`API Performance: ${endpoint} ${success ? 'succeeded' : 'failed'} in ${duration.toFixed(2)}ms`);
      this.apiCallTimes.delete(callId);
      
      // Warn on slow API calls
      if (duration > 5000) {
        console.warn(`Slow API call detected: ${endpoint} took ${duration.toFixed(2)}ms`);
      }
    }
  }

  // Track component render performance
  markRenderStart(componentName: string): void {
    this.renderTimes.set(componentName, performance.now());
  }

  markRenderEnd(componentName: string): void {
    const startTime = this.renderTimes.get(componentName);
    if (startTime) {
      const duration = performance.now() - startTime;
      
      this.addMetric({
        name: `render_${componentName}`,
        value: duration,
        timestamp: Date.now(),
        type: 'render'
      });

      console.log(`Render Performance: ${componentName} rendered in ${duration.toFixed(2)}ms`);
      this.renderTimes.delete(componentName);
      
      // Warn on slow renders
      if (duration > 100) {
        console.warn(`Slow render detected: ${componentName} took ${duration.toFixed(2)}ms`);
      }
    }
  }

  // Legacy method support for backward compatibility
  startTimer(name: string): void {
    this.markRenderStart(name);
  }

  endTimer(name: string): number | null {
    const startTime = this.renderTimes.get(name);
    if (startTime) {
      this.markRenderEnd(name);
      return performance.now() - startTime;
    }
    return null;
  }

  // Track user interactions
  trackInteraction(action: string, duration?: number): void {
    this.addMetric({
      name: `interaction_${action}`,
      value: duration || 0,
      timestamp: Date.now(),
      type: 'interaction'
    });
  }

  // Get performance summary for cold start analysis
  getColdStartSummary(): object {
    const { appStart, authComplete, dashboardReady, dataLoaded } = this.loadingStages;
    
    if (!appStart) return {};
    
    return {
      totalColdStartTime: dataLoaded ? dataLoaded - appStart : 'incomplete',
      authTime: authComplete ? authComplete - appStart : 'incomplete',
      dashboardTime: dashboardReady ? dashboardReady - appStart : 'incomplete',
      dataLoadTime: dataLoaded && dashboardReady ? dataLoaded - dashboardReady : 'incomplete',
      stages: this.loadingStages
    };
  }

  // Legacy method support
  getMetrics(): PerformanceMetric[] {
    return this.metrics.filter(m => m.type === 'render');
  }

  clearMetrics(): void {
    this.metrics = [];
    this.loadingStages = {};
    this.apiCallTimes.clear();
    this.renderTimes.clear();
  }

  // Legacy async measurement support
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

  // Get overall performance report
  getPerformanceReport(): object {
    const coldStart = this.getColdStartSummary();
    const apiMetrics = this.metrics.filter(m => m.type === 'api');
    const renderMetrics = this.metrics.filter(m => m.type === 'render');
    
    // Calculate averages
    const avgApiTime = apiMetrics.length > 0 
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length 
      : 0;
    
    const avgRenderTime = renderMetrics.length > 0
      ? renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length
      : 0;
    
    return {
      coldStart,
      averageApiTime: avgApiTime.toFixed(2) + 'ms',
      averageRenderTime: avgRenderTime.toFixed(2) + 'ms',
      totalMetrics: this.metrics.length,
      slowApiCalls: apiMetrics.filter(m => m.value > 3000).length,
      slowRenders: renderMetrics.filter(m => m.value > 100).length
    };
  }

  // Clear old metrics to prevent memory leaks
  clearOldMetrics(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
  }

  private addMetric(metric: PerformanceMetric): void {
    if (!this.enabled) return;
    
    this.metrics.push(metric);
    
    // Limit metrics array size
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  private initializePerformanceObserver(): void {
    if (!this.enabled) return;
    
    // Observe paint timing
    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.addMetric({
              name: entry.name,
              value: entry.startTime,
              timestamp: Date.now(),
              type: 'navigation'
            });
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });

        // Observe navigation timing
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.addMetric({
              name: 'navigation',
              value: entry.duration,
              timestamp: Date.now(),
              type: 'navigation'
            });
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }
    }
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for common performance tracking
export const trackComponentRender = (componentName: string) => {
  return {
    start: () => performanceMonitor.markRenderStart(componentName),
    end: () => performanceMonitor.markRenderEnd(componentName)
  };
};

export const trackApiCall = (endpoint: string) => {
  const callId = performanceMonitor.startApiCall(endpoint);
  return {
    end: (success: boolean = true) => performanceMonitor.endApiCall(callId, success)
  };
};

export const markLoadingStage = (stage: keyof LoadingStages) => {
  performanceMonitor.markStage(stage);
};

export const logPerformanceReport = () => {
  console.log('Performance Report:', performanceMonitor.getPerformanceReport());
};

// Auto-cleanup every 30 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    performanceMonitor.clearOldMetrics();
  }, 30 * 60 * 1000);
}
