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


def strip_json(raw: str) -> str:
    """Strip markdown fences if model wraps response in them."""
    raw = raw.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return raw.strip()


@app.get("/")
def root():
    return {"message": "ResumeLens API is running!"}


@app.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    industry: str = Form(""),
    job_description: str = Form(""),
    target_company: str = Form(""),
    target_role: str = Form(""),
    experience_level: str = Form("")
):
    contents = await file.read()
    pdf = pdfplumber.open(io.BytesIO(contents))
    text = ""
    for page in pdf.pages:
        text += page.extract_text() or ""

    industry_context = f"The candidate is targeting the {industry} industry. Tailor ALL feedback specifically for what {industry} employers and ATS systems look for." if industry else ""
    company_context = f"The target company is {target_company}. Research what {target_company} specifically looks for in candidates — their culture, known ATS keywords, hiring bar, and role expectations — and reference this directly in your feedback." if target_company else ""
    role_context = f"The candidate is specifically targeting the role of '{target_role}'. Evaluate the resume against what this exact role requires." if target_role else ""
    level_context = f"The candidate's experience level is: {experience_level}. CRITICAL: only suggest roles and feedback appropriate for this level — never suggest senior roles to an entry-level candidate or vice versa." if experience_level else ""
    jd_context = f"\n\nJOB DESCRIPTION TO MATCH AGAINST:\n{job_description}" if job_description else ""

    prompt = f"""
You are a brutally honest but constructive US resume coach with 15 years of experience placing candidates at Fortune 500 companies. You give hyper-specific, personalized feedback — never generic advice.

{industry_context}
{company_context}
{role_context}
{level_context}

STRICT RULES YOU MUST FOLLOW:
- Every piece of feedback MUST reference specific content from the actual resume (real job titles, real company names, real bullet points, real skills listed)
- NEVER say vague things like "add metrics" or "improve your summary" — instead quote the exact weak text and show the exact rewrite
- Strengths must be specific skills or experiences actually visible in the resume, not generic traits like "communication skills"
- Critical improvements must include the EXACT weak text from the resume and the EXACT improved version
- Target roles must match the candidate's actual experience level — don't suggest senior roles to a junior candidate
- If a target company is provided, mention specifically what that company looks for and how this resume falls short or succeeds
- If a job description is provided, compare the resume line by line against the requirements

CRITICAL — FUNDAMENTAL MISMATCH CHECK (honesty over politeness):
If the candidate is applying to a role they are FUNDAMENTALLY unqualified for — meaning they lack the core degree, license, certification, or entire field of training that the role legally or practically requires (e.g. a Computer Science student applying for a Staff Nurse, Cardiologist, Lawyer, or Civil Engineer role) — you MUST NOT softly encourage them. Be honest and direct. Set "fundamental_mismatch" to true and clearly state they should not apply to this specific role as-is, explain exactly what core qualifications they are missing (degrees, licenses, certifications, years of clinical/field training), and point them toward roles that DO fit their actual background. This is being kind by being honest — it saves them from wasting applications. For normal gaps (missing a few skills, needs more experience, weak bullets) set "fundamental_mismatch" to false — those are fixable and should get the usual constructive feedback.

Return ONLY a JSON object with this exact structure, no markdown, no backticks:

{{
    "overall_score": <number 0-100>,
    "fundamental_mismatch": <true or false — true ONLY for severe field/qualification mismatches as described above>,
    "mismatch_warning": "<if fundamental_mismatch is true: a direct, honest 1-2 sentence statement that they should not apply to this role and why. If false: empty string>",
    "mismatch_requirements": ["<if mismatch: a core qualification they would NEED to be eligible, e.g. 'A Bachelor of Science in Nursing (BSN)'>", "<another required qualification>", "<another>"],
    "summary": "<3 sentence summary that references their actual job titles, companies, and specific gaps for their target industry>",
    "section_scores": {{
        "work_experience": <number 0-100>,
        "skills": <number 0-100>,
        "education": <number 0-100>,
        "summary_section": <number 0-100 — score the resume's professional summary/objective/profile statement at the top. If the resume genuinely has NO summary or objective section at all, score it low (10-30) and note it as a missing element — do NOT default to 0 unless it is truly absent>,
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
        "<quote or directly reference an actual job title, company, bullet point, or skill LITERALLY found in the resume>",
        "<another strength pulled directly from actual resume content>",
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
    raw = strip_json(response.choices[0].message.content)
    print("ANALYZE RESPONSE:", raw[:200])
    return json.loads(raw)


@app.post("/rewrite")
async def rewrite_resume(
    file: UploadFile = File(...),
    industry: str = Form(""),
    job_description: str = Form(""),
    target_company: str = Form(""),
    target_role: str = Form(""),
    experience_level: str = Form(""),
    analysis: str = Form("")
):
    contents = await file.read()
    pdf = pdfplumber.open(io.BytesIO(contents))
    text = ""
    for page in pdf.pages:
        text += page.extract_text() or ""

    analysis_context = ""
    if analysis:
        try:
            parsed = json.loads(analysis)
            missing_kw = parsed.get("keyword_analysis", {}).get("missing_keywords", [])
            improvements = parsed.get("critical_improvements", [])
            analysis_context = f"""
