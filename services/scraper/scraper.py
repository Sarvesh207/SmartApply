import os
import uuid
import sys
import logging
from datetime import datetime
import pandas as pd
from dotenv import load_dotenv
import psycopg2
from jobspy import scrape_jobs

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

from urllib.parse import urlparse, parse_qs, urlunparse, urlencode

def get_db_connection():
    # Load .env from root or parent directory if running locally
    load_dotenv()
    
    # Check parent directory .env
    if not os.getenv("DATABASE_URL"):
        load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
        
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        logging.error("DATABASE_URL environment variable is missing.")
        sys.exit(1)
        
    # Standardize connection string for psycopg2 (replace postgres:// with postgresql:// if needed)
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
        
    # Prisma's query parameters (like ?schema=public, pgbouncer=true, connection_limit=1) cause psycopg2 to fail.
    # Parse URL and strip these parameters specifically.
    try:
        parsed = urlparse(db_url)
        query = parse_qs(parsed.query)
        query.pop('schema', None)
        query.pop('pgbouncer', None)
        query.pop('connection_limit', None)
        new_query = urlencode(query, doseq=True)
        db_url = urlunparse(parsed._replace(query=new_query))
    except Exception as e:
        logging.warning(f"Failed to parse and clean DATABASE_URL: {e}")

    try:
        conn = psycopg2.connect(db_url)
        return conn
    except Exception as e:
        logging.error(f"Failed to connect to the database: {e}")
        sys.exit(1)

def run_scraper():
    logging.info("Starting JobSpy scrape...")
    
    # Connect to PostgreSQL to fetch user profile skills to build personalized search terms
    conn = get_db_connection()
    cursor = conn.cursor()
    
    search_query = ""
    try:
        # Query unique skills from Resume table
        cursor.execute('SELECT "skills" FROM "Resume";')
        rows = cursor.fetchall()
        
        # Aggregate all unique skills
        unique_skills = set()
        for row in rows:
            skills_list = row[0]
            if isinstance(skills_list, list):
                for skill in skills_list:
                    if skill and isinstance(skill, str):
                        unique_skills.add(skill.strip())
            
        logging.info(f"Retrieved user skills from database: {list(unique_skills)}")
        
        # Build search term queries matching user profiles
        skills = list(unique_skills)[:6] # Limit to top 6 skills to prevent overly long query parameters
        if skills:
            term_clauses = []
            for skill in skills:
                term_clauses.append(f'"{skill} Developer"')
                term_clauses.append(f'"{skill} Engineer"')
            search_query = " OR ".join(term_clauses)
        else:
            # Fallback default query
            search_query = '"Frontend Developer" OR "Frontend Engineer" OR "React Developer" OR "Next.js Developer"'
            
    except Exception as e:
        logging.warning(f"Failed to load personalized skills from DB: {e}. Falling back to default search query.")
        search_query = '"Frontend Developer" OR "Frontend Engineer" OR "React Developer" OR "Next.js Developer"'
    finally:
        cursor.close()
        conn.close()
        
    logging.info(f"Using search term query: {search_query}")
    
    try:
        # Run JobSpy scraper
        jobs_df = scrape_jobs(
            site_name=["linkedin", "indeed"],
            search_term=search_query,
            location="India",
            country_indeed="India",
            results_wanted=30,
            hours_old=168,
            linkedin_fetch_description=True
        )
        
        logging.info(f"Scraped {len(jobs_df)} jobs from JobSpy.")
    except Exception as e:
        logging.error(f"Error occurred during job scraping: {e}")
        # Return empty dataframe to fail gracefully
        jobs_df = pd.DataFrame()
        
    if jobs_df.empty:
        logging.warning("No jobs were scraped. Exiting scraper.")
        return

    # Connect to PostgreSQL
    conn = get_db_connection()
    cursor = conn.cursor()
    
    inserted_count = 0
    skipped_count = 0
    
    for _, row in jobs_df.iterrows():
        # Map DataFrame row fields to database fields, handling NaNs
        job_url = str(row.get('job_url', '')).strip()
        if not job_url:
            continue
            
        title = str(row.get('title', 'Unknown Job Title')).strip()
        company = str(row.get('company', 'Unknown Company')).strip()
        location = str(row.get('location', 'India')).strip()
        description = str(row.get('description', 'No description available')).strip()
        source = str(row.get('site', 'linkedin')).strip()
        company_url = row.get('company_url', None)
        if pd.isna(company_url) or not str(company_url).strip():
            company_url = None
        else:
            company_url = str(company_url).strip()
            
        date_posted = row.get('date_posted', None)
        if pd.isna(date_posted) or not date_posted:
            date_posted = None
        else:
            # Try to format the date_posted
            try:
                if isinstance(date_posted, str):
                    date_posted = datetime.fromisoformat(date_posted)
            except Exception:
                date_posted = None

        job_id = str(uuid.uuid4())
        scraped_at = datetime.utcnow()
        created_at = datetime.utcnow()

        try:
            # Double-quotes are used for table "Job" and field name "jobUrl" to match Prisma's case-sensitive schema
            cursor.execute(
                """
                INSERT INTO "Job" (
                    "id", "title", "company", "location", "description", 
                    "source", "jobUrl", "companyUrl", "datePosted", "scrapedAt", "createdAt"
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT ("jobUrl") DO NOTHING
                RETURNING id;
                """,
                (
                    job_id, title, company, location, description,
                    source, job_url, company_url, date_posted, scraped_at, created_at
                )
            )
            
            result = cursor.fetchone()
            if result:
                inserted_count += 1
            else:
                skipped_count += 1
        except Exception as e:
            logging.error(f"Error inserting job {job_url}: {e}")
            conn.rollback()
            continue
            
    conn.commit()
    cursor.close()
    conn.close()
    
    logging.info(f"Database insertion complete. Inserted: {inserted_count}, Skipped (duplicate): {skipped_count}")

if __name__ == "__main__":
    run_scraper()
