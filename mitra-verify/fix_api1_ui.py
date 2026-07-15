import re

with open('src/app/demo/basic/page.tsx', 'r') as f:
    content = f.read()

new_component = """
function ResultCard({ result, reason, confidence, processingTime, onRestart }: { result: 'pass' | 'fail'; reason?: string; confidence: number; processingTime: number; onRestart: () => void }) {
  const isPass = result === 'pass';
  const color = isPass ? '#00ff88' : '#ff3366';
  
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: isPass ? 'linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,255,136,0.02))' : 'linear-gradient(135deg, rgba(255,51,102,0.1), rgba(255,51,102,0.02))',
      border: `1px solid ${color}40`,
      boxShadow: `0 0 40px ${color}15`,
      borderRadius: 'var(--radius-xl)',
      padding: '40px 20px',
      textAlign: 'center'
    }}>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        style={{ width: 80, height: 80, borderRadius: '50%', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: `0 0 30px ${color}40` }}>
        {isPass ? <CheckCircle size={40} color={color} /> : <AlertCircle size={40} color={color} />}
      </motion.div>
      
      <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 16 }}>
        {isPass ? 'LIVENESS VERIFIED' : 'VERIFICATION FAILED'}
      </h2>
      
      {!isPass && (
        <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 20, background: 'rgba(0,0,0,0.4)', border: `1px solid ${color}40`, color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 32, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {reason || 'SPOOF DETECTED'}
        </div>
      )}

      {isPass && (
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Confidence</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{(confidence * 100).toFixed(0)}%</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Processing Time</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{processingTime.toFixed(0)}ms</div>
          </div>
        </div>
      )}

      <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 32, fontFamily: 'monospace' }}>
        Status: <span style={{ color, fontWeight: 700 }}>{isPass ? 'PASS' : 'FAIL'}</span>
      </div>

      <button onClick={onRestart} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', color: '#0f172a', border: 'none', padding: '14px 28px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 15, transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
        <Camera size={18} /> {isPass ? 'Start New Verification' : 'Try Again'}
      </button>
    </div>
  );
}
"""

check_badge_def = """function CheckBadge({ label, passed, checking }: { label: string; passed: boolean; checking: boolean }) {
  const color = checking ? '#00d4ff' : passed ? '#00ff88' : '#475569';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      borderRadius: 10, background: `${color}0a`, border: `1px solid ${color}22`,
    }}>
      <motion.div animate={{ scale: passed ? [1, 1.2, 1] : 1 }} transition={{ duration: 0.3 }}>
        <CheckCircle size={16} color={color} />
      </motion.div>
      <span style={{ fontSize: 13, color: checking ? '#00d4ff' : passed ? '#94a3b8' : '#475569', fontWeight: passed ? 500 : 400 }}>
        {label}
      </span>
      {checking && (
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#00d4ff' }}
        />
      )}
    </div>
  );
}"""

content = content.replace(check_badge_def, check_badge_def + "\n\n" + new_component)


old_stop = """  function stopCamera() {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
    setCameraStatus('Inactive');
    setResult(null);"""

new_stop = """  function stopCamera() {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
    streamingRef.current = false; // ensure animation loop terminates immediately
    setCameraStatus('Inactive');
    setResult(null);"""
content = content.replace(old_stop, new_stop)


camera_container_start = """          <div className="lg:col-span-8 flex flex-col gap-4">
            <div style={{
              position: 'relative', borderRadius: 'var(--radius-xl)', overflow: 'hidden',
              background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)',
              aspectRatio: '4/3',
            }}>"""

camera_container_new = """          <div className="lg:col-span-8 flex flex-col gap-4">
            <div style={{
              position: 'relative', borderRadius: 'var(--radius-xl)', overflow: 'hidden',
              background: result ? 'transparent' : '#0a0a0a', border: result ? 'none' : '1px solid rgba(255,255,255,0.06)',
              aspectRatio: '4/3',
            }}>
              {result ? (
                <ResultCard
                  result={result}
                  reason={apiResponse?.reason?.replace(/_/g, ' ') || apiResponse?.status?.replace(/_/g, ' ') || 'SPOOF DETECTED'}
                  confidence={confidence}
                  processingTime={processingTime}
                  onRestart={() => {
                    setResult(null);
                    setCurrentStep(0);
                    setSpoofScore(0);
                    startCamera();
                  }}
                />
              ) : (
                <>"""

content = content.replace(camera_container_start, camera_container_new)

end_of_camera_block_regex = r"(\{\/\* Session Status Tag \*\/\}.*?\{\s*streaming && \([\s\S]*?\}\s*<\/div>\s*<\/div>)"
old_result_overlay = re.search(r'(\{\/\* Result state overlay \*\/\}\s*<AnimatePresence>[\s\S]*?<\/AnimatePresence>)', content)
if old_result_overlay:
    content = content.replace(old_result_overlay.group(1), "")

content = re.sub(end_of_camera_block_regex, r"\g<1>\n              </>", content)

with open('src/app/demo/basic/page.tsx', 'w') as f:
    f.write(content)

print("UI successfully overhauled!")
