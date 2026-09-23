# AI/ML Learning Platform — Content Blueprint

> **Purpose:** Copy this document into an LLM, CMS, LMS, Moodle, Open edX, Notion, or a developer specification. It defines a complete AI/ML learning path, lesson objects, resource links, assessments, discussions, and projects.
>
> **Content policy:** Link or embed original/public resources. Do not re-upload copyrighted videos, paid course PDFs, or question banks without permission. Write original lesson notes and original questions where reuse rights are unclear.

---

## 1. Platform Content Model

Create the following content types and fields.

### Course
```yaml
course:
  title: ""
  slug: ""
  level: beginner | intermediate | advanced
  duration: ""
  prerequisites: []
  learning_outcomes: []
  modules: []
  final_project: ""
  completion_rule: "Complete all lessons, score >= 60% on module quizzes, and submit projects"
```

### Module
```yaml
module:
  title: ""
  description: ""
  estimated_time: ""
  outcomes: []
  lessons: []
  quiz: []
  discussion_prompt: ""
  project_or_lab: ""
```

### Lesson
```yaml
lesson:
  title: ""
  type: video | article | notebook | PDF | lab | discussion
  objective: ""
  primary_resource:
    title: ""
    url: ""
  supporting_resources: []
  learner_task: ""
  uploaded_materials: []
```

### Assessment Item
```yaml
assessment_item:
  id: ""
  type: mcq | multiple_select | short_answer | coding
  difficulty: beginner | intermediate | advanced
  topic: ""
  question: ""
  options: []
  answer: ""
  explanation: ""
  source_or_origin: "Original question / licensed question / instructor-created"
```

### Upload Areas
- **Video library:** YouTube/Vimeo/hosted video URL, title, duration, transcript, tags, module mapping.
- **Notes and PDFs:** title, author, source URL, license/permission, downloadable file, module mapping.
- **Blogs:** Markdown editor, tags, author profile, comments, related course/module.
- **Research papers:** title, authors, abstract, DOI/arXiv link, publication year, topic tags, reading questions.
- **Discussion forum:** course/module, prompt, learner posts, upvotes, instructor moderation.
- **Question bank:** topic, difficulty, question type, correct answer, explanation, version, license/origin.

---

## 2. Learner Entry Assessment

### Goal
Use a **20-question diagnostic** before enrollment. It should identify whether the learner needs the Foundation Path before core machine learning.

### Score routing
| Score | Recommendation |
|---:|---|
| 0–7 | Complete Foundation Path: Python, basic math, data handling |
| 8–14 | Start Foundations and Core ML together at a slower pace |
| 15–20 | Start Core Machine Learning; use Foundations as revision |

### Diagnostic coverage
- Python basics: 5 questions
- Math and statistics intuition: 5 questions
- Data handling and visualization: 3 questions
- AI/ML concepts: 5 questions
- Responsible AI: 2 questions

### Diagnostic sample MCQs
```yaml
- id: DIAG-01
  type: mcq
  difficulty: beginner
  topic: Python
  question: "Which Python data type is best suited to store an ordered, mutable collection of values?"
  options: ["tuple", "list", "set", "string"]
  answer: "list"
  explanation: "Lists preserve order and can be changed after creation."

- id: DIAG-02
  type: mcq
  difficulty: beginner
  topic: Statistics
  question: "Which statistic is most affected by a single extremely large value in a dataset?"
  options: ["median", "mode", "mean", "minimum"]
  answer: "mean"
  explanation: "The mean uses every value, so outliers can shift it substantially."

- id: DIAG-03
  type: mcq
  difficulty: beginner
  topic: ML basics
  question: "Predicting whether an email is spam or not spam is usually which task?"
  options: ["classification", "clustering", "dimensionality reduction", "reinforcement learning"]
  answer: "classification"
  explanation: "The target is one of a fixed set of labels."

- id: DIAG-04
  type: mcq
  difficulty: beginner
  topic: ML evaluation
  question: "Why should a test dataset be kept separate from training data?"
  options: ["To make training faster", "To estimate performance on unseen data", "To add more features", "To remove labels"]
  answer: "To estimate performance on unseen data"
  explanation: "A held-out test set is used for an unbiased final estimate of generalization."

- id: DIAG-05
  type: mcq
  difficulty: beginner
  topic: Responsible AI
  question: "Which practice most directly helps reduce privacy risk when sharing a dataset?"
  options: ["Adding more columns", "Removing or protecting personally identifying information", "Training for more epochs", "Using a larger neural network"]
  answer: "Removing or protecting personally identifying information"
  explanation: "Personal data should be minimized, anonymized where appropriate, and governed carefully."
```

