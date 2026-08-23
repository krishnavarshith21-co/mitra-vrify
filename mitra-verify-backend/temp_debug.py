import re
with open("app/main.py", "r") as f:
    content = f.read()

new_content = """from fastapi.exceptions import RequestValidationError
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

if "validation_exception_handler" not in content:
    content = content.replace("app = FastAPI(", new_content + "\napp = FastAPI(")
    with open("app/main.py", "w") as f:
        f.write(content)
