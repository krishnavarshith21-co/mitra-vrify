import re

file_path = "/Users/krishnavarshithkamanaboina/Desktop/mitra-vrify/mitra-verify/src/app/demo/enterprise/page.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Replace the step tracker (lines ~1584 to ~1607)
step_tracker_old = r"""                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: phase === 'ENROLLMENT' \? 1 : \(phase === 'IDLE' \? 0\.3 : 0\.6\) \}\}>
.*
                  <div style=\{\{ display: 'flex', alignItems: 'center', gap: 10, opacity: phase === 'MONITORING' \? 1 : 0\.5 \}\}\>
                    <div style=\{\{ width: 24, height: 24, borderRadius: '50%', background: phase === 'MONITORING' \? '#00ff8822' : '#334155', border: `1px solid \$\{phase === 'MONITORING' \? '#00ff88' : '#475569'\}`, display: 'flex', alignItems: 'center', justifyContent: 'center' \}\}\>
                      <span style=\{\{ fontSize: 10, color: phase === 'MONITORING' \? '#00ff88' : '#475569' \}\}\>3\</span\>
                    \</div\>
                    <div style=\{\{ fontSize: 13, fontWeight: phase === 'MONITORING' \? 700 : 500, color: phase === 'MONITORING' \? '#00ff88' : '#94a3b8' \}\}\>Continuous Monitoring\</div\>
                  \</div\>"""

step_tracker_new = """                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: (phase === 'IDLE' || phase === 'ENROLLMENT' || phase === 'ENROLLED' || phase === 'COLLECTING' || phase === 'COVERAGE_INCOMPLETE' || phase === 'READY' || phase === 'ENROLLING') ? 1 : 0.5 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#00d4ff22', border: `1px solid #00d4ff`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 10, color: '#00d4ff' }}>1</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#00d4ff' }}>Enrollment</div>
                  </div>
                  <div style={{ width: 2, height: 16, background: 'rgba(255,255,255,0.1)', marginLeft: 11, marginTop: -8, marginBottom: -8 }} />
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: (phase === 'IDENTITY_VERIFYING' || phase === 'IDENTITY_VERIFIED') ? 1 : 0.5 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: phase === 'IDENTITY_VERIFYING' ? '#ffb80022' : '#334155', border: `1px solid ${phase === 'IDENTITY_VERIFYING' ? '#ffb800' : '#475569'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 10, color: phase === 'IDENTITY_VERIFYING' ? '#ffb800' : '#475569' }}>2</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: phase === 'IDENTITY_VERIFYING' ? '#ffb800' : '#94a3b8' }}>Identity</div>
                  </div>
                  <div style={{ width: 2, height: 16, background: 'rgba(255,255,255,0.1)', marginLeft: 11, marginTop: -8, marginBottom: -8 }} />
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: (phase === 'LIVENESS_CHALLENGES' || phase === 'LIVENESS_VERIFIED') ? 1 : 0.5 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: phase === 'LIVENESS_CHALLENGES' ? '#00d4ff22' : '#334155', border: `1px solid ${phase === 'LIVENESS_CHALLENGES' ? '#00d4ff' : '#475569'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 10, color: phase === 'LIVENESS_CHALLENGES' ? '#00d4ff' : '#475569' }}>3</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: phase === 'LIVENESS_CHALLENGES' ? '#00d4ff' : '#94a3b8' }}>Liveness</div>
                  </div>
                  <div style={{ width: 2, height: 16, background: 'rgba(255,255,255,0.1)', marginLeft: 11, marginTop: -8, marginBottom: -8 }} />
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: (phase === 'CONTINUOUS_MONITORING' || phase === 'ACCESS_GRANTED') ? 1 : 0.5 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: phase === 'CONTINUOUS_MONITORING' ? '#00ff8822' : '#334155', border: `1px solid ${phase === 'CONTINUOUS_MONITORING' ? '#00ff88' : '#475569'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 10, color: phase === 'CONTINUOUS_MONITORING' ? '#00ff88' : '#475569' }}>4</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: phase === 'CONTINUOUS_MONITORING' ? '#00ff88' : '#94a3b8' }}>Monitoring</div>
                  </div>"""

import re
content = re.sub(step_tracker_old, step_tracker_new, content, flags=re.DOTALL)

with open(file_path, "w") as f:
    f.write(content)
