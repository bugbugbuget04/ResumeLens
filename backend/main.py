from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from groq import Groq
import pdfplumber
import io
import os
import json
import requests

load_dotenv()

# Google Sheet web app — collects emails & feedback reliably (survives server restarts)
GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyJsDT2oLV9QMh3JPk8X7TDkj5Yq_j6amjgMrn4VFUmysdk0cwBVlcLSwLac-6bjIlp/exec"

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

    # --- Input quality detection: thin input = generic output, so flag it honestly ---
    word_count = len(text.split())
    input_tips = []
    if word_count < 150:
        input_tips.append("Your resume is quite short — adding more detail about your experience, achievements, and skills will produce a much sharper analysis.")
    if not job_description:
        input_tips.append("Paste the job description you're targeting for a precise requirement-by-requirement match.")
    if not target_role:
        input_tips.append("Add your target role so feedback can be tailored to what that job needs.")
    input_quality = "high" if word_count >= 250 and job_description else ("low" if word_count < 150 or (not job_description and not target_role) else "medium")

    quality_note = ""
    if input_quality != "high":
        quality_note = "\n\nNOTE ON INPUT: The provided resume and/or job details are limited, so some feedback may be necessarily broad. Where you lack specific information from the resume, be honest that you cannot assess it rather than inventing generic filler — and note what the candidate could add for a deeper analysis."

    industry_context = f"The candidate is targeting the {industry} industry. Tailor ALL feedback specifically for what {industry} employers and ATS systems look for." if industry else ""
    company_context = f"The target company is {target_company}. Research what {target_company} specifically looks for in candidates — their culture, known ATS keywords, hiring bar, and role expectations — and reference this directly in your feedback." if target_company else ""
    role_context = f"The candidate is specifically targeting the role of '{target_role}'. Evaluate the resume against what this exact role requires." if target_role else ""
    level_context = f"The candidate's experience level is: {experience_level}. CRITICAL: only suggest roles and feedback appropriate for this level — never suggest senior roles to an entry-level candidate or vice versa." if experience_level else ""
    jd_context = f"\n\nJOB DESCRIPTION TO MATCH AGAINST:\n{job_description}" if job_description else ""

    prompt = f"""
You are simulating THREE expert reviewers analyzing this resume together:
1. An ATS (Applicant Tracking System) scanner that parses and keyword-matches
2. A technical recruiter who screens resumes in 6 seconds
3. A hiring manager deciding whether to interview

Be BRUTALLY HONEST. Avoid generic resume advice that users have heard 500 times. Every observation must reference ACTUAL content from this specific resume — real job titles, real company names, real bullet points, real skills. If you find yourself writing advice that could apply to any resume, delete it and be specific instead.

{industry_context}
{company_context}
{role_context}
{level_context}
{quality_note}

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
    "recruiter_first_impression": "<Write what a recruiter notices in the first 6 seconds of scanning THIS resume. Reference actual things visible — their most recent title, a standout project, or a glaring gap. Format as 2-4 short punchy observations, each starting with the candidate's reality. Be honest about what jumps out, good AND bad.>",
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
    "requirement_match": [
        {"{"} "requirement": "<a specific requirement or skill from the job description (or, if no JD, a key requirement for their target role/industry)>", "found": <true or false — is this genuinely evidenced in their resume?>, "evidence": "<if found: briefly cite where in their resume; if not found: empty string>" {"}"}
    ],
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
    "bullet_rewrites": [
        {"{"} "original": "<an exact bullet copied word-for-word from their resume>", "rewrite": "<a stronger version of that exact bullet — add action verb, specific impact, and a realistic metric>" {"}"},
        {"{"} "original": "<another exact bullet from their resume>", "rewrite": "<stronger version>" {"}"},
        {"{"} "original": "<a third exact bullet from their resume>", "rewrite": "<stronger version>" {"}"}
    ],
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
    "competitive_gap": {{
        "intro": "<one honest sentence: what the strongest candidates for their target role/industry typically have>",
        "candidates_have": ["<a credential, skill, or experience top candidates in this field usually have>", "<another>", "<another>"],
        "you_are_missing": ["<which of those THIS candidate lacks, based on their actual resume>", "<another they're missing, or empty if they have most>"]
    }},
    "interview_probability": "Low",
    "target_roles": ["<role that matches their actual experience level and background>", "<role>", "<role>"]
}}

IMPORTANT RULES FOR THE NEW FIELDS:
- "requirement_match" MUST be an array of 5-8 items. If a job description is provided, pull requirements directly from it. If no job description, use the most important requirements for their stated target role/industry. Be honest about "found" — only mark true if there is real evidence in the resume.
- "bullet_rewrites" MUST contain exactly 3 items, each using a REAL bullet copied exactly from their resume. If the resume has fewer than 3 bullets, rewrite what exists and fill remaining with the weakest sentences present.
- "recruiter_first_impression" must reference actual specific content, not generic phrases.
- "competitive_gap" must be grounded in their real background and realistic for their target field.

interview_probability MUST be exactly one of: "Low", "Medium", or "High".
critical_improvements MUST be an array with exactly 3 objects.
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
    result = json.loads(raw)
    # attach input-quality signal so the frontend can guide the user
    result["input_quality"] = input_quality
    result["input_tips"] = input_tips
    return result


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
You are a top-tier US resume writer who has helped candidates land roles at Fortune 500 companies and top startups. Rewrite the resume below into a powerful, ATS-optimized document that gets interviews.

{industry_context}
{company_context}
{role_context}
{level_context}
{analysis_context}

YOUR MISSION: Transform every weak, duty-based line into a strong, achievement-driven bullet. The rewritten resume should be dramatically better than the original — not a light edit.

THE BULLET FORMULA: [Powerful action verb] + [specific accomplishment] + [quantified impact].

RULES:
- Keep ALL real experience, companies, job titles, dates, and education exactly as given — NEVER fabricate jobs, degrees, or employers
- PRESERVE any real numbers and details already in the resume. Where the original lacks numbers, add a BRACKETED PLACEHOLDER like "[X]%", "[X]+", or "[$X]K" instead of inventing a fake specific number — this signals the candidate must insert their real figure and keeps them honest
- Start bullets with strong, varied action verbs (Spearheaded, Engineered, Drove, Optimized, Launched, Negotiated). Never reuse the same verb or start with "Responsible for", "Helped with", or "Worked on"
- Weave in missing keywords naturally so it passes ATS for the target role/industry
- Write a sharp 2-3 line professional summary at the top tailored to the target role
- Clear section headers: SUMMARY, EXPERIENCE, EDUCATION, SKILLS
- Keep it to 1 page of content (2 pages only for 10+ years of experience)

TRANSFORMATION EXAMPLES (this is the quality bar — note bracketed placeholders for missing numbers):
- Before: "Responsible for managing social media accounts"
  After: "Grew company Instagram following by [X]% in [X] months by launching a content calendar and daily engagement strategy"
- Before: "Helped customers with their orders"
  After: "Resolved [X]+ daily customer inquiries with a [X]% satisfaction rating, driving repeat purchases"
- Before: "Worked on a machine learning project"
  After: "Built and deployed an ML prediction model that improved forecast accuracy by [X]% using Python and scikit-learn"

Every single bullet in your output should meet this standard. If a bullet doesn't have an action verb and a result, rewrite it until it does.

Return ONLY JSON, no markdown:

{{
    "rewritten_resume": "<full resume as plain text with \\n for line breaks>",
    "changes_made": ["<specific change referencing actual content>", "<change 2>", "<change 3>", "<change 4>"],
    "keywords_added": ["<kw1>", "<kw2>", "<kw3>", "<kw4>", "<kw5>"]
}}

ORIGINAL RESUME:
{text}
{jd_context}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.6,
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


@app.post("/polish")
async def polish_text(data: dict):
    """Polish a single resume field (bullet, summary, etc.) into strong resume language."""
    try:
        text = data.get("text", "").strip()
        field_type = data.get("field_type", "bullet")  # bullet | summary | skill
        role = data.get("role", "")

        if not text:
            return {"polished": ""}

        role_hint = f" The person is targeting a {role} role." if role else ""

        if field_type == "summary":
            instruction = f"Rewrite this into a punchy 2-3 sentence professional resume summary. Strong, specific, no fluff, no first-person pronouns where avoidable.{role_hint}"
        elif field_type == "skill":
            instruction = f"Clean this up into a concise, comma-separated list of professional skills suitable for a resume.{role_hint}"
        else:
            instruction = f"Rewrite this into a single powerful resume bullet using the formula [strong action verb] + [specific accomplishment] + [quantified impact]. Start with a varied, strong action verb (not 'Responsible for' or 'Helped'). PRESERVE any real numbers, names, or details the person already wrote. If the bullet already has a metric, keep it. If it has NO metric, add a bracketed placeholder like '[X]%' or '[X]+' so they know to insert their real figure (do not invent a fake specific number). Make it achievement-focused, not duty-focused. One line, no period at the start.{role_hint} Example: 'helped customers' becomes 'Resolved [X]+ daily customer inquiries with a [X]% satisfaction rating'."

        prompt = f"""You are an expert resume writer. {instruction}

