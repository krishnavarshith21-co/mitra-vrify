import traceback
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select

from app.api.v1.admin.router import router as admin_router
from app.api.v1.analytics.router import router as analytics_router
from app.api.v1.auth.router import router as auth_router
from app.api.v1.identity.router import router as identity_router
from app.api.v1.keys.router import router as keys_router
from app.api.v1.liveness.router import router as liveness_router
from app.api.v1.applications.router import router as applications_router
from app.api.v1.verification.router import router as verification_router
from app.core.config import settings
from app.core.database import AsyncSessionLocal, init_db
from app.core.security import hash_password
from app.models.models import AuditLog, SystemLog, User, UserRole


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    
    # Seeding default admin user and log trails
    async with AsyncSessionLocal() as db:
        # Check if admin user exists
        admin_result = await db.execute(select(User).where(User.email == "admin@mitraverify.com"))
        admin = admin_result.scalar_one_or_none()
        
        admin_id = str(uuid.uuid4())
        if not admin:
            admin = User(
                id=admin_id,
                email="admin@mitraverify.com",
                password_hash=hash_password("admin123"),
                full_name="System Administrator",
                role=UserRole.admin,
                email_verified=True,
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(admin)
            await db.commit()
            print("Seeded default admin user: admin@mitraverify.com / admin123")
        else:
            admin_id = admin.id

        # Seed system logs if empty
        logs_check = await db.execute(select(SystemLog).limit(1))
        if not logs_check.scalar_one_or_none():
            mock_logs = [
                SystemLog(
                    id=str(uuid.uuid4()),
                    level="INFO",
                    message="Database engine initialized and migration check passed.",
                    meta_data={"driver": "aiosqlite"},
                    created_at=datetime.now(timezone.utc) - timedelta(minutes=50)
                ),
                SystemLog(
                    id=str(uuid.uuid4()),
                    level="INFO",
                    message="Mediapipe computer vision models loaded successfully.",
                    meta_data={"tasks": ["face_detector", "face_landmarker"]},
                    created_at=datetime.now(timezone.utc) - timedelta(minutes=45)
                ),
                SystemLog(
                    id=str(uuid.uuid4()),
                    level="INFO",
                    message="Face anti-spoof checks compiled.",
                    meta_data={"version": "1.4.2"},
                    created_at=datetime.now(timezone.utc) - timedelta(minutes=40)
                ),
                SystemLog(
                    id=str(uuid.uuid4()),
                    level="WARNING",
                    message="Verification latency spike detected on Basic Liveness API.",
                    meta_data={"latency_ms": 1240, "threshold_ms": 1000},
                    created_at=datetime.now(timezone.utc) - timedelta(minutes=30)
                ),
                SystemLog(
                    id=str(uuid.uuid4()),
                    level="ERROR",
                    message="Face matching failed due to insufficient illumination.",
                    meta_data={"brightness_score": 0.12, "min_required": 0.3},
                    created_at=datetime.now(timezone.utc) - timedelta(minutes=15)
                ),
                SystemLog(
                    id=str(uuid.uuid4()),
                    level="INFO",
                    message="API keys refreshed and validation caches synchronized.",
                    meta_data={"keys_synced": 3},
                    created_at=datetime.now(timezone.utc) - timedelta(minutes=5)
                )
            ]
            for log in mock_logs:
                db.add(log)
            await db.commit()
            print("Seeded mock system logs.")

        # Seed audit logs if empty
        audits_check = await db.execute(select(AuditLog).limit(1))
        if not audits_check.scalar_one_or_none():
            mock_audits = [
                AuditLog(
                    id=str(uuid.uuid4()),
                    user_id=admin_id,
                    action="admin_seeded",
                    resource_type="system",
                    meta_data={"details": "System database initialized with default configuration"},
                    ip_address="127.0.0.1",
                    created_at=datetime.now(timezone.utc) - timedelta(minutes=50)
                ),
                AuditLog(
                    id=str(uuid.uuid4()),
                    user_id=admin_id,
                    action="generate_api_key",
                    resource_type="api_key",
                    meta_data={"prefix": "mv_live_ba12", "type": "enterprise"},
                    ip_address="127.0.0.1",
                    created_at=datetime.now(timezone.utc) - timedelta(minutes=35)
                ),
                AuditLog(
                    id=str(uuid.uuid4()),
                    user_id=admin_id,
                    action="login",
                    resource_type="session",
                    meta_data={"user_agent": "Mozilla/5.0 Chrome/124.0.0"},
                    ip_address="127.0.0.1",
                    created_at=datetime.now(timezone.utc) - timedelta(minutes=25)
                )
            ]
            for audit in mock_audits:
                db.add(audit)
            await db.commit()
            print("Seeded mock audit logs.")
    
    # ─── CV Engine Startup Diagnostics ───────────────────────
    print("=" * 60)
    print("[STARTUP] CV ENGINE DIAGNOSTICS")
    try:
        from app.services.cv.mediapipe_engine import (
            CV2_AVAILABLE,
            CV2_INIT_ERROR,
            INSIGHTFACE_AVAILABLE,
            INSIGHTFACE_INIT_ERROR,
            MP_AVAILABLE,
            MP_INIT_ERROR,
            global_face_mesh,
        )
        print(f"  MP_AVAILABLE:         {MP_AVAILABLE}")
        print(f"  CV2_AVAILABLE:        {CV2_AVAILABLE}")
        print(f"  INSIGHTFACE_AVAILABLE:{INSIGHTFACE_AVAILABLE}")
        print(f"  global_face_mesh:     {'LOADED' if global_face_mesh is not None else 'NONE'}")
        
        if MP_INIT_ERROR:
            print(f"  [ERROR] MP_INIT_ERROR:\n{MP_INIT_ERROR}")
        if CV2_INIT_ERROR:
            print(f"  [ERROR] CV2_INIT_ERROR:\n{CV2_INIT_ERROR}")
        if INSIGHTFACE_INIT_ERROR:
            print(f"  [WARNING] INSIGHTFACE_INIT_ERROR:\n{INSIGHTFACE_INIT_ERROR}")

        # Quick FaceMesh smoke test with a synthetic image
        if MP_AVAILABLE and CV2_AVAILABLE and global_face_mesh is not None:
            import numpy as np
            # Create a small test image (blank) just to confirm process() doesn't crash
            test_img = np.zeros((100, 100, 3), dtype=np.uint8)
            test_result = global_face_mesh.process(test_img)
            test_mfl = getattr(test_result, "multi_face_landmarks", None)
            print(f"  FaceMesh smoke test: process() returned {type(test_result).__name__} (faces: {len(test_mfl) if test_mfl else 0})")
            print("[STARTUP] ✓ CV Engine is READY")
        else:
            print("[STARTUP] ✗ CV Engine is NOT AVAILABLE — see errors above")
    except Exception as e:
        print(f"[STARTUP] CV diagnostics exception: {e}\n{traceback.format_exc()}")
    print("=" * 60)
            
    yield

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi import Request

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"OMG VALIDATION ERROR: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

app = FastAPI(
    title="MITRA VERIFY API",
    description="Enterprise Face Liveness, Identity Verification & Continuous Authentication",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(keys_router, prefix="/api/v1")
app.include_router(liveness_router, prefix="/api/v1")
app.include_router(identity_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(applications_router, prefix="/api/v1")
app.include_router(verification_router, prefix="/api/v1")

import time

from app.core.logging import logger


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    # Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    response.headers["X-Process-Time"] = str(process_time)
    
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    tb = traceback.format_exc()
    logger.error(f"Unhandled Error: {request.method} {request.url}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error", "error_code": "server_error"})

@app.get("/telemetry")
@app.get("/api/v1/telemetry")
async def telemetry_check():
    return {
        "status": "synchronized",
        "service": "mitra-verify-telemetry",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "sqlite"
    }

@app.get("/")
async def root():
    return {
        "product": "MITRA VERIFY",
        "tagline": "Enterprise Face Liveness, Identity Verification & Continuous Authentication",
        "version": "1.0.0",
        "license": "MIT",
        "docs": "/docs",
        "endpoints": {
            "basic_liveness": "POST /api/v1/liveness/basic",
            "advanced_liveness": "POST /api/v1/liveness/advanced",
            "identity_verify": "POST /api/v1/identity/verify"
        }
    }

@app.get("/health")
@app.get("/api/health")
@app.get("/api/v1/health")
async def health():
    return {"status": "ok", "version": "1.0"}
