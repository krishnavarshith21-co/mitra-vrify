import numpy as np

def log_enrollment(session_id, embedding_vector):
    exists = embedding_vector is not None
    dim = len(embedding_vector) if exists and not isinstance(embedding_vector[0], list) else (len(embedding_vector[0]) if exists and isinstance(embedding_vector[0], list) else 0)
    
    if exists and not isinstance(embedding_vector[0], list):
        norm = sum(x*x for x in embedding_vector) ** 0.5
    elif exists and isinstance(embedding_vector[0], list):
        norm = sum(x*x for x in embedding_vector[0]) ** 0.5
    else:
        norm = 0

    print(f"\n[ENROLL]")
    print(f"session_id: {session_id}")
    print(f"embedding exists: {exists}")
    print(f"embedding dimension: {dim}")
    print(f"embedding norm: {norm}\n")
