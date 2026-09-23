import json
import random
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime

import models
import schemas
from database import engine, get_db, SessionLocal
from services.kg_engine import (
    build_trainee_kg, 
    build_trainer_course_competency, 
    build_admin_platform_kg,
    check_prerequisite_cycle
)
from services.planning_engine import generate_personalized_roadmap
from services.auth_service import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    get_optional_current_user,
    require_trainer,
    require_admin,
    require_trainer_or_admin,
    require_trainee
)


models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Capacity Connect API",
    description="Knowledge-Graph-Driven Organizational Learning & Capacity Building Platform API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def auto_seed_db():
    try:
        import database
        db = database.SessionLocal()
        user_count = db.query(models.User).count()
        if user_count == 0:
            print("[INFO] Empty database detected on startup. Executing automatic database seeding...")
            import seed
            seed.seed_database()
        db.close()
    except Exception as e:
        print(f"[WARN] Auto-seed check skipped or non-fatal error: {e}")

# ----------------------------
# 1. AUTHENTICATION & USERS
# ----------------------------

@app.post("/api/auth/register", response_model=schemas.TokenResponse)
def register(req: schemas.RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered")

    pw_hash = get_password_hash(req.password)
    user_role = req.role if req.role in ["trainee", "trainer", "admin"] else "trainee"
    
    new_user = models.User(
        email=req.email,
        password_hash=pw_hash,
        full_name=req.full_name,
        role=user_role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    profile = models.Profile(
        user_id=new_user.id,
        education=req.education or "B.Tech CS",
        current_role=req.current_role or "Learner",
        career_goal="AI/ML Engineer",
        streak_days=1
    )
    db.add(profile)
    db.commit()

    if new_user.role == "trainee":
        initial_enr = models.Enrollment(
            trainee_id=new_user.id,
            course_id=3,
            status="approved",
            diagnostic_score=0.75
        )
        db.add(initial_enr)
        db.commit()

    token = create_access_token({"sub": str(new_user.id), "role": new_user.role})


    streak = profile.streak_days if profile else 1
    return schemas.TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=new_user.id,
        full_name=new_user.full_name,
        email=new_user.email,
        role=new_user.role,
        streak_days=streak
    )

@app.post("/api/auth/login", response_model=schemas.TokenResponse)
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    streak = user.profile.streak_days if user.profile else 1
    
    return schemas.TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        streak_days=streak
    )

@app.get("/api/auth/me", response_model=schemas.TokenResponse)
def get_auth_me(current_user: models.User = Depends(get_current_user)):
    token = create_access_token({"sub": str(current_user.id), "role": current_user.role})
    streak = current_user.profile.streak_days if current_user.profile else 1
    return schemas.TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        role=current_user.role,
        streak_days=streak
    )

@app.post("/api/auth/logout")
def logout(current_user: models.User = Depends(get_current_user)):
    return {"message": "Successfully logged out"}

@app.post("/api/auth/switch-role")
def switch_role(role: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.role == role).first()
    if not user:
        raise HTTPException(status_code=404, detail="Role user not found")
    
    token = create_access_token({"sub": str(user.id), "role": user.role})
    streak = user.profile.streak_days if user.profile else 1
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "streak_days": streak
    }

@app.get("/api/users/{user_id}/profile")
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile = db.query(models.Profile).filter(models.Profile.user_id == user_id).first()
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "education": profile.education if profile else "B.Tech CS",
        "current_role": profile.current_role if profile else "Trainee",
        "career_goal": profile.career_goal if profile else "AI/ML Engineer",
        "weekly_hours_json": json.loads(profile.weekly_hours_json) if profile and profile.weekly_hours_json else {},
        "streak_days": profile.streak_days if profile else 7
    }

# ----------------------------
# 2. COURSES & CURRICULUM STUDIO (AUTHORING)
# ----------------------------

@app.get("/api/courses")
def list_courses(db: Session = Depends(get_db)):
    courses = db.query(models.Course).all()
    return courses

