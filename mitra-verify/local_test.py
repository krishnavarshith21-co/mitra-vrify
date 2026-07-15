import cv2
# pyright: reportAttributeAccessIssue=false
import mediapipe as mp
import numpy as np
import sys
sys.path.append("/Users/krishnavarshithkamanaboina/Desktop/mitra-vrify/mitra-verify-backend")
from app.services.cv.mediapipe_engine import _calculate_face_embedding

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True)

def get_emb(img_path):
    img = cv2.imread(img_path)
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    res = face_mesh.process(rgb)
    if not res.multi_face_landmarks: return None
    return np.array(_calculate_face_embedding(img, res.multi_face_landmarks[0].landmark))

emb1 = get_emb("/Users/krishnavarshithkamanaboina/.gemini/antigravity-ide/brain/4a3feaf1-8d48-475d-a9d1-8d42d735a74e/enrolled_user_1784051335340.png")
emb2 = get_emb("/Users/krishnavarshithkamanaboina/.gemini/antigravity-ide/brain/4a3feaf1-8d48-475d-a9d1-8d42d735a74e/different_user_1784051352186.png")
emb3 = get_emb("/Users/krishnavarshithkamanaboina/.gemini/antigravity-ide/brain/4a3feaf1-8d48-475d-a9d1-8d42d735a74e/printed_photo_1784051369354.png")
emb4 = get_emb("/Users/krishnavarshithkamanaboina/.gemini/antigravity-ide/brain/4a3feaf1-8d48-475d-a9d1-8d42d735a74e/phone_replay_1784051388448.png")

if emb1 is not None and emb2 is not None:
    dist = np.linalg.norm(emb1 - emb2)
    print("Enrolled vs Different:", dist)

if emb1 is not None and emb3 is not None:
    dist = np.linalg.norm(emb1 - emb3)
    print("Enrolled vs Printed:", dist)

if emb1 is not None and emb4 is not None:
    dist = np.linalg.norm(emb1 - emb4)
    print("Enrolled vs Replay:", dist)
    
