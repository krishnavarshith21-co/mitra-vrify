from app.services.cv.mediapipe_engine import global_face_mesh, _head_pose_3d
import cv2
import numpy as np

img = cv2.imread('face.jpg')
h, w = img.shape[:2]
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
results = global_face_mesh.process(img_rgb)
if results.multi_face_landmarks:
    landmarks = results.multi_face_landmarks[0].landmark
    yaw, pitch, roll = _head_pose_3d(landmarks, w, h)
    print(f"Yaw: {yaw}, Pitch: {pitch}, Roll: {roll}")
    
    # print landmarks
    l1 = landmarks[1]
    l199 = landmarks[199]
    l263 = landmarks[263]
    l33 = landmarks[33]
    print(f"Nose(1): x={l1.x}, y={l1.y}")
    print(f"Chin(199): x={l199.x}, y={l199.y}")
    print(f"LeftEye(263): x={l263.x}, y={l263.y}")
    print(f"RightEye(33): x={l33.x}, y={l33.y}")