### Optional external practice links
- ML practice quizzes: https://www.quizforml.com/
- Machine-learning diagnostic quiz: https://freudly.ai/tests/machine-learning-quiz/
- Microsoft ML for Beginners curriculum and quizzes: https://github.com/microsoft/ML-For-Beginners

---

## 3. Course Map

| Course ID | Course | Level | Suggested time | Output |
|---|---|---:|---:|---|
| AIML-00 | Orientation and Diagnostic | Beginner | 1–2 hours | Personalized learning route |
| AIML-01 | Python, Math and Data Foundations | Beginner | 4–6 weeks | Data-analysis notebook |
| AIML-02 | Core Machine Learning | Beginner–Intermediate | 5–7 weeks | End-to-end ML project |
| AIML-03 | Deep Learning | Intermediate | 4–6 weeks | Image/text model |
| AIML-04 | NLP, Transformers and LLM Applications | Intermediate | 4–6 weeks | RAG or NLP application |
| AIML-05 | MLOps, Deployment and Responsible AI | Intermediate | 3–4 weeks | Deployed model/API + model card |
| AIML-06 | Capstone Portfolio | Intermediate | 3–4 weeks | Public project portfolio |

---

# AIML-00 — Orientation and Diagnostic

## Outcomes
- Explain the difference between AI, ML, deep learning, and generative AI.
- Understand the learning platform, assessments, submissions, and code environment.
- Complete the diagnostic and receive a recommended route.

## Lessons

| Lesson | Format | Resource | Learner task |
|---|---|---|---|
| AI, ML and Deep Learning overview | Article + video | Google ML Crash Course: https://developers.google.com/machine-learning/crash-course | Write a 100-word explanation of AI vs ML vs deep learning |
| How the AI/ML path works | Platform article | Create original platform page | Set personal goals and weekly study hours |
| Diagnostic assessment | Quiz | Use items in Section 2 | Complete 20 questions |
| Code environment introduction | Lab | Google Colab: https://colab.research.google.com/ | Run a starter notebook |

## Discussion
**Prompt:** “Name one problem in education, healthcare, finance, agriculture, or public services that AI could assist with. What data would be needed, and what could go wrong?”

---

# AIML-01 — Python, Math and Data Foundations

## Prerequisites
None. Learners should pass this course before AIML-02 if their diagnostic score is below 15.

## Outcomes
- Write basic Python for data tasks.
- Use NumPy, pandas, and matplotlib.
- Explain core linear algebra, probability, statistics, and calculus intuition used in ML.
- Prepare and inspect a tabular dataset.

## Module 1.1 — Python Programming

| Lesson | Resource type | Primary resource | Upload / content to create | Assessment |
|---|---|---|---|---|
| Python syntax and variables | Video/course | CS50 Python: https://cs50.harvard.edu/python/ | Original cheat sheet: variables, data types, conditions, loops | 10 MCQs |
| Functions and collections | Video/course | CS50 Python: https://cs50.harvard.edu/python/ | Original examples for list, tuple, dictionary, set | 10 MCQs + 2 coding tasks |
| Python for data work | Interactive lab | Kaggle Learn: https://www.kaggle.com/learn | Starter notebooks | Notebook completion |

### Module quiz sample
```yaml
- id: FND-PY-01
  type: mcq
  topic: Python
  question: "What does a Python function primarily provide?"
  options: ["A way to reuse a named block of code", "A way to store only numbers", "A database connection", "A chart type"]
  answer: "A way to reuse a named block of code"
  explanation: "Functions package reusable behavior behind a name and parameters."

- id: FND-PY-02
  type: mcq
  topic: Python
  question: "Which expression creates a dictionary?"
  options: ["[1, 2]", "(1, 2)", "{'model': 'tree'}", "{1, 2}"]
  answer: "{'model': 'tree'}"
  explanation: "Curly braces with key-value pairs define a dictionary."
```

