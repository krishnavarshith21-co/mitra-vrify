'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, Terminal, ArrowRight, Code2, Globe, Shield, Server, CheckCircle, Copy } from 'lucide-react';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/cyber/PageTransition';

const CodeBlock = ({ code, language }: { code: string, language: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="terminal relative mt-4 mb-6">
      <div className="absolute top-0 right-0 flex items-center z-10">
        <span className="text-[11px] text-slate-500 py-2 px-3 uppercase font-mono">{language}</span>
        <button onClick={handleCopy} className={`bg-transparent border-none p-3 cursor-pointer ${copied ? 'text-[#00ff88]' : 'text-slate-500'}`}>
          {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <pre className="m-0 pt-10 overflow-x-auto bg-black/50 p-4 rounded-lg font-mono text-xs">
        <code className="text-slate-300 whitespace-pre-wrap">{code}</code>
      </pre>
    </div>
  );
};

export default function IntegrationDocsPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-[#01081a]">
        <Navbar />
        
        <div className="max-w-4xl mx-auto px-4 md:px-6 pt-28 pb-20">
          <div className="mb-10 border-b border-white/10 pb-10">
            <div className="flex items-center gap-3 text-[#00d4ff] mb-4 text-sm font-bold tracking-wider uppercase">
              <Layers size={16} /> Hosted Integration
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Integrating MITRA VERIFY</h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-3xl">
              Use the MITRA VERIFY platform to securely verify your users' identities without building complex computer vision pipelines. 
              Our hosted flow provides a seamless, secure, and accurate liveness check that redirects back to your application upon completion.
            </p>
          </div>

          <div className="space-y-16">
            
            {/* Step 1 */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center text-[#00d4ff] font-bold">1</div>
                <h2 className="text-2xl font-bold text-white">Create a Verification Session</h2>
              </div>
              <div className="pl-14">
                <p className="text-slate-400 mb-4">
                  From your <strong className="text-white">backend server</strong> or client application, initiate a new verification session. 
                  You must provide your <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded text-white">API Key</code> to authorize the request.
                </p>
                
                <CodeBlock language="typescript" code={`// Frontend or Backend API Call
const response = await fetch("https://api.mitraverify.com/api/v1/verification/sessions", {
  method: "POST",
  headers: {
    "X-API-Key": "YOUR_CLIENT_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    application_id: "YOUR_APPLICATION_ID",
    redirect_uri: "https://your-app.com/verification-callback" // Where we send the user back to
  })
});

const data = await response.json();
// data.session_id: "sess_..."
// data.verification_url: "https://mitraverify.com/verify/session/sess_..."`} />

              </div>
            </section>

            {/* Step 2 */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center text-[#00d4ff] font-bold">2</div>
                <h2 className="text-2xl font-bold text-white">Redirect the User</h2>
              </div>
              <div className="pl-14">
                <p className="text-slate-400 mb-4">
                  Redirect your user to the <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded text-white">verification_url</code> returned in Step 1.
                </p>
                <div className="glass p-6 rounded-xl border border-white/5 flex flex-col md:flex-row items-center gap-6 justify-center bg-black/20 mb-4">
                  <div className="flex flex-col items-center">
                    <Globe className="text-slate-500 mb-2" size={32} />
                    <span className="text-sm font-semibold text-white">Your App</span>
                  </div>
                  <div className="flex flex-col items-center flex-1 w-full text-[#00d4ff]">
                    <span className="text-xs font-mono mb-1">Redirect</span>
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent relative">
                      <ArrowRight size={14} className="absolute -top-1.5 -right-1" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <Shield className="text-[#00ff88] mb-2" size={32} />
                    <span className="text-sm font-semibold text-white">MITRA VERIFY</span>
                  </div>
                </div>
                <p className="text-slate-400 mb-4">
                  The user will securely perform the liveness challenge on our hosted infrastructure. Once complete, we will redirect them back to your <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded text-white">redirect_uri</code>.
                </p>
              </div>
            </section>

            {/* Step 3 */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center text-[#00d4ff] font-bold">3</div>
                <h2 className="text-2xl font-bold text-white">Verify the Result</h2>
              </div>
              <div className="pl-14">
                <p className="text-slate-400 mb-4">
                  When the user returns to your application, we will append the session ID to your callback URL (e.g. <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded text-white">?session_id=sess_...</code>).
                </p>
                <div className="bg-[#ff3366]/10 border border-[#ff3366]/30 p-4 rounded-xl flex gap-3 mb-6">
                  <Terminal className="text-[#ff3366] shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-sm font-bold text-[#ff3366] mb-1">Security Critical</h4>
                    <p className="text-xs text-[#ff3366]/80 leading-relaxed">
                      You must retrieve the final verification result directly from your backend server using your <strong>Server Secret</strong>. 
                      Never trust the frontend to tell you that verification succeeded. Do not expose your Server Secret to the browser.
                    </p>
                  </div>
                </div>
                
                <CodeBlock language="typescript" code={`// Backend API Endpoint (e.g. Next.js Route Handler / Node.js Express)
export async function POST(req: Request) {
  const { sessionId } = await req.json();

  const resultResponse = await fetch(\`https://api.mitraverify.com/api/v1/verification/sessions/\${sessionId}/result\`, {
    method: "GET",
    headers: {
      "X-Server-Secret": "YOUR_SERVER_SECRET" // Stored in .env securely
    }
  });

  const data = await resultResponse.json();

  if (data.status === "VERIFIED") {
    // Verification passed! Update database and authenticate user
    return Response.json({ success: true, user: data.user_id });
  } else {
    // Verification failed or pending
    return Response.json({ success: false, reason: data.status }, { status: 403 });
  }
}`} />
              </div>
            </section>
            
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
