import json
from datetime import datetime, timedelta
from database import engine, SessionLocal, Base
import models
from services.auth_service import get_password_hash
from services.planning_engine import generate_personalized_roadmap

def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    demo_password_hash = get_password_hash("demo1234")

    # 1. Create Users (Trainees, Trainer, Admin)
    jhanvi = models.User(
        email="jhanvi@capacityconnect.edu",
        full_name="Jhanvi Murarka",
        password_hash=demo_password_hash,
        role="trainee",
        aadhaar_masked="XXXX-XXXX-8921",
        govt_id_type="Aadhaar Card",
        phone_number="+91 98123 45678"
    )

    aarav = models.User(
        email="aarav@capacityconnect.edu",
        full_name="Aarav Sharma",
        password_hash=demo_password_hash,
        role="trainee",
        aadhaar_masked="XXXX-XXXX-4512",
        govt_id_type="Aadhaar Card",
        phone_number="+91 98234 56789"
    )

    ananya = models.User(
        email="ananya@capacityconnect.edu",
        full_name="Ananya Iyer",
        password_hash=demo_password_hash,
        role="trainee",
        aadhaar_masked="XXXX-XXXX-6734",
        govt_id_type="Passport",
        phone_number="+91 98345 67890"
    )

    rohan = models.User(
        email="rohan@capacityconnect.edu",
        full_name="Rohan Verma",
        password_hash=demo_password_hash,
        role="trainee",
        aadhaar_masked="XXXX-XXXX-2389",
        govt_id_type="Aadhaar Card",
        phone_number="+91 98456 78901"
    )

    priya = models.User(
        email="priya@capacityconnect.edu",
        full_name="Priya Patel",
        password_hash=demo_password_hash,
        role="trainee",
        aadhaar_masked="XXXX-XXXX-9102",
        govt_id_type="Voter ID",
        phone_number="+91 98567 89012"
    )

    trainer = models.User(
        email="rajesh@capacityconnect.edu",
        full_name="Dr. Rajesh Kumar",
        password_hash=demo_password_hash,
        role="trainer",
        aadhaar_masked="XXXX-XXXX-1102",
        govt_id_type="Passport",
        phone_number="+91 98765 12345"
    )

    admin = models.User(
        email="admin@capacityconnect.edu",
        full_name="System Administrator",
        password_hash=demo_password_hash,
        role="admin",
        aadhaar_masked="XXXX-XXXX-9999",
        govt_id_type="Govt ID",
        phone_number="+91 99000 00000"
    )

    db.add_all([jhanvi, aarav, ananya, rohan, priya, trainer, admin])
    db.commit()

    # Create Profiles
    trainee_profiles = [
        (jhanvi.id, "B.Tech Computer Science (3rd Year)", "AI/ML Student Trainee", 1.0, "Become AI/ML & LLM Solutions Engineer", 7),
        (aarav.id, "M.Tech Data Science", "Data Science Fellow", 2.0, "Become Senior ML Engineer", 12),
        (ananya.id, "B.E. Information Technology", "Junior Developer", 1.5, "Transition into AI Systems Architect", 5),
        (rohan.id, "B.Sc Mathematics", "Analytics Intern", 0.5, "Master Machine Learning Foundations", 3),
        (priya.id, "B.Tech Electronics", "Software Trainee", 1.0, "Become Data Scientist", 4),
    ]

    for uid, edu, crole, exp, goal, streak in trainee_profiles:
        p = models.Profile(
            user_id=uid,
            education=edu,
            current_role=crole,
            experience_years=exp,
            career_goal=goal,
            weekly_hours_json=json.dumps({"Mon": 2, "Tue": 2, "Wed": 2, "Thu": 3, "Fri": 2, "Sat": 4, "Sun": 3}),
            streak_days=streak
        )
        db.add(p)
    db.commit()

    # 2. Create Courses
    c0 = models.Course(code="AIML-00", title="Orientation and Diagnostic Assessment", description="Course orientation, AI vs ML vs DL overview, and pre-enrollment 20-question diagnostic entry gate.", level="Beginner", duration_hours=2, trainer_name="Dr. Rajesh Kumar")
    c1 = models.Course(code="AIML-01", title="Python, Math and Data Foundations", description="Python programming, CS50 foundations, linear algebra, calculus intuition, probability, NumPy, pandas & Matplotlib.", level="Beginner", duration_hours=30, trainer_name="Dr. Rajesh Kumar")
    c2 = models.Course(code="AIML-02", title="Core Machine Learning", description="Supervised learning, regression, classification (Trees, Random Forests), evaluation metrics, clustering & PCA.", level="Beginner-Intermediate", duration_hours=45, trainer_name="Dr. Rajesh Kumar")
    c3 = models.Course(code="AIML-03", title="Deep Learning & Neural Networks", description="Feed-forward neural networks, backpropagation, CNNs, computer vision, PyTorch basics & transfer learning.", level="Intermediate", duration_hours=40, trainer_name="Dr. Rajesh Kumar")
    c4 = models.Course(code="AIML-04", title="NLP, Transformers and LLM Applications", description="Tokenization, word embeddings, transformer attention, Hugging Face, RAG (Retrieval-Augmented Generation) & AI Agents.", level="Intermediate", duration_hours=40, trainer_name="Dr. Rajesh Kumar")
    c5 = models.Course(code="AIML-05", title="MLOps, Deployment and Responsible AI", description="Model serving with FastAPI, Docker, experiment tracking with MLflow, data drift monitoring & NIST Responsible AI model cards.", level="Intermediate", duration_hours=25, trainer_name="Dr. Rajesh Kumar")
    c6 = models.Course(code="AIML-06", title="Capstone Portfolio", description="End-to-end industrial portfolio project development with public repository, model card, and live API deployment.", level="Intermediate", duration_hours=30, trainer_name="Dr. Rajesh Kumar")

    db.add_all([c0, c1, c2, c3, c4, c5, c6])
    db.commit()

    # Assign Trainer to Courses
    for course_obj in [c1, c2, c3, c4, c5, c6]:
        t_assign = models.TrainerCourseAssignment(trainer_id=trainer.id, course_id=course_obj.id)
        db.add(t_assign)
    db.commit()

    # 3. Create Concepts & Prerequisite DAG
    concepts_data = [
        # AIML-01
        (c1.id, "AIML01-C1", "Python Basics & Syntax", "Variables, data types, lists, dictionaries, functions & CS50 syntax", "Python Programming", 1, 4.0),
        (c1.id, "AIML01-C2", "Linear Algebra & Vectors", "Vectors, matrices, dot products & 3Blue1Brown linear algebra intuition", "Mathematics for ML", 2, 5.0),
        (c1.id, "AIML01-C3", "Calculus & Gradients", "Derivatives, partial gradients & loss function optimization intuition", "Mathematics for ML", 3, 5.0),
        (c1.id, "AIML01-C4", "Probability & Statistics", "Mean, median, variance, probability distributions, sampling & correlation", "Mathematics for ML", 4, 4.0),
        (c1.id, "AIML01-C5", "NumPy & pandas Data Wrangling", "Array manipulation, pandas DataFrame cleaning, filtering & Matplotlib visualization", "Data Analysis Tools", 5, 6.0),

        # AIML-02
        (c2.id, "AIML02-C1", "ML Workflow & Problem Framing", "Regression vs classification vs clustering, train/val/test splits & scikit-learn pipeline", "ML Workflow", 1, 4.0),
        (c2.id, "AIML02-C2", "Linear & Logistic Regression", "Loss functions, gradient descent, MAE, RMSE, precision, recall & ROC-AUC", "Supervised Learning", 2, 6.0),
        (c2.id, "AIML02-C3", "Decision Trees & Random Forests", "Tree split criteria, ensemble learning, overfitting & hyperparameter tuning", "Supervised Learning", 3, 6.0),
        (c2.id, "AIML02-C4", "Unsupervised Clustering & PCA", "K-means clustering, silhouette score, dimensionality reduction with PCA", "Unsupervised Learning", 4, 5.0),

        # AIML-03
        (c3.id, "AIML03-C1", "Neural Network Fundamentals", "Perceptrons, activation functions (ReLU, Sigmoid), feedforward & backpropagation", "Neural Network Basics", 1, 6.0),
        (c3.id, "AIML03-C2", "CNNs & Computer Vision", "Convolutional layers, pooling, image classification & PyTorch transfer learning", "Computer Vision", 2, 7.0),

        # AIML-04
        (c4.id, "AIML04-C1", "Text Embeddings & Transformers", "Tokenization, dense vector embeddings, self-attention & Hugging Face pipeline", "NLP Foundations", 1, 6.0),
        (c4.id, "AIML04-C2", "RAG & Vector Search", "Retrieval-Augmented Generation, chunking, FAISS vector index & grounded LLM responses", "LLM Applications", 2, 8.0),

        # AIML-05
        (c5.id, "AIML05-C1", "ML Model Serving (FastAPI)", "REST API endpoints for model inference, Docker containerization & Streamlit UI", "Deployment Basics", 1, 5.0),
        (c5.id, "AIML05-C2", "MLOps & Responsible AI", "MLflow experiment tracking, data drift detection & NIST Model Card documentation", "Monitoring & Ethics", 2, 5.0)
    ]

    concept_objs = []
    for c_id, code, title, desc, mod, ord_idx, est_h in concepts_data:
        co = models.Concept(
            course_id=c_id, code=code, title=title, description=desc,
            module_name=mod, order_index=ord_idx, estimated_hours=est_h
        )
        db.add(co)
        concept_objs.append(co)
    db.commit()

    c_map = {co.code: co.id for co in concept_objs}

    # Prerequisites DAG Edges
    prereqs = [
        (c_map["AIML01-C2"], c_map["AIML01-C1"]),
        (c_map["AIML01-C5"], c_map["AIML01-C1"]),
        (c_map["AIML02-C1"], c_map["AIML01-C5"]),
        (c_map["AIML02-C2"], c_map["AIML01-C2"]),
        (c_map["AIML02-C2"], c_map["AIML01-C3"]),
        (c_map["AIML02-C3"], c_map["AIML02-C1"]),
        (c_map["AIML03-C1"], c_map["AIML02-C2"]),
        (c_map["AIML03-C2"], c_map["AIML03-C1"]),
        (c_map["AIML04-C1"], c_map["AIML03-C1"]),
        (c_map["AIML04-C2"], c_map["AIML04-C1"]),
        (c_map["AIML05-C1"], c_map["AIML02-C2"]),
        (c_map["AIML05-C2"], c_map["AIML05-C1"])
    ]

    for c_id, p_id in prereqs:
        db.add(models.Prerequisite(concept_id=c_id, prerequisite_concept_id=p_id))
    db.commit()

    # 4. Create Diagnostic Entry Gate Assessment & 20 Questions
    diag_asm = models.Assessment(course_id=c0.id, title="Pre-Enrollment 20-Question AI/ML Diagnostic Assessment", assessment_type="diagnostic", passing_score=0.60)
    db.add(diag_asm)
    db.commit()

    questions = [
        # Python (5 Qs)
        ("Which Python data type is best suited to store an ordered, mutable collection of values?", ["tuple", "list", "set", "string"], 1, "Lists preserve order and can be modified after creation.", "Python Basics", c_map["AIML01-C1"]),
        ("What is the primary function of a Python dictionary?", ["Store key-value pairs", "Store sorted numbers", "Execute database queries", "Render plots"], 0, "Dictionaries map unique keys to values.", "Python Basics", c_map["AIML01-C1"]),
        ("Which keyword is used to define a reusable function in Python?", ["function", "def", "func", "create"], 1, "'def' declares a function block in Python.", "Python Basics", c_map["AIML01-C1"]),
        ("What does the expression len([10, 20, 30]) return?", ["3", "30", "2", "Error"], 0, "len() returns the number of elements in a list.", "Python Basics", c_map["AIML01-C1"]),
        ("In Python, which module is standard for numerical array computations?", ["math", "numpy", "sys", "json"], 1, "NumPy provides high-performance N-dimensional array objects.", "Python Basics", c_map["AIML01-C1"]),

        # Math & Stats Intuition (5 Qs)
        ("Which statistic is most sensitive to a single extremely large outlier value in a dataset?", ["median", "mode", "mean", "minimum"], 2, "The arithmetic mean sums all values, so extreme outliers pull it heavily.", "Statistics", c_map["AIML01-C4"]),
        ("In Machine Learning, what does a feature vector represent?", ["One sample observation described by multiple numeric variables", "A final prediction label", "A neural network layer", "A database index"], 0, "Feature vectors store input variables for a single data point.", "Linear Algebra", c_map["AIML01-C2"]),
        ("What does the gradient of a loss function indicate?", ["The direction of steepest increase of loss", "The dataset size", "The accuracy percentage", "The number of classes"], 0, "Gradients point in the direction of maximum loss increase; gradient descent moves in the opposite direction.", "Calculus", c_map["AIML01-C3"]),
        ("What does variance measure in a probability distribution?", ["The center value", "How spread out values are around the mean", "The number of categories", "The sample size"], 1, "Variance quantifies the squared deviation of data points from the mean.", "Statistics", c_map["AIML01-C4"]),
        ("What is the result of taking the dot product of two orthogonal (perpendicular) vectors?", ["0", "1", "-1", "Infinity"], 0, "The dot product of orthogonal vectors is zero.", "Linear Algebra", c_map["AIML01-C2"]),

        # Data Handling (3 Qs)
        ("Which pandas data structure is two-dimensional with tabular rows and columns?", ["Series", "DataFrame", "Panel", "Array"], 1, "DataFrame represents a 2D labeled tabular data structure.", "Data Analysis", c_map["AIML01-C5"]),
        ("Why is it essential to separate a dataset into training and test sets?", ["To speed up computation", "To evaluate model performance on unseen data", "To reduce memory usage", "To normalize values"], 1, "The test set provides an unbiased evaluation of model generalization.", "Data Analysis", c_map["AIML01-C5"]),
        ("What is the main goal of data normalization (e.g. MinMax scaling)?", ["Convert text to uppercase", "Bring feature values to a uniform scale", "Remove missing rows", "Encrypt sensitive data"], 1, "Feature scaling prevents features with large magnitudes from dominating distance metrics.", "Data Analysis", c_map["AIML01-C5"]),

        # AI/ML Concepts (5 Qs)
        ("Predicting whether an email is spam or not spam is classified under which task?", ["Regression", "Binary Classification", "Clustering", "Reinforcement Learning"], 1, "Spam detection assigns one of two categorical labels (Spam / Not Spam).", "ML Basics", c_map["AIML02-C1"]),
        ("Predicting the continuous market selling price of a house is an example of:", ["Regression", "Classification", "Dimensionality Reduction", "Association Mining"], 0, "Continuous output prediction is a regression problem.", "ML Basics", c_map["AIML02-C1"]),
        ("What is the primary indicator of an overfitted Machine Learning model?", ["High training accuracy but low validation/test accuracy", "Low training accuracy and low test accuracy", "Fast execution speed", "Zero feature weights"], 0, "Overfitting occurs when a model memorizes noise in training data but fails on unseen validation data.", "ML Basics", c_map["AIML02-C1"]),
        ("Which evaluation metric is critical when missing a positive case carries high cost (e.g. medical diagnosis)?", ["Precision", "Recall", "Accuracy", "Training Speed"], 1, "Recall measures the proportion of actual positive cases successfully identified.", "ML Basics", c_map["AIML02-C2"]),
        ("In neural networks, what is backpropagation primarily used for?", ["Generating random weights", "Calculating parameter gradients using the chain rule", "Encrypting neural nodes", "Loading data batches"], 1, "Backpropagation efficiently computes gradients of the loss function with respect to weights.", "Neural Networks", c_map["AIML03-C1"]),

        # Responsible AI (2 Qs)
        ("Which practice most directly reduces privacy risks when releasing a dataset for AI training?", ["Adding more feature columns", "Removing or masking personally identifiable information (PII)", "Training for more epochs", "Using larger batch sizes"], 1, "PII minimization and masking safeguard individual privacy.", "Responsible AI", c_map["AIML05-C2"]),
        ("What is the main purpose of a Model Card in AI governance?", ["To store source code", "To document intended use, performance, evaluation limits, and ethical considerations", "To bypass license checks", "To speed up model deployment"], 1, "Model cards document model behavior, scope, and limitations for transparency.", "Responsible AI", c_map["AIML05-C2"])
    ]

    for q_text, opts, corr_idx, exp, top, c_id in questions:
        q = models.Question(
            assessment_id=diag_asm.id,
            concept_id=c_id,
            question_text=q_text,
            options_json=json.dumps(opts),
            correct_option_index=corr_idx,
            explanation=exp,
            topic=top
        )
        db.add(q)
    db.commit()

    # 5. Add Learning Resources
    resources_data = [
        (c1.id, c_map["AIML01-C1"], "Python Programming", "CS50 Introduction to Programming with Python", "video", "https://cs50.harvard.edu/python/", "Harvard's premier introduction to Python programming syntax, functions, and collections."),
        (c1.id, c_map["AIML01-C2"], "Mathematics for ML", "3Blue1Brown: Essence of Linear Algebra", "video", "https://www.3blue1brown.com/topics/linear-algebra", "Visual intuitive explanations of vectors, matrices, dot products, and transformations."),
        (c1.id, c_map["AIML01-C3"], "Mathematics for ML", "3Blue1Brown: Essence of Calculus & Gradients", "video", "https://www.3blue1brown.com/topics/calculus", "Visual guide to derivatives, partial derivatives, and gradient descent intuition."),
        (c1.id, c_map["AIML01-C4"], "Mathematics for ML", "Khan Academy: Statistics & Probability", "link", "https://www.khanacademy.org/math/statistics-probability", "Comprehensive practice on distributions, mean, variance, and hypothesis testing."),
        (c1.id, c_map["AIML01-C5"], "Data Analysis Tools", "Kaggle Learn: Pandas & Data Cleaning", "notebook", "https://colab.research.google.com/", "Interactive Google Colab starter notebook for pandas data wrangling and Matplotlib."),
        
        (c2.id, c_map["AIML02-C1"], "ML Workflow", "Google Machine Learning Crash Course", "link", "https://developers.google.com/machine-learning/crash-course", "Google's flagship practical ML curriculum covering framing, loss, and training."),
        (c2.id, c_map["AIML02-C2"], "Supervised Learning", "Scikit-Learn Regression & Classification Guide", "pdf", "https://scikit-learn.org/stable/", "Official scikit-learn documentation and cheat sheet for linear models and evaluation metrics."),
        
        (c3.id, c_map["AIML03-C1"], "Neural Network Basics", "MIT 6.S191: Introduction to Deep Learning", "video", "https://introtodeeplearning.com/", "MIT's official open course on neural network architectures and backpropagation."),
        
        (c4.id, c_map["AIML04-C1"], "NLP Foundations", "Hugging Face LLM & Transformer Course", "link", "https://huggingface.co/learn/llm-course", "Deep dive into tokenizers, self-attention, BERT, GPT, and vector embeddings."),
        (c4.id, c_map["AIML04-C2"], "LLM Applications", "Build a RAG Course Assistant with FAISS", "github", "https://github.com/huggingface/agents-course", "Hands-on implementation of Retrieval-Augmented Generation over document knowledge bases.")
    ]

    for course_id, concept_id, mod_name, title, r_type, url, desc in resources_data:
        res = models.Resource(
            course_id=course_id, concept_id=concept_id, module_name=mod_name,
            title=title, resource_type=r_type, content_url=url, description=desc
        )
        db.add(res)
    db.commit()

    # 6. Seed Cohort Enrollments across 2 Courses (AIML-01 and AIML-02)
    enrollments_seed = [
        # (trainee_id, course_id, status, diagnostic_score)
        (jhanvi.id, c2.id, "approved", 0.75),
        (jhanvi.id, c1.id, "completed", 0.90),
        (aarav.id, c2.id, "approved", 0.85),
        (ananya.id, c2.id, "approval_pending", 0.70),
        (rohan.id, c1.id, "approved", 0.65),
        (priya.id, c1.id, "approval_pending", 0.55),
    ]

    for t_id, crs_id, st, score in enrollments_seed:
        db.add(models.Enrollment(trainee_id=t_id, course_id=crs_id, status=st, diagnostic_score=score))
    db.commit()

    # 7. Seed Diagnostic Mastery Scores for Cohort (Rich competency heatmap data)
    mastery_seeds = [
        # Jhanvi (AIML-02 enrolled)
        (jhanvi.id, c_map["AIML01-C1"], 0.85),
        (jhanvi.id, c_map["AIML01-C2"], 0.80),
        (jhanvi.id, c_map["AIML01-C3"], 0.65),
        (jhanvi.id, c_map["AIML01-C4"], 0.70),
        (jhanvi.id, c_map["AIML01-C5"], 0.75),
        (jhanvi.id, c_map["AIML02-C1"], 0.60),
        (jhanvi.id, c_map["AIML02-C2"], 0.45),
        (jhanvi.id, c_map["AIML02-C3"], 0.30),
        (jhanvi.id, c_map["AIML02-C4"], 0.15),

        # Aarav (AIML-02 enrolled)
        (aarav.id, c_map["AIML01-C1"], 0.95),
        (aarav.id, c_map["AIML01-C2"], 0.90),
        (aarav.id, c_map["AIML01-C3"], 0.85),
        (aarav.id, c_map["AIML01-C4"], 0.88),
        (aarav.id, c_map["AIML01-C5"], 0.92),
        (aarav.id, c_map["AIML02-C1"], 0.85),
        (aarav.id, c_map["AIML02-C2"], 0.80),
        (aarav.id, c_map["AIML02-C3"], 0.75),
        (aarav.id, c_map["AIML02-C4"], 0.65),

        # Ananya (AIML-02 pending)
        (ananya.id, c_map["AIML01-C1"], 0.75),
        (ananya.id, c_map["AIML01-C2"], 0.70),
        (ananya.id, c_map["AIML01-C3"], 0.60),
        (ananya.id, c_map["AIML01-C4"], 0.68),
        (ananya.id, c_map["AIML01-C5"], 0.72),
        (ananya.id, c_map["AIML02-C1"], 0.55),
        (ananya.id, c_map["AIML02-C2"], 0.35),
        (ananya.id, c_map["AIML02-C3"], 0.25),
        (ananya.id, c_map["AIML02-C4"], 0.00),

        # Rohan (AIML-01 enrolled)
        (rohan.id, c_map["AIML01-C1"], 0.70),
        (rohan.id, c_map["AIML01-C2"], 0.60),
        (rohan.id, c_map["AIML01-C3"], 0.40),
        (rohan.id, c_map["AIML01-C4"], 0.50),
        (rohan.id, c_map["AIML01-C5"], 0.45),

        # Priya (AIML-01 pending)
        (priya.id, c_map["AIML01-C1"], 0.55),
        (priya.id, c_map["AIML01-C2"], 0.45),
        (priya.id, c_map["AIML01-C3"], 0.30),
        (priya.id, c_map["AIML01-C4"], 0.35),
        (priya.id, c_map["AIML01-C5"], 0.25),
    ]

    for t_id, concept_id, score in mastery_seeds:
        db.add(models.MasteryState(trainee_id=t_id, concept_id=concept_id, mastery_score=score))
    db.commit()

    # 8. Generate Personalized Roadmaps for Approved Trainees
    generate_personalized_roadmap(db, jhanvi.id, c2.id, {"Mon": 2, "Tue": 2, "Wed": 2, "Thu": 3, "Fri": 2, "Sat": 4, "Sun": 3})
    generate_personalized_roadmap(db, aarav.id, c2.id, {"Mon": 3, "Tue": 3, "Wed": 3, "Thu": 3, "Fri": 3, "Sat": 5, "Sun": 4})
    generate_personalized_roadmap(db, rohan.id, c1.id, {"Mon": 2, "Tue": 2, "Wed": 2, "Thu": 2, "Fri": 2, "Sat": 3, "Sun": 3})

    # 9. Seed Certificate for Completed Foundations
    cert = models.Certificate(
        trainee_id=jhanvi.id,
        course_id=c1.id,
        certificate_code="CC-AIML-2026-000184",
        issued_date="21 September 2026"
    )
    db.add(cert)
    db.commit()

    # 10. Seed Assignments & Submissions
    a1 = models.Assignment(
        course_id=c2.id,
        concept_id=c_map["AIML02-C2"],
        title="Supervised Housing Price Prediction Model & Metrics Analysis",
        description="Implement Linear and Ridge Regression on the Ames Housing dataset. Compute RMSE, MAE, and R^2 score.",
        due_date="2026-10-15",
        max_score=100.0
    )
    a2 = models.Assignment(
        course_id=c1.id,
        concept_id=c_map["AIML01-C5"],
        title="Pandas Data Wrangling & Exploratory Data Analysis Notebook",
        description="Clean dirty dataset with pandas, handle missing values, and generate Matplotlib distribution plots.",
        due_date="2026-10-01",
        max_score=100.0
    )
    db.add_all([a1, a2])
    db.commit()

    sub1 = models.Submission(
        assignment_id=a1.id,
        trainee_id=jhanvi.id,
        content_url="https://github.com/capacityconnect-trainee/housing-price-model.ipynb",
        submitted_at=datetime.utcnow(),
        status="submitted"
    )
    sub2 = models.Submission(
        assignment_id=a1.id,
        trainee_id=aarav.id,
        content_url="https://github.com/aarav-sharma/housing-regression-pipeline.ipynb",
        submitted_at=datetime.utcnow(),
        grade=92.0,
        feedback="Excellent feature scaling and cross-validation setup!",
        graded_by=trainer.id,
        graded_at=datetime.utcnow(),
        status="graded"
    )
    db.add_all([sub1, sub2])
    db.commit()

    # 11. Seed Discussions, Ratings & Cohorts
    dp1 = models.DiscussionPost(
        course_id=c2.id,
        concept_id=c_map["AIML02-C2"],
        author_id=jhanvi.id,
        author_role="trainee",
        title="Clarification on Gradient Descent Learning Rate tuning",
        content="Is there a rule of thumb for setting the learning rate alpha in Ridge vs Lasso regression?",
        is_pinned=True,
        is_flagged=False
    )
    dp2 = models.DiscussionPost(
        course_id=c2.id,
        concept_id=c_map["AIML02-C2"],
        author_id=trainer.id,
        author_role="trainer",
        parent_id=1,
        content="Great question Jhanvi! Usually grid search cross-validation or adaptive learning rate schedulers work best. Start with 0.01.",
        is_pinned=False,
        is_flagged=False
    )
    db.add_all([dp1, dp2])
    db.commit()

    r1 = models.Rating(
        trainee_id=jhanvi.id,
        course_id=c2.id,
        trainer_id=trainer.id,
        score=5.0,
        comment="Dr. Rajesh Kumar's personalized roadmap overrides really helped me focus on my regression math gaps!"
    )
    r2 = models.Rating(
        trainee_id=aarav.id,
        course_id=c2.id,
        trainer_id=trainer.id,
        score=4.8,
        comment="Outstanding Knowledge Graph visualizations and fast diagnostic gate feedback."
    )
    db.add_all([r1, r2])
    db.commit()

    ch1 = models.Cohort(
        course_id=c2.id,
        name="SIH-2026 AI/ML Prep Batch A",
        start_date="2026-09-01",
        end_date="2026-11-30"
    )
    db.add(ch1)
    db.commit()

    cm1 = models.CohortMember(cohort_id=ch1.id, trainee_id=jhanvi.id)
    cm2 = models.CohortMember(cohort_id=ch1.id, trainee_id=aarav.id)
    cm3 = models.CohortMember(cohort_id=ch1.id, trainee_id=ananya.id)
    db.add_all([cm1, cm2, cm3])
    db.commit()

    # 12. Seed Anti-Corruption Admin Audit Logs & Approval Queue
    from services.admin_service import log_admin_action

    auditor = models.User(
        email="compliance@capacityconnect.edu",
        full_name="Compliance & Audit Officer",
        password_hash=demo_password_hash,
        role="admin",
        admin_tier="compliance_auditor",
        aadhaar_masked="XXXX-XXXX-[#007]",
        govt_id_type="Institutional Audit Badge",
        phone_number="+91 99999 00007"
    )
    db.add(auditor)
    db.commit()

    log1 = log_admin_action(
        db=db,
        admin_id=admin.id,
        action_type="admin_login",
        target_type="system",
        reason="Initial System Administrator Governance Session"
    )

    log2 = log_admin_action(
        db=db,
        admin_id=admin.id,
        action_type="pii_unmask",
        target_type="user",
        target_id=jhanvi.id,
        reason="Identity Audit Verification for SIH Demo Evaluation"
    )

    log3 = log_admin_action(
        db=db,
        admin_id=admin.id,
        action_type="user_update",
        target_type="user",
        target_id=aarav.id,
        reason="Corrected email domain spelling"
    )

    app1 = models.ApprovalRequest(
        requested_by=admin.id,
        action_type="admin_create",
        target_type="user",
        reason="Requesting creation of second Support Admin account for cohort B moderation.",
        status="pending",
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(app1)
    db.commit()

    print("Successfully seeded Capacity Connect DB with multi-trainee cohort (5 trainees across 2 courses), real bcrypt password hashes (demo1234), AI/ML Curriculum, 20 Diagnostic Questions, Admin Governance Hash Chains, Approval Requests, Discussion Posts, Ratings, and Cohort Batches!")
    db.close()

if __name__ == "__main__":
    seed_database()
