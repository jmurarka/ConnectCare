import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import models

def generate_personalized_roadmap(db: Session, trainee_id: int, course_id: int, weekly_hours: dict):
    # Calculate weekly capacity
    total_weekly_hours = sum(weekly_hours.values())
    if total_weekly_hours <= 0:
        total_weekly_hours = 14.0 # Default fallback

    # Get course and concepts
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    concepts = db.query(models.Concept).filter(models.Concept.course_id == course_id).order_by(models.Concept.order_index).all()
    concept_map = {c.id: c for c in concepts}

    # Get prerequisite mapping
    prereqs = db.query(models.Prerequisite).all()
    prereq_graph = {}
    for p in prereqs:
        if p.concept_id not in prereq_graph:
            prereq_graph[p.concept_id] = []
        prereq_graph[p.concept_id].append(p.prerequisite_concept_id)

    # Get trainee mastery states
    masteries = db.query(models.MasteryState).filter(models.MasteryState.trainee_id == trainee_id).all()
    mastery_map = {m.concept_id: m.mastery_score for m in masteries}

    roadmap_items = []
    current_week = 1
    current_week_hours = 0.0

    for c in concepts:
        m_score = mastery_map.get(c.id, 0.0)
        req_prereqs = prereq_graph.get(c.id, [])

        # Prerequisite check
        prereq_met = True
        prereq_names = []
        for pid in req_prereqs:
            p_score = mastery_map.get(pid, 0.0)
            if p_score < 0.60:
                prereq_met = False
                p_c = concept_map.get(pid)
                if p_c:
                    prereq_names.append(p_c.title)

        if not prereq_met:
            status = "locked"
            est_hours = c.estimated_hours
            reason = f"Locked: Requires prerequisite mastery in {', '.join(prereq_names)}"
        elif m_score >= 0.80:
            status = "skipped_mastered"
            est_hours = round(c.estimated_hours * 0.25, 1) # 75% time saved
            reason = f"Personalized: Fast-tracked revision ({int(m_score*100)}% diagnostic score)"
        elif 0.40 <= m_score < 0.80:
            status = "needs_revision"
            est_hours = round(c.estimated_hours * 0.75, 1)
            reason = f"Targeted learning: Focused practice scheduled ({int(m_score*100)}% baseline)"
        else:
            status = "in_progress" if len(roadmap_items) == 0 else "upcoming"
            est_hours = c.estimated_hours
            reason = "Standard comprehensive learning module"

        # Fit into week
        if current_week_hours + est_hours > total_weekly_hours and current_week_hours > 0:
            current_week += 1
            current_week_hours = est_hours
        else:
            current_week_hours += est_hours

        roadmap_items.append({
            "concept_id": c.id,
            "concept_code": c.code,
            "title": c.title,
            "module_name": c.module_name,
            "week_number": current_week,
            "estimated_hours": est_hours,
            "status": status,
            "reason_explanation": reason,
            "mastery_score": round(m_score * 100, 1)
        })

    # Estimate completion date
    days_needed = int((current_week * 7))
    comp_date = (datetime.utcnow() + timedelta(days=days_needed)).strftime("%d %B %Y")

    # Check existing roadmap or create new
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

    for item in roadmap_items:
        rmi = models.RoadmapItem(
            roadmap_id=rm_id,
            concept_id=item["concept_id"],
            week_number=item["week_number"],
            estimated_hours=item["estimated_hours"],
            status=item["status"],
            reason_explanation=item["reason_explanation"]
        )
        db.add(rmi)

    db.commit()

    db_items = db.query(models.RoadmapItem).filter(models.RoadmapItem.roadmap_id == rm_id).order_by(models.RoadmapItem.week_number).all()
    res_items = []
    for item in db_items:
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
        "roadmap_id": rm_id,
        "weekly_capacity_hours": total_weekly_hours,
        "estimated_completion_weeks": current_week,
        "estimated_completion_date": comp_date,
        "items": res_items
    }
