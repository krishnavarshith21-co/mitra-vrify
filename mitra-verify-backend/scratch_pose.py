import cv2
import numpy as np
import math

w, h = 640, 480
# simulate a centered face
image_points = np.array([
    (w/2, h/2),                 # Nose tip (center)
    (w/2, h/2 + 100),           # Chin (down)
    (w/2 + 70, h/2 - 50),       # Left eye (person's left, image right)
    (w/2 - 70, h/2 - 50),       # Right eye (person's right, image left)
    (w/2 + 45, h/2 + 45),       # Left mouth (person's left, image right)
    (w/2 - 45, h/2 + 45),       # Right mouth
], dtype="double")

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
sy = math.sqrt(rmat[0,0] * rmat[0,0] + rmat[1,0] * rmat[1,0])
x = math.atan2(rmat[2,1], rmat[2,2])
y = math.atan2(-rmat[2,0], sy)
z = math.atan2(rmat[1,0], rmat[0,0])

pitch = x * 180.0 / math.pi
yaw = y * 180.0 / math.pi
roll = z * 180.0 / math.pi
print("Original code raw angles:", pitch, yaw, roll)

pitch = -pitch
yaw = -yaw
if pitch > 180: pitch -= 360
elif pitch < -180: pitch += 360
if yaw > 180: yaw -= 360
elif yaw < -180: yaw += 360
print("Original code adjusted:", pitch, yaw, roll)
