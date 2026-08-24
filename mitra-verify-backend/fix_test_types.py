import os
import glob
import re

files_to_delete = [
    "scratch_pose2.py", "scratch_pose3.py", "scratch_pose4.py", "scratch_pose5.py",
    "scratch_pose6.py", "scratch_pose7.py", "scratch_pose8.py", "scratch_pose9.py",
    "scratch_pose10.py", "test_down_pose.py", "test_sim.py", "test_state_machine.py",
    "validate_api3.py", "test_identity.py", "trace_enrollment.py", "test_cache.py", "test_cv.py"
]

for f in glob.glob("scratch_*.py"):
    if os.path.exists(f): os.remove(f)

for f in files_to_delete:
    if os.path.exists(f): os.remove(f)

print("Removed scratch scripts.")

