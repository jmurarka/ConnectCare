from typing import Dict, List, Any
from services.plan_aware_reasoner import LearnerState, CurriculumKG, ReasonerResult, PlanAwareReasoner

class DynamicReplanner:
    MAX_STEPS = 8

    def __init__(self, reasoner: PlanAwareReasoner):
        self.reasoner = reasoner
        self.kg = reasoner.kg

    def generate_roadmap(self, learner: LearnerState, canonical_idx: int = 1) -> Dict[str, Any]:
        """
        Executes constraint replanning based on ReasonerResult:
        Step 1: REINSERTION (priority 0) for forgetting events.
        Step 2: ROOT-CAUSE REMEDIATION (priority 1) for weak concepts' unmet prerequisites.
        Step 3: FORWARD LEARNING (priority 2/3) in topological order up to MAX_STEPS=8.
        Step 4: COMPRESSION if deviation < -1.
        """
        result = self.reasoner.analyse(learner, canonical_idx)
        steps = []
        added_concept_ids = set()
        operators_applied = []

        # ----------------------------------------------------
        # STEP 1: REINSERTION (priority 0)
        # ----------------------------------------------------
        for fe in result.forgetting_events:
            cid = fe["concept_id"]
            c_name = fe["concept_name"]
            if cid not in added_concept_ids and len(steps) < self.MAX_STEPS:
                if self.reasoner.prerequisites_met(cid, learner):
                    concept_obj = self.kg.concept_map.get(cid)
                    steps.append({
                        "concept_id": cid,
                        "concept_name": c_name,
                        "module_name": concept_obj.module_name if concept_obj else "Module",
                        "action": "reinforce",
                        "priority": 0,
                        "status": "needs_revision",
                        "estimated_hours": round((concept_obj.estimated_hours if concept_obj else 4.0) * 0.5, 1),
                        "reason": f"REINSERTION: Mastery declined from {int(fe['previous_score']*100)}% to {int(fe['current_score']*100)}%. Spaced review scheduled.",
                        "operator_applied": "REINSERTION"
                    })
                    added_concept_ids.add(cid)
                    operators_applied.append(f"REINSERTION({cid})")

        # ----------------------------------------------------
        # STEP 2: ROOT-CAUSE REMEDIATION (priority 1)
        # ----------------------------------------------------
        for weak_cid, root_prereq_ids in result.weak_root_causes.items():
            for pid in root_prereq_ids:
                if pid not in added_concept_ids and len(steps) < self.MAX_STEPS:
                    p_obj = self.kg.concept_map.get(pid)
                    weak_obj = self.kg.concept_map.get(weak_cid)
                    p_score = learner.get_mastery(pid)
                    steps.append({
                        "concept_id": pid,
                        "concept_name": p_obj.title if p_obj else f"Prerequisite {pid}",
                        "module_name": p_obj.module_name if p_obj else "Module",
                        "action": "review",
                        "priority": 1,
                        "status": "needs_revision",
                        "estimated_hours": round((p_obj.estimated_hours if p_obj else 4.0) * 0.75, 1),
                        "reason": f"ROOT-CAUSE REMEDIATION: Prerequisite for {weak_obj.title if weak_obj else 'weak topic'} ({int(p_score*100)}% mastery). Focus practice first.",
                        "operator_applied": "REMEDIATION"
                    })
                    added_concept_ids.add(pid)
                    operators_applied.append(f"REMEDIATION({pid})")

        # ----------------------------------------------------
        # STEP 3: FORWARD LEARNING (priority 2 / priority 3)
        # ----------------------------------------------------
        for cid in self.kg.all_concept_ids():
            if len(steps) >= self.MAX_STEPS:
                break
            
            if cid in added_concept_ids:
                continue

            score = learner.get_mastery(cid)
            concept_obj = self.kg.concept_map.get(cid)
            if not concept_obj:
                continue

            # Skip if already STRONG (>= 0.80) unless it was explicitly added
            if score >= 0.80:
                continue

            prereqs_ok = self.reasoner.prerequisites_met(cid, learner)

            if not prereqs_ok:
                # Priority 2: Unmet prerequisites -> Insert missing prereq first, defer blocked concept
                unmet_ids = self.reasoner.find_unmet_prerequisites(cid, learner)
                for pid in unmet_ids:
                    if pid not in added_concept_ids and len(steps) < self.MAX_STEPS:
                        p_obj = self.kg.concept_map.get(pid)
                        steps.append({
                            "concept_id": pid,
                            "concept_name": p_obj.title if p_obj else f"Prerequisite {pid}",
                            "module_name": p_obj.module_name if p_obj else "Module",
                            "action": "review",
                            "priority": 2,
                            "status": "needs_revision",
                            "estimated_hours": round((p_obj.estimated_hours if p_obj else 4.0) * 0.75, 1),
                            "reason": f"FORWARD DEFERRAL: Unlocks blocked module {concept_obj.title}.",
                            "operator_applied": "PREREQUISITE_INSERTION"
                        })
                        added_concept_ids.add(pid)
                        operators_applied.append(f"PREREQUISITE_INSERTION({pid})")

                # Insert blocked concept as locked
                if len(steps) < self.MAX_STEPS:
                    steps.append({
                        "concept_id": cid,
                        "concept_name": concept_obj.title,
                        "module_name": concept_obj.module_name,
                        "action": "learn",
                        "priority": 2,
                        "status": "locked",
                        "estimated_hours": concept_obj.estimated_hours,
                        "reason": f"Locked by prerequisite: Complete missing prerequisite concepts first.",
                        "operator_applied": "DEFERRED"
                    })
                    added_concept_ids.add(cid)

            else:
                # Priority 3: Prerequisites met -> Add learn/review step
                action = "review" if score > 0.0 else "learn"
                status = "in_progress" if len(steps) == 0 else "upcoming"
                est_hrs = round(concept_obj.estimated_hours * 0.75, 1) if action == "review" else concept_obj.estimated_hours
                
                steps.append({
                    "concept_id": cid,
                    "concept_name": concept_obj.title,
                    "module_name": concept_obj.module_name,
                    "action": action,
                    "priority": 3,
                    "status": status,
                    "estimated_hours": est_hrs,
                    "reason": f"Forward learning: Scheduled in topological sequence.",
                    "operator_applied": "FORWARD_LEARNING"
                })
                added_concept_ids.add(cid)
                operators_applied.append(f"FORWARD({cid})")

        # ----------------------------------------------------
        # STEP 4: COMPRESSION (if deviation < -1)
        # ----------------------------------------------------
        if result.deviation < -1.0:
            # Acceleration compression: Cap review steps to max 2 per module tier
            review_steps = [s for s in steps if s["action"] in ["review", "reinforce"]]
            if len(review_steps) > 2:
                compressed_steps = []
                review_count = 0
                for s in steps:
                    if s["action"] in ["review", "reinforce"]:
                        review_count += 1
                        if review_count <= 2:
                            compressed_steps.append(s)
                    else:
                        compressed_steps.append(s)
                steps = compressed_steps
                operators_applied.append("COMPRESSION(deviation < -1)")

        # Assign week numbers fitting into weekly capacity
        weekly_cap = learner.weekly_hours_available if learner.weekly_hours_available > 0 else 14.0
        curr_week = 1
        curr_hrs = 0.0

        for s in steps:
            h = s["estimated_hours"]
            if curr_hrs + h > weekly_cap and curr_hrs > 0:
                curr_week += 1
                curr_hrs = h
            else:
                curr_hrs += h
            s["week_number"] = curr_week

        analysis_summary = (
            f"Replanning complete: {len(result.forgetting_events)} reinsertions, "
            f"{len(result.weak_root_causes)} root-cause remediations, "
            f"deviation index {result.deviation}."
        )

        return {
            "steps": steps[:self.MAX_STEPS],
            "operators_applied": operators_applied,
            "analysis": analysis_summary,
            "deviation": result.deviation,
            "forgetting_events": result.forgetting_events,
            "weak_root_causes": result.weak_root_causes,
            "total_weeks": curr_week
        }
