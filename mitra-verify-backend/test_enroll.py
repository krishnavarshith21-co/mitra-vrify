import asyncio
import base64
import numpy as np
import cv2
import requests

def run():
    img = np.zeros((320, 320, 3), dtype=np.uint8)
    cv2.circle(img, (160, 160), 50, (255, 255, 255), -1)
    # Add fake facial landmarks or just use a real face?
    # Wait, the mediapipe engine won't detect a face in a white circle.
    # If there's no face, process_demo_frame will just return NO_FACE.
    pass

run()
