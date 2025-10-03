from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import os
from PyPDF2 import PdfReader
from docx import Document
import re
import sqlite3
import json
import tempfile
import uuid
from datetime import datetime
import pandas as pd
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
import io

app = FastAPI(title="AI-Powered Resume Matcher API - Enhanced Version")

# CORS for frontend
origins = [
    "http://localhost:5173", 
    "http://localhost:3000", 
    "http://localhost:5174",
    "http://127.0.0.1:5173"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
def init_db():
    conn = sqlite3.connect('resume_matcher_enhanced.db', check_same_thread=False)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analysis_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            resume_filename TEXT NOT NULL,
            jd_filename TEXT NOT NULL,
            match_score REAL NOT NULL,
            matched_keywords TEXT,
            missing_keywords TEXT,
            resume_skills TEXT,
            jd_skills TEXT,
            breakdown TEXT,
            ats_score REAL,
            completeness_score REAL,
            action_verbs_score REAL,
            quantifiable_impact_score REAL,
            improvement_suggestions TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS comparison_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            jd_filename TEXT NOT NULL,
            resume_filenames TEXT,
            scores TEXT,
            best_match TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

init_db()

# Enhanced keyword categories with weights
SKILL_KEYWORDS = {
    'programming': {
        'keywords': ['python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust', 'swift', 'kotlin'],
        'weight': 1.2
    },
    'web_frameworks': {
        'keywords': ['react', 'angular', 'vue', 'django', 'flask', 'node', 'express', 'spring', 'laravel'],
        'weight': 1.3
    },
    'database': {
        'keywords': ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'sqlite'],
        'weight': 1.1
    },
    'cloud_devops': {
        'keywords': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd'],
        'weight': 1.4
    },
    'data_science': {
        'keywords': ['pandas', 'numpy', 'tensorflow', 'pytorch', 'scikit', 'matplotlib', 'seaborn', 'machine learning'],
        'weight': 1.3
    },
    'tools': {
        'keywords': ['git', 'jira', 'confluence', 'slack', 'figma', 'photoshop'],
        'weight': 1.0
    }
}

QUALIFICATION_KEYWORDS = {
    'degrees': {
        'keywords': ['bachelor', 'master', 'phd', 'doctorate', 'btech', 'mtech', 'msc', 'bsc', 'mba', 'bba'],
        'weight': 1.5
    },
    'certifications': {
        'keywords': ['certified', 'certification', 'aws certified', 'pmp', 'scrum master', 'six sigma'],
        'weight': 1.2
    }
}

# Action verbs for analysis
ACTION_VERBS = {
    'strong': ['achieved', 'implemented', 'developed', 'managed', 'led', 'optimized', 'increased', 
               'decreased', 'improved', 'created', 'executed', 'spearheaded', 'orchestrated',
               'transformed', 'revolutionized', 'pioneered', 'engineered', 'architected'],
    'weak': ['assisted', 'helped', 'participated', 'supported', 'worked on', 'involved in']
}

EXPERIENCE_PATTERNS = [
    r'(\d+)\s*\+?\s*years?',
    r'(\d+)\s*\+?\s*yrs?',
    r'experience.*(\d+)\s*years?',
    r'(\d+)\s*years?.*experience'
]

# ATS unfriendly elements
ATS_UNFRIENDLY_ELEMENTS = [
    'table', 'column', 'image', 'graphic', 'chart', 'infographic',
    'header', 'footer', 'text box', 'textbox'
]

# Required sections for completeness
REQUIRED_SECTIONS = [
    'summary', 'experience', 'education', 'skills', 'contact'
]

def extract_text_from_file(file_path: str) -> str:
    """Extract text from PDF or DOCX files with error handling"""
    try:
        if file_path.endswith(".pdf"):
            text = ""
            pdf = PdfReader(file_path)
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text.strip()
        elif file_path.endswith(".docx"):
            doc = Document(file_path)
            return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
        else:
            return ""
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting text: {str(e)}")