## Module 1.2 — Mathematics for ML

| Lesson | Primary resource | Learner task |
|---|---|---|
| Linear algebra intuition | 3Blue1Brown, Essence of Linear Algebra: https://www.3blue1brown.com/topics/linear-algebra | Make a one-page note on vectors, matrices, and dot products |
| Calculus intuition | 3Blue1Brown, Essence of Calculus: https://www.3blue1brown.com/topics/calculus | Explain derivative and gradient in plain language |
| Probability and statistics | Khan Academy Statistics and Probability: https://www.khanacademy.org/math/statistics-probability | Calculate mean, median, variance on a small dataset |
| Statistics for data science | StatQuest: https://www.youtube.com/@statquest | Create a glossary of distribution, sampling, correlation, and p-value |

### Module quiz sample
```yaml
- id: FND-MATH-01
  type: mcq
  topic: Linear algebra
  question: "In ML, a feature vector usually represents:"
  options: ["One example described by several numeric values", "Only the final prediction", "A neural-network layer", "A database table"]
  answer: "One example described by several numeric values"
  explanation: "A feature vector stores the measured or engineered inputs for one observation."

- id: FND-MATH-02
  type: mcq
  topic: Statistics
  question: "What does variance describe?"
  options: ["The center of a distribution", "How spread out values are around the mean", "The number of features", "The number of classes"]
  answer: "How spread out values are around the mean"
  explanation: "Variance measures squared deviations from the mean."
```

## Module 1.3 — Data Analysis Tools

| Lesson | Primary resource | Learner task |
|---|---|---|
| NumPy | NumPy Learn: https://numpy.org/learn/ | Manipulate arrays in a notebook |
| pandas | pandas Getting Started: https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html | Load, clean, and summarize CSV data |
| Visualization | Matplotlib tutorials: https://matplotlib.org/stable/tutorials/index.html | Produce histogram, scatter plot, and bar chart |
| Intro datasets | Kaggle Datasets: https://www.kaggle.com/datasets | Select one tabular dataset and document its columns |

## Foundation project
**Project:** Exploratory data analysis of a public dataset.

**Deliverables:**
- Jupyter/Colab notebook
- Dataset source URL and license
- Data dictionary
- Three charts
- Five observations and two data-quality limitations

## Discussion
**Prompt:** “What is the difference between correlation and causation? Give an example from a real dataset or daily life.”

---

# AIML-02 — Core Machine Learning

## Prerequisites
AIML-01 or comparable knowledge of Python, basic statistics, and dataframes.

## Outcomes
- Frame a problem as regression, classification, clustering, or dimensionality reduction.
- Build models in scikit-learn.
- Evaluate models correctly and identify overfitting.
- Communicate results, limitations, and fairness concerns.

## Module 2.1 — ML Workflow and Problem Framing

| Lesson | Primary resource | Learner task |
|---|---|---|
| ML concepts and workflow | Google ML Crash Course: https://developers.google.com/machine-learning/crash-course | Label five example problems by ML task |
| ML for Beginners curriculum | Microsoft ML for Beginners: https://github.com/microsoft/ML-For-Beginners | Complete selected introductory lessons and quizzes |
| Scikit-learn workflow | scikit-learn Getting Started: https://scikit-learn.org/stable/getting_started.html | Build first train-test pipeline |

### Quiz sample
```yaml
- id: ML-WF-01
  type: mcq
  topic: ML task selection
  question: "Predicting a house price is typically which task?"
  options: ["Regression", "Binary classification", "Clustering", "Association-rule mining"]
  answer: "Regression"
  explanation: "The target is a continuous numerical value."

- id: ML-WF-02
  type: mcq
  topic: Dataset split
  question: "What is the main purpose of validation data?"
  options: ["Tune model choices before final testing", "Replace all training data", "Remove labels", "Guarantee fairness"]
  answer: "Tune model choices before final testing"
  explanation: "Validation data supports model and hyperparameter selection; the test set remains untouched until final evaluation."
```

## Module 2.2 — Regression

