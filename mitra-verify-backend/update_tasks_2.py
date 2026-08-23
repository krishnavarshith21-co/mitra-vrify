file_path = "/Users/krishnavarshithkamanaboina/.gemini/antigravity-ide/brain/ff6fbf1a-ac1e-4601-8ce8-e290dae42950/task.md"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("[ ] **1. Backend - Secure Biometric Template**", "[x] **1. Backend - Secure Biometric Template**")
content = content.replace("[ ] Update `IdentityEnrollResponse`", "[x] Update `IdentityEnrollResponse`")
content = content.replace("[ ] Update `/identity/enroll` route logic", "[x] Update `/identity/enroll` route logic")
content = content.replace("[ ] Update `DemoProcessRequest`", "[x] Update `DemoProcessRequest`")

content = content.replace("[ ] **2. Frontend - Strip Template Logic**", "[x] **2. Frontend - Strip Template Logic**")
content = content.replace("[ ] Remove `enrolledEmbedding` state", "[x] Remove `enrolledEmbedding` state")
content = content.replace("[ ] Remove `enrolledEmbedding` passing", "[x] Remove `enrolledEmbedding` passing")
content = content.replace("[ ] Update `src/lib/api.ts`", "[x] Update `src/lib/api.ts`")

with open(file_path, "w") as f:
    f.write(content)
