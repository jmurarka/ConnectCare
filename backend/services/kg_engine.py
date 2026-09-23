from sqlalchemy.orm import Session
import models
from services.neo4j_service import is_neo4j_active, sync_course_concepts_to_neo4j, NEO4J_INSTANCE_ID

def build_trainee_kg(db: Session, trainee_id: int, course_id: int):
    # Fetch concepts for course
    concepts = db.query(models.Concept).filter(models.Concept.course_id == course_id).order_by(models.Concept.order_index).all()
    concept_map = {c.id: c for c in concepts}
    
    # Fetch prerequisites
    prereqs = db.query(models.Prerequisite).all()
    prereq_graph = {}
    for p in prereqs:
        if p.concept_id not in prereq_graph:
            prereq_graph[p.concept_id] = []
        prereq_graph[p.concept_id].append(p.prerequisite_concept_id)

    # Sync to Neo4j if driver available
    c_dicts = [{"id": c.id, "code": c.code, "title": c.title, "module_name": c.module_name, "estimated_hours": c.estimated_hours, "order_index": c.order_index} for c in concepts]
    p_dicts = [{"concept_id": p.concept_id, "prerequisite_concept_id": p.prerequisite_concept_id} for p in prereqs]
    sync_course_concepts_to_neo4j(course_id, c_dicts, p_dicts)

    # Fetch trainee mastery states & score history
    masteries = db.query(models.MasteryState).filter(models.MasteryState.trainee_id == trainee_id).all()
    mastery_map = {m.concept_id: m.mastery_score for m in masteries}

    history_records = db.query(models.MasteryHistory).filter(models.MasteryHistory.trainee_id == trainee_id).order_by(models.MasteryHistory.timestamp.asc()).all()
    score_history = {}
    for h in history_records:
        if h.concept_id not in score_history:
            score_history[h.concept_id] = []
        score_history[h.concept_id].append(h.score)

    nodes = []
    edges = []

    for c in concepts:
        score = mastery_map.get(c.id, 0.0)
        req_prereq_ids = prereq_graph.get(c.id, [])
        history = score_history.get(c.id, [])
        prev_max = max(history) if history else 0.0
        
        # Calculate if prerequisites are satisfied
        prereq_satisfied = True
        prereq_reasons = []
        for pid in req_prereq_ids:
            p_score = mastery_map.get(pid, 0.0)
            p_concept = concept_map.get(pid)
            if p_score < 0.60:
                prereq_satisfied = False
                if p_concept:
                    prereq_reasons.append(f"Requires {p_concept.title} (Current: {int(p_score*100)}%, Need >= 60%)")

        # Determine status adhering to DynamicReplanner Architecture
        if score >= 0.80:
            status = "strong"
            badge = "Strong (80-100%)"
        elif score >= 0.60:
            status = "proficient"
            badge = "Proficient (60-79%)"
        elif score >= 0.50:
            status = "developing"
            badge = "Developing (50-59%)"
        elif score < 0.50 and prev_max >= 0.75:
            status = "forgotten"
            badge = f"Forgotten (Declined from {int(prev_max*100)}%)"
        elif score > 0.0:
            status = "weak"
            badge = "Needs Revision (<50%)"
        else:
            if not prereq_satisfied:
                status = "blocked"
                badge = "Blocked by Prerequisite"
            else:
                status = "not_started"
                badge = "Ready to Learn"

        nodes.append({
            "id": c.id,
            "code": c.code,
            "title": c.title,
            "module_name": c.module_name,
            "mastery_score": round(score * 100, 1),
            "status": status,
            "badge": badge,
            "prereq_satisfied": prereq_satisfied,
            "prereq_reasons": prereq_reasons,
            "estimated_hours": c.estimated_hours
        })

        for pid in req_prereq_ids:
            edges.append({
                "from": pid,
                "to": c.id,
                "satisfied": mastery_map.get(pid, 0.0) >= 0.60
            })

    return {
        "course_id": course_id,
        "trainee_id": trainee_id,
        "neo4j_active": is_neo4j_active(),
        "neo4j_instance_id": NEO4J_INSTANCE_ID,
        "nodes": nodes,
        "edges": edges
    }

