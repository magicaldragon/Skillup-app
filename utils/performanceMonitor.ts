/**
 * Performance monitoring utility for tracking API calls and application loading stages
 */

// Store timers for performance tracking
const timers: Record<string, number> = {};

// Simple performance monitoring for API calls
export const performanceMonitor = {
  /**
   * Track API call performance
   * @param endpoint The API endpoint being called
   * @param startTime The time when the API call started
   * @param success Whether the call was successful
   */
  trackApiCall: (endpoint: string, startTime: number, success: boolean) => {
    const duration = Date.now() - startTime;
    console.log(`API Call to ${endpoint}: ${duration}ms (${success ? 'success' : 'failed'})`); 
  },

  /**
   * Mark a loading stage for performance tracking
   * @param stageName The name of the loading stage
   */
  markLoadingStage: (stageName: string) => {
    console.log(`Loading stage: ${stageName} at ${Date.now()}`); 
  },
  
  /**
   * Start a timer for performance tracking
   * @param timerName The name of the timer
   */
  startTimer: (timerName: string) => {
    timers[timerName] = Date.now();
    console.log(`Timer started: ${timerName}`);
  },
  
  /**
   * End a timer and log the duration
   * @param timerName The name of the timer
   * @returns The duration in milliseconds
   */
  endTimer: (timerName: string) => {
    if (!timers[timerName]) {
      console.warn(`Timer ${timerName} was not started`);
      return 0;
    }
    
    const duration = Date.now() - timers[timerName];
    console.log(`Timer ${timerName}: ${duration}ms`);
    delete timers[timerName];
    return duration;
  }
};