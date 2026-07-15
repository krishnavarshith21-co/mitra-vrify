import asyncio
import time
import numpy as np
from unittest.mock import patch, MagicMock

import sys
import os
sys.path.append(os.path.abspath("mitra-verify-backend"))

from app.services.cv.mediapipe_engine import process_demo_frame, SESSION_CACHE

DUMMY_IMAGE = "data:image/jpeg;base64,invalid"

def create_mock_landmarks():
    mock_landmarks = MagicMock()
    pts = []
    for i in range(478):
        x = 0.1 + (0.8 * (i / 477))
        y = 0.1 + (0.8 * (i / 477))
        pts.append(MagicMock(x=x, y=y, z=0.5))
    mock_landmarks.landmark = pts
    return mock_landmarks

def print_result(scenario, cv_result):
    print(f"--- Scenario: {scenario} ---")
    print(f"identity_match: {cv_result.get('enrolled_matched', False)}")
    print(f"similarity: {cv_result.get('similarity_score', 0.0)}")
    print(f"confidence: {cv_result.get('face_confidence', 0.0)}")
    print(f"spoof_score: {cv_result.get('spoof_score', 0.0)}")
    print(f"challenge_result: {cv_result.get('challenge_passed', False)}")
    print(f"final_status: {cv_result.get('status', 'Unknown')}\n")

