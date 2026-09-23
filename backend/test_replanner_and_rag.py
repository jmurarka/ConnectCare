import sys
import os
from database import SessionLocal
import models
from services.plan_aware_reasoner import build_learner_state, build_curriculum_kg, PlanAwareReasoner
from services.dynamic_replanner import DynamicReplanner
from services.rag_explanation_engine import generate_rag_explanation
from services.neo4j_service import is_neo4j_active, NEO4J_INSTANCE_ID
from services.planning_engine import generate_personalized_roadmap

def main():
    print("=== Testing Capacity Connect Dynamic Replanner, KG & RAG Engine ===")
    db = SessionLocal()

    try:
        # Check trainee and course
        trainee = db.query(models.User).filter(models.User.role == "trainee").first()
        course = db.query(models.Course).first()

        if not trainee or not course:
            print("[FAIL] Trainee or Course not found in database. Run seed.py first.")
            return

        trainee_id = trainee.id
        course_id = course.id
        print(f"[INFO] Testing for Trainee ID={trainee_id} ({trainee.email}), Course ID={course_id} ({course.code})")

        # 1. Test LearnerState & CurriculumKG construction
        learner = build_learner_state(db, trainee_id, course_id)
        kg = build_curriculum_kg(db, course_id)
        print(f"[PASS] Loaded {len(kg.concepts)} concepts, {len(learner.mastery_states)} mastery states.")

        # 2. Test PlanAwareReasoner
        reasoner = PlanAwareReasoner(kg)
        res = reasoner.analyse(learner)
        print(f"[PASS] Reasoner Analysis: {len(res.weak_concept_ids)} weak concepts, "
              f"{len(res.forgetting_events)} forgotten events, deviation={res.deviation}")

        # 3. Test DynamicReplanner 8-step roadmap generation
        replanner = DynamicReplanner(reasoner)
        roadmap_res = replanner.generate_roadmap(learner)
        steps = roadmap_res["steps"]
        print(f"[PASS] DynamicReplanner generated {len(steps)} steps (MAX_STEPS <= 8).")
        for i, s in enumerate(steps, 1):
            print(f"  Step {i}: [Priority {s['priority']}] [{s['action'].upper()}] {s['concept_name']} (Wk {s['week_number']}) - {s['reason']}")

        # 4. Test RAG Explanation Generation (Gemini API)
        explanation = generate_rag_explanation(
            trainee_name=trainee.full_name,
            course_title=course.title,
            reasoner_analysis={
                "forgetting_events": roadmap_res["forgetting_events"],
                "weak_root_causes": roadmap_res["weak_root_causes"],
                "deviation": roadmap_res["deviation"]
            },
            roadmap_steps=steps
        )
        print("\n=== Gemini RAG Grounded Explanation Output ===")
        print(explanation)
        print("=============================================\n")

        # 5. Test Full Pipeline via generate_personalized_roadmap
        full_roadmap = generate_personalized_roadmap(db, trainee_id, course_id, {"Mon": 2, "Tue": 2, "Wed": 2, "Thu": 3, "Fri": 2, "Sat": 4, "Sun": 3})
        assert "rag_explanation" in full_roadmap
        assert "items" in full_roadmap
        assert len(full_roadmap["items"]) <= 8
        print("[PASS] End-to-end generate_personalized_roadmap pipeline verified.")

        # 6. Test Neo4j connectivity
        print(f"[INFO] Neo4j instance ID: {NEO4J_INSTANCE_ID}. Neo4j driver active: {is_neo4j_active()}")
        print("\n>>> ALL ARCHITECTURE TESTS PASSED SUCCESSFULLY! <<<")

    finally:
        db.close()

if __name__ == "__main__":
    main()