def extract_skills_and_qualifications(text: str) -> dict:
    """Extract skills and qualifications from text with weights"""
    text = text.lower()
    
    # Remove special characters but keep important symbols like +, #
    text = re.sub(r"[^a-z0-9\s+#\.]", " ", text)
    
    found_keywords = {}
    
    # Extract skills from predefined categories with weights
    for category, data in SKILL_KEYWORDS.items():
        for skill in data['keywords']:
            if re.search(r'\b' + re.escape(skill) + r'\b', text):
                found_keywords[skill] = data['weight']
    
    # Extract qualifications with weights
    for category, data in QUALIFICATION_KEYWORDS.items():
        for qual in data['keywords']:
            if re.search(r'\b' + re.escape(qual) + r'\b', text):
                found_keywords[qual] = data['weight']
    
    # Extract experience years
    experience_years = extract_experience(text)
    if experience_years > 0:
        found_keywords['experience'] = min(experience_years * 0.1, 1.0)
    
    # Extract additional technical skills using patterns
    technical_patterns = [
        r'\b[a-z]+\s*\+\s*[a-z]+\b',
        r'\b[a-z]{2,}\d+\b',
    ]
    
    for pattern in technical_patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            found_keywords[match] = 1.0
    
    return found_keywords

def extract_experience(text: str) -> int:
    """Extract years of experience from text"""
    text = text.lower()
    max_experience = 0
    
    for pattern in EXPERIENCE_PATTERNS:
        matches = re.findall(pattern, text)
        for match in matches:
            try:
                years = int(match)
                max_experience = max(max_experience, years)
            except ValueError:
                continue
    
    return max_experience

def check_ats_friendliness(text: str, file_path: str) -> dict:
    """Check ATS compatibility of the resume"""
    text_lower = text.lower()
    score = 100
    issues = []
    
    # Check for tables and images in text
    for element in ATS_UNFRIENDLY_ELEMENTS:
        if element in text_lower:
            score -= 10
            issues.append(f"Contains {element}")
    
    # Check file format
    if file_path.endswith('.pdf'):
        # Additional PDF checks can be added here
        pass
    elif file_path.endswith('.docx'):
        # Additional DOCX checks
        pass
    
    # Check for proper structure
    if len(text.split()) < 100:
        score -= 20
        issues.append("Resume too short")
    
    if len(text.split()) > 800:
        score -= 10
        issues.append("Resume too long")
    
    return {
        'score': max(0, score),
        'issues': issues,
        'is_ats_friendly': score >= 70
    }

def check_section_completeness(text: str) -> dict:
    """Check if all required sections are present"""
    text_lower = text.lower()
    sections_found = []
    missing_sections = []
    
    for section in REQUIRED_SECTIONS:
        if section in text_lower:
            sections_found.append(section)
        else:
            missing_sections.append(section)
    
    completeness_score = (len(sections_found) / len(REQUIRED_SECTIONS)) * 100
    
    return {
        'score': completeness_score,
        'sections_found': sections_found,
        'missing_sections': missing_sections
    }

def analyze_action_verbs(text: str) -> dict:
    """Analyze usage of strong vs weak action verbs"""
    text_lower = text.lower()
    strong_verbs_found = []
    weak_verbs_found = []
    
    for verb in ACTION_VERBS['strong']:
        if re.search(r'\b' + re.escape(verb) + r'\b', text_lower):
            strong_verbs_found.append(verb)
    
    for verb in ACTION_VERBS['weak']:
        if re.search(r'\b' + re.escape(verb) + r'\b', text_lower):
            weak_verbs_found.append(verb)
    
    total_verbs = len(strong_verbs_found) + len(weak_verbs_found)
    if total_verbs > 0:
        strong_ratio = (len(strong_verbs_found) / total_verbs) * 100
    else:
        strong_ratio = 0
    
    return {
        'score': strong_ratio,
        'strong_verbs': strong_verbs_found,
        'weak_verbs': weak_verbs_found,
        'total_verbs': total_verbs
    }

def check_quantifiable_impact(text: str) -> dict:
    """Check for quantifiable achievements and metrics"""
    # Patterns for quantifiable achievements
    patterns = [
        r'increased by\s*(\d+%?)',
        r'decreased by\s*(\d+%?)',
        r'reduced by\s*(\d+%?)',
        r'improved by\s*(\d+%?)',
        r'saved\s*(\$?\d+)',
        r'achieved\s*(\d+%?)',
        r'managed\s*(\$?\d+)',
        r'led\s*team of\s*(\d+)',
        r'handled\s*(\d+)'
    ]
    
    quantifiable_found = []
    for pattern in patterns:
        matches = re.findall(pattern, text.lower())
        quantifiable_found.extend(matches)
    
    score = min(len(quantifiable_found) * 10, 100)
    
    return {
        'score': score,
        'quantifiable_metrics': quantifiable_found,
        'count': len(quantifiable_found)
    }

