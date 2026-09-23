from dataclasses import dataclass, field
from typing import Dict, List, Set, Optional, Any
from sqlalchemy.orm import Session
import models

@dataclass
class LearnerState:
    trainee_id: int
    mastery_states: Dict[int, float] = field(default_factory=dict) # concept_id -> score (0.0 to 1.0)
    score_history: Dict[int, List[float]] = field(default_factory=dict) # concept_id -> list of past scores
    weekly_hours_available: float = 14.0

    def get_mastery(self, concept_id: int) -> float:
        return self.mastery_states.get(concept_id, 0.0)

    def is_strong(self, concept_id: int) -> bool:
        return self.get_mastery(concept_id) >= 0.80

    def is_weak(self, concept_id: int) -> bool:
        return self.get_mastery(concept_id) < 0.50

@dataclass
class CurriculumKG:
    course_id: int
    concepts: List[Any] # List of models.Concept
    prerequisites: List[Any] # List of models.Prerequisite
    concept_map: Dict[int, Any] = field(default_factory=dict)
    prereq_graph: Dict[int, List[int]] = field(default_factory=dict) # concept_id -> list of prerequisite_concept_ids
    topological_order: List[int] = field(default_factory=list)

    def __post_init__(self):
        self.concept_map = {c.id: c for c in self.concepts}
        self.prereq_graph = {}
        for p in self.prerequisites:
            if p.concept_id not in self.prereq_graph:
                self.prereq_graph[p.concept_id] = []
            self.prereq_graph[p.concept_id].append(p.prerequisite_concept_id)
        
        # Sort topological order by order_index
        sorted_concepts = sorted(self.concepts, key=lambda c: c.order_index)
        self.topological_order = [c.id for c in sorted_concepts]

    def hard_prerequisites(self, concept_id: int) -> List[int]:
        return self.prereq_graph.get(concept_id, [])

    def all_concept_ids(self) -> List[int]:
        return self.topological_order

@dataclass
class ReasonerResult:
    weak_root_causes: Dict[int, List[int]] = field(default_factory=dict) # weak concept_id -> list of root-cause prereq IDs
    forgetting_events: List[Dict[str, Any]] = field(default_factory=list) # [{concept_id, concept_name, prev_score, curr_score}]
    deviation: float = 0.0 # negative = ahead of schedule, positive = behind schedule
    weak_concept_ids: List[int] = field(default_factory=list)

