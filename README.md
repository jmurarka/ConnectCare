# Capacity Connect — Knowledge-Graph-Driven Organizational Learning Platform

**Capacity Connect** is a modern web-based organizational learning and capacity-building platform designed for institutions, enterprises, and educational organizations. 

Unlike traditional LMS platforms (which simply follow *register → watch videos → get certificate*), Capacity Connect embeds **three levels of intelligence**:
1. **Level 1 — LMS Core**: Structured courses, module lessons, video lectures, PDFs, Colab notebooks, discussion boards, and digital certificates.
2. **Level 2 — Analytics & Governance**: Progress tracking, concept mastery percentages, class competency heatmaps, and Admin PII security with audit trails.
3. **Level 3 — Adaptive Intelligence (Knowledge Graph)**: Directed Acyclic Graph (DAG) prerequisite reasoning, 20-question diagnostic entry gates, weekly availability planning, personalized roadmap generation, grounded explanations, and human-in-the-loop educator overrides.

---

## 🏛️ Institutional Design System & Aesthetics

Capacity Connect is styled after credible institutional portals (SWAYAM / NPTEL + modern university LMS):
- **Paper Canvas Background**: `#F7F7F5`
- **Primary Institutional Color**: `#174A7E` Deep Navy Blue
- **Crisp Cards & Borders**: `#FFFFFF` cards with `#E5E5E2` borders and clean sans-serif typography.
- **Zero Distractions**: No neon gradients, glassmorphism, floating AI hype bubbles, or competitive XP leaderboards.

---

## 👥 Three Role Workflows

### 🎓 1. Trainee Portal
- **Career Goal & Competency Explorer**: Map goals (e.g., *"Become AI/ML & LLM Solutions Engineer"*) to required competencies and course routes.
- **Diagnostic Entry Gate Assessment**: Complete a 20-question pre-enrollment assessment to evaluate baseline knowledge across Python, Math/Stats, Data Analysis, ML Concepts, and Responsible AI.
- **Learning Availability Planner**: Input daily available hours (Mon–Sun sliders) to automatically calculate weekly capacity and target completion dates.
- **Personalized Roadmap**: Dynamic timeline fast-tracking mastered concepts (80%+ baseline) and scheduling targeted revision for knowledge gaps.
- **Interactive Trainee Knowledge Graph**: Visual SVG DAG node map showing concept mastery statuses (`Strong`, `Proficient`, `Developing`, `Needs Revision`, `Blocked by Prerequisite`).
- **Interactive Lesson Player**: Embedded lectures, downloadable PDF guides, Colab notebooks, formative MCQs, and discussion boards.
- **Digital Certificates**: Official institutional certificate generator with unique code verification (scores strictly excluded from certificates).

### 👨‍🏫 2. Trainer Educator Workspace
- **Enrollment Approval Queue**: Review diagnostic submissions (score, prerequisite threshold check) and approve or reject enrollment requests.
- **Class Competency Heatmap**: Visualize cohort-level mastery distribution across concepts (Strong, Proficient, Developing, Weak) to identify class bottlenecks.
- **Human-in-the-Loop AI Roadmap Override**: Review AI-generated student roadmaps, customize module sequences or practice hours, and log audit notes.

### 🛡️ 3. Admin Governance Portal
- **Executive Platform Analytics**: Monitor total trainees, authorized trainers, active enrollments, and certificates issued.
- **Platform Competency Health**: Aggregate knowledge graph analytics across courses.
- **Sensitive PII Access Control**: Government ID / Aadhaar / Phone PII is masked by default. Requires Security PIN (`1234`) + OTP (`5678`) verification to unlock temporary access.
- **Audit Logs Table**: Full compliance log recording admin ID, target user, timestamp, and verification purpose.

---

## 📚 Curriculum Structure (AI/ML Track)

Pre-seeded with the complete **AI/ML Learning Path**:
- `AIML-00`: Orientation & Pre-Enrollment Diagnostic Assessment
- `AIML-01`: Python, Math & Data Foundations
- `AIML-02`: Core Machine Learning (Regression, Trees, Random Forests, PCA)
- `AIML-03`: Deep Learning & Neural Networks (Backpropagation, CNNs, PyTorch)
- `AIML-04`: NLP, Transformers, RAG & LLM Applications (Embeddings, FAISS, Agents)
- `AIML-05`: MLOps, Deployment & Responsible AI (FastAPI, Docker, MLflow, Model Cards)
- `AIML-06`: Capstone Portfolio

---

## 💻 Tech Stack

- **Frontend**: React (Vite build system) + Tailwind CSS + Lucide Icons + Custom SVG Knowledge Graph Renderer.
- **Backend**: Python FastAPI REST API server.
- **Database**: SQLite database (`capacity_connect.db`) via SQLAlchemy ORM.
- **Engine Services**:
  - `kg_engine.py`: Graph DAG prerequisite traversal & concept mastery calculator.
  - `planning_engine.py`: Take-U-Forward style weekly availability capacity planner.
  - `seed.py`: Pre-seeded database populator with 7 courses, 20 diagnostic MCQs, and sample profiles.

---

## 🚀 How to Set Up and Run Locally

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 1. Clone Repository
```bash
git clone https://github.com/jmurarka/ConnectCare.git
cd ConnectCare
```

### 2. Backend Setup & Run
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Seed SQLite database with AI/ML track, diagnostic MCQs & roles
python seed.py

# Start FastAPI server on http-[#127.0.0.1:8000](http://127.0.0.1:8000)
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup & Run
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server on http-[#127.0.0.1:3000](http://127.0.0.1:3000)
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 3000
```

---

## 🔑 Demo Access & Role Credentials

Use the top-right navbar pill in the web application to switch roles seamlessly:

| Role | Profile | Features |
| --- | --- | --- |
| 🎓 **Trainee** | Jhanvi Murarka | Career goals, 20-Q diagnostic, availability sliders, roadmap, personal KG |
| 👨‍🏫 **Trainer** | Dr. Rajesh Kumar | Diagnostic approval queue, class competency heatmap, AI roadmap override |
| 🛡️ **Admin** | System Admin | Platform metrics, platform KG, PII access (**PIN**: `1234`, **OTP**: `5678`), audit logs |

---

## 📜 Public Certificate Verification Demo

Test certificate verification on the **Digital Certificates** page using sample code:
```
CC-AIML-2026-000184
```

---

## 📄 License
Capacity Connect is released under the Institutional Academic License.
