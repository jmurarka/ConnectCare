from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="trainee") # trainee, trainer, admin
    
    # Extended Admin & Account Status Fields
    is_active = Column(Boolean, default=True)
    admin_tier = Column(String, nullable=True, default="super_admin") # super_admin, platform_admin, support_admin, compliance_auditor
    deactivated_reason = Column(Text, nullable=True)
    deactivated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    deactivated_at = Column(DateTime, nullable=True)
    password_reset_required = Column(Boolean, default=False)
    
    # Protected PII Fields
    aadhaar_masked = Column(String, nullable=True, default="XXXX-XXXX-4892")
    govt_id_type = Column(String, nullable=True, default="National Identity Card")
    phone_number = Column(String, nullable=True, default="+91 98765 43210")

    profile = relationship("Profile", back_populates="user", uselist=False)
    enrollments = relationship("Enrollment", back_populates="trainee")

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    education = Column(String, default="B.Tech Computer Science")
    current_role = Column(String, default="Junior Data Analyst / Trainee")
    experience_years = Column(Float, default=1.0)
    career_goal = Column(String, default="Become AI/ML & LLM Engineer")
    weekly_hours_json = Column(Text, default='{"Mon":2,"Tue":2,"Wed":2,"Thu":3,"Fri":2,"Sat":4,"Sun":3}')
    streak_days = Column(Integer, default=7)
    last_active_date = Column(String, default=datetime.utcnow().strftime("%Y-%m-%d"))

    user = relationship("User", back_populates="profile")

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True) # AIML-00, AIML-01, AIML-02 etc.
    title = Column(String, nullable=False)
    description = Column(Text)
    level = Column(String, default="Beginner") # Beginner, Intermediate, Advanced
    duration_hours = Column(Integer, default=40)
    trainer_name = Column(String, default="Dr. Rajesh Kumar")
    prerequisite_threshold = Column(Float, default=0.60) # 60% requirement

    concepts = relationship("Concept", back_populates="course")
    assessments = relationship("Assessment", back_populates="course")

class Concept(Base):
    __tablename__ = "concepts"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    code = Column(String, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    module_name = Column(String, nullable=False)
    order_index = Column(Integer, default=1)
    estimated_hours = Column(Float, default=4.0)

    course = relationship("Course", back_populates="concepts")
    resources = relationship("Resource", back_populates="concept")

class Prerequisite(Base):
    __tablename__ = "prerequisites"

    id = Column(Integer, primary_key=True, index=True)
    concept_id = Column(Integer, ForeignKey("concepts.id"))
    prerequisite_concept_id = Column(Integer, ForeignKey("concepts.id"))

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    concept_id = Column(Integer, ForeignKey("concepts.id"), nullable=True)
    module_name = Column(String)
    title = Column(String, nullable=False)
    resource_type = Column(String, default="video") # video, pdf, github, link, notebook
    content_url = Column(String, nullable=False)
    description = Column(Text)

    concept = relationship("Concept", back_populates="resources")

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    title = Column(String, nullable=False)
    assessment_type = Column(String, default="module") # diagnostic, module, final
    passing_score = Column(Float, default=0.60)

    course = relationship("Course", back_populates="assessments")
    questions = relationship("Question", back_populates="assessment")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"))
    concept_id = Column(Integer, ForeignKey("concepts.id"), nullable=True)
    question_text = Column(Text, nullable=False)
    options_json = Column(Text, nullable=False) # JSON list of strings
    correct_option_index = Column(Integer, nullable=False)
    explanation = Column(Text)
    topic = Column(String, default="General")

    assessment = relationship("Assessment", back_populates="questions")

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    trainee_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    status = Column(String, default="approval_pending") # diagnostic_pending, approval_pending, approved, rejected, completed
    diagnostic_score = Column(Float, default=0.0)
    enrolled_at = Column(DateTime, default=datetime.utcnow)

    trainee = relationship("User", back_populates="enrollments")

class MasteryState(Base):
    __tablename__ = "mastery_states"

    id = Column(Integer, primary_key=True, index=True)
    trainee_id = Column(Integer, ForeignKey("users.id"))
    concept_id = Column(Integer, ForeignKey("concepts.id"))
    mastery_score = Column(Float, default=0.0) # 0.0 to 1.0

class Roadmap(Base):
    __tablename__ = "roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    trainee_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    weekly_capacity_hours = Column(Float, default=16.0)
    estimated_completion_date = Column(String)
    is_trainer_overridden = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("RoadmapItem", back_populates="roadmap")

class RoadmapItem(Base):
    __tablename__ = "roadmap_items"

    id = Column(Integer, primary_key=True, index=True)
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id"))
    concept_id = Column(Integer, ForeignKey("concepts.id"))
    week_number = Column(Integer, default=1)
    estimated_hours = Column(Float, default=4.0)
    status = Column(String, default="in_progress") # completed, in_progress, locked, skipped_mastered, needs_revision
    reason_explanation = Column(Text)

    roadmap = relationship("Roadmap", back_populates="items")

class TrainerOverride(Base):
    __tablename__ = "trainer_overrides"

    id = Column(Integer, primary_key=True, index=True)
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id"))
    trainer_id = Column(Integer, ForeignKey("users.id"))
    notes = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    trainee_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    certificate_code = Column(String, unique=True, index=True)
    issued_date = Column(String, default=datetime.utcnow().strftime("%d %B %Y"))

class SensitiveAccessLog(Base):
    __tablename__ = "sensitive_access_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"))
    target_user_id = Column(Integer, ForeignKey("users.id"))
    purpose = Column(String, default="Verification of Identity")
    timestamp = Column(DateTime, default=datetime.utcnow)