class PlanAwareReasoner:
    def __init__(self, kg: CurriculumKG):
        self.kg = kg

    def prerequisites_met(self, concept_id: int, learner: LearnerState, threshold: float = 0.60) -> bool:
        prereq_ids = self.kg.hard_prerequisites(concept_id)
        for pid in prereq_ids:
            if learner.get_mastery(pid) < threshold:
                return False
        return True

    def find_unmet_prerequisites(self, concept_id: int, learner: LearnerState, threshold: float = 0.60) -> List[int]:
        prereq_ids = self.kg.hard_prerequisites(concept_id)
        unmet = []
        for pid in prereq_ids:
            if learner.get_mastery(pid) < threshold:
                unmet.append(pid)
        return unmet

    def analyse(self, learner: LearnerState, canonical_idx: int = 1) -> ReasonerResult:
        """
        Implements the 4-step PlanAwareReasoner logic:
        1. Weak Concept Detection (mastery_score < 0.5)
        2. Backward DFS Traversal (find root-cause prerequisite chain)
        3. Score-History Check (Was previously STRONG before dropping below 0.5?)
        4. Compute Progress Deviation (expected vs actual mastery growth)
        """
        weak_concepts = []
        
        # Step 1: Weak Concept Detection
        for cid in self.kg.all_concept_ids():
            score = learner.get_mastery(cid)
            if score < 0.50:
                weak_concepts.append(cid)

        forgetting_events = []
        weak_root_causes = {}

        # Step 2 & 3: Backward DFS & Score History Check
        for cid in weak_concepts:
            history = learner.score_history.get(cid, [])
            prev_max_score = max(history) if history else 0.0
            curr_score = learner.get_mastery(cid)
            c_name = self.kg.concept_map[cid].title if cid in self.kg.concept_map else f"Concept {cid}"

            # Step 3: Check if previously scored STRONG (>= 0.75) before dropping below 0.5
            if prev_max_score >= 0.75:
                # Mark as FORGOTTEN -> appended to forgetting_events[]
                forgetting_events.append({
                    "concept_id": cid,
                    "concept_name": c_name,
                    "previous_score": round(prev_max_score, 2),
                    "current_score": round(curr_score, 2)
                })
            else:
                # Keep as WEAK -> Backward DFS to find root causes
                root_causes = self._backward_dfs_prereqs(cid, learner, set())
                weak_root_causes[cid] = root_causes

        # Step 4: Compute Progress Deviation
        # Total expected score across all concepts if on pace
        total_concepts = len(self.kg.all_concept_ids())
        expected_avg_mastery = min(0.85, (canonical_idx / max(total_concepts, 1)) * 0.80 + 0.20)
        
        actual_scores = [learner.get_mastery(cid) for cid in self.kg.all_concept_ids()]
        actual_avg_mastery = sum(actual_scores) / max(len(actual_scores), 1) if actual_scores else 0.0

        # deviation: negative = ahead of schedule (actual > expected), positive = behind
        # scaled score e.g. -1.5 means accelerating
        deviation = round((expected_avg_mastery - actual_avg_mastery) * 10, 2)

        return ReasonerResult(
            weak_root_causes=weak_root_causes,
            forgetting_events=forgetting_events,
            deviation=deviation,
            weak_concept_ids=weak_concepts
        )

    def _backward_dfs_prereqs(self, concept_id: int, learner: LearnerState, visited: Set[int]) -> List[int]:
        root_causes = []
        prereqs = self.kg.hard_prerequisites(concept_id)
        
        for pid in prereqs:
            if pid not in visited:
                visited.add(pid)
                p_score = learner.get_mastery(pid)
                if p_score < 0.60:
                    root_causes.append(pid)
                    # Recursively walk further back
                    sub_causes = self._backward_dfs_prereqs(pid, learner, visited)
                    root_causes.extend(sub_causes)
                    
        return list(dict.fromkeys(root_causes)) # Deduplicate preserving order

def build_learner_state(db: Session, trainee_id: int, course_id: int) -> LearnerState:
    masteries = db.query(models.MasteryState).filter(models.MasteryState.trainee_id == trainee_id).all()
    mastery_states = {m.concept_id: m.mastery_score for m in masteries}

    # Fetch history
    history_records = db.query(models.MasteryHistory).filter(models.MasteryHistory.trainee_id == trainee_id).order_by(models.MasteryHistory.timestamp.asc()).all()
    score_history = {}
    for h in history_records:
        if h.concept_id not in score_history:
            score_history[h.concept_id] = []
        score_history[h.concept_id].append(h.score)

    profile = db.query(models.Profile).filter(models.Profile.user_id == trainee_id).first()
    weekly_hours = 14.0
    if profile and profile.weekly_hours_json:
        try:
            import json
            h_dict = json.loads(profile.weekly_hours_json)
            weekly_hours = float(sum(h_dict.values()))
        except Exception:
            pass

    return LearnerState(
        trainee_id=trainee_id,
        mastery_states=mastery_states,
        score_history=score_history,
        weekly_hours_available=weekly_hours
    )

def build_curriculum_kg(db: Session, course_id: int) -> CurriculumKG:
    concepts = db.query(models.Concept).filter(models.Concept.course_id == course_id).order_by(models.Concept.order_index).all()
    prereqs = db.query(models.Prerequisite).all()
    return CurriculumKG(course_id=course_id, concepts=concepts, prerequisites=prereqs)