def build_trainer_course_competency(db: Session, course_id: int):
    concepts = db.query(models.Concept).filter(models.Concept.course_id == course_id).order_by(models.Concept.order_index).all()
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.course_id == course_id,
        models.Enrollment.status.in_(["approved", "completed"])
    ).all()
    
    total_enrolled = len(enrollments)
    trainee_ids = [e.trainee_id for e in enrollments]

    masteries = db.query(models.MasteryState).filter(
        models.MasteryState.concept_id.in_([c.id for c in concepts]),
        models.MasteryState.trainee_id.in_(trainee_ids)
    ).all() if trainee_ids else []

    concept_stats = []

    for c in concepts:
        c_masteries = [m for m in masteries if m.concept_id == c.id]
        strong = [m.trainee_id for m in c_masteries if m.mastery_score >= 0.80]
        proficient = [m.trainee_id for m in c_masteries if 0.60 <= m.mastery_score < 0.80]
        developing = [m.trainee_id for m in c_masteries if 0.40 <= m.mastery_score < 0.60]
        weak = [m.trainee_id for m in c_masteries if 0.0 < m.mastery_score < 0.40]
        not_started = [t_id for t_id in trainee_ids if t_id not in [m.trainee_id for m in c_masteries]]

        avg_mastery = (sum(m.mastery_score for m in c_masteries) / total_enrolled * 100) if total_enrolled > 0 else 0

        concept_stats.append({
            "concept_id": c.id,
            "title": c.title,
            "module_name": c.module_name,
            "avg_mastery": round(avg_mastery, 1),
            "at_risk_trainee_ids": weak,
            "counts": {
                "strong": len(strong),
                "proficient": len(proficient),
                "developing": len(developing),
                "weak": len(weak),
                "not_started": len(not_started)
            },
            "trainee_groups": {
                "weak_trainee_ids": weak,
                "developing_trainee_ids": developing
            }
        })

    all_at_risk = list(set([t_id for c in concept_stats for t_id in c["at_risk_trainee_ids"]]))

    return {
        "course_id": course_id,
        "total_enrolled": total_enrolled,
        "at_risk_trainee_ids": all_at_risk,
        "concepts": concept_stats
    }

def check_prerequisite_cycle(db: Session, concept_id: int, new_prereq_id: int) -> bool:
    if concept_id == new_prereq_id:
        return True

    all_prereqs = db.query(models.Prerequisite).all()
    graph = {}
    for p in all_prereqs:
        if p.prerequisite_concept_id not in graph:
            graph[p.prerequisite_concept_id] = []
        graph[p.prerequisite_concept_id].append(p.concept_id)
    
    visited = set()
    queue = [concept_id]
    
    while queue:
        curr = queue.pop(0)
        if curr == new_prereq_id:
            return True
        if curr not in visited:
            visited.add(curr)
            neighbors = graph.get(curr, [])
            for n in neighbors:
                if n not in visited:
                    queue.append(n)
                    
    return False

def build_admin_platform_kg(db: Session):
    courses = db.query(models.Course).all()
    platform_competencies = []

    for course in courses:
        concepts = db.query(models.Concept).filter(models.Concept.course_id == course.id).all()
        concept_ids = [c.id for c in concepts]
        masteries = db.query(models.MasteryState).filter(models.MasteryState.concept_id.in_(concept_ids)).all() if concept_ids else []
        
        avg_score = (sum(m.mastery_score for m in masteries) / len(masteries) * 100) if masteries else 0.0

        platform_competencies.append({
            "course_id": course.id,
            "code": course.code,
            "title": course.title,
            "level": course.level,
            "avg_mastery": round(avg_score, 1),
            "concept_count": len(concepts),
            "status": "Healthy" if avg_score >= 65 else "Attention Required"
        })

    return {
        "platform_competencies": platform_competencies
    }