def generate_improvement_suggestions(analysis_results: dict) -> list:
    """Generate specific improvement suggestions"""
    suggestions = []
    
    # Skills match suggestions
    if analysis_results['missing_keywords']:
        missing_skills = analysis_results['missing_keywords'][:5]  # Top 5 missing
        suggestions.append(f"Add these key skills from JD: {', '.join(missing_skills)}")
    
    # ATS suggestions
    ats_issues = analysis_results['ats_analysis']['issues']
    if ats_issues:
        suggestions.append(f"Fix ATS issues: {', '.join(ats_issues[:3])}")
    
    # Completeness suggestions
    missing_sections = analysis_results['completeness_analysis']['missing_sections']
    if missing_sections:
        suggestions.append(f"Add missing sections: {', '.join(missing_sections)}")
    
    # Action verbs suggestions
    if analysis_results['action_verbs_analysis']['score'] < 70:
        suggestions.append("Use more strong action verbs like 'achieved', 'implemented', 'optimized'")
    
    # Quantifiable impact suggestions
    if analysis_results['quantifiable_impact_analysis']['count'] < 3:
        suggestions.append("Add more quantifiable achievements with numbers and percentages")
    
    # Experience suggestions
    if analysis_results.get('experience_years', 0) < 2:
        suggestions.append("Highlight relevant experience and projects")
    
    return suggestions[:6]  # Return top 6 suggestions

def calculate_match_score(resume_skills: dict, jd_skills: dict, additional_analysis: dict) -> tuple:
    """Calculate comprehensive match score with detailed breakdown"""
    
    if not jd_skills:
        return 0.0, [], {}, {}
    
    # Find matching skills
    matched_skills = set(resume_skills.keys()).intersection(set(jd_skills.keys()))
    missing_skills = set(jd_skills.keys()) - set(resume_skills.keys())
    
    # Calculate weighted scores
    jd_total_weight = sum(jd_skills.values())
    matched_weight = sum(jd_skills[skill] for skill in matched_skills if skill in jd_skills)
    
    # Base score (percentage of JD requirements met)
    if jd_total_weight > 0:
        base_score = (matched_weight / jd_total_weight) * 100
    else:
        base_score = 0
    
    # Additional scoring components
    ats_score = additional_analysis['ats_score'] * 0.15  # 15% weight
    completeness_score = additional_analysis['completeness_score'] * 0.10  # 10% weight
    action_verbs_score = additional_analysis['action_verbs_score'] * 0.10  # 10% weight
    quantifiable_score = additional_analysis['quantifiable_impact_score'] * 0.15  # 15% weight
    
    # Final score with all components
    final_score = (base_score * 0.5) + ats_score + completeness_score + action_verbs_score + quantifiable_score
    
    # Bonus for high-value skills match
    high_value_skills = ['python', 'java', 'javascript', 'aws', 'docker', 'kubernetes', 'react', 'machine learning']
    high_value_matches = matched_skills.intersection(high_value_skills)
    if high_value_matches:
        bonus = min(len(high_value_matches) * 3, 15)
        final_score += bonus
    
    # Penalty for too many missing key skills
    key_skills = set(high_value_skills).intersection(set(jd_skills.keys()))
    missing_key_skills = key_skills - matched_skills
    if key_skills:
        penalty = (len(missing_key_skills) / len(key_skills)) * 20
        final_score -= penalty
    
    # Ensure score is between 0 and 100
    final_score = max(0, min(100, final_score))
    
    # Prepare detailed breakdown
    breakdown = {
        'base_score': round(base_score, 2),
        'skills_match_score': round(base_score, 2),
        'ats_score': round(additional_analysis['ats_score'], 2),
        'completeness_score': round(additional_analysis['completeness_score'], 2),
        'action_verbs_score': round(additional_analysis['action_verbs_score'], 2),
        'quantifiable_impact_score': round(additional_analysis['quantifiable_impact_score'], 2),
        'skills_matched': len(matched_skills),
        'total_jd_skills': len(jd_skills),
        'coverage_percentage': round((len(matched_skills) / len(jd_skills)) * 100, 2) if jd_skills else 0,
        'bonus_points': min(len(high_value_matches) * 3, 15),
        'penalty_points': (len(missing_key_skills) / len(key_skills)) * 20 if key_skills else 0,
        'high_value_matches': list(high_value_matches),
        'missing_key_skills': list(missing_key_skills)
    }
    
    return round(final_score, 2), sorted(list(matched_skills)), sorted(list(missing_skills)), breakdown