| Lesson | Primary resource | Learner task |
|---|---|---|
| Linear regression | Google ML Crash Course: https://developers.google.com/machine-learning/crash-course/linear-regression | Fit and interpret a linear-regression model |
| Loss and gradient descent | Google ML Crash Course: https://developers.google.com/machine-learning/crash-course/descending-into-ml/training-and-loss | Explain loss and gradient descent with a diagram |
| Regression metrics | scikit-learn metrics: https://scikit-learn.org/stable/modules/model_evaluation.html | Compare MAE and RMSE |

## Module 2.3 — Classification

| Lesson | Primary resource | Learner task |
|---|---|---|
| Logistic regression | scikit-learn linear models: https://scikit-learn.org/stable/modules/linear_model.html | Train a binary classifier |
| Decision trees and ensembles | scikit-learn ensembles: https://scikit-learn.org/stable/modules/ensemble.html | Compare tree vs random forest |
| Precision, recall, F1, ROC-AUC | Google ML Crash Course classification: https://developers.google.com/machine-learning/crash-course/classification | Evaluate a classifier and write a metric interpretation |

### Quiz sample
```yaml
- id: ML-CLS-01
  type: mcq
  topic: Evaluation
  question: "When missing a positive case is very costly, which metric is often especially important?"
  options: ["Recall", "Training time", "Number of features", "Chart width"]
  answer: "Recall"
  explanation: "Recall measures how many actual positive cases the model finds."

- id: ML-CLS-02
  type: mcq
  topic: Overfitting
  question: "A model has very high training accuracy but much lower validation accuracy. What is the likely issue?"
  options: ["Overfitting", "Perfect generalization", "Data encryption", "Feature scaling always failed"]
  answer: "Overfitting"
  explanation: "The model may have learned patterns specific to the training data rather than generalizable patterns."
```

## Module 2.4 — Unsupervised Learning and Features

| Lesson | Primary resource | Learner task |
|---|---|---|
| Clustering | scikit-learn clustering: https://scikit-learn.org/stable/modules/clustering.html | Run k-means and interpret clusters |
| Dimensionality reduction | scikit-learn decomposition: https://scikit-learn.org/stable/modules/decomposition.html | Visualize data with PCA |
| Feature engineering | Google ML Crash Course: https://developers.google.com/machine-learning/crash-course/overfitting/regularization | Create and justify three features |

## Core ML project
**Project:** Select a supervised-learning dataset and build an end-to-end baseline.

**Required sections:**
1. Problem statement and intended users
2. Dataset source, license, and limitations
3. Exploratory analysis
4. Preprocessing and feature choices
5. Baseline model and comparison model
6. Metrics and confusion matrix/appropriate regression metrics
7. Error analysis
8. Bias, risk, and misuse considerations

## Discussion
**Prompt:** “A bank wants an ML model for loan decisions. Which accuracy metric is insufficient by itself, and what fairness/privacy risks should be considered?”

---

# AIML-03 — Deep Learning

## Prerequisites
AIML-02 or confidence with training/evaluating basic ML models and Python notebooks.

## Outcomes
- Explain neural networks, backpropagation, and optimization at a practical level.
- Train a simple neural model using PyTorch or TensorFlow.
- Recognize regularization, transfer learning, and common training failures.

## Module 3.1 — Neural-Network Basics

| Lesson | Primary resource | Learner task |
|---|---|---|
| Neural networks visually explained | 3Blue1Brown Neural Networks: https://www.3blue1brown.com/topics/neural-networks | Draw and explain a feed-forward network |
| Deep-learning overview | MIT Introduction to Deep Learning: https://introtodeeplearning.com/ | Complete introductory lecture/lab |
| Deep learning with code | fast.ai Practical Deep Learning: https://course.fast.ai/ | Run the first notebook/lab |

### Quiz sample
```yaml
- id: DL-01
  type: mcq
  topic: Neural networks
  question: "What does an activation function enable in a neural network?"
  options: ["Nonlinear relationships", "File compression", "Database indexing", "Dataset labeling"]
  answer: "Nonlinear relationships"
  explanation: "Without nonlinear activations, stacked linear layers collapse into a linear transformation."

- id: DL-02
  type: mcq
  topic: Optimization
  question: "What is backpropagation used for?"
  options: ["Computing gradients used to update model weights", "Collecting new web data", "Encrypting a model", "Rendering charts"]
  answer: "Computing gradients used to update model weights"
  explanation: "Backpropagation efficiently applies the chain rule to calculate gradients through the network."
```

