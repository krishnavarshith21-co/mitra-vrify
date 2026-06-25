import { NextResponse } from 'next/server';
import { verificationEvents } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const total = verificationEvents.length;
  let successful = 0;
  let failed = 0;
  let spoof = 0;
  let noFace = 0;
  let identityMatches = 0;
  let totalProcessingTime = 0;

  const apiPerformance: Record<string, { requests: number, pass: number, fail: number, spoof: number, faceLost: number, errors: number, totalLatency: number, lastRequest: string | null }> = {
    Basic: { requests: 0, pass: 0, fail: 0, spoof: 0, faceLost: 0, errors: 0, totalLatency: 0, lastRequest: null },
    Advanced: { requests: 0, pass: 0, fail: 0, spoof: 0, faceLost: 0, errors: 0, totalLatency: 0, lastRequest: null },
    Enterprise: { requests: 0, pass: 0, fail: 0, spoof: 0, faceLost: 0, errors: 0, totalLatency: 0, lastRequest: null }
  };

  const deviceAnalytics = { desktop: 0, mobile: 0, tablet: 0 };
  const failureReasonCounts: Record<string, number> = {};

  const securityEvents = {
    deepfake: 0,
    replay_attack: 0,
    identity_mismatch: 0,
    multiple_faces: 0,
    face_not_found: 0
  };

  // Group events by 10-second intervals for the chart
  const temporalDataMap: Record<string, { time: string, verified: number, failed: number, spoof: number, faceLost: number, multipleFaces: number, count: number, totalLatency: number }> = {};

  // For audit logs, we map the most recent 10 events
  const auditLogs = verificationEvents.slice(-10).reverse().map(ev => ({
    id: ev.id,
    timestamp: ev.timestamp,
    action: `Verification via ${ev.apiType} API`,
    status: ev.status,
    ip: ev.ip
  }));

  for (const event of verificationEvents) {
    totalProcessingTime += event.processingTimeMs;
    
    // API Performance
    if (apiPerformance[event.apiType]) {
      const perf = apiPerformance[event.apiType];
      perf.requests++;
      perf.totalLatency += event.processingTimeMs;
      perf.lastRequest = event.timestamp;
      if (event.status === 'VERIFIED' || event.status === 'IDENTITY MATCHED') {
        perf.pass++;
      } else if (event.spoofFlag) {
        perf.spoof++;
        perf.fail++;
      } else if (event.status === 'NO FACE DETECTED' || !event.faceDetectedFlag) {
        perf.faceLost++;
        perf.fail++;
      } else {
        perf.fail++;
        perf.errors++;
      }
    }
    
    // Device Analytics
    if (event.device === 'Desktop') deviceAnalytics.desktop++;
    else if (event.device === 'Mobile') deviceAnalytics.mobile++;
    else if (event.device === 'Tablet') deviceAnalytics.tablet++;
    
    // Failure Reasons
    if (event.failureReason) {
       failureReasonCounts[event.failureReason] = (failureReasonCounts[event.failureReason] || 0) + 1;
    }

    if (event.status === 'VERIFIED' || event.status === 'IDENTITY MATCHED') {
      successful++;
    } else {
      failed++;
    }

    if (event.spoofFlag || event.status === 'SPOOF ATTEMPT') {
      spoof++;
      // We don't have deepfake vs replay stored explicitly, so we bucket them under deepfake for real threat logs
      securityEvents.deepfake++; 
    }
    
    if (event.status === 'NO FACE DETECTED' || !event.faceDetectedFlag) {
      noFace++;
      securityEvents.face_not_found++;
    }

    if (event.status === 'FAILED' && event.apiType === 'Enterprise' && event.faceDetectedFlag && !event.identityMatchedFlag) {
       securityEvents.identity_mismatch++;
    }

    if (event.identityMatchedFlag) {
      identityMatches++;
    }

    // Chart grouping
    const date = new Date(event.timestamp);
    // Group by minute:seconds rounded to nearest 10s
    const seconds = date.getSeconds();
    const roundedSeconds = Math.floor(seconds / 10) * 10;
    const timeKey = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${roundedSeconds.toString().padStart(2, '0')}`;

    if (!temporalDataMap[timeKey]) {
      temporalDataMap[timeKey] = { time: timeKey, verified: 0, failed: 0, spoof: 0, faceLost: 0, multipleFaces: 0, count: 0, totalLatency: 0 };
    }
    
    temporalDataMap[timeKey].count++;
    temporalDataMap[timeKey].totalLatency += event.processingTimeMs;
    
    if (event.status === 'VERIFIED' || event.status === 'IDENTITY MATCHED') {
       temporalDataMap[timeKey].verified++;
    } else if (event.spoofFlag) {
       temporalDataMap[timeKey].spoof++;
       temporalDataMap[timeKey].failed++;
    } else if (event.status === 'NO FACE DETECTED' || !event.faceDetectedFlag) {
       temporalDataMap[timeKey].faceLost++;
       temporalDataMap[timeKey].failed++;
    } else {
       temporalDataMap[timeKey].failed++;
    }
    
    if (event.multipleFaces) {
       temporalDataMap[timeKey].multipleFaces++;
    }
  }

  const successRate = total > 0 ? (successful / total) * 100 : 0;
  const avgProcessingTime = total > 0 ? Math.round(totalProcessingTime / total) : 0;
  
  // Sort temporal data by time
  const temporalData = Object.values(temporalDataMap).sort((a, b) => a.time.localeCompare(b.time)).slice(-20).map(t => ({
    time: t.time,
    pass: t.verified,
    failed: t.failed,
    spoof: t.spoof,
    faceLost: t.faceLost,
    multipleFaces: t.multipleFaces,
    latency: t.count > 0 ? Math.round(t.totalLatency / t.count) : 0,
    throughput: t.count * 360 // Extrapolate 10s count to req/hr
  }));

  const avgLatency = total > 0 ? Math.round(totalProcessingTime / total) : 0;
  
  // Build Top Failure Reasons
  const totalFailures = Object.values(failureReasonCounts).reduce((a,b) => a+b, 0);
  const topFailureReasons = Object.entries(failureReasonCounts)
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: totalFailures > 0 ? Math.round((count / totalFailures) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Build Recent Alerts dynamically
  const recentAlerts = [];
  if (successRate < 80) recentAlerts.push({ type: 'High Failure Rate', message: `Success rate dropped to ${successRate.toFixed(1)}%`, time: new Date().toISOString(), severity: 'warning' });
  if (avgLatency > 500) recentAlerts.push({ type: 'API Latency Warning', message: `Average processing time is ${avgLatency}ms`, time: new Date().toISOString(), severity: 'warning' });
  if (securityEvents.deepfake > 5) recentAlerts.push({ type: 'Repeated Spoof Attempts', message: `Multiple deepfakes detected`, time: new Date().toISOString(), severity: 'critical' });
  if (Math.random() > 0.95) recentAlerts.push({ type: 'Webhook Offline', message: `Delivery delayed`, time: new Date().toISOString(), severity: 'critical' });

  // Mock Verification Timeline (Heatmap)
  const timelineHeatmap = Array.from({ length: 24 }).map((_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    volume: Math.floor(Math.random() * 500) + 50
  }));

  return NextResponse.json({
    data: {
      executive_overview: {
        total_verifications: total,
        successful_verifications: successful,
        failed_verifications: failed,
        spoof_attempts_blocked: spoof,
        identity_matches: identityMatches,
        face_enrollments: apiPerformance['Enterprise'].requests > 0 ? Math.floor(apiPerformance['Enterprise'].requests * 0.4) : 0,
        webhook_deliveries: total,
        face_lost_events: noFace,
        avg_processing_time_ms: avgProcessingTime,
        active_api_keys: 3,
      },
      analytics_chart: temporalData,
      security_events: securityEvents,
      api_performance: apiPerformance,
      audit_logs: auditLogs,
      bottom_analytics: {
        face_quality: {
          average: 98.4,
          low_light: 4.2,
          blur: 1.8,
          occlusion: 2.0,
          head_rotation_fail: 0.5
        },
        device_analytics: deviceAnalytics,
        country_analytics: [
          { country: 'India', value: 45 },
          { country: 'USA', value: 25 },
          { country: 'Germany', value: 15 },
          { country: 'Singapore', value: 10 },
          { country: 'Japan', value: 5 }
        ]
      },
      system_health: {
        face_detection: 'Operational',
        liveness_engine: 'Operational',
        anti_spoof_engine: 'Operational',
        identity_engine: 'Operational',
        api_gateway: 'Operational'
      },
      top_failure_reasons: topFailureReasons,
      recent_alerts: recentAlerts,
      timeline_heatmap: timelineHeatmap
    }
  });
}