def save_analysis_history(session_id: str, resume_filename: str, jd_filename: str, 
                         match_score: float, matched_keywords: list, missing_keywords: list,
                         resume_skills: list, jd_skills: list, breakdown: dict,
                         ats_score: float, completeness_score: float, 
                         action_verbs_score: float, quantifiable_impact_score: float,
                         improvement_suggestions: list):
    conn = sqlite3.connect('resume_matcher_enhanced.db', check_same_thread=False)
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO analysis_history 
           (session_id, resume_filename, jd_filename, match_score, matched_keywords, missing_keywords,
            resume_skills, jd_skills, breakdown, ats_score, completeness_score, 
            action_verbs_score, quantifiable_impact_score, improvement_suggestions) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (session_id, resume_filename, jd_filename, match_score, 
         json.dumps(matched_keywords), json.dumps(missing_keywords),
         json.dumps(resume_skills), json.dumps(jd_skills), json.dumps(breakdown),
         ats_score, completeness_score, action_verbs_score, quantifiable_impact_score,
         json.dumps(improvement_suggestions))
    )
    conn.commit()
    conn.close()

def get_analysis_history(session_id: str):
    conn = sqlite3.connect('resume_matcher_enhanced.db', check_same_thread=False)
    cursor = conn.cursor()
    cursor.execute(
        """SELECT id, resume_filename, jd_filename, match_score, created_at, 
                  matched_keywords, missing_keywords, improvement_suggestions
           FROM analysis_history 
           WHERE session_id = ? 
           ORDER BY created_at DESC 
           LIMIT 20""",
        (session_id,)
    )
    history = cursor.fetchall()
    conn.close()
    return [dict(row) for row in history]

def highlight_text(text: str, keywords: set) -> str:
    """Wrap matched keywords in HTML highlight tags"""
    for keyword in keywords:
        pattern = re.compile(re.escape(keyword), re.IGNORECASE)
        text = pattern.sub(f'<mark class="highlight">{keyword}</mark>', text)
    return text

