from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str
    role: Optional[str] = "trainee"
    education: Optional[str] = "B.Tech CS"
    current_role: Optional[str] = "Learner"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    full_name: str
    email: str
    role: str
    streak_days: Optional[int] = 1

class ProfileUpdate(BaseModel):
    education: Optional[str] = None
    current_role: Optional[str] = None
    experience_years: Optional[float] = None
    career_goal: Optional[str] = None
    weekly_hours_json: Optional[str] = None

class AvailabilityRequest(BaseModel):
    weekly_hours: Dict[str, float]

class DiagnosticSubmitRequest(BaseModel):
    answers: Dict[int, int]

class EnrollmentApprovalRequest(BaseModel):
    enrollment_id: int
    approve: bool
    notes: Optional[str] = None

class EnrollmentActionRequest(BaseModel):
    notes: Optional[str] = None

class BulkEnrollmentActionRequest(BaseModel):
    enrollment_ids: List[int]
    approve: bool
    notes: Optional[str] = None

class TrainerOverrideRequest(BaseModel):
    roadmap_id: int
    custom_items: List[Dict]
    notes: str

class SensitiveAccessRequest(BaseModel):
    pin: str
    otp: str
    target_user_id: int
    purpose: str

class CertificateIssueRequest(BaseModel):
    trainee_id: int
    course_id: int

class TrainerProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    education: Optional[str] = None
    current_role: Optional[str] = None

# --- Phase 2 Schemas ---

class CourseCreateRequest(BaseModel):
    code: str
    title: str
    description: Optional[str] = ""
    level: Optional[str] = "Beginner"
    duration_hours: Optional[int] = 40

class ConceptCreateRequest(BaseModel):
    code: str
    title: str
    description: Optional[str] = ""
    module_name: str
    order_index: Optional[int] = 1
    estimated_hours: Optional[float] = 4.0

class PrerequisiteCreateRequest(BaseModel):
    prerequisite_concept_id: int

class ResourceCreateRequest(BaseModel):
    title: str
    resource_type: str = "video" # video, pdf, notebook, link, github
    content_url: str
    description: Optional[str] = ""
    module_name: Optional[str] = ""

class QuestionCreateRequest(BaseModel):
    question_text: str
    options: List[str]
    correct_option_index: int
    explanation: Optional[str] = ""
    topic: Optional[str] = "General"
    concept_id: Optional[int] = None

class AssignmentCreateRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    concept_id: Optional[int] = None
    due_date: Optional[str] = None
    max_score: Optional[float] = 100.0

class GradeSubmissionRequest(BaseModel):
    grade: float
    feedback: Optional[str] = ""

class LessonCompleteRequest(BaseModel):
    concept_id: int
    resource_id: Optional[int] = None

# --- Phase 3 Schemas ---

class DiscussionPostCreateRequest(BaseModel):
    course_id: int
    concept_id: Optional[int] = None
    title: Optional[str] = None
    content: str
    parent_id: Optional[int] = None

class DiscussionPinRequest(BaseModel):
    is_pinned: bool

class DiscussionFlagRequest(BaseModel):
    is_flagged: bool

class RatingCreateRequest(BaseModel):
    course_id: int
    trainer_id: Optional[int] = None
    score: float
    comment: Optional[str] = ""

class CohortCreateRequest(BaseModel):
    name: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class CohortAddMemberRequest(BaseModel):
    trainee_id: int

class SubmissionCreateRequest(BaseModel):
    assignment_id: int
    content_url: str

class TraineeProfileUpdate(BaseModel):
    education: Optional[str] = None
    current_role: Optional[str] = None
    career_goal: Optional[str] = None

class AdminUserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    reason: str

class AdminDeactivateRequest(BaseModel):
    reason: str

class AdminOtpRequest(BaseModel):
    purpose: Optional[str] = "elevated_access"

class AdminElevatedPiiVerifyRequest(BaseModel):
    challenge_id: int
    code: str
    target_user_id: int
    reason: str
    is_break_glass: Optional[bool] = False

class AdminApprovalDecisionRequest(BaseModel):
    approve: bool
    review_reason: Optional[str] = None

class AdminCreateAccountRequest(BaseModel):
    full_name: str
    email: str
    password: str
    admin_tier: Optional[str] = "platform_admin"
    reason: str


