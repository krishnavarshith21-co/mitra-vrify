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

  const apiUsage = {
    Basic: 0,
    Advanced: 0,
    Enterprise: 0
  };

  const securityEvents = {
    deepfake: 0,
    replay_attack: 0,
    identity_mismatch: 0,
    multiple_faces: 0,
    face_not_found: 0
  };

  // Group events by 10-second intervals for the chart
  const temporalDataMap: Record<string, { time: string, verified: number, failed: number, spoof: number, count: number, totalLatency: number }> = {};

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
    
    // API Usage
    if (apiUsage[event.apiType] !== undefined) {
      apiUsage[event.apiType]++;
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
      temporalDataMap[timeKey] = { time: timeKey, verified: 0, failed: 0, spoof: 0, count: 0, totalLatency: 0 };
    }
    
    temporalDataMap[timeKey].count++;
    temporalDataMap[timeKey].totalLatency += event.processingTimeMs;
    
    if (event.status === 'VERIFIED' || event.status === 'IDENTITY MATCHED') {
       temporalDataMap[timeKey].verified++;
    } else if (event.spoofFlag) {
       temporalDataMap[timeKey].spoof++;
       temporalDataMap[timeKey].failed++;
    } else {
       temporalDataMap[timeKey].failed++;
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
    latency: t.count > 0 ? Math.round(t.totalLatency / t.count) : 0,
    throughput: t.count * 360 // Extrapolate 10s count to req/hr
  }));

  return NextResponse.json({
    data: {
      executive_overview: {
        total_verifications: total,
        successful_verifications: successful,
        failed_verifications: failed,
        spoof_attempts_blocked: spoof,
        identity_matches: identityMatches,
        avg_processing_time_ms: avgProcessingTime,
        active_api_keys: 3, // Real system would query db for API keys
      },
      analytics_chart: temporalData,
      security_events: securityEvents,
      api_usage: apiUsage,
      audit_logs: auditLogs,
      system_health: {
        face_detection: 'Operational',
        liveness_engine: 'Operational',
        anti_spoof_engine: 'Operational',
        identity_engine: 'Operational',
        api_gateway: 'Operational'
      }
    }
  });
}
