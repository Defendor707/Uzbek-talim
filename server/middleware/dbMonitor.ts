
import { Request, Response, NextFunction } from 'express';
import { dbOptimizer } from '../utils/dbOptimizer';

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: number;
  success: boolean;
}

class DatabaseMonitor {
  private metrics: QueryMetrics[] = [];
  private readonly maxMetrics = 1000;

  recordQuery(query: string, duration: number, success: boolean): void {
    this.metrics.push({
      query,
      duration,
      timestamp: Date.now(),
      success
    });

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getSlowQueries(threshold: number = 1000): QueryMetrics[] {
    return this.metrics.filter(m => m.duration > threshold);
  }

  getAverageQueryTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / this.metrics.length;
  }

  getFailureRate(): number {
    if (this.metrics.length === 0) return 0;
    const failures = this.metrics.filter(m => !m.success).length;
    return (failures / this.metrics.length) * 100;
  }

  async getHealthReport(): Promise<any> {
    const slowQueries = this.getSlowQueries();
    const avgQueryTime = this.getAverageQueryTime();
    const failureRate = this.getFailureRate();
    const connectionStats = await dbOptimizer.getConnectionStats();

    return {
      avgQueryTime,
      failureRate,
      slowQueriesCount: slowQueries.length,
      connectionStats,
      recommendations: this.generateRecommendations(avgQueryTime, failureRate)
    };
  }

  private generateRecommendations(avgTime: number, failureRate: number): string[] {
    const recommendations: string[] = [];

    if (avgTime > 500) {
      recommendations.push('Consider adding indexes for slow queries');
    }
    if (failureRate > 5) {
      recommendations.push('High failure rate detected, check connection pool settings');
    }
    if (this.getSlowQueries().length > 10) {
      recommendations.push('Multiple slow queries detected, run ANALYZE on tables');
    }

    return recommendations;
  }
}

export const dbMonitor = new DatabaseMonitor();

// Middleware to monitor database performance
export const dbPerformanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  const originalEnd = res.end;
  res.end = function(this: Response, ...args: any[]) {
    const duration = Date.now() - startTime;
    const success = res.statusCode < 400;
    
    // Only monitor API requests
    if (req.path.startsWith('/api/')) {
      dbMonitor.recordQuery(req.path, duration, success);
    }
    
    originalEnd.apply(this, args);
  };

  next();
};
