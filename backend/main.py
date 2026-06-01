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

    industry_context = f"The candidate is targeting the {industry} industry." if industry else ""
    company_context = f"The target company is {target_company}. Consider their known hiring standards and ATS system." if target_company else ""
    jd_context = f"\n\nJOB DESCRIPTION TO MATCH AGAINST:\n{job_description}" if job_description else ""

    prompt = f"""
You are a senior US hiring manager and certified resume coach with 15 years of experience at Fortune 500 companies. Analyze this resume with the same rigor as a professional resume review service charging $200/hour.

{industry_context}
{company_context}

Return ONLY a JSON object with this exact structure, no markdown, no backticks:

{{
    "overall_score": <number 0-100>,
    "summary": "<3 sentence expert summary>",
    "section_scores": {{
        "work_experience": <number 0-100>,
        "skills": <number 0-100>,
        "education": <number 0-100>,
        "summary_section": <number 0-100>,
        "formatting": <number 0-100>
    }},
    "ats_score": <number 0-100>,
    "ats_feedback": "<specific ATS feedback>",
    "job_match_score": {"<number 0-100>" if job_description else "null"},
    "job_match_feedback": {"<specific feedback on resume vs job description>" if job_description else "null"},
    "keyword_analysis": {{
        "strong_keywords": ["<keyword1>", "<keyword2>", "<keyword3>"],
        "missing_keywords": ["<keyword1>", "<keyword2>", "<keyword3>"]
    }},
    "bullet_point_analysis": {{
        "score": <number 0-100>,
        "feedback": "<feedback>",
        "weak_bullet": "<exact weak bullet from resume>",
        "improved_bullet": "<rewritten version with metrics>"
    }},
    "top_strengths": ["<strength1>", "<strength2>", "<strength3>"],
    "critical_improvements": [
        {{
            "priority": "HIGH",
            "section": "<section name>",
            "issue": "<specific problem>",
            "fix": "<exactly how to fix it>"
        }},
        {{
            "priority": "HIGH",
            "section": "<section name>",
            "issue": "<specific problem>",
            "fix": "<exactly how to fix it>"
        }},
        {{
            "priority": "MEDIUM",
            "section": "<section name>",
            "issue": "<specific problem>",
            "fix": "<exactly how to fix it>"
        }}
    ],
    "interview_probability": "Low",
    "target_roles": ["<role1>", "<role2>", "<role3>"]
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