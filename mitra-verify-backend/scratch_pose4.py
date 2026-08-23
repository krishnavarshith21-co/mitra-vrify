import cv2
import numpy as np
import math

w, h = 640, 480
# Simulate MediaPipe output (origin top-left, +X Right, +Y Down)
image_points = np.array([
    (w/2, h/2),                 # Nose 1
    (w/2, h/2 + 100),           # Chin 199 (down)
    (w/2 + 70, h/2 - 50),       # 263 Left eye (right of image, above nose)
    (w/2 - 70, h/2 - 50),       # 33 Right eye (left of image, above nose)
    (w/2 + 45, h/2 + 45),       # 291 Left Mouth (right of image, below nose)
    (w/2 - 45, h/2 + 45),       # 61 Right mouth (left of image, below nose)
], dtype="double")

# Inverted model points to match Image +Y Down
model_points = np.array([
    (0.0, 0.0, 0.0),             # Nose tip
    (0.0, 330.0, -65.0),         # Chin (Y positive)
    (225.0, -170.0, -135.0),     # Left eye corner (+X, -Y)
    (-225.0, -170.0, -135.0),    # Right eye corner (-X, -Y)
    (150.0, 150.0, -125.0),      # Left Mouth corner (+X, +Y)
    (-150.0, 150.0, -125.0)      # Right mouth corner (-X, +Y)
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

# Note: if model axes perfectly match image axes, solving PnP yields the true camera rotation.
# Because the "camera" is looking into the screen, Pitch > 0 usually means looking down, etc.
print(f"Yaw={yaw:.2f} Pitch={pitch:.2f} Roll={roll:.2f}")

