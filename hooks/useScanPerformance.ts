import { useState, useCallback } from 'react';

interface ScanMetrics {
  captureTime: number;
  processingTime: number;
  totalTime: number;
  imageSize: number;
  success: boolean;
  error?: string;
}

export const useScanPerformance = () => {
  const [metrics, setMetrics] = useState<ScanMetrics | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  const startScan = useCallback(() => {
    setStartTime(Date.now());
  }, []);

  const endScan = useCallback((captureTime: number, processingTime: number, imageSize: number, success: boolean, error?: string) => {
    if (startTime) {
      const totalTime = Date.now() - startTime;
      setMetrics({
        captureTime,
        processingTime,
        totalTime,
        imageSize,
        success,
        error
      });
      
      // Log performance metrics
      console.log('📊 Scan Performance Metrics:', {
        captureTime: `${captureTime}ms`,
        processingTime: `${processingTime}ms`,
        totalTime: `${totalTime}ms`,
        imageSize: `${(imageSize / 1024).toFixed(1)}KB`,
        success
      });
    }
    setStartTime(null);
  }, [startTime]);

  const resetMetrics = useCallback(() => {
    setMetrics(null);
    setStartTime(null);
  }, []);

  return {
    metrics,
    startScan,
    endScan,
    resetMetrics
  };
}; 