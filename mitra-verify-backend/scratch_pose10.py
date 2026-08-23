from app.services.cv.mediapipe_engine import global_face_mesh, _head_pose_3d
import cv2
import numpy as np

img = cv2.imread('screenshot_test.png')
h, w = img.shape[:2]
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
results = global_face_mesh.process(img_rgb)
if results.multi_face_landmarks:
    landmarks = results.multi_face_landmarks[0].landmark
    yaw, pitch, roll = _head_pose_3d(landmarks, w, h)
    print(f"Yaw: {yaw}, Pitch: {pitch}, Roll: {roll}")
else:
    print("No face detected in screenshot.")