def generate_pdf_report(analysis_data: dict) -> str:
    """Generate PDF report for the analysis with proper error handling"""
    try:
        print("Generating PDF report with data:", analysis_data.keys() if analysis_data else "No data")
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title = Paragraph("Resume Analysis Report", styles['Heading1'])
        story.append(title)
        story.append(Spacer(1, 12))
        
        # Basic Information - Use .get() for safe access
        basic_info = [
            ["Resume File", analysis_data.get('resume', 'N/A')],
            ["Job Description File", analysis_data.get('job_description', 'N/A')],
            ["Overall Match Score", f"{analysis_data.get('match_score', 0)}%"],
            ["Analysis Date", datetime.now().strftime("%Y-%m-%d %H:%M:%S")]
        ]
        
        basic_table = Table(basic_info, colWidths=[200, 200])
        basic_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(basic_table)
        story.append(Spacer(1, 12))
        
        # Score Breakdown
        breakdown_title = Paragraph("Score Breakdown", styles['Heading2'])
        story.append(breakdown_title)
        
        breakdown_data = [["Category", "Score"]]
        breakdown = analysis_data.get('breakdown', {})
        
        # Add breakdown scores
        for category, score in breakdown.items():
            if isinstance(score, (int, float)):
                breakdown_data.append([category.replace('_', ' ').title(), f"{score}%"])
        
        # Add additional scores if not in breakdown
        additional_scores = [
            ("ATS Score", analysis_data.get('ats_analysis', {}).get('score', 0)),
            ("Completeness Score", analysis_data.get('completeness_analysis', {}).get('score', 0)),
            ("Action Verbs Score", analysis_data.get('action_verbs_analysis', {}).get('score', 0)),
            ("Quantifiable Impact", analysis_data.get('quantifiable_impact_analysis', {}).get('score', 0))
        ]
        
        for category, score in additional_scores:
            if score > 0:
                breakdown_data.append([category, f"{score}%"])
        
        breakdown_table = Table(breakdown_data, colWidths=[300, 100])
        breakdown_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(breakdown_table)
        story.append(Spacer(1, 12))
        
        # Skills Analysis
        skills_title = Paragraph("Skills Analysis", styles['Heading2'])
        story.append(skills_title)
        
        matched_skills = analysis_data.get('matched_keywords', [])
        missing_skills = analysis_data.get('missing_keywords', [])
        
        skills_data = [
            ["Matched Skills", f"{len(matched_skills)} skills"],
            ["Missing Skills", f"{len(missing_skills)} skills"],
            ["Total JD Skills", f"{breakdown.get('total_jd_skills', 0)} skills"],
            ["Coverage", f"{breakdown.get('coverage_percentage', 0)}%"]
        ]
        
        skills_table = Table(skills_data, colWidths=[200, 200])
        skills_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgreen),
            ('BACKGROUND', (0, 1), (-1, 1), colors.lightcoral),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(skills_table)
        story.append(Spacer(1, 12))
        
        # Quality Analysis
        quality_title = Paragraph("Resume Quality Analysis", styles['Heading2'])
        story.append(quality_title)
        
        quality_data = [
            ["ATS Score", f"{analysis_data.get('ats_analysis', {}).get('score', 0)}%"],
            ["Section Completeness", f"{analysis_data.get('completeness_analysis', {}).get('score', 0)}%"],
            ["Action Verbs Score", f"{analysis_data.get('action_verbs_analysis', {}).get('score', 0)}%"],
            ["Quantifiable Impact", f"{analysis_data.get('quantifiable_impact_analysis', {}).get('score', 0)}%"]
        ]
        
        quality_table = Table(quality_data, colWidths=[200, 200])
        quality_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(quality_table)
        story.append(Spacer(1, 12))
        
        # Improvement Suggestions
        suggestions_title = Paragraph("Improvement Suggestions", styles['Heading2'])
        story.append(suggestions_title)
        
        suggestions = analysis_data.get('improvement_suggestions', [])
        if suggestions:
            for i, suggestion in enumerate(suggestions[:6], 1):
                suggestion_text = Paragraph(f"{i}. {suggestion}", styles['BodyText'])
                story.append(suggestion_text)
        else:
            story.append(Paragraph("No specific suggestions available.", styles['BodyText']))
        
        doc.build(story)
        buffer.seek(0)
        
        # Save PDF temporarily
        filename = f"report_{uuid.uuid4().hex[:8]}.pdf"
        with open(filename, 'wb') as f:
            f.write(buffer.getvalue())
        
        print(f"PDF report generated successfully: {filename}")
        return filename
        
    except Exception as e:
        print(f"PDF Generation Error: {str(e)}")
        raise

@app.get("/")
async def read_root():
    return {
        "message": "AI-Powered Resume & JD Matcher API - Enhanced Version", 
        "version": "3.0",
        "status": "No authentication required",
        "features": [
            "Match Score Analysis",
            "Keyword Match/Mismatch",
            "ATS-Friendliness Check", 
            "Section Completeness",
            "Action Verbs Analysis",
            "Quantifiable Impact Check",
            "Improvement Suggestions",
            "PDF Report Export",
            "Multiple Resume Comparison"
        ]
    }