async def test_scenarios():
    print("Starting API 3 Validation Tests...\n")
    
    # 1. Happy Path
    with patch("app.services.cv.mediapipe_engine.global_face_mesh") as mock_mesh, \
         patch("app.services.cv.mediapipe_engine.global_face_analyzer") as mock_insight, \
         patch("app.services.cv.mediapipe_engine.b64_to_numpy", return_value=np.zeros((100, 100, 3), dtype=np.uint8)), \
         patch("app.services.cv.mediapipe_engine.cv2.Laplacian", return_value=np.random.randint(0, 255, (100, 100), dtype=np.uint8)), \
         patch("app.services.cv.mediapipe_engine._head_pose_3d", return_value=(0.0, 0.0, 0.0)), \
         patch("app.services.cv.mediapipe_engine._compute_cosine_similarity", return_value=(0.95, 0.05)), \
         patch("app.services.cv.mediapipe_engine._calculate_spoof_risk", return_value=0.01), \
         patch("app.services.cv.mediapipe_engine._evaluate_challenge", return_value={"passed": True}):
         
        mock_landmarks = create_mock_landmarks()
        mock_mesh.process.return_value = MagicMock(multi_face_landmarks=[mock_landmarks])
        mock_insight.get.return_value = [{"embedding": [0.1] * 512, "bbox": [0,0,100,100]}]

        res = process_demo_frame(
            image_b64=DUMMY_IMAGE,
            frame_id="1",
            session_id="happy_session",
            challenge_type="smile",
            enrolled_signature=None,
            enrolled_embedding=[0.1] * 512,
            api_type="enterprise"
        )
        print_result("1. Happy Path", res)

    # 2. Different Person
    with patch("app.services.cv.mediapipe_engine.global_face_mesh") as mock_mesh, \
         patch("app.services.cv.mediapipe_engine.global_face_analyzer") as mock_insight, \
         patch("app.services.cv.mediapipe_engine.b64_to_numpy", return_value=np.zeros((100, 100, 3), dtype=np.uint8)), \
         patch("app.services.cv.mediapipe_engine.cv2.Laplacian", return_value=np.random.randint(0, 255, (100, 100), dtype=np.uint8)), \
         patch("app.services.cv.mediapipe_engine._head_pose_3d", return_value=(0.0, 0.0, 0.0)), \
         patch("app.services.cv.mediapipe_engine._compute_cosine_similarity", return_value=(0.40, 0.60)), \
         patch("app.services.cv.mediapipe_engine._calculate_spoof_risk", return_value=0.01), \
         patch("app.services.cv.mediapipe_engine._evaluate_challenge", return_value={"passed": True}):
         
        mock_landmarks = create_mock_landmarks()
        mock_mesh.process.return_value = MagicMock(multi_face_landmarks=[mock_landmarks])
        mock_insight.get.return_value = [{"embedding": [0.2] * 512, "bbox": [0,0,100,100]}]

        res = process_demo_frame(
            image_b64=DUMMY_IMAGE,
            frame_id="2",
            session_id="different_person_session",
            challenge_type="smile",
            enrolled_signature=None,
            enrolled_embedding=[0.1] * 512,
            api_type="enterprise"
        )
        print_result("2. Different Person", res)

    # 3 & 4. Challenge Failure (Timeout)
    with patch("app.services.cv.mediapipe_engine.global_face_mesh") as mock_mesh, \
         patch("app.services.cv.mediapipe_engine.b64_to_numpy", return_value=np.zeros((100, 100, 3), dtype=np.uint8)):
        mock_mesh.process.return_value = MagicMock(multi_face_landmarks=[])
        SESSION_CACHE["timeout_session"] = {"last_face_seen": time.time(), "challenge_start_time": time.time() - 35.0, "last_active": time.time()}
        
        res = process_demo_frame(
            image_b64=DUMMY_IMAGE,
            frame_id="3",
            session_id="timeout_session",
            challenge_type="turn_left",
            enrolled_signature=None,
            enrolled_embedding=[0.1] * 512,
            api_type="enterprise"
        )
        print_result("3 & 4. Challenge Failure / Timeout", res)

    # 5. Spoof Test
    with patch("app.services.cv.mediapipe_engine.global_face_mesh") as mock_mesh, \
         patch("app.services.cv.mediapipe_engine.global_face_analyzer") as mock_insight, \
         patch("app.services.cv.mediapipe_engine.b64_to_numpy", return_value=np.zeros((100, 100, 3), dtype=np.uint8)), \
         patch("app.services.cv.mediapipe_engine.cv2.Laplacian", return_value=np.random.randint(0, 255, (100, 100), dtype=np.uint8)), \
         patch("app.services.cv.mediapipe_engine._head_pose_3d", return_value=(0.0, 0.0, 0.0)), \
         patch("app.services.cv.mediapipe_engine._compute_cosine_similarity", return_value=(0.95, 0.05)), \
         patch("app.services.cv.mediapipe_engine._calculate_spoof_risk", return_value=0.85): 
         
        mock_landmarks = create_mock_landmarks()
        mock_mesh.process.return_value = MagicMock(multi_face_landmarks=[mock_landmarks])
        mock_insight.get.return_value = [{"embedding": [0.1] * 512, "bbox": [0,0,100,100]}]

        res = process_demo_frame(
            image_b64=DUMMY_IMAGE,
            frame_id="4",
            session_id="spoof_session",
            challenge_type="smile",
            enrolled_signature=None,
            enrolled_embedding=[0.1] * 512,
            api_type="enterprise"
        )
        print_result("5. Spoof Test", res)

    # 6. Multiple Faces
    with patch("app.services.cv.mediapipe_engine.global_face_mesh") as mock_mesh, \
         patch("app.services.cv.mediapipe_engine.global_face_analyzer") as mock_insight, \
         patch("app.services.cv.mediapipe_engine.b64_to_numpy", return_value=np.zeros((100, 100, 3), dtype=np.uint8)), \
         patch("app.services.cv.mediapipe_engine._head_pose_3d", return_value=(0.0, 0.0, 0.0)), \
         patch("app.services.cv.mediapipe_engine.cv2.Laplacian", return_value=np.random.randint(0, 255, (100, 100), dtype=np.uint8)):
         
        mock_landmarks = create_mock_landmarks()
        mock_mesh.process.return_value = MagicMock(multi_face_landmarks=[mock_landmarks, mock_landmarks])
        
        res = process_demo_frame(
            image_b64=DUMMY_IMAGE,
            frame_id="5",
            session_id="multi_face_session",
            challenge_type="smile",
            enrolled_signature=None,
            enrolled_embedding=[0.1] * 512,
            api_type="enterprise"
        )
        print_result("6. Multiple Faces", res)

if __name__ == "__main__":
    asyncio.run(test_scenarios())