Return ONLY the rewritten text, no quotes, no markdown, no explanation, no preamble.

Original: {text}"""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=300,
        )
        polished = response.choices[0].message.content.strip()
        # strip wrapping quotes if model added them
        if polished.startswith('"') and polished.endswith('"'):
            polished = polished[1:-1].strip()
        return {"polished": polished}
    except Exception as e:
        print("Polish error:", str(e))
        return {"polished": data.get("text", "")}


@app.post("/suggest-bullets")
async def suggest_bullets(data: dict):
    """Generate ready-to-use resume bullet points OR skills for a given job title."""
    try:
        job_title = data.get("job_title", "").strip()
        mode = data.get("mode", "bullets")  # "bullets" or "skills"
        if not job_title:
            return {"bullets": []}

        if mode == "skills":
            prompt = f"""You are an expert resume writer and recruiter. List the 10 most relevant, in-demand skills that hiring managers and ATS systems specifically look for in a "{job_title}".

RULES:
- Prioritize SPECIFIC, role-defining skills over generic ones. For a "{job_title}", lead with the actual tools, technologies, certifications, methodologies, and domain skills that role requires.
- Include real named tools/systems where relevant (e.g. for a data analyst: "SQL", "Tableau", "Python"; for a nurse: "EHR/Epic", "IV Therapy", "Patient Assessment"; for a sales role: "Salesforce CRM", "Pipeline Management")
- Mix mostly hard/technical skills with 2-3 high-value soft skills that genuinely matter for this role
- Each short (1-4 words), no explanations, no numbering, no symbols
- Avoid filler like "hard worker", "team player", "communication" unless truly central to the role

