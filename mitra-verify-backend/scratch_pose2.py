import cv2
import numpy as np
import math

w, h = 640, 480
# simulate a centered face BUT with person's left eye on the right side of the image
# This is how images actually look!
image_points = np.array([
    (w/2, h/2),                 # Nose tip (center)
    (w/2, h/2 + 100),           # Chin (down)
    (w/2 - 70, h/2 - 50),       # Left eye corner (wait, person's left is on the RIGHT side of the image? Yes. Let's make it w/2 + 70 to test)
    (w/2 + 70, h/2 - 50),       # Let's see what happens if we feed it what MediaPipe feeds it.
    (w/2 - 45, h/2 + 45),       
    (w/2 + 45, h/2 + 45),       
], dtype="double")
# Actually, wait. In MediaPipe, landmark 263 is Left Eye (person's left, image RIGHT side).
# So 263 x is > 33 x.
# In original code, index 2 is landmark 263. Index 3 is landmark 33.
# Let's replicate original code EXACTLY.
image_points_real = np.array([
    (w/2, h/2),                 # Nose 1
    (w/2, h/2 + 100),           # Chin 199 (image down)
    (w/2 + 70, h/2 - 50),       # 263 Left eye (image right)
    (w/2 - 70, h/2 - 50),       # 33 Right eye (image left)
    (w/2 + 45, h/2 + 45),       # 291 Left Mouth (image right)
    (w/2 - 45, h/2 + 45),       # 61 Right mouth (image left)
], dtype="double")

model_points = np.array([
    (0.0, 0.0, 0.0),             # Nose tip
    (0.0, -330.0, -65.0),        # Chin
    (-225.0, 170.0, -135.0),     # Left eye corner (wait, this is NEGATIVE X)
    (225.0, 170.0, -135.0),      # Right eye corner (this is POSITIVE X)
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
    model_points, image_points_real, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_ITERATIVE
)
rmat, _ = cv2.Rodrigues(rotation_vector)
sy = math.sqrt(rmat[0,0] * rmat[0,0] + rmat[1,0] * rmat[1,0])
x = math.atan2(rmat[2,1], rmat[2,2])
y = math.atan2(-rmat[2,0], sy)
z = math.atan2(rmat[1,0], rmat[0,0])

pitch = x * 180.0 / math.pi
yaw = y * 180.0 / math.pi
roll = z * 180.0 / math.pi
print(f"Yaw={-yaw:.2f} Pitch={-pitch:.2f} Roll={roll:.2f}")