@app.post("/match/")
async def match_resume(resume: UploadFile = File(...), jd: UploadFile = File(...)):
    """Enhanced resume matching with comprehensive analysis"""
    
    # Validate file types
    if not (resume.filename.endswith(('.pdf', '.docx')) and jd.filename.endswith(('.pdf', '.docx'))):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
    
    try:
        # Save files temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(resume.filename)[1]) as resume_temp:
            resume_content = await resume.read()
            resume_temp.write(resume_content)
            resume_path = resume_temp.name
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(jd.filename)[1]) as jd_temp:
            jd_content = await jd.read()
            jd_temp.write(jd_content)
            jd_path = jd_temp.name
        
        try:
            # Extract text
            resume_text = extract_text_from_file(resume_path)
            jd_text = extract_text_from_file(jd_path)
            
            if not resume_text or not jd_text:
                raise HTTPException(status_code=400, detail="Could not extract text from files")
            
            # Extract skills and qualifications with weights
            resume_skills = extract_skills_and_qualifications(resume_text)
            jd_skills = extract_skills_and_qualifications(jd_text)
            
            # Comprehensive analysis
            ats_analysis = check_ats_friendliness(resume_text, resume_path)
            completeness_analysis = check_section_completeness(resume_text)
            action_verbs_analysis = analyze_action_verbs(resume_text)
            quantifiable_impact_analysis = check_quantifiable_impact(resume_text)
            experience_years = extract_experience(resume_text)
            
            additional_analysis = {
                'ats_score': ats_analysis['score'],
                'completeness_score': completeness_analysis['score'],
                'action_verbs_score': action_verbs_analysis['score'],
                'quantifiable_impact_score': quantifiable_impact_analysis['score']
            }
            
            # Calculate comprehensive match score
            score, matched_keywords, missing_keywords, breakdown = calculate_match_score(
                resume_skills, jd_skills, additional_analysis
            )
            
            # Generate improvement suggestions
            analysis_context = {
                'missing_keywords': missing_keywords,
                'ats_analysis': ats_analysis,
                'completeness_analysis': completeness_analysis,
                'action_verbs_analysis': action_verbs_analysis,
                'quantifiable_impact_analysis': quantifiable_impact_analysis,
                'experience_years': experience_years
            }
            
            improvement_suggestions = generate_improvement_suggestions(analysis_context)
            
            # Generate session ID
            session_id = str(uuid.uuid4())
            
            # Save to history
            save_analysis_history(
                session_id, resume.filename, jd.filename, score,
                matched_keywords, missing_keywords, 
                list(resume_skills.keys()), list(jd_skills.keys()), 
                breakdown, ats_analysis['score'], completeness_analysis['score'],
                action_verbs_analysis['score'], quantifiable_impact_analysis['score'],
                improvement_suggestions
            )
            
            return {
                "resume": resume.filename,
                "job_description": jd.filename,
                "match_score": score,
                "matched_keywords": matched_keywords,
                "missing_keywords": missing_keywords,
                "resume_skills_found": list(resume_skills.keys()),
                "jd_skills_required": list(jd_skills.keys()),
                "breakdown": breakdown,
                "ats_analysis": ats_analysis,
                "completeness_analysis": completeness_analysis,
                "action_verbs_analysis": action_verbs_analysis,
                "quantifiable_impact_analysis": quantifiable_impact_analysis,
                "experience_years": experience_years,
                "improvement_suggestions": improvement_suggestions,
                "session_id": session_id,
                "message": "Comprehensive analysis completed successfully"
            }
            
        finally:
            # Clean up temporary files
            os.unlink(resume_path)
            os.unlink(jd_path)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.post("/compare-multiple/")
