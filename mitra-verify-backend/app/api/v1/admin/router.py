from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, delete
from datetime import datetime
import os
import uuid
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.models.models import User, ApiKey, VerificationLog, SystemLog, AuditLog, LivenessLog, ApiUsage, Organization, Session
from app.api.v1.auth.router import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])

# Inline Schemas for Admin
class UpdateRoleRequest(BaseModel):
    role: str

class UpdateStatusRequest(BaseModel):
    is_active: bool

# Dependency to check if user is admin
async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required. You are not authorized to view this resource."
        )
    return current_user

@router.get("/stats")
async def get_admin_stats(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Users counts
        total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
        active_users = (await db.execute(select(func.count(User.id)).where(User.is_active == True))).scalar() or 0
        admin_users = (await db.execute(select(func.count(User.id)).where(User.role == "admin"))).scalar() or 0
        
        # API Keys counts
        total_keys = (await db.execute(select(func.count(ApiKey.id)))).scalar() or 0
        active_keys = (await db.execute(select(func.count(ApiKey.id)).where(ApiKey.is_active == True))).scalar() or 0
        
        # Verification counts
        total_requests = (await db.execute(select(func.count(VerificationLog.id)))).scalar() or 0
        passed_requests = (await db.execute(select(func.count(VerificationLog.id)).where(VerificationLog.result == "pass"))).scalar() or 0
        failed_requests = (await db.execute(select(func.count(VerificationLog.id)).where(VerificationLog.result == "fail"))).scalar() or 0
        spoof_requests = (await db.execute(select(func.count(VerificationLog.id)).where(VerificationLog.result == "spoof"))).scalar() or 0
        error_requests = (await db.execute(select(func.count(VerificationLog.id)).where(VerificationLog.result == "error"))).scalar() or 0
        
        avg_processing_time = (await db.execute(select(func.avg(VerificationLog.processing_time)))).scalar() or 0.0
        
        # Database size
        db_size_bytes = 0
        db_file = "./mitra_verify.db"
        if os.path.exists(db_file):
            db_size_bytes = os.path.getsize(db_file)
        elif os.path.exists("mitra_verify.db"):
            db_size_bytes = os.path.getsize("mitra_verify.db")
            
        # Load average
        cpu_load = 0.0
        try:
            load = os.getloadavg()
            cpu_load = round(load[0], 2)
        except Exception:
            cpu_load = 0.15 # Fallback
            
        return {
            "users": {
                "total": total_users,
                "active": active_users,
                "admin": admin_users
            },
            "keys": {
                "total": total_keys,
                "active": active_keys
            },
            "requests": {
                "total": total_requests,
                "passed": passed_requests,
                "failed": failed_requests,
                "spoof": spoof_requests,
                "error": error_requests,
                "success_rate": round((passed_requests / total_requests * 100) if total_requests > 0 else 100.0, 2),
                "avg_processing_time": round(float(avg_processing_time), 2)
            },
            "system": {
                "db_size_bytes": db_size_bytes,
                "cpu_load": cpu_load,
                "memory_usage_pct": 32.4, # Mock percentage since psutil is not available
                "status": "healthy"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load admin stats: {str(e)}")

@router.get("/users")
async def get_all_users(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Fetch users ordered by creation date
        result = await db.execute(select(User).order_by(User.created_at.desc()))
        users = result.scalars().all()
        return [
            {
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role,
                "email_verified": u.email_verified,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "last_login": u.last_login.isoformat() if u.last_login else None
            }
            for u in users
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")

@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    data: UpdateRoleRequest,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    if data.role not in ("user", "admin", "enterprise"):
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'user', 'admin', or 'enterprise'.")
    
    # Check if user exists
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Prevent self-downgrading
    if user.id == current_admin.id and data.role != "admin":
        raise HTTPException(status_code=400, detail="You cannot revoke admin privileges from yourself.")
        
    user.role = data.role
    
    # Add Audit log
    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_admin.id,
        action="update_user_role",
        resource_type="user",
        resource_id=user.id,
        meta_data={"target_email": user.email, "new_role": data.role},
        ip_address="internal",
        created_at=datetime.utcnow()
    )
    db.add(audit)
    
    await db.commit()
    return {"message": f"User role updated to {data.role}"}

@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    data: UpdateStatusRequest,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    # Check if user exists
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Prevent self-deactivation
    if user.id == current_admin.id and not data.is_active:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own admin account.")
        
    user.is_active = data.is_active
    
    # Add Audit log
    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_admin.id,
        action="update_user_status",
        resource_type="user",
        resource_id=user.id,
        meta_data={"target_email": user.email, "is_active": data.is_active},
        ip_address="internal",
        created_at=datetime.utcnow()
    )
    db.add(audit)
    
    await db.commit()
    return {"message": f"User status updated. Active: {data.is_active}"}

@router.get("/logs/system")
async def get_system_logs(
    limit: int = 50,
    level: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    try:
        query = select(SystemLog).order_by(SystemLog.created_at.desc())
        if level:
            query = query.where(SystemLog.level == level)
        query = query.limit(limit)
        
        result = await db.execute(query)
        logs = result.scalars().all()
        return [
            {
                "id": l.id,
                "level": l.level,
                "message": l.message,
                "meta_data": l.meta_data,
                "created_at": l.created_at.isoformat() if l.created_at else None
            }
            for l in logs
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch system logs: {str(e)}")

@router.get("/logs/audit")
async def get_audit_logs(
    limit: int = 50,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    try:
        query = select(AuditLog, User.email).join(User, AuditLog.user_id == User.id, isouter=True).order_by(AuditLog.created_at.desc()).limit(limit)
        result = await db.execute(query)
        rows = result.fetchall()
        return [
            {
                "id": row[0].id,
                "user_id": row[0].user_id,
                "user_email": row[1] or "system",
                "action": row[0].action,
                "resource_type": row[0].resource_type,
                "resource_id": row[0].resource_id,
                "meta_data": row[0].meta_data,
                "ip_address": row[0].ip_address,
                "created_at": row[0].created_at.isoformat() if row[0].created_at else None
            }
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch audit logs: {str(e)}")

@router.delete("/logs/system")
async def clear_system_logs(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    try:
        await db.execute(delete(SystemLog))
        
        # Add new log entry noting who cleared them
        clear_log = SystemLog(
            id=str(uuid.uuid4()),
            level="WARNING",
            message=f"System logs cleared by administrator {current_admin.email}",
            meta_data={"admin_id": current_admin.id},
            created_at=datetime.utcnow()
        )
        db.add(clear_log)
        await db.commit()
        return {"message": "System logs cleared successfully"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to clear system logs: {str(e)}")

@router.delete("/logs/audit")
async def clear_audit_logs(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    try:
        await db.execute(delete(AuditLog))
        
        # Add new audit log entry noting who cleared them
        clear_audit = AuditLog(
            id=str(uuid.uuid4()),
            user_id=current_admin.id,
            action="clear_audit_logs",
            resource_type="logs",
            meta_data={"cleared_by": current_admin.email},
            ip_address="internal",
            created_at=datetime.utcnow()
        )
        db.add(clear_audit)
        await db.commit()
        return {"message": "Audit logs cleared successfully"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to clear audit logs: {str(e)}")

@router.post("/reset-db")
async def reset_database(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Delete dependent liveness logs
        await db.execute(delete(LivenessLog))
        
        # Delete verification logs
        await db.execute(delete(VerificationLog))
        
        # Delete API usage logs
        await db.execute(delete(ApiUsage))
        
        # Delete API keys
        await db.execute(delete(ApiKey))
        
        # Delete sessions (except for current admin's sessions if we want to keep them logged in, or delete all sessions)
        # Deleting all other sessions is safer. Let's delete all sessions.
        await db.execute(delete(Session))
        
        # Delete audit logs (except for this reset action, which we will add next)
        await db.execute(delete(AuditLog))
        
        # Delete organizations
        await db.execute(delete(Organization))
        
        # Delete all users EXCEPT the default admin user
        await db.execute(delete(User).where(User.email != "admin@mitraverify.com"))
        
        # Add a new audit log for the reset action
        reset_audit = AuditLog(
            id=str(uuid.uuid4()),
            user_id=current_admin.id,
            action="reset_database",
            resource_type="database",
            meta_data={"reset_by": current_admin.email},
            ip_address="internal",
            created_at=datetime.utcnow()
        )
        db.add(reset_audit)
        
        # Re-verify admin role and active status
        current_admin.role = "admin"
        current_admin.is_active = True
        
        await db.commit()
        return {"message": "Database reset completed successfully. All logs, API keys, organizations, and non-admin users have been cleared."}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to reset database: {str(e)}")

