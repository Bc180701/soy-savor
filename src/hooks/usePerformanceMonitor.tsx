import { useEffect, useCallback, useRef } from 'react';

interface PerformanceMetric {
  action: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceConfig {
  enableLogging: boolean;
  slowThreshold: number; // en ms
  verySlowThreshold: number; // en ms
}

const DEFAULT_CONFIG: PerformanceConfig = {
  enableLogging: true,
  slowThreshold: 1000, // 1s
  verySlowThreshold: 3000, // 3s
};

export function usePerformanceMonitor(config: Partial<PerformanceConfig> = {}) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const metricsRef = useRef<PerformanceMetric[]>([]);
  const startTimesRef = useRef<Map<string, number>>(new Map());

  // Fonction pour démarrer une mesure
  const startMeasure = useCallback((actionName: string, metadata?: Record<string, any>) => {
    if (!fullConfig.enableLogging) return;
    
    const startTime = performance.now();
    startTimesRef.current.set(actionName, startTime);
    
    console.log(`⏱️ START: ${actionName}`, metadata ? metadata : '');
  }, [fullConfig.enableLogging]);

  // Fonction pour terminer une mesure
  const endMeasure = useCallback((actionName: string, metadata?: Record<string, any>) => {
    if (!fullConfig.enableLogging) return;
    
    const startTime = startTimesRef.current.get(actionName);
    if (!startTime) {
      console.warn(`⚠️ Aucune mesure démarrée pour: ${actionName}`);
      return;
    }

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    const metric: PerformanceMetric = {
      action: actionName,
      duration,
      timestamp: Date.now(),
      metadata
    };

    metricsRef.current.push(metric);
    startTimesRef.current.delete(actionName);

    // Log avec niveau selon la durée
    let logLevel = '✅';
    let logColor = '#22c55e'; // vert
    
    if (duration > fullConfig.verySlowThreshold) {
      logLevel = '🔴';
      logColor = '#ef4444'; // rouge
    } else if (duration > fullConfig.slowThreshold) {
      logLevel = '🟡';
      logColor = '#f59e0b'; // orange
    }

    console.log(
      `%c${logLevel} END: ${actionName} (${duration}ms)`,
      `color: ${logColor}; font-weight: bold;`,
      metadata ? metadata : ''
    );

    // Alerte pour les actions très lentes
    if (duration > fullConfig.verySlowThreshold) {
      console.warn(`🐌 Action très lente détectée: ${actionName} - ${duration}ms`);
    }

    return duration;
  }, [fullConfig.enableLogging, fullConfig.slowThreshold, fullConfig.verySlowThreshold]);

  // Fonction pour mesurer une action async
  const measureAsync = useCallback(async function<T>(
    actionName: string,
    asyncFn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    startMeasure(actionName, metadata);
    try {
      const result = await asyncFn();
      endMeasure(actionName, { ...metadata, success: true });
      return result;
    } catch (error) {
      endMeasure(actionName, { ...metadata, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }, [startMeasure, endMeasure]);

  // Fonction pour obtenir les statistiques
  const getStats = useCallback(() => {
    if (!fullConfig.enableLogging) return null;

    const metrics = metricsRef.current;
    if (metrics.length === 0) return null;

    const actionStats = metrics.reduce((acc, metric) => {
      if (!acc[metric.action]) {
        acc[metric.action] = {
          count: 0,
          totalDuration: 0,
          minDuration: Infinity,
          maxDuration: 0,
          avgDuration: 0
        };
      }

      const stats = acc[metric.action];
      stats.count++;
      stats.totalDuration += metric.duration;
      stats.minDuration = Math.min(stats.minDuration, metric.duration);
      stats.maxDuration = Math.max(stats.maxDuration, metric.duration);
      stats.avgDuration = Math.round(stats.totalDuration / stats.count);

      return acc;
    }, {} as Record<string, { count: number; totalDuration: number; minDuration: number; maxDuration: number; avgDuration: number; }>);

    return {
      totalActions: metrics.length,
      timeRange: {
        start: Math.min(...metrics.map(m => m.timestamp)),
        end: Math.max(...metrics.map(m => m.timestamp))
      },
      actionStats
    };
  }, [fullConfig.enableLogging]);

  // Fonction pour vider les métriques
  const clearMetrics = useCallback(() => {
    metricsRef.current = [];
    startTimesRef.current.clear();
    console.log('🗑️ Métriques de performance vidées');
  }, []);

  // Fonction pour exporter les métriques
  const exportMetrics = useCallback(() => {
    if (!fullConfig.enableLogging) return null;
    
    const data = {
      metrics: metricsRef.current,
      stats: getStats(),
      exportDate: new Date().toISOString(),
      userAgent: navigator.userAgent
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('📊 Métriques exportées:', data);
    return data;
  }, [fullConfig.enableLogging, getStats]);

  // Log des statistiques périodiquement
  useEffect(() => {
    if (!fullConfig.enableLogging) return;

    const interval = setInterval(() => {
      const stats = getStats();
      if (stats && stats.totalActions > 0) {
        console.group('📊 Statistiques de performance');
        console.log('Total actions:', stats.totalActions);
        console.table(stats.actionStats);
        console.groupEnd();
      }
    }, 60000); // Toutes les minutes

    return () => clearInterval(interval);
  }, [fullConfig.enableLogging, getStats]);

  return {
    startMeasure,
    endMeasure,
    measureAsync,
    getStats,
    clearMetrics,
    exportMetrics,
    metricsCount: metricsRef.current.length
  };
}