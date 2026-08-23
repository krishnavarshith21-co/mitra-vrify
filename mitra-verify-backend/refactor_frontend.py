import re

file_path = "/Users/krishnavarshithkamanaboina/Desktop/mitra-vrify/mitra-verify/src/app/demo/enterprise/page.tsx"
with open(file_path, "r") as f:
    content = f.read()

# 1. Update Phase type
old_phase = r"const \[phase, setPhase\] = useState\<'IDLE' \| 'ENROLLMENT' \| 'CHALLENGES' \| 'MONITORING'\>\('IDLE'\);"
new_phase = "type Phase = 'IDLE' | 'ENROLLMENT' | 'ENROLLED' | 'IDENTITY_VERIFYING' | 'IDENTITY_VERIFIED' | 'LIVENESS_CHALLENGES' | 'LIVENESS_VERIFIED' | 'ACCESS_GRANTED' | 'CONTINUOUS_MONITORING' | 'ACCESS_REVOKED' | 'FAILED';\n  const [phase, setPhase] = useState<Phase>('IDLE');\n  const phaseRef = useRef<Phase>('IDLE');\n  useEffect(() => { phaseRef.current = phase; }, [phase]);"
content = re.sub(old_phase, new_phase, content)

# 2. Replace enrollmentStatus with phase
# We will just map the backend state to phase
# Old code:
# const backendState = data.enrollment_progress.state;
# setEnrollmentStatus(prev => { ... return backendState; });
# We change this to setPhase(backendState) if it's one of the valid phases
sync_block_old = r"          const backendState = data\.enrollment_progress\.state;[\s\S]*?console\.log\(`\[ENROLL DEBUG\].*?\);\n        \}"
sync_block_new = """          const backendState = data.enrollment_progress.state as Phase;
          setPhase(prev => {
            if (prev === 'ENROLLING' && enrollRequestInFlightRef.current) return prev;
            return backendState;
          });
          console.log(`[STATE SYNC] backend_state=${backendState} in_flight=${enrollRequestInFlightRef.current}`);
        }"""
content = re.sub(sync_block_old, sync_block_new, content)

# 3. Replace enrollmentStatusRef.current === 'READY' with phaseRef.current === 'READY'
content = content.replace("enrollmentStatusRef.current !== 'READY'", "phaseRef.current !== 'READY'")
content = content.replace("enrollmentStatusRef.current === 'READY'", "phaseRef.current === 'READY'")

# 4. Remove EnrollmentStatus definition and useState entirely
content = re.sub(r"type EnrollmentStatus = .*?;\n", "", content)
content = re.sub(r"const \[enrollmentStatus, setEnrollmentStatus\] = useState\<EnrollmentStatus\>\('IDLE'\);\n", "", content)
content = re.sub(r"const enrollmentStatusRef = useRef\<EnrollmentStatus\>\('IDLE'\);\n", "", content)
content = re.sub(r"useEffect\(\(\) => \{ enrollmentStatusRef\.current = enrollmentStatus; \}, \[enrollmentStatus\]\);\n", "", content)

# Replace remaining `enrollmentStatus` variables with `phase` in UI renders
content = content.replace("enrollmentStatus === 'IDLE'", "phase === 'IDLE'")
content = content.replace("enrollmentStatus === 'CAMERA_ACTIVE'", "phase === 'IDLE'")
content = content.replace("enrollmentStatus === 'COLLECTING'", "phase === 'COLLECTING'")
content = content.replace("enrollmentStatus === 'COVERAGE_INCOMPLETE'", "phase === 'COVERAGE_INCOMPLETE'")
content = content.replace("enrollmentStatus === 'READY'", "phase === 'READY'")
content = content.replace("enrollmentStatus === 'ENROLLING'", "phase === 'ENROLLING'")
content = content.replace("enrollmentStatus === 'ENROLLED'", "phase === 'ENROLLED'")
content = content.replace("enrollmentStatus === 'FAILED'", "phase === 'FAILED'")

content = content.replace("enrollmentStatusRef.current = 'IDLE'", "setPhase('IDLE')")
content = content.replace("enrollmentStatus !== 'READY'", "phase !== 'READY'")

with open(file_path, "w") as f:
    f.write(content)
