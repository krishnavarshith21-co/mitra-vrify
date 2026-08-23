from app.services.cv.mediapipe_engine import global_face_mesh
import cv2
import numpy as np
import math

img = cv2.imread('face.jpg')
h, w = img.shape[:2]
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
results = global_face_mesh.process(img_rgb)
landmarks = results.multi_face_landmarks[0].landmark

image_points = np.array([
    (float(landmarks[1].x) * w, float(landmarks[1].y) * h),
    (float(landmarks[199].x) * w, float(landmarks[199].y) * h),
    (float(landmarks[263].x) * w, float(landmarks[263].y) * h),
    (float(landmarks[33].x) * w, float(landmarks[33].y) * h),
    (float(landmarks[291].x) * w, float(landmarks[291].y) * h),
    (float(landmarks[61].x) * w, float(landmarks[61].y) * h)
], dtype="double")

# The standard model points provided by MediaPipe's examples:
model_points = np.array([
    (0.0, 0.0, 0.0),             # Nose tip
    (0.0, -330.0, -65.0),        # Chin
    (-225.0, 170.0, -135.0),     # Left eye corner
    (225.0, 170.0, -135.0),      # Right eye corner
    (-150.0, -150.0, -125.0),    # Left Mouth corner
    (150.0, -150.0, -125.0)      # Right mouth corner
])

focal_length = w
center = (w / 2, h / 2)
camera_matrix = np.array(
    [[focal_length, 0, center[0]],
     [0, focal_length, center[1]],
     [0, 0, 1]], dtype="double"
)
dist_coeffs = np.zeros((4, 1))

success, rotation_vector, translation_vector = cv2.solvePnP(
    model_points, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_ITERATIVE
)

rmat, _ = cv2.Rodrigues(rotation_vector)
print("Rotation Matrix:")
print(rmat)