## Module 3.2 — Computer Vision and CNNs

| Lesson | Primary resource | Learner task |
|---|---|---|
| Convolutional neural networks | MIT Introduction to Deep Learning: https://introtodeeplearning.com/ | Identify convolution, pooling, and dense layers in a model |
| Transfer learning | TensorFlow transfer-learning tutorial: https://www.tensorflow.org/tutorials/images/transfer_learning | Fine-tune a pretrained image classifier |
| Data augmentation | TensorFlow image tutorials: https://www.tensorflow.org/tutorials/images | Test at least one augmentation technique |

## Module 3.3 — Sequence Models and Training Practice

| Lesson | Primary resource | Learner task |
|---|---|---|
| Sequence-model intuition | MIT Introduction to Deep Learning: https://introtodeeplearning.com/ | Compare a sequence task with an image task |
| PyTorch basics | PyTorch Learn the Basics: https://pytorch.org/tutorials/beginner/basics/intro.html | Build/train a small model |
| Training diagnostics | TensorBoard: https://www.tensorflow.org/tensorboard | Track loss and validation metrics |

## Deep-learning project
**Choose one:**
- Image classifier using transfer learning
- Sentiment classifier
- Tabular neural-network benchmark against a classical ML baseline

**Required:** model card, dataset citation, validation method, chart of training/validation behavior, error examples, limitations.

## Discussion
**Prompt:** “When might a simple logistic regression or decision tree be preferable to a neural network?”

---

# AIML-04 — NLP, Transformers and LLM Applications

## Prerequisites
AIML-03 recommended; learners can join after AIML-02 if they use pretrained APIs/models and understand ML evaluation.

## Outcomes
- Explain tokens, embeddings, transformer attention, and inference at a high level.
- Use a pretrained transformer for a text task.
- Build a basic retrieval-augmented generation (RAG) prototype.
- Evaluate LLM output for correctness, safety, and hallucination.

## Module 4.1 — NLP Foundations

| Lesson | Primary resource | Learner task |
|---|---|---|
| NLP and transformers | Hugging Face LLM Course: https://huggingface.co/learn/llm-course | Complete initial chapters |
| Text classification | Hugging Face course: https://huggingface.co/learn/llm-course | Fine-tune or run a text-classification pipeline |
| Embeddings | Hugging Face course: https://huggingface.co/learn/llm-course | Compare similarity among 10 sentences |

### Quiz sample
```yaml
- id: NLP-01
  type: mcq
  topic: Embeddings
  question: "What is a common use of an embedding vector?"
  options: ["Representing semantic similarity numerically", "Replacing all source documents", "Encrypting user passwords", "Increasing screen resolution"]
  answer: "Representing semantic similarity numerically"
  explanation: "Embeddings map content into vector space so similar meanings tend to be near each other."

- id: NLP-02
  type: mcq
  topic: LLM limitations
  question: "What is a hallucination in an LLM context?"
  options: ["A plausible-sounding but unsupported or false output", "A correctly cited answer", "A smaller model file", "A dataset split"]
  answer: "A plausible-sounding but unsupported or false output"
  explanation: "LLMs can generate fluent content that is not grounded in reliable evidence."
```

## Module 4.2 — Transformers and LLMs

| Lesson | Primary resource | Learner task |
|---|---|---|
| Build transformer intuition | Andrej Karpathy YouTube channel: https://www.youtube.com/@AndrejKarpathy | Watch a selected transformer/LLM lecture and post a concept summary |
| LLM application patterns | Hugging Face Learn: https://huggingface.co/learn | Compare summarization, extraction, classification, and chat use cases |
| Prompt design and evaluation | Create original platform note with tested examples | Write prompts and define an evaluation rubric |

## Module 4.3 — RAG and AI Agents

| Lesson | Primary resource | Learner task |
|---|---|---|
| RAG concepts | Hugging Face course: https://huggingface.co/learn | Diagram ingestion, chunking, embedding, retrieval, and generation |
| Vector search | FAISS documentation: https://faiss.ai/ | Create a small local vector-search experiment |
| Agents | Hugging Face Agents Course: https://huggingface.co/learn/agents-course | Complete introductory agent lessons |