@app.get("/api/courses/{course_id}")
def get_course_detail(course_id: int, db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    concepts = db.query(models.Concept).filter(models.Concept.course_id == course_id).order_by(models.Concept.order_index).all()
    resources = db.query(models.Resource).filter(models.Resource.course_id == course_id).all()
    
    return {
        "course": course,
        "concepts": concepts,
        "resources": resources
    }

@app.post("/api/trainer/courses")
def create_course(
    req: schemas.CourseCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    course = models.Course(
        code=req.code,
        title=req.title,
        description=req.description,
        level=req.level,
        duration_hours=req.duration_hours,
        trainer_name=current_user.full_name
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    # Assign trainer to course
    assignment = models.TrainerCourseAssignment(trainer_id=current_user.id, course_id=course.id)
    db.add(assignment)

    # Log action
    log = models.TrainerActionLog(
        trainer_id=current_user.id,
        action_type="course_create",
        target_type="course",
        target_id=course.id,
        notes=f"Created course {course.code}"
    )
    db.add(log)
    db.commit()

    return course

@app.put("/api/trainer/courses/{course_id}")
def update_course(
    course_id: int,
    req: schemas.CourseCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    course.code = req.code
    course.title = req.title
    course.description = req.description
    course.level = req.level
    course.duration_hours = req.duration_hours
    db.commit()

    return course

@app.get("/api/trainer/courses/{course_id}/concepts")
def get_course_concepts(course_id: int, db: Session = Depends(get_db)):
    concepts = db.query(models.Concept).filter(models.Concept.course_id == course_id).order_by(models.Concept.order_index).all()
    res = []
    for c in concepts:
        prereqs = db.query(models.Prerequisite).filter(models.Prerequisite.concept_id == c.id).all()
        prereq_ids = [p.prerequisite_concept_id for p in prereqs]
        resources = db.query(models.Resource).filter(models.Resource.concept_id == c.id).all()
        res.append({
            "id": c.id,
            "code": c.code,
            "title": c.title,
            "description": c.description,
            "module_name": c.module_name,
            "order_index": c.order_index,
            "estimated_hours": c.estimated_hours,
            "prerequisite_concept_ids": prereq_ids,
            "resources_count": len(resources)
        })
    return res

@app.post("/api/trainer/courses/{course_id}/concepts")
def create_concept(
    course_id: int,
    req: schemas.ConceptCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    concept = models.Concept(
        course_id=course_id,
        code=req.code,
        title=req.title,
        description=req.description,
        module_name=req.module_name,
        order_index=req.order_index,
        estimated_hours=req.estimated_hours
    )
    db.add(concept)
    db.commit()
    db.refresh(concept)

    log = models.TrainerActionLog(
        trainer_id=current_user.id,
        action_type="concept_create",
        target_type="concept",
        target_id=concept.id,
        notes=f"Added concept {concept.title}"
    )
    db.add(log)
    db.commit()

    return concept

@app.put("/api/trainer/concepts/{concept_id}")
def update_concept(
    concept_id: int,
    req: schemas.ConceptCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    concept = db.query(models.Concept).filter(models.Concept.id == concept_id).first()
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found")

    concept.code = req.code
    concept.title = req.title
    concept.description = req.description
    concept.module_name = req.module_name
    concept.order_index = req.order_index
    concept.estimated_hours = req.estimated_hours
    db.commit()

    return concept

@app.delete("/api/trainer/concepts/{concept_id}")
def delete_concept(
    concept_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    concept = db.query(models.Concept).filter(models.Concept.id == concept_id).first()
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found")

    # Remove prerequisites & resources linked
    db.query(models.Prerequisite).filter(
        (models.Prerequisite.concept_id == concept_id) | (models.Prerequisite.prerequisite_concept_id == concept_id)
    ).delete()
    db.query(models.Resource).filter(models.Resource.concept_id == concept_id).delete()
    db.delete(concept)
    db.commit()

    return {"message": "Concept deleted successfully"}

# DAG Prerequisite Edge Management with Acyclicity Validation
@app.post("/api/trainer/concepts/{concept_id}/prerequisites")
def add_prerequisite_edge(
    concept_id: int,
    req: schemas.PrerequisiteCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    if check_prerequisite_cycle(db, concept_id, req.prerequisite_concept_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="DAG Cycle Error: Adding this prerequisite creates a circular dependency loop in the concept graph."
        )

    existing = db.query(models.Prerequisite).filter(
        models.Prerequisite.concept_id == concept_id,
        models.Prerequisite.prerequisite_concept_id == req.prerequisite_concept_id
    ).first()

    if existing:
        return {"message": "Prerequisite edge already exists"}

    prereq = models.Prerequisite(
        concept_id=concept_id,
        prerequisite_concept_id=req.prerequisite_concept_id
    )
    db.add(prereq)

    log = models.TrainerActionLog(
        trainer_id=current_user.id,
        action_type="prerequisite_add",
        target_type="concept",
        target_id=concept_id,
        notes=f"Added prerequisite dependency {req.prerequisite_concept_id} -> {concept_id}"
    )
    db.add(log)
    db.commit()

    return {"message": "Prerequisite edge added successfully"}

@app.delete("/api/trainer/concepts/{concept_id}/prerequisites/{prereq_concept_id}")
def remove_prerequisite_edge(
    concept_id: int,
    prereq_concept_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    prereq = db.query(models.Prerequisite).filter(
        models.Prerequisite.concept_id == concept_id,
        models.Prerequisite.prerequisite_concept_id == prereq_concept_id
    ).first()

    if not prereq:
        raise HTTPException(status_code=404, detail="Prerequisite edge not found")

    db.delete(prereq)
    db.commit()

    return {"message": "Prerequisite edge removed successfully"}

# Resource Authoring
@app.get("/api/trainer/concepts/{concept_id}/resources")
def get_concept_resources(concept_id: int, db: Session = Depends(get_db)):
    resources = db.query(models.Resource).filter(models.Resource.concept_id == concept_id).all()
    return resources

@app.post("/api/trainer/concepts/{concept_id}/resources")
def add_concept_resource(
    concept_id: int,
    req: schemas.ResourceCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    concept = db.query(models.Concept).filter(models.Concept.id == concept_id).first()
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found")

    resource = models.Resource(
        course_id=concept.course_id,
        concept_id=concept_id,
        module_name=req.module_name or concept.module_name,
        title=req.title,
        resource_type=req.resource_type,
        content_url=req.content_url,
        description=req.description
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)

    return resource

@app.delete("/api/trainer/resources/{resource_id}")
def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    res = db.query(models.Resource).filter(models.Resource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")

    db.delete(res)
    db.commit()
    return {"message": "Resource deleted successfully"}

# ----------------------------
# 3. QUESTION BANK MANAGER (AUTHORING)
# ----------------------------

@app.get("/api/trainer/assessments/{assessment_id}/questions")
def get_assessment_questions(
    assessment_id: int,
    topic: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Question).filter(models.Question.assessment_id == assessment_id)
    if topic:
        query = query.filter(models.Question.topic == topic)
    if search:
        query = query.filter(models.Question.question_text.ilike(f"%{search}%"))

    questions = query.all()
    res = []
    for q in questions:
        concept = db.query(models.Concept).filter(models.Concept.id == q.concept_id).first() if q.concept_id else None
        res.append({
            "id": q.id,
            "assessment_id": q.assessment_id,
            "concept_id": q.concept_id,
            "concept_title": concept.title if concept else "General Track",
            "question_text": q.question_text,
            "options": json.loads(q.options_json),
            "correct_option_index": q.correct_option_index,
            "explanation": q.explanation,
            "topic": q.topic
        })
    return res

@app.post("/api/trainer/assessments/{assessment_id}/questions")
def add_question(
    assessment_id: int,
    req: schemas.QuestionCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    if req.correct_option_index < 0 or req.correct_option_index >= len(req.options):
        raise HTTPException(status_code=400, detail="Invalid correct_option_index: must match one of the options")

    question = models.Question(
        assessment_id=assessment_id,
        concept_id=req.concept_id,
        question_text=req.question_text,
        options_json=json.dumps(req.options),
        correct_option_index=req.correct_option_index,
        explanation=req.explanation,
        topic=req.topic or "General"
    )
    db.add(question)
    db.commit()
    db.refresh(question)

    return question

@app.put("/api/trainer/questions/{question_id}")
def update_question(
    question_id: int,
    req: schemas.QuestionCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    q = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    q.question_text = req.question_text
    q.options_json = json.dumps(req.options)
    q.correct_option_index = req.correct_option_index
    q.explanation = req.explanation
    q.topic = req.topic
    q.concept_id = req.concept_id
    db.commit()

    return q

@app.delete("/api/trainer/questions/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    q = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    db.delete(q)
    db.commit()
    return {"message": "Question deleted successfully"}

# ----------------------------
# 4. ASSIGNMENTS & GRADING (PROJECT DELIVERABLES)
# ----------------------------

@app.get("/api/trainer/courses/{course_id}/assignments")
def get_course_assignments(course_id: int, db: Session = Depends(get_db)):
    assignments = db.query(models.Assignment).filter(models.Assignment.course_id == course_id).all()
    res = []
    for a in assignments:
        concept = db.query(models.Concept).filter(models.Concept.id == a.concept_id).first() if a.concept_id else None
        subs = db.query(models.Submission).filter(models.Submission.assignment_id == a.id).all()
        pending_subs = [s for s in subs if s.status == "submitted"]
        res.append({
            "id": a.id,
            "course_id": a.course_id,
            "concept_id": a.concept_id,
            "concept_title": concept.title if concept else "Course Project",
            "title": a.title,
            "description": a.description,
            "due_date": a.due_date,
            "max_score": a.max_score,
            "total_submissions": len(subs),
            "pending_grading_count": len(pending_subs)
        })
    return res

@app.post("/api/trainer/courses/{course_id}/assignments")
def create_assignment(
    course_id: int,
    req: schemas.AssignmentCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    assignment = models.Assignment(
        course_id=course_id,
        concept_id=req.concept_id,
        title=req.title,
        description=req.description,
        due_date=req.due_date,
        max_score=req.max_score
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return assignment

@app.get("/api/trainer/assignments/{assignment_id}/submissions")
def get_assignment_submissions(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    subs = db.query(models.Submission).filter(models.Submission.assignment_id == assignment_id).all()
    res = []
    for s in subs:
        trainee = db.query(models.User).filter(models.User.id == s.trainee_id).first()
        res.append({
            "id": s.id,
            "assignment_id": s.assignment_id,
            "trainee_id": s.trainee_id,
            "trainee_name": trainee.full_name if trainee else "Trainee",
            "trainee_email": trainee.email if trainee else "",
            "content_url": s.content_url,
            "submitted_at": s.submitted_at.strftime("%Y-%m-%d %H:%M UTC") if s.submitted_at else "",
            "grade": s.grade,
            "feedback": s.feedback,
            "status": s.status
        })
    return res

@app.post("/api/trainer/submissions/{submission_id}/grade")
def grade_submission(
    submission_id: int,
    req: schemas.GradeSubmissionRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    sub = db.query(models.Submission).filter(models.Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    sub.grade = req.grade
    sub.feedback = req.feedback
    sub.graded_by = current_user.id
    sub.graded_at = datetime.utcnow()
    sub.status = "graded"

    # Send Notification to Trainee
    notif = models.Notification(
        user_id=sub.trainee_id,
        type="assignment_graded",
        message=f"Your assignment submission has been graded: {req.grade} pts. Feedback: '{req.feedback}'",
        related_type="submission",
        related_id=sub.id
    )
    db.add(notif)

    # Log action
    log = models.TrainerActionLog(
        trainer_id=current_user.id,
        action_type="grade_assignment",
        target_type="submission",
        target_id=sub.id,
        notes=f"Graded submission #{sub.id} with score {req.grade}"
    )
    db.add(log)
    db.commit()

    return {
        "submission_id": sub.id,
        "grade": sub.grade,
        "status": sub.status,
        "message": "Submission graded successfully and notification sent to trainee."
    }

# ----------------------------
# 5. LESSON PROGRESS & MASTERY ON COMPLETION (ADAPTIVE INTELLIGENCE)
# ----------------------------

@app.post("/api/lessons/complete")
def complete_lesson(
    req: schemas.LessonCompleteRequest,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_current_user)
):
    target_trainee_id = current_user.id if current_user else 1

    progress = models.LessonProgress(
        trainee_id=target_trainee_id,
        concept_id=req.concept_id,
        resource_id=req.resource_id,
        status="completed"
    )
    db.add(progress)

    # Dynamic Mastery Nudge (+0.15 increment, capped at 1.0)
    m_state = db.query(models.MasteryState).filter(
        models.MasteryState.trainee_id == target_trainee_id,
        models.MasteryState.concept_id == req.concept_id
    ).first()

    if m_state:
        m_state.mastery_score = min(1.0, m_state.mastery_score + 0.15)
    else:
        m_state = models.MasteryState(
            trainee_id=target_trainee_id,
            concept_id=req.concept_id,
            mastery_score=0.40
        )
        db.add(m_state)

    db.commit()

    return {
        "concept_id": req.concept_id,
        "new_mastery_score": round(m_state.mastery_score * 100, 1),
        "status": "completed",
        "message": "Lesson resource completed! Concept mastery updated in real time on Knowledge Graph."
    }

# ----------------------------
# 6. NOTIFICATIONS API
# ----------------------------

@app.get("/api/notifications")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    notifs = db.query(models.Notification).filter(models.Notification.user_id == current_user.id).order_by(models.Notification.created_at.desc()).all()
    return notifs

@app.post("/api/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    n = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    if n:
        n.is_read = True
        db.commit()
    return {"message": "Notification marked as read"}

# ----------------------------
# 7. ENROLLMENT & COHORT MANAGEMENT
# ----------------------------

@app.get("/api/enrollments/requests")
def get_enrollment_requests(db: Session = Depends(get_db)):
    requests = db.query(models.Enrollment).filter(models.Enrollment.status == "approval_pending").all()
    res = []
    for r in requests:
        user = db.query(models.User).filter(models.User.id == r.trainee_id).first()
        course = db.query(models.Course).filter(models.Course.id == r.course_id).first()
        res.append({
            "enrollment_id": r.id,
            "trainee_id": user.id if user else 1,
            "trainee_name": user.full_name if user else "Trainee",
            "course_title": course.title if course else "Course",
            "diagnostic_score": round(r.diagnostic_score * 100, 1),
            "status": r.status,
            "prerequisite_status": "Passed (Threshold >= 60%)" if r.diagnostic_score >= 0.60 else "Requires Revision"
        })
    return res

@app.get("/api/trainer/enrollments")
def get_trainer_enrollments(
    course_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    query = db.query(models.Enrollment)

    if current_user.role == "trainer":
        assigned_courses = db.query(models.TrainerCourseAssignment.course_id).filter(
            models.TrainerCourseAssignment.trainer_id == current_user.id
        ).all()
        assigned_ids = [c[0] for c in assigned_courses]
        if assigned_ids:
            query = query.filter(models.Enrollment.course_id.in_(assigned_ids))

    if course_id:
        query = query.filter(models.Enrollment.course_id == course_id)

    if status and status != "all":
        query = query.filter(models.Enrollment.status == status)

    if search:
        search_pattern = f"%{search}%"
        query = query.join(models.User, models.Enrollment.trainee_id == models.User.id).filter(
            models.User.full_name.ilike(search_pattern) | models.User.email.ilike(search_pattern)
        )

    total_count = query.count()
    offset = (page - 1) * limit
    enrollments = query.order_by(models.Enrollment.enrolled_at.desc()).offset(offset).limit(limit).all()

    items = []
    for r in enrollments:
        user = db.query(models.User).filter(models.User.id == r.trainee_id).first()
        course = db.query(models.Course).filter(models.Course.id == r.course_id).first()
        items.append({
            "enrollment_id": r.id,
            "trainee_id": user.id if user else 0,
            "trainee_name": user.full_name if user else "Unknown Trainee",
            "trainee_email": user.email if user else "",
            "course_id": r.course_id,
            "course_code": course.code if course else "",
            "course_title": course.title if course else "Course",
            "diagnostic_score": round(r.diagnostic_score * 100, 1),
            "status": r.status,
            "prerequisite_status": "Passed (Threshold >= 60%)" if r.diagnostic_score >= 0.60 else "Requires Revision",
            "enrolled_at": r.enrolled_at.strftime("%Y-%m-%d %H:%M UTC") if r.enrolled_at else ""
        })

    return {
        "items": items,
        "total": total_count,
        "page": page,
        "limit": limit,
        "pages": (total_count + limit - 1) // limit if total_count > 0 else 1
    }

@app.post("/api/enrollments/approve")
def approve_enrollment_legacy(
    req: schemas.EnrollmentApprovalRequest, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    enr = db.query(models.Enrollment).filter(models.Enrollment.id == req.enrollment_id).first()
    if not enr:
        raise HTTPException(status_code=404, detail="Enrollment request not found")
    
    enr.status = "approved" if req.approve else "rejected"
    
    log_action = models.TrainerActionLog(
        trainer_id=current_user.id,
        action_type="enrollment_approve" if req.approve else "enrollment_reject",
        target_type="enrollment",
        target_id=enr.id,
        notes=req.notes
    )
    db.add(log_action)
    db.commit()

    return {
        "enrollment_id": enr.id,
        "status": enr.status,
        "message": f"Enrollment for Trainee has been {enr.status.upper()}."
    }

@app.post("/api/trainer/enrollments/{enrollment_id}/approve")
def approve_trainer_enrollment(
    enrollment_id: int,
    req: Optional[schemas.EnrollmentActionRequest] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    enr = db.query(models.Enrollment).filter(models.Enrollment.id == enrollment_id).first()
    if not enr:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    enr.status = "approved"
    notes = req.notes if req else None

    log_entry = models.TrainerActionLog(
        trainer_id=current_user.id,
        action_type="enrollment_approve",
        target_type="enrollment",
        target_id=enr.id,
        notes=notes
    )
    db.add(log_entry)
    db.commit()

    return {
        "enrollment_id": enr.id,
        "status": enr.status,
        "message": "Enrollment approved successfully"
    }

@app.post("/api/trainer/enrollments/{enrollment_id}/reject")
def reject_trainer_enrollment(
    enrollment_id: int,
    req: Optional[schemas.EnrollmentActionRequest] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    enr = db.query(models.Enrollment).filter(models.Enrollment.id == enrollment_id).first()
    if not enr:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    enr.status = "rejected"
    notes = req.notes if req else None

    log_entry = models.TrainerActionLog(
        trainer_id=current_user.id,
        action_type="enrollment_reject",
        target_type="enrollment",
        target_id=enr.id,
        notes=notes
    )
    db.add(log_entry)
    db.commit()

    return {
        "enrollment_id": enr.id,
        "status": enr.status,
        "message": "Enrollment rejected"
    }

@app.post("/api/trainer/enrollments/bulk-decision")
def bulk_enrollment_decision(
    req: schemas.BulkEnrollmentActionRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    new_status = "approved" if req.approve else "rejected"
    action_type = "enrollment_approve" if req.approve else "enrollment_reject"
    
    updated_ids = []
    for eid in req.enrollment_ids:
        enr = db.query(models.Enrollment).filter(models.Enrollment.id == eid).first()
        if enr:
            enr.status = new_status
            log_entry = models.TrainerActionLog(
                trainer_id=current_user.id,
                action_type=action_type,
                target_type="enrollment",
                target_id=enr.id,
                notes=req.notes
            )
            db.add(log_entry)
            updated_ids.append(eid)
    
    db.commit()
    return {
        "updated_count": len(updated_ids),
        "status": new_status,
        "enrollment_ids": updated_ids
    }

@app.get("/api/trainer/courses/{course_id}/trainees")
def get_course_trainees_roster(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    trainee_users = db.query(models.User).filter(models.User.role == "trainee").all()
    concepts = db.query(models.Concept).filter(models.Concept.course_id == course_id).all()
    concept_ids = [c.id for c in concepts]

    roster = []
    for user in trainee_users:
        enr = db.query(models.Enrollment).filter(
            models.Enrollment.course_id == course_id,
            models.Enrollment.trainee_id == user.id
        ).first()

        profile = db.query(models.Profile).filter(models.Profile.user_id == user.id).first()
        
        masteries = db.query(models.MasteryState).filter(
            models.MasteryState.trainee_id == user.id,
            models.MasteryState.concept_id.in_(concept_ids)
        ).all() if concept_ids else []

        avg_mastery = (sum(m.mastery_score for m in masteries) / len(concepts) * 100) if concepts else 0.0
        completed_concepts = sum(1 for m in masteries if m.mastery_score >= 0.80)

        roster.append({
            "trainee_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "enrollment_status": enr.status if enr else "registered",
            "diagnostic_score": round((enr.diagnostic_score if enr else 0.75) * 100, 1),
            "avg_mastery_percentage": round(avg_mastery, 1),
            "completed_concepts_count": completed_concepts,
            "total_concepts_count": len(concepts),
            "streak_days": profile.streak_days if profile else 0,
            "last_active_date": profile.last_active_date if profile else ""
        })

    return {
        "course_id": course_id,
        "course_title": course.title,
        "total_trainees": len(roster),
        "trainees": roster
    }


# ----------------------------
# 8. AVAILABILITY PLANNER & ROADMAP
# ----------------------------

@app.post("/api/planner/availability")
def set_weekly_availability(
    req: schemas.AvailabilityRequest, 
    course_id: int = 3, 
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_current_user)
):
    target_trainee_id = current_user.id if current_user else 1

    profile = db.query(models.Profile).filter(models.Profile.user_id == target_trainee_id).first()
    if profile:
        profile.weekly_hours_json = json.dumps(req.weekly_hours)
        db.commit()

    roadmap = generate_personalized_roadmap(db, target_trainee_id, course_id, req.weekly_hours)
    return roadmap

@app.get("/api/roadmap/{course_id}")
def get_trainee_roadmap(
    course_id: int, 
    trainee_id: Optional[int] = None, 
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_current_user)
):
    target_trainee_id = trainee_id if trainee_id is not None else (current_user.id if current_user else 1)
    rm = db.query(models.Roadmap).filter(
        models.Roadmap.trainee_id == target_trainee_id,
        models.Roadmap.course_id == course_id
    ).first()
    rm_data = generate_personalized_roadmap(db, target_trainee_id, course_id, {"Mon": 2, "Tue": 2, "Wed": 2, "Thu": 3, "Fri": 2, "Sat": 4, "Sun": 3})
    if rm:
        rm_data["is_trainer_overridden"] = rm.is_trainer_overridden
    return rm_data

@app.get("/api/trainee/roadmap/{course_id}/explain")
def explain_trainee_roadmap(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_current_user)
):
    target_trainee_id = current_user.id if current_user else 1
    rm_data = generate_personalized_roadmap(db, target_trainee_id, course_id, {"Mon": 2, "Tue": 2, "Wed": 2, "Thu": 3, "Fri": 2, "Sat": 4, "Sun": 3})
    return {
        "course_id": course_id,
        "trainee_id": target_trainee_id,
        "rag_explanation": rm_data.get("rag_explanation", ""),
        "operators_applied": rm_data.get("operators_applied", []),
        "analysis": rm_data.get("analysis", "")
    }

# ----------------------------
# 9. KNOWLEDGE GRAPH & ANALYTICS VIEWS
# ----------------------------

@app.get("/api/kg/trainee/{course_id}")
def get_trainee_kg_view(
    course_id: int, 
    trainee_id: Optional[int] = None, 
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_current_user)
):
    target_trainee_id = trainee_id if trainee_id is not None else (current_user.id if current_user else 1)
    return build_trainee_kg(db, target_trainee_id, course_id)

@app.get("/api/kg/trainer/{course_id}")
def get_trainer_kg_view(course_id: int, db: Session = Depends(get_db)):
    return build_trainer_course_competency(db, course_id)

@app.get("/api/kg/admin")
def get_admin_kg_view(db: Session = Depends(get_db)):
    return build_admin_platform_kg(db)

@app.get("/api/trainer/courses/{course_id}/overview")
def get_trainer_course_overview(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    enrolled_count = db.query(models.Enrollment).filter(
        models.Enrollment.course_id == course_id,
        models.Enrollment.status.in_(["approved", "completed"])
    ).count()

    pending_count = db.query(models.Enrollment).filter(
        models.Enrollment.course_id == course_id,
        models.Enrollment.status == "approval_pending"
    ).count()

    completed_count = db.query(models.Enrollment).filter(
        models.Enrollment.course_id == course_id,
        models.Enrollment.status == "completed"
    ).count()

    kg_data = build_trainer_course_competency(db, course_id)
    concepts = kg_data.get("concepts", [])
    avg_mastery = sum(c["avg_mastery"] for c in concepts) / len(concepts) if concepts else 0.0
    at_risk_count = len(kg_data.get("at_risk_trainee_ids", []))

    completion_rate = (completed_count / enrolled_count * 100) if enrolled_count > 0 else 0.0

    return {
        "course_id": course.id,
        "course_code": course.code,
        "course_title": course.title,
        "enrolled_count": enrolled_count,
        "pending_approvals_count": pending_count,
        "avg_mastery_percentage": round(avg_mastery, 1),
        "at_risk_count": at_risk_count,
        "completion_rate_percentage": round(completion_rate, 1)
    }

@app.get("/api/trainer/courses/{course_id}/at-risk")
def get_at_risk_trainees(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    kg_data = build_trainer_course_competency(db, course_id)
    at_risk_ids = kg_data.get("at_risk_trainee_ids", [])

    concepts = db.query(models.Concept).filter(models.Concept.course_id == course_id).all()
    concept_map = {c.id: c.title for c in concepts}

    res = []
    for t_id in at_risk_ids:
        user = db.query(models.User).filter(models.User.id == t_id).first()
        profile = db.query(models.Profile).filter(models.Profile.user_id == t_id).first() if user else None
        
        masteries = db.query(models.MasteryState).filter(
            models.MasteryState.trainee_id == t_id,
            models.MasteryState.concept_id.in_(list(concept_map.keys()))
        ).all()

        weak_titles = [concept_map.get(m.concept_id) for m in masteries if m.mastery_score < 0.40]
        avg_m = (sum(m.mastery_score for m in masteries) / len(concepts) * 100) if concepts else 0.0

        res.append({
            "trainee_id": t_id,
            "full_name": user.full_name if user else "Trainee",
            "email": user.email if user else "",
            "avg_mastery": round(avg_m, 1),
            "weak_concepts_count": len(weak_titles),
            "weak_concept_titles": weak_titles,
            "streak_days": profile.streak_days if profile else 0
        })

    return res

@app.get("/api/trainer/trainees/{trainee_id}")
def get_trainee_detail(
    trainee_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    user = db.query(models.User).filter(models.User.id == trainee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Trainee not found")

    profile = db.query(models.Profile).filter(models.Profile.user_id == trainee_id).first()
    enrollments = db.query(models.Enrollment).filter(models.Enrollment.trainee_id == trainee_id).all()
    masteries = db.query(models.MasteryState).filter(models.MasteryState.trainee_id == trainee_id).all()
    roadmaps = db.query(models.Roadmap).filter(models.Roadmap.trainee_id == trainee_id).all()

    enr_res = []
    for e in enrollments:
        c = db.query(models.Course).filter(models.Course.id == e.course_id).first()
        enr_res.append({
            "enrollment_id": e.id,
            "course_id": e.course_id,
            "course_title": c.title if c else "Course",
            "status": e.status,
            "diagnostic_score": round(e.diagnostic_score * 100, 1)
        })

    mastery_res = []
    for m in masteries:
        concept = db.query(models.Concept).filter(models.Concept.id == m.concept_id).first()
        mastery_res.append({
            "concept_id": m.concept_id,
            "title": concept.title if concept else "Concept",
            "module_name": concept.module_name if concept else "",
            "mastery_score": round(m.mastery_score * 100, 1)
        })

    avg_mastery = (sum(m.mastery_score for m in masteries) / len(masteries) * 100) if masteries else 0.0

    return {
        "trainee_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "education": profile.education if profile else "",
        "current_role": profile.current_role if profile else "",
        "career_goal": profile.career_goal if profile else "",
        "streak_days": profile.streak_days if profile else 0,
        "avg_mastery_percentage": round(avg_mastery, 1),
        "enrollments": enr_res,
        "mastery_states": mastery_res,
        "roadmaps_count": len(roadmaps)
    }

# ----------------------------
# 10. TRAINER OVERRIDE (HUMAN-IN-THE-LOOP)
# ----------------------------

@app.get("/api/trainer/trainees/{trainee_id}/roadmap/{course_id}")
def get_trainee_roadmap_for_trainer(
    trainee_id: int,
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    rm = db.query(models.Roadmap).filter(
        models.Roadmap.trainee_id == trainee_id,
        models.Roadmap.course_id == course_id
    ).first()

    if not rm:
        rm_data = generate_personalized_roadmap(db, trainee_id, course_id, {"Mon": 2, "Tue": 2, "Wed": 2, "Thu": 3, "Fri": 2, "Sat": 4, "Sun": 3})
        return rm_data

    items = db.query(models.RoadmapItem).filter(models.RoadmapItem.roadmap_id == rm.id).order_by(models.RoadmapItem.week_number).all()
    res_items = []
    for item in items:
        concept = db.query(models.Concept).filter(models.Concept.id == item.concept_id).first()
        res_items.append({
            "id": item.id,
            "concept_id": item.concept_id,
            "title": concept.title if concept else "Concept",
            "module_name": concept.module_name if concept else "Module",
            "week_number": item.week_number,
            "estimated_hours": item.estimated_hours,
            "status": item.status,
            "reason_explanation": item.reason_explanation
        })

    return {
        "roadmap_id": rm.id,
        "trainee_id": trainee_id,
        "course_id": course_id,
        "weekly_capacity_hours": rm.weekly_capacity_hours,
        "estimated_completion_date": rm.estimated_completion_date,
        "is_trainer_overridden": rm.is_trainer_overridden,
        "items": res_items
    }

@app.post("/api/trainer/override-roadmap")
def trainer_override_roadmap(
    req: schemas.TrainerOverrideRequest, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    rm = db.query(models.Roadmap).filter(models.Roadmap.id == req.roadmap_id).first()
    if not rm:
        raise HTTPException(status_code=404, detail="Roadmap not found")

    rm.is_trainer_overridden = True
    
    override_log = models.TrainerOverride(
        roadmap_id=rm.id,
        trainer_id=current_user.id,
        notes=req.notes
    )
    db.add(override_log)

    log_action = models.TrainerActionLog(
        trainer_id=current_user.id,
        action_type="roadmap_override",
        target_type="roadmap",
        target_id=rm.id,
        notes=req.notes
    )
    db.add(log_action)

    existing_items = db.query(models.RoadmapItem).filter(models.RoadmapItem.roadmap_id == rm.id).all()
    existing_by_id = {item.id: item for item in existing_items}
    processed_ids = set()

    for mod in req.custom_items:
        item_id = mod.get("item_id")
        if isinstance(item_id, int) and item_id in existing_by_id:
            rmi = existing_by_id[item_id]
            if "status" in mod: rmi.status = mod["status"]
            if "estimated_hours" in mod: rmi.estimated_hours = mod["estimated_hours"]
            if "week_number" in mod: rmi.week_number = mod["week_number"]
            if "reason_explanation" in mod and mod["reason_explanation"]:
                rmi.reason_explanation = mod["reason_explanation"]
            else:
                rmi.reason_explanation = f"Trainer Override: {req.notes}"
            processed_ids.add(item_id)
        else:
            concept_id = mod.get("concept_id") or 1
            new_rmi = models.RoadmapItem(
                roadmap_id=rm.id,
                concept_id=concept_id,
                week_number=mod.get("week_number", 1),
                estimated_hours=mod.get("estimated_hours", 4.0),
                status=mod.get("status", "in_progress"),
                reason_explanation=mod.get("reason_explanation") or f"Trainer Override: {req.notes}"
            )
            db.add(new_rmi)

    for item_id, item_obj in existing_by_id.items():
        if item_id not in processed_ids:
            db.delete(item_obj)

    db.commit()

    return {
        "message": "Trainer override saved and logged successfully.",
        "roadmap_id": rm.id,
        "is_trainer_overridden": True
    }

@app.get("/api/trainer/roadmap/{roadmap_id}/history")
def get_roadmap_override_history(
    roadmap_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    overrides = db.query(models.TrainerOverride).filter(models.TrainerOverride.roadmap_id == roadmap_id).order_by(models.TrainerOverride.timestamp.desc()).all()
    action_logs = db.query(models.TrainerActionLog).filter(
        models.TrainerActionLog.target_type == "roadmap",
        models.TrainerActionLog.target_id == roadmap_id
    ).order_by(models.TrainerActionLog.timestamp.desc()).all()

    res_overrides = []
    for o in overrides:
        trainer = db.query(models.User).filter(models.User.id == o.trainer_id).first()
        res_overrides.append({
            "id": o.id,
            "trainer_name": trainer.full_name if trainer else "Trainer",
            "notes": o.notes,
            "timestamp": o.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")
        })

    res_logs = []
    for l in action_logs:
        trainer = db.query(models.User).filter(models.User.id == l.trainer_id).first()
        res_logs.append({
            "id": l.id,
            "trainer_name": trainer.full_name if trainer else "Trainer",
            "action_type": l.action_type,
            "notes": l.notes,
            "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")
        })

    return {
        "roadmap_id": roadmap_id,
        "overrides": res_overrides,
        "action_logs": res_logs
    }

# ----------------------------
# 11. ADMIN SENSITIVE PII SECURITY
# ----------------------------

# --- Admin OTP & PII Security Services ---
from services.admin_service import (
    log_admin_action,
    verify_audit_log_chain,
    create_otp_challenge,
    verify_otp_challenge,
    create_subject_notification
)

@app.get("/api/admin/platform/overview")
def get_admin_platform_overview(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    total_trainees = db.query(models.User).filter(models.User.role == "trainee").count()
    total_trainers = db.query(models.User).filter(models.User.role == "trainer").count()
    total_admins = db.query(models.User).filter(models.User.role == "admin").count()
    active_enrollments = db.query(models.Enrollment).filter(models.Enrollment.status.in_(["approved", "completed"])).count()
    certificates_issued = db.query(models.Certificate).count()
    pending_approvals = db.query(models.Enrollment).filter(models.Enrollment.status == "approval_pending").count()

    return {
        "total_trainees": total_trainees,
        "total_trainers": total_trainers,
        "total_admins": total_admins,
        "active_enrollments": active_enrollments,
        "certificates_issued": certificates_issued,
        "pending_approvals": pending_approvals
    }

@app.post("/api/admin/auth/otp/request")
def request_admin_otp(
    req: schemas.AdminOtpRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    challenge, raw_code = create_otp_challenge(db, current_user.id, req.purpose or "elevated_access")
    return {
        "challenge_id": challenge.id,
        "message": "OTP challenge generated successfully.",
        "dev_otp_code": raw_code,
        "expires_at": challenge.expires_at.strftime("%Y-%m-%d %H:%M:%S UTC")
    }

@app.post("/api/admin/sensitive-pii")
def access_sensitive_pii(
    req: schemas.SensitiveAccessRequest, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    target_user = db.query(models.User).filter(models.User.id == req.target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")

    if not req.purpose or len(req.purpose.strip()) < 5 or req.purpose.strip() == "Identity Audit Verification":
        raise HTTPException(status_code=400, detail="A detailed audit reason (at least 5 characters) is mandatory for unmasking PII.")

    log_entry = log_admin_action(
        db=db,
        admin_id=current_user.id,
        action_type="pii_unmask",
        target_type="user",
        target_id=target_user.id,
        reason=req.purpose,
        metadata={"scope": "aadhaar,phone"}
    )

    create_subject_notification(
        db=db,
        user_id=target_user.id,
        message=f"Your protected identity information was accessed by {current_user.full_name} for reason: '{req.purpose}'.",
        related_admin_id=current_user.id,
        related_action_id=log_entry.id
    )

    unmasked_id = f"Aadhaar: 8921-4451-{target_user.id:04d}"

    return {
        "access_granted": True,
        "target_user_id": target_user.id,
        "full_name": target_user.full_name,
        "unmasked_aadhaar": unmasked_id,
        "govt_id_type": target_user.govt_id_type or "National Identity Card",
        "phone_number": target_user.phone_number or "+91 98765 43210",
        "audit_log_id": log_entry.id,
        "timestamp": log_entry.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")
    }

@app.get("/api/admin/sensitive-logs")
def get_sensitive_logs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    logs = db.query(models.AdminAuditLog).order_by(models.AdminAuditLog.timestamp.desc()).all()
    res = []
    for l in logs:
        admin = db.query(models.User).filter(models.User.id == l.admin_id).first()
        target = db.query(models.User).filter(models.User.id == l.target_id).first() if l.target_id else None
        res.append({
            "log_id": l.id,
            "admin_name": admin.full_name if admin else "Admin",
            "target_user_name": target.full_name if target else "System",
            "action_type": l.action_type,
            "purpose": l.reason or l.action_type,
            "entry_hash": l.entry_hash[:16] + "...",
            "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")
        })
    return res

@app.get("/api/admin/audit-logs/verify-integrity")
def verify_audit_logs_integrity(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    return verify_audit_log_chain(db)

# --- 11b. ADMIN USER DIRECTORY & ACCOUNT GOVERNANCE ---

@app.get("/api/admin/users")
def list_admin_users(
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    query = db.query(models.User)

    if role and role != "all":
        query = query.filter(models.User.role == role)

    if status == "active":
        query = query.filter(models.User.is_active == True)
    elif status == "deactivated":
        query = query.filter(models.User.is_active == False)

    if search:
        pattern = f"%{search}%"
        query = query.filter(models.User.full_name.ilike(pattern) | models.User.email.ilike(pattern))

    total = query.count()
    offset = (page - 1) * limit
    users = query.order_by(models.User.id.asc()).offset(offset).limit(limit).all()

    items = []
    for u in users:
        items.append({
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "admin_tier": u.admin_tier or "super_admin",
            "is_active": u.is_active,
            "aadhaar_masked": u.aadhaar_masked or "XXXX-XXXX-4892",
            "phone_number": u.phone_number or "+91 98765 43210",
            "deactivated_reason": u.deactivated_reason,
            "deactivated_at": u.deactivated_at.strftime("%Y-%m-%d %H:%M UTC") if u.deactivated_at else None
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit
    }

@app.get("/api/admin/users/{user_id}")
def get_admin_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = db.query(models.Profile).filter(models.Profile.user_id == user_id).first()
    enrollments = db.query(models.Enrollment).filter(models.Enrollment.trainee_id == user_id).all()

    enr_details = []
    for e in enrollments:
        crs = db.query(models.Course).filter(models.Course.id == e.course_id).first()
        enr_details.append({
            "enrollment_id": e.id,
            "course_title": crs.title if crs else "Course",
            "status": e.status,
            "diagnostic_score": round(e.diagnostic_score * 100, 1)
        })

    return {
        "id": target_user.id,
        "full_name": target_user.full_name,
        "email": target_user.email,
        "role": target_user.role,
        "admin_tier": target_user.admin_tier or "super_admin",
        "is_active": target_user.is_active,
        "aadhaar_masked": target_user.aadhaar_masked or "XXXX-XXXX-4892",
        "phone_number": target_user.phone_number or "+91 98765 43210",
        "education": profile.education if profile else "B.Tech CS",
        "current_role": profile.current_role if profile else "Learner",
        "streak_days": profile.streak_days if profile else 7,
        "enrollments": enr_details
    }

@app.put("/api/admin/users/{user_id}")
def update_admin_user_non_sensitive(
    user_id: int,
    req: schemas.AdminUserUpdateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not req.reason or len(req.reason.strip()) < 3:
        raise HTTPException(status_code=400, detail="Audit reason is required.")

    if req.full_name: target_user.full_name = req.full_name
    if req.email: target_user.email = req.email
    if req.role: target_user.role = req.role

    log_entry = log_admin_action(
        db=db,
        admin_id=current_user.id,
        action_type="user_update",
        target_type="user",
        target_id=target_user.id,
        reason=req.reason,
        metadata={"full_name": req.full_name, "email": req.email, "role": req.role}
    )

    return {"message": "User profile updated successfully.", "user_id": target_user.id, "audit_log_id": log_entry.id}

@app.post("/api/admin/users/{user_id}/deactivate")
def deactivate_user_account(
    user_id: int,
    req: schemas.AdminDeactivateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not req.reason or len(req.reason.strip()) < 3:
        raise HTTPException(status_code=400, detail="Deactivation reason is required.")

    target_user.is_active = False
    target_user.deactivated_reason = req.reason
    target_user.deactivated_by = current_user.id
    target_user.deactivated_at = datetime.utcnow()

    log_entry = log_admin_action(
        db=db,
        admin_id=current_user.id,
        action_type="user_deactivate",
        target_type="user",
        target_id=target_user.id,
        reason=req.reason
    )

    create_subject_notification(
        db=db,
        user_id=target_user.id,
        message=f"Your account status has been deactivated by Admin {current_user.full_name}. Reason: '{req.reason}'.",
        related_admin_id=current_user.id,
        related_action_id=log_entry.id
    )

    return {"message": f"Account for {target_user.full_name} has been soft-deactivated.", "user_id": target_user.id}

@app.post("/api/admin/users/{user_id}/reactivate")
def reactivate_user_account(
    user_id: int,
    req: schemas.AdminDeactivateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user.is_active = True
    target_user.deactivated_reason = None
    target_user.deactivated_by = None
    target_user.deactivated_at = None

    log_entry = log_admin_action(
        db=db,
        admin_id=current_user.id,
        action_type="user_reactivate",
        target_type="user",
        target_id=target_user.id,
        reason=req.reason or "Reactivated by Admin"
    )

    return {"message": f"Account for {target_user.full_name} reactivated.", "user_id": target_user.id}

# --- 11c. MAKER-CHECKER APPROVAL QUEUE ---

@app.get("/api/admin/approvals")
def get_approval_requests(
    status: Optional[str] = Query("pending"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    query = db.query(models.ApprovalRequest)
    if status and status != "all":
        query = query.filter(models.ApprovalRequest.status == status)

    requests = query.order_by(models.ApprovalRequest.created_at.desc()).all()
    res = []
    for r in requests:
        requester = db.query(models.User).filter(models.User.id == r.requested_by).first()
        reviewer = db.query(models.User).filter(models.User.id == r.reviewed_by).first() if r.reviewed_by else None
        res.append({
            "id": r.id,
            "requested_by": r.requested_by,
            "requester_name": requester.full_name if requester else "Admin",
            "action_type": r.action_type,
            "target_type": r.target_type,
            "target_id": r.target_id,
            "reason": r.reason,
            "status": r.status,
            "reviewed_by_name": reviewer.full_name if reviewer else None,
            "review_reason": r.review_reason,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M UTC")
        })
    return res

@app.post("/api/admin/approvals/{id}/approve")
def approve_maker_checker_request(
    id: int,
    req: schemas.AdminApprovalDecisionRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    approval = db.query(models.ApprovalRequest).filter(models.ApprovalRequest.id == id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    if approval.requested_by == current_user.id:
        raise HTTPException(status_code=403, detail="Maker-Checker Security Invariant: Requester cannot approve their own request.")

    approval.status = "approved" if req.approve else "rejected"
    approval.reviewed_by = current_user.id
    approval.reviewed_at = datetime.utcnow()
    approval.review_reason = req.review_reason

    log_admin_action(
        db=db,
        admin_id=current_user.id,
        action_type="approval_decision",
        target_type="approval_request",
        target_id=approval.id,
        reason=f"Decision: {approval.status.upper()} - {req.review_reason or 'Reviewed by Maker-Checker'}"
    )

    return {"message": f"Approval request #{approval.id} marked as {approval.status.upper()}.", "status": approval.status}

@app.post("/api/admin/approvals/{id}/reject")
def reject_maker_checker_request(
    id: int,
    req: schemas.AdminApprovalDecisionRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    approval = db.query(models.ApprovalRequest).filter(models.ApprovalRequest.id == id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    approval.status = "rejected"
    approval.reviewed_by = current_user.id
    approval.reviewed_at = datetime.utcnow()
    approval.review_reason = req.review_reason or "Rejected by second admin reviewer"

    log_admin_action(
        db=db,
        admin_id=current_user.id,
        action_type="approval_reject",
        target_type="approval_request",
        target_id=approval.id,
        reason=approval.review_reason
    )

    return {"message": f"Approval request #{approval.id} REJECTED.", "status": "rejected"}

# --- 11d. ANOMALY & INTEGRITY DETECTOR ---

@app.get("/api/admin/anomalies")
def get_admin_anomalies(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    # Rule 1: High unmask frequency
    recent_unmasks = db.query(models.AdminAuditLog).filter(models.AdminAuditLog.action_type == "pii_unmask").count()
    
    anomalies = []
    if recent_unmasks > 2:
        anomalies.append({
            "id": 1,
            "severity": "HIGH",
            "type": "unmask_burst",
            "title": "Elevated PII Access Burst Detected",
            "description": f"Admin requested unmasking on {recent_unmasks} user records in a single session.",
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        })

    anomalies.append({
        "id": 2,
        "severity": "MEDIUM",
        "type": "maker_checker_rejection",
        "title": "Self-Approval Blocked & Rejected",
        "description": "System automatically blocked a single-admin self-approval attempt on high-risk admin creation.",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    })

    return anomalies

# ----------------------------
# 12. CERTIFICATE SYSTEM & ISSUANCE
# ----------------------------

@app.get("/api/trainer/courses/{course_id}/completion-eligible")
def get_completion_eligible_trainees(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.course_id == course_id,
        models.Enrollment.status.in_(["approved", "completed"])
    ).all()

    existing_certs = db.query(models.Certificate).filter(models.Certificate.course_id == course_id).all()
    issued_trainee_ids = set(c.trainee_id for c in existing_certs)

    eligible = []
    for enr in enrollments:
        user = db.query(models.User).filter(models.User.id == enr.trainee_id).first()
        if not user:
            continue
        
        is_already_issued = user.id in issued_trainee_ids
        
        masteries = db.query(models.MasteryState).join(models.Concept).filter(
            models.Concept.course_id == course_id,
            models.MasteryState.trainee_id == user.id
        ).all()

        avg_mastery = (sum(m.mastery_score for m in masteries) / len(masteries) * 100) if masteries else 0.0
        
        is_eligible = (enr.status == "completed" or enr.diagnostic_score >= 0.70 or avg_mastery >= 70.0)

        eligible.append({
            "trainee_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "diagnostic_score": round(enr.diagnostic_score * 100, 1),
            "avg_mastery_percentage": round(avg_mastery, 1),
            "enrollment_status": enr.status,
            "is_eligible": is_eligible,
            "already_issued": is_already_issued,
            "existing_certificate_code": next((c.certificate_code for c in existing_certs if c.trainee_id == user.id), None)
        })

    return {
        "course_id": course_id,
        "course_title": course.title,
        "eligible_trainees": eligible
    }

@app.post("/api/trainer/certificates/issue")
def issue_certificate(
    req: schemas.CertificateIssueRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    existing = db.query(models.Certificate).filter(
        models.Certificate.trainee_id == req.trainee_id,
        models.Certificate.course_id == req.course_id
    ).first()

    if existing:
        return {
            "certificate_id": existing.id,
            "certificate_code": existing.certificate_code,
            "issued_date": existing.issued_date,
            "message": "Certificate already issued previously for this trainee and course."
        }

    user = db.query(models.User).filter(models.User.id == req.trainee_id).first()
    course = db.query(models.Course).filter(models.Course.id == req.course_id).first()
    if not user or not course:
        raise HTTPException(status_code=404, detail="Trainee or Course not found")

    code_num = random.randint(100000, 999999)
    cert_code = f"CC-AIML-2026-{code_num}"
    issue_date_str = datetime.utcnow().strftime("%d %B %Y")

    cert = models.Certificate(
        trainee_id=req.trainee_id,
        course_id=req.course_id,
        certificate_code=cert_code,
        issued_date=issue_date_str
    )
    db.add(cert)

    enr = db.query(models.Enrollment).filter(
        models.Enrollment.trainee_id == req.trainee_id,
        models.Enrollment.course_id == req.course_id
    ).first()
    if enr:
        enr.status = "completed"

    log_entry = models.TrainerActionLog(
        trainer_id=current_user.id,
        action_type="certificate_issue",
        target_type="certificate",
        target_id=req.course_id,
        notes=f"Issued certificate {cert_code} to {user.full_name}"
    )
    db.add(log_entry)
    db.commit()

    return {
        "certificate_id": cert.id,
        "certificate_code": cert.certificate_code,
        "trainee_name": user.full_name,
        "course_title": course.title,
        "issued_date": cert.issued_date,
        "message": "Certificate issued successfully!"
    }

@app.get("/api/certificates/verify/{certificate_code}")
def verify_certificate(certificate_code: str, db: Session = Depends(get_db)):
    cert = db.query(models.Certificate).filter(models.Certificate.certificate_code == certificate_code).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found or invalid certificate code")

    trainee = db.query(models.User).filter(models.User.id == cert.trainee_id).first()
    course = db.query(models.Course).filter(models.Course.id == cert.course_id).first()

    return {
        "is_valid": True,
        "certificate_code": cert.certificate_code,
        "trainee_name": trainee.full_name if trainee else "Trainee",
        "course_title": course.title if course else "AI/ML Learning Track",
        "issued_date": cert.issued_date,
        "authorized_issuer": "Capacity Connect Institutional Board"
    }

# ----------------------------
# 13. TRAINER PROFILE
# ----------------------------

@app.get("/api/trainer/profile")
def get_trainer_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    assignments = db.query(models.TrainerCourseAssignment).filter(models.TrainerCourseAssignment.trainer_id == current_user.id).all()
    
    courses = []
    for a in assignments:
        c = db.query(models.Course).filter(models.Course.id == a.course_id).first()
        if c:
            courses.append({
                "course_id": c.id,
                "code": c.code,
                "title": c.title,
                "level": c.level
            })

    return {
        "user_id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "education": profile.education if profile else "Ph.D. Computer Science",
        "current_role": profile.current_role if profile else "Lead AI/ML Educator",
        "assigned_courses": courses
    }

@app.put("/api/trainer/profile")
def update_trainer_profile(
    req: schemas.TrainerProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    if req.full_name:
        current_user.full_name = req.full_name

    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if profile:
        if req.education:
            profile.education = req.education
        if req.current_role:
            profile.current_role = req.current_role
        db.commit()

    return {"message": "Trainer profile updated successfully"}

# ----------------------------
# 14. PHASE 3: DISCUSSIONS, RATINGS & COHORTS
# ----------------------------

# --- Discussion Moderation ---

@app.get("/api/trainer/discussions")
def get_trainer_discussions(
    course_id: Optional[int] = Query(None),
    flagged_only: bool = Query(False),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    query = db.query(models.DiscussionPost).filter(models.DiscussionPost.parent_id == None)

    if course_id:
        query = query.filter(models.DiscussionPost.course_id == course_id)
    if flagged_only:
        query = query.filter(models.DiscussionPost.is_flagged == True)

    total_count = query.count()
    offset = (page - 1) * limit
    posts = query.order_by(models.DiscussionPost.is_pinned.desc(), models.DiscussionPost.created_at.desc()).offset(offset).limit(limit).all()

    items = []
    for p in posts:
        author = db.query(models.User).filter(models.User.id == p.author_id).first()
        course = db.query(models.Course).filter(models.Course.id == p.course_id).first()
        concept = db.query(models.Concept).filter(models.Concept.id == p.concept_id).first() if p.concept_id else None
        replies_count = db.query(models.DiscussionPost).filter(models.DiscussionPost.parent_id == p.id).count()
        
        replies = db.query(models.DiscussionPost).filter(models.DiscussionPost.parent_id == p.id).order_by(models.DiscussionPost.created_at.asc()).all()
        replies_data = []
        for r in replies:
            r_author = db.query(models.User).filter(models.User.id == r.author_id).first()
            replies_data.append({
                "id": r.id,
                "author_id": r.author_id,
                "author_name": r_author.full_name if r_author else "Anonymous",
                "author_role": r.author_role,
                "content": r.content,
                "created_at": r.created_at.strftime("%Y-%m-%d %H:%M UTC") if r.created_at else ""
            })

        items.append({
            "id": p.id,
            "course_id": p.course_id,
            "course_title": course.title if course else "",
            "concept_id": p.concept_id,
            "concept_title": concept.title if concept else None,
            "author_id": p.author_id,
            "author_name": author.full_name if author else "Anonymous",
            "author_role": p.author_role,
            "title": p.title,
            "content": p.content,
            "is_pinned": p.is_pinned,
            "is_flagged": p.is_flagged,
            "created_at": p.created_at.strftime("%Y-%m-%d %H:%M UTC") if p.created_at else "",
            "replies_count": replies_count,
            "replies": replies_data
        })

    return {
        "items": items,
        "total": total_count,
        "page": page,
        "limit": limit,
        "pages": (total_count + limit - 1) // limit if total_count > 0 else 1
    }

@app.post("/api/discussions")
def create_discussion_post(
    req: schemas.DiscussionPostCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    post = models.DiscussionPost(
        course_id=req.course_id,
        concept_id=req.concept_id,
        author_id=current_user.id,
        author_role=current_user.role,
        parent_id=req.parent_id,
        title=req.title,
        content=req.content
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    return post

@app.post("/api/trainer/discussions/{post_id}/pin")
def pin_discussion_post(
    post_id: int,
    req: schemas.DiscussionPinRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    post = db.query(models.DiscussionPost).filter(models.DiscussionPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Discussion post not found")

    post.is_pinned = req.is_pinned
    db.commit()
    return {"id": post.id, "is_pinned": post.is_pinned, "message": "Post pin state updated"}

@app.post("/api/trainer/discussions/{post_id}/flag")
def flag_discussion_post(
    post_id: int,
    req: schemas.DiscussionFlagRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    post = db.query(models.DiscussionPost).filter(models.DiscussionPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Discussion post not found")

    post.is_flagged = req.is_flagged
    db.commit()
    return {"id": post.id, "is_flagged": post.is_flagged, "message": "Post flag state updated"}

@app.delete("/api/trainer/discussions/{post_id}")
def delete_discussion_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    post = db.query(models.DiscussionPost).filter(models.DiscussionPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Discussion post not found")

    # Delete replies if any
    db.query(models.DiscussionPost).filter(models.DiscussionPost.parent_id == post_id).delete()
    db.delete(post)
    db.commit()
    return {"message": "Discussion thread deleted successfully"}


# --- Trainer Rating & Feedback Analytics ---

@app.get("/api/trainer/ratings")
def get_trainer_ratings(
    trainer_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    target_trainer_id = trainer_id or current_user.id
    ratings = db.query(models.Rating).filter(
        (models.Rating.trainer_id == target_trainer_id) | (models.Rating.trainer_id == None)
    ).all()

    total_ratings = len(ratings)
    avg_score = (sum(r.score for r in ratings) / total_ratings) if total_ratings > 0 else 0.0

    distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    for r in ratings:
        s = int(round(r.score))
        if s in distribution:
            distribution[s] += 1

    comments = []
    for r in ratings:
        trainee = db.query(models.User).filter(models.User.id == r.trainee_id).first()
        course = db.query(models.Course).filter(models.Course.id == r.course_id).first()
        comments.append({
            "id": r.id,
            "trainee_id": r.trainee_id,
            "trainee_name": trainee.full_name if trainee else "Learner",
            "course_title": course.title if course else "Course",
            "score": r.score,
            "comment": r.comment,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M UTC") if r.created_at else ""
        })

    return {
        "trainer_id": target_trainer_id,
        "average_rating": round(avg_score, 2),
        "total_ratings": total_ratings,
        "rating_distribution": distribution,
        "recent_feedback": comments
    }

@app.post("/api/ratings")
def create_rating(
    req: schemas.RatingCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    rating = models.Rating(
        trainee_id=current_user.id,
        course_id=req.course_id,
        trainer_id=req.trainer_id,
        score=req.score,
        comment=req.comment
    )
    db.add(rating)
    db.commit()
    db.refresh(rating)
    return rating


# --- Cohort Management ---

@app.get("/api/trainer/courses/{course_id}/cohorts")
def get_course_cohorts(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    cohorts = db.query(models.Cohort).filter(models.Cohort.course_id == course_id).all()
    res = []
    for c in cohorts:
        members = db.query(models.CohortMember).filter(models.CohortMember.cohort_id == c.id).all()
        member_details = []
        for m in members:
            user = db.query(models.User).filter(models.User.id == m.trainee_id).first()
            if user:
                member_details.append({
                    "trainee_id": user.id,
                    "full_name": user.full_name,
                    "email": user.email,
                    "joined_at": m.joined_at.strftime("%Y-%m-%d %H:%M UTC") if m.joined_at else ""
                })
        res.append({
            "id": c.id,
            "course_id": c.course_id,
            "name": c.name,
            "start_date": c.start_date,
            "end_date": c.end_date,
            "created_at": c.created_at.strftime("%Y-%m-%d %H:%M UTC") if c.created_at else "",
            "member_count": len(members),
            "members": member_details
        })
    return res

@app.post("/api/trainer/courses/{course_id}/cohorts")
def create_cohort(
    course_id: int,
    req: schemas.CohortCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    cohort = models.Cohort(
        course_id=course_id,
        name=req.name,
        start_date=req.start_date,
        end_date=req.end_date
    )
    db.add(cohort)
    db.commit()
    db.refresh(cohort)
    return cohort

@app.post("/api/trainer/cohorts/{cohort_id}/members")
def add_cohort_member(
    cohort_id: int,
    req: schemas.CohortAddMemberRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainer_or_admin)
):
    cohort = db.query(models.Cohort).filter(models.Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")

    existing = db.query(models.CohortMember).filter(
        models.CohortMember.cohort_id == cohort_id,
        models.CohortMember.trainee_id == req.trainee_id
    ).first()
    if existing:
        return {"message": "Trainee is already a member of this cohort", "cohort_member_id": existing.id}

    member = models.CohortMember(
        cohort_id=cohort_id,
        trainee_id=req.trainee_id
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return {"message": "Trainee added to cohort successfully", "cohort_member_id": member.id}


# ----------------------------
# 15. TRAINEE PORTAL ENDPOINTS (SIH READY)
# ----------------------------

@app.get("/api/trainee/dashboard")
def get_trainee_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainee)
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    enrollments = db.query(models.Enrollment).filter(models.Enrollment.trainee_id == current_user.id).all()
    
    active_enr = next((e for e in enrollments if e.status in ["approved", "diagnostic_pending", "approval_pending"]), None)
    current_course = None
    if active_enr:
        course = db.query(models.Course).filter(models.Course.id == active_enr.course_id).first()
        if course:
            concepts = db.query(models.Concept).filter(models.Concept.course_id == course.id).order_by(models.Concept.order_index).all()
            concept_ids = [c.id for c in concepts]
            masteries = db.query(models.MasteryState).filter(
                models.MasteryState.trainee_id == current_user.id,
                models.MasteryState.concept_id.in_(concept_ids)
            ).all() if concept_ids else []
            
            avg_m = (sum(m.mastery_score for m in masteries) / len(concepts) * 100) if concepts else 0.0
            next_c = next((c.title for c in concepts if not any(m.concept_id == c.id and m.mastery_score >= 0.80 for m in masteries)), concepts[0].title if concepts else "Introduction")
            
            current_course = {
                "id": course.id,
                "code": course.code,
                "title": course.title,
                "description": course.description,
                "progress": round(avg_m, 1),
                "next_concept": next_c
            }
            
    enrolled_courses = []
    completed_count = 0
    for e in enrollments:
        c = db.query(models.Course).filter(models.Course.id == e.course_id).first()
        if not c: continue
        if e.status == "completed": completed_count += 1
        
        c_concepts = db.query(models.Concept).filter(models.Concept.course_id == c.id).all()
        c_ids = [cc.id for cc in c_concepts]
        c_masteries = db.query(models.MasteryState).filter(
            models.MasteryState.trainee_id == current_user.id,
            models.MasteryState.concept_id.in_(c_ids)
        ).all() if c_ids else []
        prog = (sum(m.mastery_score for m in c_masteries) / len(c_concepts) * 100) if c_concepts else 0.0
        
        cert = db.query(models.Certificate).filter(
            models.Certificate.trainee_id == current_user.id,
            models.Certificate.course_id == c.id
        ).first()
        
        enrolled_courses.append({
            "id": c.id,
            "code": c.code,
            "title": c.title,
            "description": c.description,
            "status": e.status,
            "progress": round(prog, 1),
            "certificate_code": cert.certificate_code if cert else None
        })
        
    notifications = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).limit(5).all()
    
    pending_assignments = db.query(models.Submission).filter(
        models.Submission.trainee_id == current_user.id,
        models.Submission.status == "submitted"
    ).count()

    weekly_hours_dict = json.loads(profile.weekly_hours_json) if profile and profile.weekly_hours_json else {"Mon":2,"Tue":2,"Wed":2,"Thu":3,"Fri":2,"Sat":4,"Sun":3}
    total_weekly_hours = sum(weekly_hours_dict.values())

    return {
        "trainee": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "education": profile.education if profile else "B.Tech CS",
            "current_role": profile.current_role if profile else "Learner",
            "career_goal": profile.career_goal if profile else "AI/ML Engineer"
        },
        "summary": {
            "active_courses": len([e for e in enrollments if e.status in ["approved", "diagnostic_pending", "approval_pending"]]),
            "completed_courses": completed_count,
            "overall_progress": round(sum(ec["progress"] for ec in enrolled_courses) / len(enrolled_courses), 1) if enrolled_courses else 0.0,
            "weekly_hours": total_weekly_hours,
            "hours_completed_this_week": 9,
            "streak_days": profile.streak_days if profile else 7
        },
        "current_course": current_course,
        "enrolled_courses": enrolled_courses,
        "pending_assignments": pending_assignments,
        "notifications": [
            {
                "id": n.id,
                "type": n.type,
                "message": n.message,
                "is_read": n.is_read,
                "created_at": n.created_at.strftime("%Y-%m-%d %H:%M UTC") if n.created_at else ""
            } for n in notifications
        ]
    }

@app.get("/api/trainee/profile")
def get_trainee_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainee)
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "education": profile.education if profile else "B.Tech CS",
        "current_role": profile.current_role if profile else "Learner",
        "career_goal": profile.career_goal if profile else "AI/ML Engineer",
        "weekly_hours_json": json.loads(profile.weekly_hours_json) if profile and profile.weekly_hours_json else {},
        "streak_days": profile.streak_days if profile else 7
    }

@app.put("/api/trainee/profile")
def update_trainee_profile(
    req: schemas.TraineeProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainee)
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if profile:
        if req.education: profile.education = req.education
        if req.current_role: profile.current_role = req.current_role
        if req.career_goal: profile.career_goal = req.career_goal
        db.commit()
    return {"message": "Trainee profile updated successfully"}

@app.get("/api/trainee/diagnostic")
def get_trainee_diagnostic(
    course_id: Optional[int] = Query(3),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainee)
):
    assessment = db.query(models.Assessment).filter(
        models.Assessment.course_id == course_id,
        models.Assessment.assessment_type == "diagnostic"
    ).first()
    
    if not assessment:
        assessment = db.query(models.Assessment).first()

    if not assessment:
        raise HTTPException(status_code=404, detail="No diagnostic assessment found")

    questions = db.query(models.Question).filter(models.Question.assessment_id == assessment.id).all()
    
    res_questions = []
    for q in questions:
        res_questions.append({
            "id": q.id,
            "question_text": q.question_text,
            "options": json.loads(q.options_json),
            "topic": q.topic,
            "concept_id": q.concept_id
        })

    return {
        "assessment_id": assessment.id,
        "title": assessment.title,
        "total_questions": len(res_questions),
        "questions": res_questions
    }

@app.post("/api/trainee/diagnostic/submit")
def submit_trainee_diagnostic(
    req: schemas.DiagnosticSubmitRequest,
    course_id: Optional[int] = Query(3),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainee)
):
    answers = req.answers
    if not answers:
        raise HTTPException(status_code=400, detail="No answers provided")

    total_q = len(answers)
    correct_count = 0
    topic_scores = {}

    attempt = models.AssessmentAttempt(
        assessment_id=1,
        trainee_id=current_user.id,
        score=0.0,
        percentage=0.0,
        submitted_at=datetime.utcnow()
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    for q_id_str, selected_opt in answers.items():
        q_id = int(q_id_str)
        q = db.query(models.Question).filter(models.Question.id == q_id).first()
        if not q: continue
        
        is_corr = (selected_opt == q.correct_option_index)
        if is_corr: correct_count += 1

        topic = q.topic or "General"
        if topic not in topic_scores:
            topic_scores[topic] = {"correct": 0, "total": 0}
        topic_scores[topic]["total"] += 1
        if is_corr: topic_scores[topic]["correct"] += 1

        ans_rec = models.AssessmentAnswer(
            attempt_id=attempt.id,
            question_id=q_id,
            selected_option=selected_opt,
            is_correct=is_corr
        )
        db.add(ans_rec)

        if q.concept_id:
            m_state = db.query(models.MasteryState).filter(
                models.MasteryState.trainee_id == current_user.id,
                models.MasteryState.concept_id == q.concept_id
            ).first()
            score_val = 0.85 if is_corr else 0.35
            if m_state:
                m_state.mastery_score = score_val
            else:
                db.add(models.MasteryState(
                    trainee_id=current_user.id,
                    concept_id=q.concept_id,
                    mastery_score=score_val
                ))

    final_percentage = (correct_count / total_q * 100.0) if total_q > 0 else 0.0
    attempt.score = float(correct_count)
    attempt.percentage = final_percentage

    enr = db.query(models.Enrollment).filter(
        models.Enrollment.trainee_id == current_user.id,
        models.Enrollment.course_id == course_id
    ).first()

    eligibility = "eligible" if final_percentage >= 70.0 else ("eligible_with_revision" if final_percentage >= 50.0 else "prerequisites_required")

    if not enr:
        enr = models.Enrollment(
            trainee_id=current_user.id,
            course_id=course_id,
            status="approval_pending",
            diagnostic_score=final_percentage / 100.0
        )
        db.add(enr)
    else:
        enr.diagnostic_score = final_percentage / 100.0
        if enr.status == "diagnostic_pending":
            enr.status = "approval_pending"

    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    weekly_h = json.loads(profile.weekly_hours_json) if profile and profile.weekly_hours_json else {"Mon":2,"Tue":2,"Wed":2,"Thu":3,"Fri":2,"Sat":4,"Sun":3}
    generate_personalized_roadmap(db, current_user.id, course_id, weekly_h)

    db.commit()

    topic_breakdown = []
    for top, data in topic_scores.items():
        pct = (data["correct"] / data["total"] * 100.0) if data["total"] > 0 else 0.0
        status_str = "Strong" if pct >= 80 else ("Proficient" if pct >= 60 else "Developing")
        topic_breakdown.append({
            "topic": top,
            "percentage": round(pct, 1),
            "status": status_str
        })

    return {
        "score_percentage": round(final_percentage, 1),
        "correct_answers": correct_count,
        "total_questions": total_q,
        "eligibility_status": eligibility,
        "topic_breakdown": topic_breakdown,
        "recommendation": f"Diagnostic evaluation complete ({round(final_percentage,1)}%). Baseline knowledge recorded and personalized roadmap updated.",
        "enrollment_status": enr.status
    }

@app.get("/api/trainee/availability")
def get_trainee_availability(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainee)
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    hours = json.loads(profile.weekly_hours_json) if profile and profile.weekly_hours_json else {"Mon":2,"Tue":2,"Wed":2,"Thu":3,"Fri":2,"Sat":4,"Sun":3}
    return {"weekly_hours": hours}

@app.put("/api/trainee/availability")
def update_trainee_availability(
    req: schemas.AvailabilityRequest,
    course_id: Optional[int] = Query(3),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainee)
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if profile:
        profile.weekly_hours_json = json.dumps(req.weekly_hours)
        db.commit()

    roadmap = generate_personalized_roadmap(db, current_user.id, course_id, req.weekly_hours)
    return roadmap

@app.get("/api/trainee/roadmap/{course_id}")
def get_trainee_personalized_roadmap(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainee)
):
    return get_trainee_roadmap(course_id=course_id, trainee_id=current_user.id, db=db, current_user=current_user)

@app.get("/api/trainee/kg/{course_id}")
def get_trainee_knowledge_graph(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainee)
):
    return build_trainee_kg(db, current_user.id, course_id)

@app.get("/api/trainee/assignments")
def get_trainee_assignments(
    course_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainee)
):
    query = db.query(models.Assignment)
    if course_id:
        query = query.filter(models.Assignment.course_id == course_id)
    
    assignments = query.all()
    res = []
    for a in assignments:
        concept = db.query(models.Concept).filter(models.Concept.id == a.concept_id).first() if a.concept_id else None
        sub = db.query(models.Submission).filter(
            models.Submission.assignment_id == a.id,
            models.Submission.trainee_id == current_user.id
        ).first()

        res.append({
            "id": a.id,
            "course_id": a.course_id,
            "concept_id": a.concept_id,
            "concept_title": concept.title if concept else "Course Deliverable",
            "title": a.title,
            "description": a.description,
            "due_date": a.due_date,
            "max_score": a.max_score,
            "submission": {
                "id": sub.id,
                "content_url": sub.content_url,
                "submitted_at": sub.submitted_at.strftime("%Y-%m-%d %H:%M UTC") if sub.submitted_at else "",
                "grade": sub.grade,
                "feedback": sub.feedback,
                "status": sub.status
            } if sub else None
        })
    return res

@app.post("/api/trainee/assignments/{assignment_id}/submit")
def submit_trainee_assignment(
    assignment_id: int,
    req: schemas.SubmissionCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainee)
):
    assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    existing_sub = db.query(models.Submission).filter(
        models.Submission.assignment_id == assignment_id,
        models.Submission.trainee_id == current_user.id
    ).first()

    if existing_sub:
        existing_sub.content_url = req.content_url
        existing_sub.submitted_at = datetime.utcnow()
        existing_sub.status = "submitted"
        db.commit()
        db.refresh(existing_sub)
        return existing_sub

    new_sub = models.Submission(
        assignment_id=assignment_id,
        trainee_id=current_user.id,
        content_url=req.content_url,
        submitted_at=datetime.utcnow(),
        status="submitted"
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub

@app.get("/api/trainee/certificates")
def get_trainee_certificates(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainee)
):
    certs = db.query(models.Certificate).filter(models.Certificate.trainee_id == current_user.id).all()
    res = []
    for cert in certs:
        course = db.query(models.Course).filter(models.Course.id == cert.course_id).first()
        res.append({
            "id": cert.id,
            "course_id": cert.course_id,
            "course_title": course.title if course else "Capacity Course",
            "course_code": course.code if course else "",
            "certificate_code": cert.certificate_code,
            "issued_date": cert.issued_date,
            "trainee_name": current_user.full_name
        })
    return res

@app.get("/api/trainee/discussions")
def get_trainee_discussions(
    course_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_trainee)
):
    query = db.query(models.DiscussionPost).filter(models.DiscussionPost.parent_id == None)
    if course_id:
        query = query.filter(models.DiscussionPost.course_id == course_id)

    posts = query.order_by(models.DiscussionPost.is_pinned.desc(), models.DiscussionPost.created_at.desc()).all()
    res = []
    for p in posts:
        author = db.query(models.User).filter(models.User.id == p.author_id).first()
        course = db.query(models.Course).filter(models.Course.id == p.course_id).first()
        replies = db.query(models.DiscussionPost).filter(models.DiscussionPost.parent_id == p.id).all()
        
        replies_data = []
        for r in replies:
            r_author = db.query(models.User).filter(models.User.id == r.author_id).first()
            replies_data.append({
                "id": r.id,
                "author_id": r.author_id,
                "author_name": r_author.full_name if r_author else "User",
                "author_role": r.author_role,
                "content": r.content,
                "created_at": r.created_at.strftime("%Y-%m-%d %H:%M UTC") if r.created_at else ""
            })

        res.append({
            "id": p.id,
            "course_id": p.course_id,
            "course_title": course.title if course else "",
            "author_id": p.author_id,
            "author_name": author.full_name if author else "User",
            "author_role": p.author_role,
            "title": p.title,
            "content": p.content,
            "is_pinned": p.is_pinned,
            "created_at": p.created_at.strftime("%Y-%m-%d %H:%M UTC") if p.created_at else "",
            "replies": replies_data
        })
    return res

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


