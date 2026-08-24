from app.services.session_manager import SESSION_CACHE
import time

SESSION_CACHE["test"] = {"stage": "INITIALIZED"}
print("Initial:", type(SESSION_CACHE["test"]), SESSION_CACHE["test"])

session = SESSION_CACHE["test"]
session["enrolled_embedding"] = [0.1, 0.2]
print("After modification via proxy:", SESSION_CACHE["test"])

SESSION_CACHE["test"]["stage"] = "VERIFIED"
print("After direct modification:", SESSION_CACHE["test"])

SESSION_CACHE["test"] = session
print("After assignment:", SESSION_CACHE["test"])
