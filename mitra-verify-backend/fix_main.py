import re

file_path = "/Users/krishnavarshithkamanaboina/Desktop/mitra-vrify/mitra-verify-backend/app/main.py"
with open(file_path, "r") as f:
    content = f.read()

# Remove the exception handler block
bad_block = """from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi import Request

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"OMG VALIDATION ERROR: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )
"""
content = content.replace(bad_block, "")

with open(file_path, "w") as f:
    f.write(content)
