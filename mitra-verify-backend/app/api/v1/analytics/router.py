from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta, timezone
from app.core.database import get_db
from app.models.models import VerificationLog, ApiKey, ApiUsage
from app.schemas.schemas import AnalyticsOverview
from app.api.v1.auth.router import get_current_user
from app.models.models import User

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview", response_model=AnalyticsOverview)
async def get_overview(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Get user's API key IDs
    keys_result = await db.execute(select(ApiKey.id).where(ApiKey.user_id == current_user.id))
    key_ids = [r[0] for r in keys_result.fetchall()]

    if not key_ids:
        return AnalyticsOverview(
            total_requests=0, successful_verifications=0, failed_verifications=0, spoof_attempts=0,
            deepfake_attempts=0, identity_matches=0, no_face_detected=0, success_rate=0.0, avg_processing_time=0.0, active_api_keys=0
        )

    # Fetch counts grouped by result and api_type to apply exact formulas
    stmt = (
        select(VerificationLog.result, VerificationLog.api_type, func.count(VerificationLog.id))
        .where(VerificationLog.api_key_id.in_(key_ids))
        .group_by(VerificationLog.result, VerificationLog.api_type)
    )
    res = await db.execute(stmt)
    rows = res.fetchall()
    
    # Initialize counts for formula components
    counts = {
        "SUCCESS": 0,
        "FAILED": 0,
        "NO_FACE_DETECTED": 0,
        "SPOOF_DETECTED": 0,
        "SESSION_TERMINATED": 0,
        "IDENTITY_MATCH_SUCCESS": 0,
        "IDENTITY_MISMATCH": 0,
        "MULTIPLE_FACE": 0,
        "CAMERA_LOST": 0
    }
    
    # Process rows, mapping historical and new results
    for result_val, api_type, count in rows:
        norm_result = (result_val or "").upper()
        
        if norm_result in ("PASS", "SUCCESS"):
            if api_type == "enterprise":
                counts["IDENTITY_MATCH_SUCCESS"] += count
            counts["SUCCESS"] += count
        elif norm_result == "IDENTITY_MATCH_SUCCESS":
            counts["IDENTITY_MATCH_SUCCESS"] += count
            counts["SUCCESS"] += count
        elif norm_result in ("FAIL", "FAILED"):
            if api_type == "enterprise":
                counts["IDENTITY_MISMATCH"] += count
            counts["FAILED"] += count
        elif norm_result == "IDENTITY_MISMATCH":
            counts["IDENTITY_MISMATCH"] += count
            counts["FAILED"] += count
        elif norm_result in ("SPOOF", "SPOOF_DETECTED"):
            counts["SPOOF_DETECTED"] += count
        elif norm_result == "NO_FACE_DETECTED":
            counts["NO_FACE_DETECTED"] += count
        elif norm_result == "SESSION_TERMINATED":
            counts["SESSION_TERMINATED"] += count
        elif norm_result == "MULTIPLE_FACE":
            counts["MULTIPLE_FACE"] += count
            counts["FAILED"] += count
        elif norm_result == "CAMERA_LOST":
            counts["CAMERA_LOST"] += count
            counts["FAILED"] += count
        else:
            # any other status (e.g. error) maps to FAILED for total requests
            counts["FAILED"] += count

    # Total Requests = SUCCESS + FAILED + NO_FACE_DETECTED + SPOOF_DETECTED + SESSION_TERMINATED
    total_requests = (
        counts["SUCCESS"] +
        counts["FAILED"] +
        counts["NO_FACE_DETECTED"] +
        counts["SPOOF_DETECTED"] +
        counts["SESSION_TERMINATED"]
    )
    
    successful_verifications = counts["SUCCESS"]
    failed_verifications = counts["FAILED"]
    spoof_attempts = counts["SPOOF_DETECTED"]
    identity_matches = counts["IDENTITY_MATCH_SUCCESS"]

    deepfake = await db.execute(
        select(func.count(VerificationLog.id)).where(
            and_(VerificationLog.api_key_id.in_(key_ids), VerificationLog.deepfake_risk > 0.5)
        )
    )
    deepfake_attempts = deepfake.scalar() or 0

    avg_time = await db.execute(
        select(func.avg(VerificationLog.processing_time)).where(VerificationLog.api_key_id.in_(key_ids))
    )
    avg_processing = avg_time.scalar() or 0.0

    active_keys = await db.execute(
        select(func.count(ApiKey.id)).where(ApiKey.user_id == current_user.id, ApiKey.is_active == True)
    )
    active_count = active_keys.scalar() or 0

    success_rate = (successful_verifications / total_requests * 100) if total_requests > 0 else 0.0

    return AnalyticsOverview(
        total_requests=total_requests,
        successful_verifications=successful_verifications,
        failed_verifications=failed_verifications,
        spoof_attempts=spoof_attempts,
        deepfake_attempts=deepfake_attempts,
        identity_matches=identity_matches,
        no_face_detected=counts["NO_FACE_DETECTED"],
        success_rate=round(success_rate, 2),
        avg_processing_time=round(float(avg_processing), 2),
        active_api_keys=active_count
    )

@router.get("/usage")
async def get_usage(days: int = 30, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    keys_result = await db.execute(select(ApiKey.id).where(ApiKey.user_id == current_user.id))
    key_ids = [r[0] for r in keys_result.fetchall()]
    if not key_ids:
        return {"data": []}
    since = datetime.now(timezone.utc) - timedelta(days=days)
    logs = await db.execute(
        select(VerificationLog.created_at, VerificationLog.result, VerificationLog.api_type)
        .where(and_(VerificationLog.api_key_id.in_(key_ids), VerificationLog.created_at >= since))
        .order_by(VerificationLog.created_at)
    )
    rows = logs.fetchall()
    return {"data": [{"date": r[0].isoformat(), "result": r[1], "type": r[2]} for r in rows]}

@router.get("/threats")
async def get_threats(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    keys_result = await db.execute(select(ApiKey.id).where(ApiKey.user_id == current_user.id))
    key_ids = [r[0] for r in keys_result.fetchall()]
    if not key_ids:
        return {"threats": []}
    threats = await db.execute(
        select(VerificationLog).where(
            and_(
                VerificationLog.api_key_id.in_(key_ids),
                VerificationLog.result.notin_(["SUCCESS", "pass", "IDENTITY_MATCH_SUCCESS"])
            )
        ).order_by(VerificationLog.created_at.desc()).limit(50)
    )
    rows = threats.scalars().all()
    return {"threats": [{"id": r.id, "result": r.result, "confidence": r.confidence,
                          "spoof_score": r.spoof_score, "api_type": r.api_type,
                          "timestamp": r.created_at.isoformat()} for r in rows]}

@router.get("/realtime")
async def get_realtime(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return {
        "active_sessions": 1,
        "queries_per_second": 0.0,
        "cpu_usage_percent": 12.5,
        "memory_usage_percent": 45.2,
        "status": "nominal"
    }

@router.get("/telemetry")
async def get_telemetry_endpoint(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return {
        "status": "synchronized",
        "latency_ms": 120,
        "packet_loss_percent": 0.0,
        "connected_clients": 1
    }