Based on the prior analysis:
- Missing keywords to add: {", ".join(missing_kw)}
- Critical issues to fix: {"; ".join([i.get("issue", "") for i in improvements])}
"""
        except:
            pass

    industry_context = f"Target industry: {industry}. Optimize for {industry} ATS systems and hiring managers." if industry else ""
    company_context = f"Target company: {target_company}. Tailor language, keywords, and tone for {target_company}." if target_company else ""
    role_context = f"Target role: {target_role}. Optimize the resume specifically for this role." if target_role else ""
    level_context = f"Experience level: {experience_level}. Keep the seniority of language appropriate to this level." if experience_level else ""
    jd_context = f"\n\nJOB DESCRIPTION TO OPTIMIZE FOR:\n{job_description}" if job_description else ""

    prompt = f"""
You are an expert US resume writer with 15 years of experience. Rewrite the resume below into a polished, ATS-optimized document.

{industry_context}
{company_context}
{role_context}
{level_context}
{analysis_context}

RULES:
- Keep all real experience, companies, job titles, dates, and education — never fabricate
- Rewrite every bullet with a strong action verb and impact/metrics where inferable
- Add missing keywords naturally
- Clear section headers: SUMMARY, EXPERIENCE, EDUCATION, SKILLS
- Remove "responsible for", "helped with", "worked on"
- 1 page content max (2 pages for 10+ years experience)

Return ONLY JSON, no markdown:

{{
    "rewritten_resume": "<full resume as plain text with \\n for line breaks>",
    "changes_made": ["<change 1>", "<change 2>", "<change 3>", "<change 4>"],
    "keywords_added": ["<kw1>", "<kw2>", "<kw3>", "<kw4>", "<kw5>"]
}}

ORIGINAL RESUME:
{text}
{jd_context}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=4000,
    )
    raw = strip_json(response.choices[0].message.content)
    print("REWRITE RESPONSE:", raw[:200])
    return json.loads(raw)


