import os

files_to_delete = [
    "debug_identity.py",
    "prove_fix.py",
    "run_e2e_tests.py",
    "run_enterprise_tests.py",
    "mitra-verify/local_test.py",
    "test_liveness.py",
    "local_test.py"
]

for f in files_to_delete:
    if os.path.exists(f): os.remove(f)

print("Removed remaining scratch scripts.")
