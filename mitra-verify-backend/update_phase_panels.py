import re

file_path = "/Users/krishnavarshithkamanaboina/Desktop/mitra-vrify/mitra-verify/src/app/demo/enterprise/page.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Fix the old phase names
content = content.replace("phase === 'CHALLENGES'", "phase === 'LIVENESS_CHALLENGES'")
content = content.replace("phase === 'MONITORING'", "phase === 'CONTINUOUS_MONITORING'")

# Add IDENTITY_VERIFYING block
identity_block = """            {phase === 'IDENTITY_VERIFYING' && (
              <div className="glass" style={{ padding: 16, borderRadius: 14, display: 'flex', flexDirection: 'column', flexShrink: 0, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#ffb800', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    IDENTITY VERIFICATION
                  </div>
                  <div className="pulse-dot" style={{ backgroundColor: '#ffb800' }} />
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.4, marginBottom: 12 }}>
                  Analyzing live face against enrolled biometric template...
                </div>
              </div>
            )}
            
            {phase === 'ACCESS_GRANTED' && (
              <div className="glass" style={{ padding: 16, borderRadius: 14, display: 'flex', flexDirection: 'column', flexShrink: 0, marginBottom: 12, borderColor: '#00ff88' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#00ff88', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    ACCESS GRANTED
                  </div>
                  <CheckCircle size={16} color="#00ff88" />
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.4, marginBottom: 12 }}>
                  Identity and liveness verified successfully. Initiating continuous monitoring...
                </div>
              </div>
            )}
            
            {phase === 'FAILED' && (
              <div className="glass" style={{ padding: 16, borderRadius: 14, display: 'flex', flexDirection: 'column', flexShrink: 0, marginBottom: 12, borderColor: '#ef4444' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    ACCESS DENIED
                  </div>
                  <AlertTriangle size={16} color="#ef4444" />
                </div>
                <div style={{ fontSize: 13, color: '#ef4444', lineHeight: 1.4, marginBottom: 12 }}>
                  Identity verification failed or security violation detected.
                </div>
              </div>
            )}
            
            {phase === 'ACCESS_REVOKED' && (
              <div className="glass" style={{ padding: 16, borderRadius: 14, display: 'flex', flexDirection: 'column', flexShrink: 0, marginBottom: 12, borderColor: '#ef4444' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    ACCESS REVOKED
                  </div>
                  <AlertTriangle size={16} color="#ef4444" />
                </div>
                <div style={{ fontSize: 13, color: '#ef4444', lineHeight: 1.4, marginBottom: 12 }}>
                  Session terminated due to security policy violation during continuous monitoring.
                </div>
              </div>
            )}
"""

# Insert the new blocks before LIVENESS_CHALLENGES block
content = content.replace("{phase === 'LIVENESS_CHALLENGES' && (", identity_block + "{phase === 'LIVENESS_CHALLENGES' && (")

# There was a manual button "Continue Verification" in 'ENROLLMENT' phase that setPhase('CHALLENGES')
# We need to remove it since the backend transitions automatically now.
button_code = r"""\s*\) : phase === 'ENROLLMENT' \? \(\s*<div style=\{\{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' \}\}>\s*<div style=\{\{ textAlign: 'center', color: '#00ff88', fontSize: 13, fontWeight: 'bold' \}\}>✓ Identity enrolled</div>\s*<div style=\{\{ display: 'flex', gap: 10 \}\}>\s*<button onClick=\{\(\) => setPhase\('LIVENESS_CHALLENGES'\)\} style=\{\{ flex: 2, padding: '10px 0', borderRadius: 10, background: 'linear-gradient\(135deg, #00ff88, #00cc66\)', color: '#000', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' \}\}>\s*Continue Verification\s*</button>\s*<button onClick=\{\(\) => \{ setPhase\('IDLE'\); setEnrolledEmbedding\(null\); \}\} style=\{\{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'rgba\(255,255,255,0\.1\)', color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' \}\}>\s*Reset\s*</button>\s*</div>\s*</div>"""
# Replace with just rendering nothing or waiting for transition
new_button_code = """) : phase === 'ENROLLED' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                    <div style={{ textAlign: 'center', color: '#00ff88', fontSize: 13, fontWeight: 'bold' }}>✓ Identity enrolled</div>
                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 11 }}>Initiating verification...</div>
                  </div>"""
content = re.sub(button_code, new_button_code, content)

with open(file_path, "w") as f:
    f.write(content)
