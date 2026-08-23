from app.services.cv.mediapipe_engine import global_face_mesh
import cv2
import numpy as np
import math

img = cv2.imread('face.jpg')
h, w = img.shape[:2]
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
results = global_face_mesh.process(img_rgb)
landmarks = results.multi_face_landmarks[0].landmark
print("LeftMouth(291):", landmarks[291].x, landmarks[291].y)
print("RightMouth(61):", landmarks[61].x, landmarks[61].y)