class TrainerCourseAssignment(Base):
    __tablename__ = "trainer_course_assignments"

    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    assigned_at = Column(DateTime, default=datetime.utcnow)

class TrainerActionLog(Base):
    __tablename__ = "trainer_action_logs"

    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("users.id"))
    action_type = Column(String, nullable=False) # "enrollment_approve" | "enrollment_reject" | "roadmap_override" | "certificate_issue"
    target_type = Column(String, nullable=False) # "enrollment" | "roadmap" | "certificate" | "concept"
    target_id = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class LessonProgress(Base):
    __tablename__ = "lesson_progress"

    id = Column(Integer, primary_key=True, index=True)
    trainee_id = Column(Integer, ForeignKey("users.id"))
    concept_id = Column(Integer, ForeignKey("concepts.id"))
    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=True)
    status = Column(String, default="completed") # "not_started" | "in_progress" | "completed"
    time_spent_minutes = Column(Float, default=15.0)
    completed_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String, nullable=False) # "enrollment_decision" | "roadmap_overridden" | "assignment_graded" | "at_risk_alert"
    message = Column(Text, nullable=False)
    related_type = Column(String, nullable=True)
    related_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    concept_id = Column(Integer, ForeignKey("concepts.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(String, nullable=True)
    max_score = Column(Float, default=100.0)

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"))
    trainee_id = Column(Integer, ForeignKey("users.id"))
    content_url = Column(String, nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    grade = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    graded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    graded_at = Column(DateTime, nullable=True)
    status = Column(String, default="submitted") # "submitted" | "graded" | "revision_requested"

class DiscussionPost(Base):
    __tablename__ = "discussion_posts"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    concept_id = Column(Integer, ForeignKey("concepts.id"), nullable=True)
    author_id = Column(Integer, ForeignKey("users.id"))
    author_role = Column(String, default="trainee")
    parent_id = Column(Integer, ForeignKey("discussion_posts.id"), nullable=True)
    title = Column(String, nullable=True)
    content = Column(Text, nullable=False)
    is_pinned = Column(Boolean, default=False)
    is_flagged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    trainee_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    trainer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    score = Column(Float, nullable=False) # 1.0 to 5.0
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Cohort(Base):
    __tablename__ = "cohorts"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    name = Column(String, nullable=False)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class CohortMember(Base):
    __tablename__ = "cohort_members"

    id = Column(Integer, primary_key=True, index=True)
    cohort_id = Column(Integer, ForeignKey("cohorts.id"))
    trainee_id = Column(Integer, ForeignKey("users.id"))
    joined_at = Column(DateTime, default=datetime.utcnow)

class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"))
    trainee_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Float, default=0.0)
    percentage = Column(Float, default=0.0)
    attempt_number = Column(Integer, default=1)
    started_at = Column(DateTime, default=datetime.utcnow)
    submitted_at = Column(DateTime, default=datetime.utcnow)

class AssessmentAnswer(Base):
    __tablename__ = "assessment_answers"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("assessment_attempts.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    selected_option = Column(Integer, nullable=False)
    is_correct = Column(Boolean, default=False)

# --- Anti-Corruption Admin Governance Models ---

class OtpChallenge(Base):
    __tablename__ = "otp_challenges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    purpose = Column(String, nullable=False) # "admin_login", "elevated_access", "high_risk_action"
    code_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, default=5)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ElevatedAccessGrant(Base):
    __tablename__ = "elevated_access_grants"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scope = Column(String, nullable=False, default="aadhaar,phone")
    reason = Column(Text, nullable=False)
    otp_challenge_id = Column(Integer, ForeignKey("otp_challenges.id"), nullable=True)
    approval_request_id = Column(Integer, nullable=True)
    granted_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    is_break_glass = Column(Boolean, default=False)

class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(Integer, primary_key=True, index=True)
    requested_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    action_type = Column(String, nullable=False) # "admin_create", "admin_revoke", "bulk_pii_export", "impersonation", "bulk_deactivate"
    target_type = Column(String, nullable=True)
    target_id = Column(Integer, nullable=True)
    payload_json = Column(Text, nullable=True)
    reason = Column(Text, nullable=False)
    status = Column(String, default="pending") # "pending", "approved", "rejected", "expired"
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)

class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action_type = Column(String, nullable=False)
    target_type = Column(String, nullable=False)
    target_id = Column(Integer, nullable=True)
    reason = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)
    ip_address = Column(String, default="127.0.0.1")
    prev_hash = Column(String, nullable=False)
    entry_hash = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

class ImpersonationSession(Base):
    __tablename__ = "impersonation_sessions"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approval_request_id = Column(Integer, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    ip_address = Column(String, default="127.0.0.1")

class SubjectNotification(Base):
    __tablename__ = "subject_notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    related_admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    related_action_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)
    deferred_until = Column(DateTime, nullable=True)




