import { NextResponse } from 'next/server';
import { verificationEvents, VerificationEvent } from '@/lib/store';

export async function GET() {
  // Return the last 50 events, newest first
  const latestEvents = [...verificationEvents].reverse().slice(0, 50);
  return NextResponse.json(latestEvents);
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const user = data.user || 'Unknown User';
    const device = data.device || 'Desktop';
    
    let failureReason = data.failureReason || undefined;
    const multipleFaces = !!data.multipleFaces;
    
    const incomingStatus = data.status || 'FAILED';
    const isSpoof = !!data.spoofFlag || incomingStatus === 'SPOOF ATTEMPT';
    const isNoFace = incomingStatus === 'NO FACE DETECTED' || (data.faceDetectedFlag === false);
    
    if (isSpoof && !failureReason) {
       failureReason = 'Spoof Detected';
    } else if (isNoFace && !failureReason) {
       failureReason = 'No Face Detected';
    } else if (incomingStatus === 'FAILED' && !failureReason) {
       failureReason = 'Verification Failed';
    }

    const newEvent: VerificationEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      apiType: data.apiType || 'Basic',
      status: incomingStatus,
      confidence: typeof data.confidence === 'number' ? data.confidence : 0,
      processingTimeMs: typeof data.processingTimeMs === 'number' ? data.processingTimeMs : 0,
      spoofFlag: !!data.spoofFlag,
      faceDetectedFlag: !!data.faceDetectedFlag,
      identityMatchedFlag: !!data.identityMatchedFlag,
      attentionScore: typeof data.attentionScore === 'number' ? data.attentionScore : (data.faceDetectedFlag ? 0.9 : 0),
      ip: request.headers.get('x-forwarded-for') || 'Unknown',
      user: user,
      device: device,
      failureReason,
      multipleFaces
    };

    verificationEvents.push(newEvent);

    // Keep memory footprint reasonable
    if (verificationEvents.length > 10000) {
      verificationEvents.shift();
    }

    return NextResponse.json({ success: true, event: newEvent });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
  }
}
