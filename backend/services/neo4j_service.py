import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "neo4j+s://d84b9a34.databases.neo4j.io")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")
NEO4J_INSTANCE_ID = os.getenv("NEO4J_INSTANCE_ID", "d84b9a34")

_driver = None
_connection_tested = False
_is_connected = False

def get_neo4j_driver():
    global _driver, _connection_tested, _is_connected
    if _connection_tested:
        return _driver if _is_connected else None
    
    _connection_tested = True
    if not NEO4J_PASSWORD or NEO4J_PASSWORD.strip() == "":
        print(f"[Neo4jService] Password not configured for instance {NEO4J_INSTANCE_ID}. Using local Graph Engine with Cypher emulation.")
        _is_connected = False
        return None

    try:
        from neo4j import GraphDatabase
        _driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))
        _driver.verify_connectivity()
        _is_connected = True
        print(f"[Neo4jService] Successfully connected to Neo4j instance: {NEO4J_INSTANCE_ID} at {NEO4J_URI}")
        return _driver
    except Exception as e:
        print(f"[Neo4jService] Could not connect to remote Neo4j database ({e}). Operating in resilient local graph mode.")
        _is_connected = False
        return None

def is_neo4j_active() -> bool:
    driver = get_neo4j_driver()
    return driver is not None

def run_cypher(query: str, parameters: dict = None) -> list:
    driver = get_neo4j_driver()
    if not driver:
        return []
    try:
        with driver.session() as session:
            result = session.run(query, parameters or {})
            return [record.data() for record in result]
    except Exception as e:
        print(f"[Neo4jService] Cypher Query Error: {e}")
        return []

def sync_course_concepts_to_neo4j(course_id: int, concepts: list, prereqs: list):
    """
    Sync concepts and prerequisite relationships into Neo4j graph using Cypher.
    """
    driver = get_neo4j_driver()
    if not driver:
        return False
    
    cypher_nodes = """
    UNWIND $concepts AS c
    MERGE (n:Concept {id: c.id})
    SET n.code = c.code,
        n.title = c.title,
        n.module_name = c.module_name,
        n.estimated_hours = c.estimated_hours,
        n.order_index = c.order_index,
        n.course_id = $course_id
    """
    
    cypher_edges = """
    UNWIND $prereqs AS p
    MATCH (fromConcept:Concept {id: p.prerequisite_concept_id})
    MATCH (toConcept:Concept {id: p.concept_id})
    MERGE (toConcept)-[r:REQUIRES]->(fromConcept)
    """
    
    try:
        with driver.session() as session:
            session.run(cypher_nodes, {"concepts": concepts, "course_id": course_id})
            session.run(cypher_edges, {"prereqs": prereqs})
        return True
    except Exception as e:
        print(f"[Neo4jService] Error syncing to Neo4j: {e}")
        return False
