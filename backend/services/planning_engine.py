import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import models

from services.plan_aware_reasoner import build_learner_state, build_curriculum_kg, PlanAwareReasoner
from services.dynamic_replanner import DynamicReplanner
from services.rag_explanation_engine import generate_rag_explanation

def generate_personalized_roadmap(db: Session, trainee_id: int, course_id: int, weekly_hours: dict):
    # Calculate weekly capacity
    total_weekly_hours = sum(weekly_hours.values()) if weekly_hours else 14.0
    if total_weekly_hours <= 0:
        total_weekly_hours = 14.0

    # Build LearnerState and CurriculumKG
    learner = build_learner_state(db, trainee_id, course_id)
    learner.weekly_hours_available = total_weekly_hours
    kg = build_curriculum_kg(db, course_id)

    # Initialize Engine Components
    reasoner = PlanAwareReasoner(kg)
    replanner = DynamicReplanner(reasoner)

    # Execute Dynamic Roadmap Replanning Architecture
    plan_output = replanner.generate_roadmap(learner, canonical_idx=1)
    steps = plan_output["steps"]

    # Calculate completion date
    total_weeks = plan_output.get("total_weeks", 1)
    days_needed = int(total_weeks * 7)
    comp_date = (datetime.utcnow() + timedelta(days=days_needed)).strftime("%d %B %Y")

    # Fetch trainee and course for RAG Explanation
    trainee = db.query(models.User).filter(models.User.id == trainee_id).first()
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    trainee_name = trainee.full_name if trainee else "Trainee"
    course_title = course.title if course else "Course"

    reasoner_res = reasoner.analyse(learner)
    rag_explanation = generate_rag_explanation(
        trainee_name=trainee_name,
        course_title=course_title,
        reasoner_analysis={
            "forgetting_events": plan_output["forgetting_events"],
            "weak_root_causes": plan_output["weak_root_causes"],
            "deviation": plan_output["deviation"]
        },
        roadmap_steps=steps
    )

    # Save to database
    existing_rm = db.query(models.Roadmap).filter(
        models.Roadmap.trainee_id == trainee_id,
        models.Roadmap.course_id == course_id
    ).first()

    if existing_rm:
        db.query(models.RoadmapItem).filter(models.RoadmapItem.roadmap_id == existing_rm.id).delete()
        existing_rm.weekly_capacity_hours = total_weekly_hours
        existing_rm.estimated_completion_date = comp_date
        db.commit()
        rm_id = existing_rm.id
    else:
        new_rm = models.Roadmap(
            trainee_id=trainee_id,
            course_id=course_id,
            weekly_capacity_hours=total_weekly_hours,
            estimated_completion_date=comp_date,
            is_trainer_overridden=False
        )
        db.add(new_rm)
        db.commit()
        db.refresh(new_rm)
        rm_id = new_rm.id

    db_items = []
    for s in steps:
        rmi = models.RoadmapItem(
            roadmap_id=rm_id,
            concept_id=s["concept_id"],
            week_number=s.get("week_number", 1),
            estimated_hours=s["estimated_hours"],
            status=s["status"],
            action_type=s.get("action", "learn"),
            priority=s.get("priority", 3),
            operator_applied=s.get("operator_applied"),
            reason_explanation=s["reason"]
        )
        db.add(rmi)

    db.commit()

    # Query saved items
    saved_items = db.query(models.RoadmapItem).filter(models.RoadmapItem.roadmap_id == rm_id).order_by(models.RoadmapItem.week_number, models.RoadmapItem.priority).all()
    res_items = []
    for item in saved_items:
        concept = db.query(models.Concept).filter(models.Concept.id == item.concept_id).first()
        res_items.append({
            "id": item.id,
            "concept_id": item.concept_id,
            "title": concept.title if concept else "Concept",
            "code": concept.code if concept else "",
            "module_name": concept.module_name if concept else "Module",
            "week_number": item.week_number,
            "estimated_hours": item.estimated_hours,
            "status": item.status,
            "action_type": item.action_type or "learn",
            "priority": item.priority if item.priority is not None else 3,
            "operator_applied": item.operator_applied or "FORWARD",
            "reason_explanation": item.reason_explanation
        })

    return {
        "roadmap_id": rm_id,
        "weekly_capacity_hours": total_weekly_hours,
        "estimated_completion_weeks": total_weeks,
        "estimated_completion_date": comp_date,
        "operators_applied": plan_output["operators_applied"],
        "analysis": plan_output["analysis"],
        "rag_explanation": rag_explanation,
        "items": res_items
    }