Return ONLY a JSON array of 10 short strings, no markdown, no explanation."""
            max_t = 400
        else:
            prompt = f"""You are a top-tier executive resume writer who has helped people land jobs at Google, Amazon, and top firms. Generate 5 outstanding, ready-to-use resume bullet points for the job title: "{job_title}".

WHAT MAKES A GREAT BULLET (follow this formula): [Strong action verb] + [specific task/what you did] + [quantified result or impact].

RULES:
- Start each with a powerful, varied action verb (Spearheaded, Engineered, Drove, Streamlined, Negotiated, Launched — never repeat the same verb)
- EVERY bullet must include a metric, but use a BRACKETED PLACEHOLDER for the number so the user knows to fill in their real figure — e.g. "by [X]%", "[$X]K", "a team of [X]", "[X]+ customers". This keeps the user honest and signals they must insert their real numbers.
- Be SPECIFIC to this exact job title — reference real tools, systems, methods, or responsibilities someone in this role actually uses. A "{job_title}" bullet should be unmistakably about THAT job, not generic filler.
- Show impact and outcomes, not just duties. "Managed inventory" is weak. "Cut inventory waste by [X]% by implementing a just-in-time tracking system" is strong.
- One line each, professional, no period at the start, no numbering, no bullet symbols

GOOD EXAMPLES (notice the specificity + bracketed placeholders):
- Retail Sales Associate: "Exceeded monthly sales targets by [X]% for [X] consecutive months by upselling extended warranties and accessories"
- Software Engineer: "Reduced API response time by [X]% by refactoring legacy database queries and adding Redis caching"
- Registered Nurse: "Managed care for [X]+ patients per shift while maintaining a [X]% patient satisfaction score"

BAD EXAMPLES (too generic — never do this):
- "Responsible for helping customers" / "Worked on various projects" / "Strong team player with good communication"

Return ONLY a JSON array of 5 strings, no markdown, no explanation."""
            max_t = 700

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=max_t,
        )
        raw = strip_json(response.choices[0].message.content)
        items = json.loads(raw)
        if isinstance(items, list):
            limit = 10 if mode == "skills" else 5
            return {"bullets": [str(b) for b in items][:limit]}
        return {"bullets": []}
    except Exception as e:
        print("Suggest error:", str(e))
        return {"bullets": []}


@app.post("/feedback")
async def save_feedback(data: dict):
    rating = data.get("rating", "")
    message = data.get("message", "")
    # Send to Google Sheet — reuse the email column, tagged as feedback
    try:
        feedback_line = f"[FEEDBACK] {rating}★ — {message}"
        requests.post(GOOGLE_SHEET_URL, json={"email": feedback_line}, timeout=5)
        print("Feedback sent to Google Sheet:", rating, message[:50])
    except Exception as e:
        print("Google Sheet error:", str(e))
    # Local backup
    try:
        with open("feedback.csv", "a") as f:
            clean_msg = str(message).replace("\n", " ").replace(",", ";")
            f.write(f"{rating},{clean_msg}\n")
    except Exception:
        pass
    return {"message": "Thanks for your feedback!"}


@app.post("/save-email")
async def save_email(data: dict):
    email = data.get("email", "")
    # Send to Google Sheet (reliable, survives restarts)
    try:
        requests.post(GOOGLE_SHEET_URL, json={"email": email}, timeout=5)
        print("Email sent to Google Sheet:", email)
    except Exception as e:
        print("Google Sheet error:", str(e))
    # Also keep a local backup copy
    try:
        with open("emails.csv", "a") as f:
            f.write(f"{email}\n")
    except Exception:
        pass
    return {"message": "Email saved!"}