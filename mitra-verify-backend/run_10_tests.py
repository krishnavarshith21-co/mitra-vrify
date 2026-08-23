import requests, json, time
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

BASE = 'http://localhost:8000/api/v1'

# We'll use a hack to inject state into the backend for precise testing
# The backend exposes no direct way to manipulate SESSION_CACHE, so we'll 
# use a small inline script to inject it via an exec call on a new endpoint
# Wait, I don't have an exec endpoint. 
# But I can modify mediapipe_engine temporarily to expose a test hook!
