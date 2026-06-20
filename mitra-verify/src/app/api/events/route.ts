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

    const newEvent: VerificationEvent = {
      id: Math.random().toString(36).substring(2, 10),
      timestamp: new Date().toISOString(),
      apiType: data.apiType || 'Basic',
      status: data.status || 'FAILED',
      confidence: typeof data.confidence === 'number' ? data.confidence : 0,
      processingTimeMs: typeof data.processingTimeMs === 'number' ? data.processingTimeMs : 0,
      spoofFlag: !!data.spoofFlag,
      faceDetectedFlag: !!data.faceDetectedFlag,
      identityMatchedFlag: !!data.identityMatchedFlag,
      attentionScore: typeof data.attentionScore === 'number' ? data.attentionScore : (data.faceDetectedFlag ? 0.9 : 0),
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
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