@app.post("/cover-letter")
async def generate_cover_letter(
    file: UploadFile = File(...),
    job_description: str = Form(""),
    target_company: str = Form(""),
    industry: str = Form(""),
    target_role: str = Form(""),
    tone: str = Form("professional"),
    hiring_manager: str = Form(""),
    why_this_job: str = Form("")
):
    contents = await file.read()
    pdf = pdfplumber.open(io.BytesIO(contents))
    text = ""
    for page in pdf.pages:
        text += page.extract_text() or ""

    tone_guide = {
        "professional": "formal, polished, and confident. No slang, no fluff. Every sentence earns its place.",
        "conversational": "warm, natural, human — like a smart person talking directly to the hiring manager. Approachable but impressive.",
        "bold": "punchy, direct, memorable — opens with a hook, short sentences, confident enough to stand out from 500 applicants.",
    }.get(tone, "professional, polished, and confident")

    company_context = f"Target company is {target_company}. Reference {target_company}'s mission, culture, or values naturally." if target_company else ""
    role_context = f"The role is {target_role}." if target_role else ""
    jd_context = f"\n\nJOB DESCRIPTION:\n{job_description}" if job_description else ""
    manager_line = f"Address it to {hiring_manager}." if hiring_manager else "Use 'Dear Hiring Manager'."
    industry_context = f"Role is in the {industry} industry." if industry else ""
    motivation_context = f"The candidate's personal motivation for wanting this job: '{why_this_job}'. Weave this authentic motivation naturally into the letter — it makes it personal and memorable." if why_this_job else ""

    prompt = f"""
You are an elite US cover letter writer. Write cover letters that get interviews — specific, compelling, tailored.

{company_context}
{role_context}
{industry_context}
{motivation_context}
TONE: {tone_guide}

RULES:
- Open with a hook — NOT "I am writing to apply for..." 
- Reference 2-3 SPECIFIC achievements from the resume with real details
- Mirror the job description's language if provided
- Show genuine company knowledge if company is named
- If the candidate shared their motivation, weave it in authentically
- Close with a confident, specific call to action
- 3 tight paragraphs, max 350 words
- {manager_line}

Return ONLY JSON, no markdown:

{{
    "cover_letter": "<full cover letter as plain text with \\n for line breaks>",
    "subject_line": "<strong email subject line>",
    "key_points": [
        "<main strength you led with and why>",
        "<how you tailored it to the company/role>",
        "<tone choice and why it fits>"
    ]
}}

RESUME:
{text}
{jd_context}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
        max_tokens=2000,
    )
    raw = strip_json(response.choices[0].message.content)
    print("COVER LETTER RESPONSE:", raw[:200])
    return json.loads(raw)


@app.post("/linkedin")
async def analyze_linkedin(
    headline: str = Form(""),
    about: str = Form(""),
    experience: str = Form(""),
    industry: str = Form(""),
    target_role: str = Form("")
):
    if not headline and not about:
        return {"error": "Please provide at least your LinkedIn headline or About section."}

    industry_context = f"They are targeting the {industry} industry." if industry else ""
    role_context = f"Their target role is {target_role}." if target_role else ""
    experience_context = f"\n\nRECENT EXPERIENCE (optional context):\n{experience}" if experience else ""

    profile_text = f"PROFILE TEXT (may include headline and About section):\n{headline}\n\n{about}{experience_context}"

    prompt = f"""
You are a LinkedIn profile expert who has helped thousands of US professionals get recruited at top companies. You give specific, actionable rewrites — never generic tips.

{industry_context}
{role_context}

The user has pasted their LinkedIn profile text below. It may contain their headline and About section mixed together. Parse out what you can and analyze it.

SCORING DIMENSIONS (each 0-100):
- headline_score: Is it keyword-rich, role-specific, and compelling?
- about_score: Does it tell a story, use first person, have a hook, value prop, and CTA?
- keywords_score: Are the right industry/role keywords present for recruiter searches?
- overall_score: Weighted average

REWRITE RULES:
- Rewritten headline: max 220 characters, keyword-rich, specific, includes value prop
- Rewritten about: 3-4 paragraphs, first person, opens with a hook, includes measurable achievements from what they shared, ends with a call to action
- Never fabricate numbers or experience not mentioned

Return ONLY JSON, no markdown:

{{
    "overall_score": <number 0-100>,
    "headline_score": <number 0-100>,
    "about_score": <number 0-100>,
    "keywords_score": <number 0-100>,
    "score_summary": "<2 sentence summary of current state and biggest gap>",
    "headline_feedback": "<specific critique of their headline>",
    "about_feedback": "<specific critique of their about section>",
    "rewritten_headline": "<new headline, max 220 chars, copy-pasteable>",
    "rewritten_about": "<full rewritten About section, 3-4 paragraphs, ready to paste>",
    "missing_keywords": ["<keyword>", "<keyword>", "<keyword>", "<keyword>"],
    "quick_wins": [
        "<one specific immediate change>",
        "<another quick win>",
        "<third quick win>"
    ]
}}

LINKEDIN PROFILE:
{profile_text}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=3000,
    )
    raw = strip_json(response.choices[0].message.content)
    print("LINKEDIN RESPONSE:", raw[:200])
    return json.loads(raw)


@app.post("/feedback")
async def save_feedback(data: dict):
    try:
        rating = data.get("rating", "")
        message = data.get("message", "")
        with open("feedback.csv", "a") as f:
            # basic CSV escaping
            clean_msg = str(message).replace("\n", " ").replace(",", ";")
            f.write(f"{rating},{clean_msg}\n")
        print("Feedback saved:", rating, message[:50])
        return {"message": "Thanks for your feedback!"}
    except Exception as e:
        print("Feedback error:", str(e))
        return {"message": "Feedback received"}


@app.post("/save-email")
async def save_email(data: dict):
    try:
        email = data.get("email")
        with open("emails.csv", "a") as f:
            f.write(f"{email}\n")
        print("Email saved:", email)
        return {"message": "Email saved!"}
    except Exception as e:
        print("Error:", str(e))
        return {"message": "Email captured"}