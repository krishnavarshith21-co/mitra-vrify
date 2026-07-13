import { useState, useCallback, useRef } from 'react';

export interface LogEvent {
  timestamp: string;
  eventType: string;
  data: any;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
}

export function useDiagnosticLogger() {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const startTime = useRef(Date.now());

  const logEvent = useCallback((eventType: string, data: any = {}, severity: LogEvent['severity'] = 'INFO') => {
    const newLog: LogEvent = {
      timestamp: new Date().toISOString(),
      eventType,
      data,
      severity
    };
    setLogs(prev => [...prev, newLog]);
    
    // Optional console mirror for quick debugging
    if (severity === 'CRITICAL' || severity === 'ERROR') {
      console.error(`[${newLog.timestamp}] ${eventType}:`, data);
    } else if (severity === 'WARNING') {
      console.warn(`[${newLog.timestamp}] ${eventType}:`, data);
    } else {
      console.log(`[${newLog.timestamp}] ${eventType}:`, data);
    }
  }, []);

  const downloadLogs = useCallback((sessionData: any = {}) => {
    const report = {
      sessionStartTime: new Date(startTime.current).toISOString(),
      sessionEndTime: new Date().toISOString(),
      sessionDurationMs: Date.now() - startTime.current,
      summary: sessionData,
      events: logs
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `developer_report_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  const interpretSpoof = useCallback((fraudDetection: any, spoofScore: number) => {
    if (!fraudDetection) return `Spoof Score: ${(spoofScore * 100).toFixed(1)}%`;
    const reasons: string[] = [];
    if (fraudDetection.printed_photo?.detected) reasons.push(`Printed photo detected (${(fraudDetection.printed_photo.confidence * 100).toFixed(1)}%)`);
    if (fraudDetection.replay_attack?.detected) reasons.push(`Replay attack suspected (${(fraudDetection.replay_attack.confidence * 100).toFixed(1)}%)`);
    if (fraudDetection.deepfake?.detected) reasons.push(`Deepfake/Jitter detected (${(fraudDetection.deepfake.confidence * 100).toFixed(1)}%)`);
    if (fraudDetection.ai_generated?.detected) reasons.push(`AI-generated symmetry (${(fraudDetection.ai_generated.confidence * 100).toFixed(1)}%)`);
    if (fraudDetection.screen_reflection?.detected) reasons.push(`Screen reflection detected (${(fraudDetection.screen_reflection.confidence * 100).toFixed(1)}%)`);
    if (fraudDetection.mask_attack?.detected) reasons.push(`Mask attack boundary detected (${(fraudDetection.mask_attack.confidence * 100).toFixed(1)}%)`);
    
    return reasons.length > 0 ? reasons.join(', ') : `General Spoof Score: ${(spoofScore * 100).toFixed(1)}%`;
  }, []);

  return { logs, logEvent, downloadLogs, interpretSpoof };
}
