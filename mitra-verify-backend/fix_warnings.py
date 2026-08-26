import json

lines_to_fix = [
    982, 983, 984, 985, 986, 1081, 1082, 1283, 1462, 1464, 1469, 1525, 1526, 1527, 
    1657, 1658, 1902, 1903, 2670, 2746, 2764, 2772, 2926, 2951, 3165, 3176, 3177, 3178, 
    3205, 3206, 3270, 3271, 3272, 3275, 3276, 3277, 3278, 3279, 3280, 3281, 3284, 3290, 
    3291, 3292, 3293, 3294, 3295, 3296, 3299, 3302, 3347, 3348
]

with open('app/services/cv/mediapipe_engine.py', 'r') as f:
    lines = f.readlines()

import re

for lnum in lines_to_fix:
    idx = lnum - 1 # 0-indexed
    # Use regex to strip float(expr), int(expr), bool(expr) wrapping around simple variables
    # e.g. float(yaw) -> yaw, float(face_confidence) -> face_confidence
    # We'll just do simple string replacements if we know what they are.
    line = lines[idx]
    
    # regex pattern for float(xyz), int(xyz), bool(xyz)
    # matching the innermost parenthesis group (not perfect, but works for simple vars)
    # e.g. float(face_confidence) -> face_confidence
    line = re.sub(r'float\(([a-zA-Z0-9_]+)\)', r'\1', line)
    line = re.sub(r'int\(([a-zA-Z0-9_]+)\)', r'\1', line)
    line = re.sub(r'bool\(([a-zA-Z0-9_]+)\)', r'\1', line)
    
    lines[idx] = line

with open('app/services/cv/mediapipe_engine.py', 'w') as f:
    f.writelines(lines)

