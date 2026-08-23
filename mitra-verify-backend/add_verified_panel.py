import re

file_path = "/Users/krishnavarshithkamanaboina/Desktop/mitra-vrify/mitra-verify/src/app/demo/enterprise/page.tsx"
with open(file_path, "r") as f:
    content = f.read()

identity_verified_block = """            {phase === 'IDENTITY_VERIFIED' && (
              <div className="glass" style={{ padding: 16, borderRadius: 14, display: 'flex', flexDirection: 'column', flexShrink: 0, marginBottom: 12, borderColor: '#00ff88' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#00ff88', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    IDENTITY VERIFIED
                  </div>
                  <CheckCircle size={16} color="#00ff88" />
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.4, marginBottom: 12 }}>
                  Live face matched enrolled template. Starting liveness challenges...
                </div>
              </div>
            )}
            
"""

content = content.replace("{phase === 'ACCESS_GRANTED' && (", identity_verified_block + "{phase === 'ACCESS_GRANTED' && (")

with open(file_path, "w") as f:
    f.write(content)