## LLM project
**Project:** Build a “course-material assistant” that answers questions over approved course PDFs/notes.

**Required safeguards:**
- Show source citations/links in answers.
- Say “I do not know” when retrieved evidence is insufficient.
- Keep uploaded private documents access-controlled.
- Include a test set of 20 questions: answerable, unanswerable, ambiguous, and adversarial.

## Discussion
**Prompt:** “Should students be allowed to use generative AI in assignments? Propose a policy that supports learning while preventing misuse.”

---

# AIML-05 — MLOps, Deployment and Responsible AI

## Outcomes
- Package a simple ML model as an API/application.
- Explain model versioning, monitoring, data drift, and reproducibility.
- Produce a model card and basic risk assessment.

## Module 5.1 — Deployment Basics

| Lesson | Primary resource | Learner task |
|---|---|---|
| Serving an ML model | FastAPI documentation: https://fastapi.tiangolo.com/ | Create one prediction endpoint |
| Reproducible environments | Docker Get Started: https://docs.docker.com/get-started/ | Containerize or document environment setup |
| App demonstration | Streamlit documentation: https://docs.streamlit.io/ | Create an optional simple model UI |

## Module 5.2 — Monitoring and MLOps

| Lesson | Primary resource | Learner task |
|---|---|---|
| ML lifecycle and monitoring | Google ML Rules: https://developers.google.com/machine-learning/guides/rules-of-ml | Write monitoring requirements |
| Experiment tracking | MLflow documentation: https://mlflow.org/docs/latest/index.html | Log two model experiments |
| Data validation | Great Expectations: https://greatexpectations.io/ | Define 3 data-quality checks |

## Module 5.3 — Responsible AI

| Lesson | Primary resource | Learner task |
|---|---|---|
| AI risk management | NIST AI RMF: https://www.nist.gov/itl/ai-risk-management-framework | Fill a basic risk checklist |
| Model documentation | Model Cards paper/project: https://modelcards.withgoogle.com/about | Create a model card |
| Dataset documentation | Datasheets for Datasets: https://arxiv.org/abs/1803.09010 | Write a dataset-documentation summary |

### Quiz sample
```yaml
- id: OPS-01
  type: mcq
  topic: Monitoring
  question: "What is data drift?"
  options: ["A change in the distribution or characteristics of incoming data over time", "A faster GPU", "A model architecture", "A database backup"]
  answer: "A change in the distribution or characteristics of incoming data over time"
  explanation: "If live data changes from training data, model performance can degrade."

- id: OPS-02
  type: mcq
  topic: Documentation
  question: "What is a primary purpose of a model card?"
  options: ["Document intended use, performance, limits, and risks", "Increase model accuracy automatically", "Replace user consent", "Store training data"]
  answer: "Document intended use, performance, limits, and risks"
  explanation: "Model cards make model behavior and appropriate use easier to assess."
```

## Deployment project
Deploy an ML prediction API or small web app. Include README, setup instructions, model version, sample requests, monitoring plan, and model card.

## Discussion
**Prompt:** “A model works well overall but poorly for one demographic group. What should the organization do before deployment?”

---

# AIML-06 — Capstone Portfolio

## Capstone choices
- Student-performance analytics with privacy safeguards
- Crop/disease image classification with limitations statement
- Financial-news sentiment analysis with clear non-investment-advice disclaimer
- Resume/job-description matching tool with fairness audit
- Educational RAG assistant over instructor-approved materials
- Health-information classifier using only non-diagnostic educational content

## Mandatory capstone deliverables
```yaml
capstone:
  repository_or_notebook_url: ""
  demo_url_optional: ""
  project_problem: ""
  intended_users: ""
  dataset_source_and_license: ""
  data_limitations: []
  baseline_and_final_models: []
  evaluation_metrics: []
  error_analysis: ""
  responsible_ai_risks: []
  model_card_url: ""
  demo_video_url_optional: ""
  presentation_slides_url: ""
```

## Evaluation rubric
| Criterion | Weight |
|---|---:|
| Problem framing and usefulness | 15% |
| Data quality and documentation | 15% |
| Modeling and evaluation | 25% |
| Technical implementation | 20% |
| Responsible AI and limitations | 15% |
| Communication and reproducibility | 10% |

