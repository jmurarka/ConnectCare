import hashlib
import json
import random
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
import models

def compute_log_entry_hash(
    prev_hash: str, 
    admin_id: int, 
    action_type: str, 
    target_type: str, 
    target_id: Optional[int], 
    reason: str, 
    timestamp_str: str
) -> str:
    raw_str = f"{prev_hash}|{admin_id}|{action_type}|{target_type}|{target_id or ''}|{reason or ''}|{timestamp_str}"
    return hashlib.sha256(raw_str.encode('utf-8')).hexdigest()

def log_admin_action(
    db: Session,
    admin_id: int,
    action_type: str,
    target_type: str,
    target_id: Optional[int] = None,
    reason: Optional[str] = None,
    metadata: Optional[dict] = None,
    ip_address: str = "127.0.0.1"
) -> models.AdminAuditLog:
    last_log = db.query(models.AdminAuditLog).order_by(models.AdminAuditLog.id.desc()).first()
    prev_hash = last_log.entry_hash if last_log else "0" * 64
    
    now = datetime.utcnow()
    timestamp_str = now.strftime("%Y-%m-%d %H:%M:%S UTC")
    
    entry_hash = compute_log_entry_hash(
        prev_hash=prev_hash,
        admin_id=admin_id,
        action_type=action_type,
        target_type=target_type,
        target_id=target_id,
        reason=reason or "",
        timestamp_str=timestamp_str
    )

    log_entry = models.AdminAuditLog(
        admin_id=admin_id,
        action_type=action_type,
        target_type=target_type,
        target_id=target_id,
        reason=reason,
        metadata_json=json.dumps(metadata) if metadata else None,
        ip_address=ip_address,
        prev_hash=prev_hash,
        entry_hash=entry_hash,
        timestamp=now
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry

def verify_audit_log_chain(db: Session) -> dict:
    logs = db.query(models.AdminAuditLog).order_by(models.AdminAuditLog.id.asc()).all()
    if not logs:
        return {"chain_verified": True, "total_logs": 0, "corrupted_log_id": None}

    expected_prev = "0" * 64
    for l in logs:
        if l.prev_hash != expected_prev:
            return {"chain_verified": False, "total_logs": len(logs), "corrupted_log_id": l.id}

        timestamp_str = l.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")
        computed = compute_log_entry_hash(
            prev_hash=l.prev_hash,
            admin_id=l.admin_id,
            action_type=l.action_type,
            target_type=l.target_type,
            target_id=l.target_id,
            reason=l.reason or "",
            timestamp_str=timestamp_str
        )
        if computed != l.entry_hash:
            return {"chain_verified": False, "total_logs": len(logs), "corrupted_log_id": l.id}

        expected_prev = l.entry_hash

    return {"chain_verified": True, "total_logs": len(logs), "corrupted_log_id": None}

def create_otp_challenge(db: Session, user_id: int, purpose: str = "elevated_access") -> tuple[models.OtpChallenge, str]:
    # Generate 6-digit OTP code
    raw_code = f"{random.randint(100000, 999999)}"
    code_hash = hashlib.sha256(raw_code.encode('utf-8')).hexdigest()
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    challenge = models.OtpChallenge(
        user_id=user_id,
        purpose=purpose,
        code_hash=code_hash,
        expires_at=expires_at,
        attempts=0,
        max_attempts=5,
        created_at=datetime.utcnow()
    )
    db.add(challenge)
    db.commit()
    db.refresh(challenge)
    return challenge, raw_code

def verify_otp_challenge(db: Session, challenge_id: int, input_code: str) -> bool:
    challenge = db.query(models.OtpChallenge).filter(models.OtpChallenge.id == challenge_id).first()
    if not challenge:
        return False

    if challenge.verified_at or challenge.expires_at < datetime.utcnow() or challenge.attempts >= challenge.max_attempts:
        return False

    challenge.attempts += 1
    input_hash = hashlib.sha256(input_code.strip().encode('utf-8')).hexdigest()
    
    if input_hash == challenge.code_hash:
        challenge.verified_at = datetime.utcnow()
        db.commit()
        return True
    
    db.commit()
    return False

def create_subject_notification(
    db: Session,
    user_id: int,
    message: str,
    related_admin_id: Optional[int] = None,
    related_action_id: Optional[int] = None,
    deferred_until: Optional[datetime] = None
) -> models.SubjectNotification:
    notif = models.SubjectNotification(
        user_id=user_id,
        message=message,
        related_admin_id=related_admin_id,
        related_action_id=related_action_id,
        created_at=datetime.utcnow(),
        deferred_until=deferred_until
    )
    db.add(notif)

    # Also log to main user Notifications table for visibility
    main_notif = models.Notification(
        user_id=user_id,
        type="admin_transparency_alert",
        message=message,
        related_type="admin_action",
        related_id=related_action_id
    )
    db.add(main_notif)
    db.commit()
    db.refresh(notif)
    return notif
