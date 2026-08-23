import re

file_path = "/Users/krishnavarshithkamanaboina/Desktop/mitra-vrify/mitra-verify/src/lib/api.ts"
with open(file_path, "r") as f:
    content = f.read()

old_func = r"  processDemoFrame: \(image: string, sessionId\?: string, challengeType\?: string, enrolledEmbedding\?: number\[\], apiType\?: string, frameId\?: string\) =>\n    api\.post\('/liveness/demo/process', \{ image, frame_id: frameId, session_id: sessionId, challenge_type: challengeType, enrolled_embedding: enrolledEmbedding, api_type: apiType \}\),"
new_func = """  processDemoFrame: (image: string, sessionId?: string, challengeType?: string, apiType?: string, frameId?: string) =>
    api.post('/liveness/demo/process', { image, frame_id: frameId, session_id: sessionId, challenge_type: challengeType, api_type: apiType }),"""

content = re.sub(old_func, new_func, content)

with open(file_path, "w") as f:
    f.write(content)