---

## 4. Question-Bank Specification

### Required tags
Every question must include:
```yaml
required_tags:
  - course_id
  - module_id
  - topic
  - subtopic
  - difficulty
  - learning_objective
  - question_type
  - correct_answer
  - explanation
  - author
  - created_date
  - review_status
  - license_or_origin
```

### Minimum question counts
| Course | Practice MCQs | Graded quiz MCQs | Question types |
|---|---:|---:|---|
| AIML-00 | 20 | 20 diagnostic | MCQ |
| AIML-01 | 80 | 30 | MCQ, coding, short answer |
| AIML-02 | 120 | 45 | MCQ, case-based, coding |
| AIML-03 | 80 | 35 | MCQ, diagram interpretation, coding |
| AIML-04 | 80 | 35 | MCQ, scenario, prompt evaluation |
| AIML-05 | 60 | 30 | MCQ, scenario, documentation review |
| Capstone | N/A | Rubric | Project review |

### LLM prompt for generating original questions
```text
You are an instructional designer for an AI/ML learning platform.
Generate 15 ORIGINAL multiple-choice questions for:
- Course: [COURSE ID]
- Module: [MODULE]
- Topic: [TOPIC]
- Learner level: [BEGINNER/INTERMEDIATE/ADVANCED]

Rules:
1. Test understanding and application, not trivia.
2. Provide four plausible options.
3. Mark exactly one correct answer unless explicitly asked for multiple select.
4. Provide a concise explanation for the correct answer and why common distractors are wrong.
5. Avoid copied wording from third-party question banks or certification exams.
6. Return valid YAML using: id, question, options, answer, explanation, difficulty, topic, learning_objective.
7. Include at least 3 scenario-based questions.
```

---

## 5. Content Upload Templates

### Video upload template
```yaml
video:
  title: ""
  source_url: ""
  embed_url: ""
  creator_or_provider: ""
  duration_minutes: 0
  transcript_url_optional: ""
  course_id: ""
  module_id: ""
  learning_objectives: []
  required_or_optional: required | optional
  copyright_status: "Embedded external source / owned / licensed"
```

### Blog/article template
```yaml
blog:
  title: ""
  slug: ""
  author: ""
  summary: ""
  course_id: ""
  module_id: ""
  tags: []
  estimated_read_minutes: 0
  body_markdown: ""
  references: []
  review_status: draft | reviewed | published
```

### PDF/resource template
```yaml
resource:
  title: ""
  resource_type: PDF | slide_deck | notebook | dataset | paper
  file_or_url: ""
  author_or_provider: ""
  license_or_permission: ""
  course_id: ""
  module_id: ""
  short_description: ""
```

### Research-paper template
```yaml
paper:
  title: ""
  authors: []
  year: ""
  url: ""
  doi_optional: ""
  topic_tags: []
  abstract_summary_original: ""
  discussion_questions: []
  prerequisites: []
```

---

## 6. Curated Resource Directory

### Foundation resources
- CS50’s Introduction to Programming with Python: https://cs50.harvard.edu/python/
- Kaggle Learn: https://www.kaggle.com/learn
- NumPy learning resources: https://numpy.org/learn/
- pandas tutorials: https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html
- Matplotlib tutorials: https://matplotlib.org/stable/tutorials/index.html
- 3Blue1Brown Linear Algebra: https://www.3blue1brown.com/topics/linear-algebra
- 3Blue1Brown Calculus: https://www.3blue1brown.com/topics/calculus
- Khan Academy Statistics & Probability: https://www.khanacademy.org/math/statistics-probability
- StatQuest YouTube: https://www.youtube.com/@statquest

### Core ML resources
- Google Machine Learning Crash Course: https://developers.google.com/machine-learning/crash-course
- Microsoft ML for Beginners: https://github.com/microsoft/ML-For-Beginners
- scikit-learn documentation: https://scikit-learn.org/stable/
- MIT Open Learning ML resources: https://openlearning.mit.edu/news/7-free-online-mit-courses-grasp-machine-learning
- Stanford CS229 site: https://cs229.stanford.edu/