async def compare_multiple_resumes(jd: UploadFile = File(...), resumes: list[UploadFile] = File(...)):
    """Compare multiple resumes against one job description"""
    if len(resumes) < 2:
        raise HTTPException(status_code=400, detail="Please upload at least 2 resumes for comparison")
    
    try:
        # Process JD first
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(jd.filename)[1]) as jd_temp:
            jd_content = await jd.read()
            jd_temp.write(jd_content)
            jd_path = jd_temp.name
        
        jd_text = extract_text_from_file(jd_path)
        jd_skills = extract_skills_and_qualifications(jd_text)
        
        results = []
        resume_files_data = []
        
        # Process each resume
        for resume in resumes:
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(resume.filename)[1]) as resume_temp:
                resume_content = await resume.read()
                resume_temp.write(resume_content)
                resume_path = resume_temp.name
            
            resume_text = extract_text_from_file(resume_path)
            resume_skills = extract_skills_and_qualifications(resume_text)
            
            # Basic analysis for comparison
            ats_analysis = check_ats_friendliness(resume_text, resume_path)
            completeness_analysis = check_section_completeness(resume_text)
            action_verbs_analysis = analyze_action_verbs(resume_text)
            
            additional_analysis = {
                'ats_score': ats_analysis['score'],
                'completeness_score': completeness_analysis['score'],
                'action_verbs_score': action_verbs_analysis['score'],
                'quantifiable_impact_score': 50  # Default for quick comparison
            }
            
            score, matched_keywords, missing_keywords, breakdown = calculate_match_score(
                resume_skills, jd_skills, additional_analysis
            )
            
            results.append({
                "filename": resume.filename,
                "match_score": score,
                "matched_keywords_count": len(matched_keywords),
                "missing_keywords_count": len(missing_keywords),
                "ats_score": ats_analysis['score'],
                "completeness_score": completeness_analysis['score']
            })
            
            resume_files_data.append({
                'path': resume_path,
                'filename': resume.filename
            })
        
        # Find best match
        best_match = max(results, key=lambda x: x['match_score'])
        
        # Save comparison history
        session_id = str(uuid.uuid4())
        conn = sqlite3.connect('resume_matcher_enhanced.db', check_same_thread=False)
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO comparison_history 
               (session_id, jd_filename, resume_filenames, scores, best_match) 
               VALUES (?, ?, ?, ?, ?)""",
            (session_id, jd.filename, json.dumps([r['filename'] for r in results]),
             json.dumps([r['match_score'] for r in results]), best_match['filename'])
        )
        conn.commit()
        conn.close()
        
        # Cleanup temporary files
        os.unlink(jd_path)
        for data in resume_files_data:
            os.unlink(data['path'])
        
        return {
            "job_description": jd.filename,
            "results": sorted(results, key=lambda x: x['match_score'], reverse=True),
            "best_match": best_match,
            "total_comparisons": len(results),
            "session_id": session_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")

@app.post("/generate-report/")
async def generate_report(analysis_data: dict):
    """Generate PDF report from analysis data"""
    try:
        print("Received analysis data for report generation")  # Debug log
        
        # Validate analysis data
        if not analysis_data:
            raise HTTPException(status_code=400, detail="No analysis data provided")
        
        print(f"Analysis data keys: {analysis_data.keys()}")
        print(f"Match score: {analysis_data.get('match_score', 'Not found')}")
        
        # Generate PDF report
        pdf_filename = generate_pdf_report(analysis_data)
        
        # Return file response
        response = FileResponse(
            pdf_filename, 
            media_type='application/pdf',
            filename=f"resume_analysis_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        )
        
        print("PDF response prepared successfully")
        return response
        
    except Exception as e:
        print(f"Report generation error: {str(e)}")  # Debug log
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

@app.post("/highlight-keywords/")
async def highlight_keywords(resume: UploadFile = File(...), jd: UploadFile = File(...)):
    """Extract and highlight matching keywords in both documents"""
    
    try:
        # Save files temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(resume.filename)[1]) as resume_temp:
            resume_content = await resume.read()
            resume_temp.write(resume_content)
            resume_path = resume_temp.name
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(jd.filename)[1]) as jd_temp:
            jd_content = await jd.read()
            jd_temp.write(jd_content)
            jd_path = jd_temp.name
        
        try:
            # Extract text
            resume_text = extract_text_from_file(resume_path)
            jd_text = extract_text_from_file(jd_path)
            
            # Extract keywords
            resume_skills = extract_skills_and_qualifications(resume_text)
            jd_skills = extract_skills_and_qualifications(jd_text)
            
            # Find matches
            matched_keywords = set(resume_skills.keys()).intersection(set(jd_skills.keys()))
            
            # Highlight keywords in text
            highlighted_resume = highlight_text(resume_text, matched_keywords)
            highlighted_jd = highlight_text(jd_text, matched_keywords)
            
            return {
                "highlighted_resume": highlighted_resume,
                "highlighted_jd": highlighted_jd,
                "matched_keywords": list(matched_keywords)
            }
            
        finally:
            # Clean up temporary files
            os.unlink(resume_path)
            os.unlink(jd_path)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.get("/history/{session_id}")
async def get_history(session_id: str):
    history = get_analysis_history(session_id)
    return {
        "history": [
            {
                "id": item["id"],
                "resume_filename": item["resume_filename"],
                "jd_filename": item["jd_filename"],
                "match_score": item["match_score"],
                "created_at": item["created_at"],
                "matched_keywords": json.loads(item["matched_keywords"]),
                "missing_keywords": json.loads(item["missing_keywords"]),
                "improvement_suggestions": json.loads(item["improvement_suggestions"])
            }
            for item in history
        ]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "resume-matcher-enhanced", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)