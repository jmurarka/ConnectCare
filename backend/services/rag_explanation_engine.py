import os
from typing import Dict, List, Any
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def generate_rag_explanation(
    trainee_name: str,
    course_title: str,
    reasoner_analysis: Dict[str, Any],
    roadmap_steps: List[Dict[str, Any]]
) -> str:
    """
    Uses Gemini API to synthesize Knowledge Graph facts, replanning operators
    (REINSERTION, REMEDIATION, FORWARD_LEARNING, COMPRESSION), and score history
    into a trainee-facing grounded explanation.
    """
    forgetting_events = reasoner_analysis.get("forgetting_events", [])
    weak_root_causes = reasoner_analysis.get("weak_root_causes", {})
    deviation = reasoner_analysis.get("deviation", 0.0)

    # Format steps summary for prompt
    step_summaries = []
    for idx, s in enumerate(roadmap_steps, 1):
        step_summaries.append(
            f"Step {idx} (Wk {s.get('week_number', 1)}, Priority {s.get('priority', 3)}, Action: {s.get('action', 'learn').upper()}): "
            f"{s.get('concept_name')} [{s.get('operator_applied', 'FORWARD')}] - Reason: {s.get('reason')}"
        )
    steps_text = "\n".join(step_summaries)

    prompt = f"""
You are an expert AI Learning Pedagogical Reasoner for the Capacity Connect Platform.
Explain to trainee '{trainee_name}' why their personalized learning roadmap for '{course_title}' was dynamically generated in this exact sequence.

KNOWLEDGE GRAPH & REPLANNING FACTS:
- Forgetting Events Detected: {forgetting_events}
- Weak Root Causes Traced: {weak_root_causes}
- Velocity Deviation Score: {deviation} (Negative = ahead of schedule, Positive = behind)
- Scheduled Roadmap Steps:
{steps_text}

INSTRUCTIONS:
1. Explain clearly in 2 to 4 concise paragraphs.
2. Directly reference specific concept names, score drops, prerequisite dependencies, and why certain topics were reinserted or prioritized.
3. Be encouraging, precise, and ground every statement in the Knowledge Graph facts above.
"""

    # 1. Attempt calling Gemini via new google.genai SDK
    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        if response and response.text:
            return response.text.strip()
    except Exception as e:
        pass

    # 2. Attempt legacy google.generativeai SDK with supported models
    try:
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            import google.generativeai as legacy_genai
        legacy_genai.configure(api_key=GEMINI_API_KEY)
        for m in ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-pro"]:
            try:
                model = legacy_genai.GenerativeModel(m)
                response = model.generate_content(prompt)
                if response and response.text:
                    return response.text.strip()
            except Exception:
                continue
    except Exception:
        pass

    # 3. REST Fallback using urllib.request
    try:
        import urllib.request
        import json
        for model_name in ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash"]:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
                headers = {"Content-Type": "application/json"}
                payload = {"contents": [{"parts": [{"text": prompt}]}]}
                req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers)
                with urllib.request.urlopen(req, timeout=10) as resp:
                    res_data = json.loads(resp.read().decode("utf-8"))
                    text = res_data["candidates"][0]["content"]["parts"][0]["text"]
                    if text:
                        return text.strip()
            except Exception:
                continue
    except Exception:
        pass

    # 4. Grounded Pedagogical Template Fallback
    parts = []
    if forgetting_events:
        fe_names = ", ".join([fe["concept_name"] for fe in forgetting_events])
        parts.append(
            f"Noticeable mastery decay detected in previously mastered concepts ({fe_names}). "
            f"The Dynamic Replanner inserted REINSERTION spaced review tasks (Priority 0) to reinforce retention."
        )
    if weak_root_causes:
        parts.append(
            f"Targeted ROOT-CAUSE REMEDIATION tasks (Priority 1) were inserted for foundational prerequisites "
            f"to resolve knowledge gaps before advancing to advanced modules."
        )
    if deviation < -1.0:
        parts.append(
            f"Your overall mastery velocity indicates you are ahead of schedule (deviation: {deviation}). "
            f"Review steps were compressed to accelerate your progression through upcoming topics."
        )
    else:
        parts.append(
            f"Forward learning modules are scheduled in strict topological order based on prerequisite readiness."
        )

    return " ".join(parts)
