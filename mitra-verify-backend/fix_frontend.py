import re

file_path = "/Users/krishnavarshithkamanaboina/Desktop/mitra-vrify/mitra-verify/src/app/demo/enterprise/page.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Remove the state
content = re.sub(r"const \[enrolledEmbedding, setEnrolledEmbedding\] = useState\<number\[\] \| null\>\(null\);\n", "", content)

# Remove the set calls
content = content.replace("setEnrolledEmbedding(res.data.embedding_vector);", "")
content = content.replace("setEnrolledEmbedding(null);", "")
content = re.sub(r"try \{ setEnrolledEmbedding\(JSON\.parse\(stored\)\); \} catch \(e\) \{ console\.warn\('Failed to parse', e\); \}\n", "", content)
content = content.replace("setEnrolledEmbedding(null);", "")

# Fix the processDemoFrame call
old_call = r"const res = await livenessAPI\.processDemoFrame\(base64Image, sessionId, activeChallengeId, hasFaceEnrolled \? \(enrolledEmbedding \|\| undefined\) : undefined, 'enterprise'\);"
new_call = "const res = await livenessAPI.processDemoFrame(base64Image, sessionId, activeChallengeId, 'enterprise');"
content = re.sub(old_call, new_call, content)

with open(file_path, "w") as f:
    f.write(content)