### Deep-learning resources
- MIT Introduction to Deep Learning: https://introtodeeplearning.com/
- fast.ai Practical Deep Learning for Coders: https://course.fast.ai/
- PyTorch tutorials: https://pytorch.org/tutorials/
- TensorFlow tutorials: https://www.tensorflow.org/tutorials
- 3Blue1Brown Neural Networks: https://www.3blue1brown.com/topics/neural-networks

### NLP, LLM and agent resources
- Hugging Face LLM Course: https://huggingface.co/learn/llm-course
- Hugging Face Agents Course: https://huggingface.co/learn/agents-course
- Hugging Face Learn portal: https://huggingface.co/learn
- Andrej Karpathy YouTube: https://www.youtube.com/@AndrejKarpathy
- FAISS: https://faiss.ai/

### Deployment and responsible-AI resources
- FastAPI: https://fastapi.tiangolo.com/
- Streamlit: https://docs.streamlit.io/
- Docker Get Started: https://docs.docker.com/get-started/
- MLflow: https://mlflow.org/docs/latest/index.html
- Great Expectations: https://greatexpectations.io/
- Google Rules of ML: https://developers.google.com/machine-learning/guides/rules-of-ml
- NIST AI Risk Management Framework: https://www.nist.gov/itl/ai-risk-management-framework
- Google Model Cards: https://modelcards.withgoogle.com/about
- Datasheets for Datasets paper: https://arxiv.org/abs/1803.09010

### Dataset sources
- Kaggle Datasets: https://www.kaggle.com/datasets
- UCI Machine Learning Repository: https://archive.ics.uci.edu/
- Google Dataset Search: https://datasetsearch.research.google.com/
- Hugging Face Datasets: https://huggingface.co/datasets

---

## 7. Recommended Screen / Page Layout

### Course landing page
1. Course title, level, duration, instructor
2. Learning outcomes
3. Prerequisites and diagnostic link
4. Module list with completion indicators
5. Resources tab: videos, blogs, PDFs, notebooks, datasets
6. Assessment tab: practice, graded quizzes, progress
7. Discussion tab
8. Projects tab
9. Certificate/completion requirements

### Lesson page
1. Lesson title and learning objective
2. Embedded video or primary resource
3. Downloadable notes/PDF/notebook
4. “Key takeaways” (3–5 bullets)
5. Practice task
6. 3–5 formative MCQs
7. Discussion/reflection prompt
8. Next lesson button

### Quiz page
1. Instructions, time limit, attempts
2. Question navigation
3. Immediate feedback only for practice quizzes
4. Explanations after submission
5. Topic-wise score breakdown
6. Suggested lessons based on weak topics

---

## 8. Master Prompt for an LLM Content Generator

```text
You are building content for an AI/ML learning platform.
Use the course blueprint below as the source of truth. Generate ONLY the requested content in clean Markdown and YAML where relevant.

Requirements:
- Keep the stated course/module/lesson hierarchy unchanged.
- Use the linked resources as external references; do not copy copyrighted transcripts, textbooks, paid content, or third-party question banks.
- For each lesson, create original: learning objectives, concise notes, glossary, worked example, learner task, 5 formative MCQs with explanations, and a discussion prompt.
- For each module, create an original graded quiz according to the Question-Bank Specification.
- Clearly label links as “external resource”; preserve exact URLs.
- Use simple English suitable for college learners in India.
- Include practical examples, preferably education, finance, agriculture, public services, or local-business scenarios when appropriate.
- Never present AI output as medical, legal, or investment advice.
- Include responsible-AI limitations when discussing models, datasets, or deployment.

[PASTE THE RELEVANT COURSE/MODULE FROM THIS BLUEPRINT HERE]
```

---

## 9. Implementation Checklist

- [ ] Create the seven course shells using the IDs in the Course Map
- [ ] Add modules and lessons from this blueprint
- [ ] Embed/link resources rather than copying external content
- [ ] Add original platform notes and downloadable templates
- [ ] Build diagnostic routing rules
- [ ] Import original MCQs using the question-bank schema
- [ ] Create quiz feedback and weak-topic recommendations
- [ ] Enable course/module discussion forums
- [ ] Add project submission, rubric, and peer/instructor feedback
- [ ] Add source/license fields for every uploaded PDF, video, dataset, and paper
- [ ] Add privacy controls for learner uploads and RAG document collections
- [ ] Test every external URL before publishing
