export interface VerificationEvent {
  id: string;
  timestamp: string;
  apiType: 'Basic' | 'Advanced' | 'Enterprise';
  status: 'VERIFIED' | 'FAILED' | 'NO FACE DETECTED' | 'SPOOF ATTEMPT' | 'IDENTITY MATCHED';
  confidence: number;
  processingTimeMs: number;
  spoofFlag: boolean;
  faceDetectedFlag: boolean;
  identityMatchedFlag: boolean;
  attentionScore: number;
  ip: string;
}

// Ensure the global variable isn't redeclared in Next.js development HMR
const globalForStore = global as unknown as { verificationEvents: VerificationEvent[] };

export const verificationEvents: VerificationEvent[] = globalForStore.verificationEvents || [];

if (process.env.NODE_ENV !== 'production') {
  globalForStore.verificationEvents = verificationEvents;
}
