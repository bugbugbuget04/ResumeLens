from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from groq import Groq
import pdfplumber
import io
import os
import json

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@app.get("/")
def root():
    return {"message": "ResumeLens API is running!"}

@app.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    industry: str = Form(""),
    job_description: str = Form(""),
    target_company: str = Form("")
):
    contents = await file.read()
    pdf = pdfplumber.open(io.BytesIO(contents))
    text = ""
    for page in pdf.pages:
        text += page.extract_text() or ""

    industry_context = f"The candidate is targeting the {industry} industry. Tailor ALL feedback specifically for what {industry} employers and ATS systems look for." if industry else ""
    company_context = f"The target company is {target_company}. Research what {target_company} specifically looks for in candidates — their culture, known ATS keywords, hiring bar, and role expectations — and reference this directly in your feedback." if target_company else ""
    jd_context = f"\n\nJOB DESCRIPTION TO MATCH AGAINST:\n{job_description}" if job_description else ""

    prompt = f"""
You are a brutally honest but constructive US resume coach with 15 years of experience placing candidates at Fortune 500 companies. You give hyper-specific, personalized feedback — never generic advice.

{industry_context}
{company_context}

STRICT RULES YOU MUST FOLLOW:
- Every piece of feedback MUST reference specific content from the actual resume (real job titles, real company names, real bullet points, real skills listed)
- NEVER say vague things like "add metrics" or "improve your summary" — instead quote the exact weak text and show the exact rewrite
- Strengths must be specific skills or experiences actually visible in the resume, not generic traits like "communication skills"
- Critical improvements must include the EXACT weak text from the resume and the EXACT improved version
- Target roles must match the candidate's actual experience level — don't suggest senior roles to a junior candidate
- If a target company is provided, mention specifically what that company looks for and how this resume falls short or succeeds
- If a job description is provided, compare the resume line by line against the requirements

Return ONLY a JSON object with this exact structure, no markdown, no backticks:

{{
    "overall_score": <number 0-100>,
    "summary": "<3 sentence summary that references their actual job titles, companies, and specific gaps for their target industry — no generic statements>",
    "section_scores": {{
        "work_experience": <number 0-100>,
        "skills": <number 0-100>,
        "education": <number 0-100>,
        "summary_section": <number 0-100>,
        "formatting": <number 0-100>
    }},
    "ats_score": <number 0-100>,
    "ats_feedback": "<specific ATS feedback referencing actual resume content and target industry keywords>",
    "job_match_score": {"<number 0-100>" if job_description else "null"},
    "job_match_feedback": {"<specific feedback comparing actual resume bullets to job description requirements>" if job_description else "null"},
    "keyword_analysis": {{
        "strong_keywords": ["<actual keyword found in their resume>", "<actual keyword>", "<actual keyword>"],
        "missing_keywords": ["<important keyword missing for their target role/industry>", "<missing keyword>", "<missing keyword>"]
    }},
    "bullet_point_analysis": {{
        "score": <number 0-100>,
        "feedback": "<specific feedback referencing actual bullets from the resume>",
        "weak_bullet": "<copy an exact weak bullet from their resume word for word>",
        "improved_bullet": "<rewrite that exact bullet with specific metrics, impact, and action verbs>"
    }},
    "top_strengths": [
        "<quote or directly reference an actual job title, company, bullet point, or skill LITERALLY found in the resume — e.g. 'Worked as Sales Associate at FreshMart for 2 months handling 50+ daily customer interactions'>",
        "<another strength pulled directly from actual resume content — never say 'communication skills' or 'problem-solving' as standalone phrases>",
        "<third strength grounded in something literally written in the resume>"
    ],
    "critical_improvements": [
        {{
            "priority": "HIGH",
            "section": "<section name>",
            "issue": "<quote the exact weak text or describe the specific missing element>",
            "fix": "<exact rewrite or precise action — never generic advice>"
        }},
        {{
            "priority": "HIGH",
            "section": "<section name>",
            "issue": "<quote the exact weak text or describe the specific missing element>",
            "fix": "<exact rewrite or precise action>"
        }},
        {{
            "priority": "MEDIUM",
            "section": "<section name>",
            "issue": "<quote the exact weak text or describe the specific missing element>",
            "fix": "<exact rewrite or precise action>"
        }}
    ],
    "interview_probability": "Low",
    "target_roles": ["<role that matches their actual experience level and background>", "<role>", "<role>"]
}}

IMPORTANT: critical_improvements MUST be an array with exactly 3 objects.
interview_probability MUST be exactly one of: "Low", "Medium", or "High".
ats_score MUST be a number between 0 and 100.
Only return the JSON. No markdown, no backticks, no explanation.

Resume:
{text}
{jd_context}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )

    raw = response.choices[0].message.content.strip()
    print("AI RESPONSE:", raw)
    result = json.loads(raw)
    return result

@app.post("/save-email")
async def save_email(data: dict):
    try:
        email = data.get("email")
        with open("emails.csv", "a") as f:
            f.write(f"{email}\n")
        print("Email saved to file:", email)
        return {"message": "Email saved!"}
    except Exception as e:
        print("Error:", str(e))
        return {"message": "Email captured"}