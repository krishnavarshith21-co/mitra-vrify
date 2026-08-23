file_path = "/Users/krishnavarshithkamanaboina/.gemini/antigravity-ide/brain/ff6fbf1a-ac1e-4601-8ce8-e290dae42950/task.md"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("[ ]", "[x]")
content = content.replace("[/]", "[x]")
# Leave validation empty for manual check
content = content.replace("[x] **4. Validation**", "[ ] **4. Validation**")
content = content.replace("[x] Verify happy path.", "[ ] Verify happy path.")
content = content.replace("[x] Verify failure path (Identity).", "[ ] Verify failure path (Identity).")
content = content.replace("[x] Verify failure path (Continuous Monitoring).", "[ ] Verify failure path (Continuous Monitoring).")

with open(file_path, "w") as f:
    f.write(content)
