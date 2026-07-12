from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from groq import Groq
import pdfplumber
import io
import os
import json
import re
import requests

load_dotenv()

# Google Sheet web app — collects emails & feedback reliably (survives server restarts)
GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyJsDT2oLV9QMh3JPk8X7TDkj5Yq_j6amjgMrn4VFUmysdk0cwBVlcLSwLac-6bjIlp/exec"

# AI model — one place to change it if Groq deprecates a model again
GROQ_MODEL = "openai/gpt-oss-120b"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


# ────────────────────────────────────────────────────────────────────
#  JSON helpers — robust parsing with one repair-retry so a single
#  malformed model response never 500s the whole request
# ────────────────────────────────────────────────────────────────────

def strip_json(raw: str) -> str:
    """Strip markdown fences if model wraps response in them."""
    raw = raw.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return raw.strip()


def ai_json(prompt: str, temperature: float = 0.2, max_tokens: int = 4000):
    """Call the model expecting JSON. If parsing fails, ask the model once to repair it."""
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
        max_tokens=max_tokens,
    )
    raw = strip_json(response.choices[0].message.content)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # One repair attempt: hand the broken output back and ask for valid JSON only
        repair = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{
                "role": "user",
                "content": "The following was supposed to be a valid JSON object but is malformed. "
                           "Return the corrected, complete, valid JSON only — no markdown, no backticks, no commentary:\n\n" + raw
            }],
            temperature=0,
            max_tokens=max_tokens,
        )
        return json.loads(strip_json(repair.choices[0].message.content))


def _num(v, default=60):
    try:
        return max(0, min(100, float(v)))
    except Exception:
        return default


# ────────────────────────────────────────────────────────────────────
#  PASS 1 — Resume fact extraction (temperature 0, pure facts)
#  Extracting structure first means the judgment pass reasons over
#  verified content instead of skimming raw text, which is what makes
#  feedback specific instead of generic.
# ────────────────────────────────────────────────────────────────────

def extract_resume_facts(text: str):
    prompt = f"""You are a resume PARSER. Extract facts from the resume below. Do NOT judge, score, or give opinions — only extract what is literally written.

Return ONLY a JSON object, no markdown, no backticks:

{{
  "has_summary": <true if there is a professional summary/objective/profile paragraph near the top, else false>,
  "summary_text": "<the verbatim summary text, or empty string>",
  "contact": {{"email": <bool>, "phone": <bool>, "linkedin_or_site": <bool>, "location": <bool>}},
  "sections_present": ["<section headings actually found, e.g. Experience, Education, Skills, Projects>"],
  "roles": [
    {{
      "title": "<exact job title>",
      "company": "<exact company name>",
      "dates": "<exact date text>",
      "bullets": ["<each bullet verbatim, word for word>"]
    }}
  ],
  "education": [{{"degree": "<verbatim>", "school": "<verbatim>", "dates": "<verbatim>"}}],
  "skills_listed": ["<each skill exactly as written>"],
  "certifications": ["<verbatim, or empty array>"],
  "estimated_total_years_experience": <number, best estimate from the dates; 0 if student/no experience>,
  "quantified_bullet_count": <how many bullets contain a number, %, $, or other metric>,
  "total_bullet_count": <total number of experience bullets>
}}

Rules:
- Copy text EXACTLY as written. Do not paraphrase, fix typos, or improve anything.
- If a field is absent, use empty string / empty array / false.
- Every bullet in "bullets" must be a verbatim copy from the resume.

RESUME:
{text}"""
    return ai_json(prompt, temperature=0, max_tokens=3500)


# ────────────────────────────────────────────────────────────────────
#  PASS 2 — Job-description requirement extraction (temperature 0)
#  Building the checklist BEFORE scoring means the requirement match
#  reflects the actual posting, not the model's vibe of it.
# ────────────────────────────────────────────────────────────────────

def extract_jd_requirements(job_description: str):
    prompt = f"""You are a job-description PARSER. Extract the concrete requirements from the posting below. Do NOT judge any candidate — only extract.

Return ONLY a JSON object, no markdown, no backticks:

{{
  "role_title": "<the job title in the posting, or empty string>",
  "seniority": "<entry|mid|senior|lead|executive|unclear>",
  "requirements": [
    {{"requirement": "<one specific, checkable requirement — a skill, tool, credential, or experience>", "type": "<must|preferred>"}}
  ]
}}

Rules:
- Extract 5 to 8 requirements, prioritizing the ones the posting emphasizes most.
- Each requirement must be specific and checkable against a resume (e.g. "3+ years of B2B SaaS sales", "Salesforce CRM", "Bachelor's degree in Computer Science") — not vague ("good communication").
- Mark "must" for hard requirements, "preferred" for nice-to-haves.

JOB DESCRIPTION:
{job_description}"""
    return ai_json(prompt, temperature=0, max_tokens=1500)


@app.get("/")
def root():
    return {"message": "ResumeLens API is running!"}

# ────────────────────────────────────────────────────────────────────
#  PASS 3 — Judgment. The analysis prompt receives the raw text PLUS
#  the extracted facts PLUS the JD requirement checklist, and scores
#  against anchored rubrics for run-to-run consistency.
# ────────────────────────────────────────────────────────────────────

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
    page_count = 0
    for page in pdf.pages:
        text += page.extract_text() or ""
        page_count += 1

    # --- Real parsing-quality signal (measured, not guessed) ---
    word_count = len(text.split())
    parse_flags = []
    stripped = text.strip()
    alpha_chars = sum(c.isalpha() for c in stripped)
    total_chars = max(len(stripped), 1)
    alpha_ratio = alpha_chars / total_chars
    has_standard_headings = sum(1 for h in ["experience", "education", "skill"] if h in text.lower())

    if word_count < 40:
        parse_flags.append("Very little text could be extracted — your resume may be image-based or use a format ATS software can't read. Export a text-based PDF or .docx.")
    if alpha_ratio < 0.55 and word_count > 0:
        parse_flags.append("The extracted text contains many stray symbols or broken characters, which suggests columns, tables, or graphics that confuse ATS parsers. Switch to a simple single-column layout.")
    if has_standard_headings < 2:
        parse_flags.append("Standard section headings (Experience, Education, Skills) weren't clearly detected. ATS software relies on these exact headings to categorize your resume.")

    parse_score = 100
    if word_count < 40:
        parse_score -= 55
    elif word_count < 120:
        parse_score -= 15
    if alpha_ratio < 0.55:
        parse_score -= 25
    if has_standard_headings < 2:
        parse_score -= 20
    if page_count > 2:
        parse_score -= 10
        parse_flags.append("Your resume is longer than 2 pages, which is discouraged for most US roles and can dilute keyword density.")
    parse_score = max(0, min(100, parse_score))

    # --- Input quality detection ---
    input_tips = []
    if word_count < 150:
        input_tips.append("Your resume is quite short — adding more detail about your experience, achievements, and skills will produce a much sharper analysis.")
    if not job_description:
        input_tips.append("Paste the job description you're targeting for a precise requirement-by-requirement match.")
    if not target_role:
        input_tips.append("Add your target role so feedback can be tailored to what that job needs.")
    input_quality = "high" if word_count >= 250 and job_description else ("low" if word_count < 150 or (not job_description and not target_role) else "medium")

    # ── PASS 1: extract structured facts (graceful fallback to {} on failure) ──
    try:
        facts = extract_resume_facts(text) if word_count >= 25 else {}
    except Exception as e:
        print("Fact extraction failed, continuing single-pass:", str(e))
        facts = {}

    # ── PASS 2: extract JD requirements if a JD was pasted ──
    jd_requirements = []
    jd_meta = {}
    if job_description.strip():
        try:
            jd_parsed = extract_jd_requirements(job_description)
            jd_requirements = jd_parsed.get("requirements", []) or []
            jd_meta = {"role_title": jd_parsed.get("role_title", ""), "seniority": jd_parsed.get("seniority", "")}
        except Exception as e:
            print("JD extraction failed, continuing without checklist:", str(e))

    quality_note = ""
    if input_quality != "high":
        quality_note = "\n\nNOTE ON INPUT: The provided resume and/or job details are limited, so some feedback may be necessarily broad. Where you lack specific information from the resume, be honest that you cannot assess it rather than inventing generic filler — and note what the candidate could add for a deeper analysis."

    industry_context = f"The candidate is targeting the {industry} industry. Tailor ALL feedback specifically for what {industry} employers and ATS systems look for." if industry else ""
    company_context = f"The target company is {target_company}. Reference what {target_company} is known to look for in candidates — culture, hiring bar, and role expectations — in your feedback. If you are not confident about company-specific facts, keep it general rather than inventing details." if target_company else ""
    role_context = f"The candidate is specifically targeting the role of '{target_role}'. Evaluate the resume against what this exact role requires." if target_role else ""
    level_context = f"The candidate's experience level is: {experience_level}. CRITICAL: only suggest roles and feedback appropriate for this level — never suggest senior roles to an entry-level candidate or vice versa." if experience_level else ""
    jd_context = f"\n\nJOB DESCRIPTION TO MATCH AGAINST:\n{job_description}" if job_description else ""

    facts_context = f"\n\nEXTRACTED RESUME FACTS (verified verbatim content — treat this as ground truth; every claim you make must be traceable to it):\n{json.dumps(facts, indent=1)}" if facts else ""

    if jd_requirements:
        req_list = json.dumps(jd_requirements, indent=1)
        requirement_instruction = f"""For "requirement_match", evaluate EXACTLY these requirements extracted from the job description — use each "requirement" string verbatim, do not invent your own list:
{req_list}
For each, set "found" true ONLY if the extracted resume facts contain real evidence, and cite that evidence."""
    else:
        requirement_instruction = """For "requirement_match", list the 5-8 most important requirements for the candidate's target role/industry, and honestly evaluate each against the extracted resume facts."""

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

EVIDENCE RULE (most important rule): every score, strength, weakness, and claim you output MUST be traceable to the extracted resume facts or the raw resume text below. When you criticize something, QUOTE the exact text you are criticizing. When you praise something, NAME the exact title/company/bullet/skill. Never attribute anything to the resume that is not literally in it.

ANCHORED SCORING RUBRIC (apply these bands consistently to every 0-100 score):
- 90-100: exceptional — would impress a top-tier recruiter immediately; quantified, targeted, flawless
- 75-89: strong — clearly above average; minor improvements possible
- 60-74: decent — solid foundation but visible weaknesses a recruiter would notice
- 40-59: weak — significant problems that will cost interviews
- 0-39: poor — major elements missing, unreadable, or fundamentally off-target
Score against the band definitions, not against a feeling. The same resume must earn the same scores every time.

STRICT RULES YOU MUST FOLLOW:
- Every piece of feedback MUST reference specific content from the actual resume (real job titles, real company names, real bullet points, real skills listed)
- NEVER say vague things like "add metrics" or "improve your summary" — instead quote the exact weak text and show the exact rewrite
- Strengths must be specific skills or experiences actually visible in the resume, not generic traits like "communication skills"
- Critical improvements must include the EXACT weak text from the resume and the EXACT improved version
- Target roles must match the candidate's actual experience level — don't suggest senior roles to a junior candidate
- In rewrites, PRESERVE real numbers already present; where a metric is missing, use a bracketed placeholder like "[X]%". EVERY number in a rewrite must either exist in the original resume or be a bracketed placeholder — outputting an invented realistic-looking specific (e.g. "30+", "95%", "12 leads") is a violation
- In rewrites, never claim tools, platforms, or skills (e.g. a specific CRM) that the original resume does not mention, and never import activities or volumes from the job description into the candidate's experience

CRITICAL — FUNDAMENTAL MISMATCH CHECK (honesty over politeness):
If the candidate is applying to a role they are FUNDAMENTALLY unqualified for — meaning they lack the core degree, license, certification, or entire field of training that the role legally or practically requires (e.g. a Computer Science student applying for a Staff Nurse, Cardiologist, Lawyer, or Civil Engineer role) — you MUST NOT softly encourage them. Be honest and direct. Set "fundamental_mismatch" to true and clearly state they should not apply to this specific role as-is, explain exactly what core qualifications they are missing (degrees, licenses, certifications, years of clinical/field training), and point them toward roles that DO fit their actual background. This is being kind by being honest — it saves them from wasting applications. For normal gaps (missing a few skills, needs more experience, weak bullets) set "fundamental_mismatch" to false — those are fixable and should get the usual constructive feedback.

{requirement_instruction}

Return ONLY a JSON object with this exact structure, no markdown, no backticks:

{{
    "overall_score": <number 0-100 per the rubric>,
    "fundamental_mismatch": <true or false — true ONLY for severe field/qualification mismatches as described above>,
    "mismatch_warning": "<if fundamental_mismatch is true: a direct, honest 1-2 sentence statement that they should not apply to this role and why. If false: empty string>",
    "mismatch_requirements": ["<if mismatch: a core qualification they would NEED to be eligible>", "<another>", "<another>"],
    "summary": "<3 sentence summary that references their actual job titles, companies, and specific gaps for their target industry>",
    "recruiter_first_impression": "<What a recruiter notices in the first 6 seconds of scanning THIS resume. Reference actual things visible — their most recent title, a standout project, or a glaring gap. 2-4 short punchy observations. Be honest about what jumps out, good AND bad.>",
    "section_scores": {{
        "work_experience": <number 0-100>,
        "skills": <number 0-100>,
        "education": <number 0-100>,
        "summary_section": <number 0-100 — if the extracted facts show has_summary=false, score 10-30 and flag it as missing; if a summary exists, judge its actual text>,
        "formatting": <number 0-100>
    }},
    "ats_breakdown": {{
        "keywords": <number 0-100 — how well the resume's actual keywords match the target role/industry and job description>,
        "formatting": <number 0-100 — how cleanly an ATS could parse this resume>,
        "structure": <number 0-100 — presence and completeness of standard sections per the extracted facts>,
        "content_quality": <number 0-100 — use the extracted quantified_bullet_count vs total_bullet_count ratio, action verbs, length>
    }},
    "ats_feedback": "<specific ATS feedback referencing actual resume content and target industry keywords>",
    "job_match_score": {"<number 0-100>" if job_description else "null"},
    "job_match_feedback": {'"<specific feedback comparing actual resume bullets to job description requirements>"' if job_description else "null"},
    "requirement_match": [
        {{"requirement": "<requirement text>", "found": <true or false>, "evidence": "<if found: cite the exact resume content that proves it; if not found: empty string>"}}
    ],
    "keyword_analysis": {{
        "strong_keywords": ["<keyword literally present in the extracted skills or bullets>", "<...>", "<...>"],
        "missing_keywords": ["<important keyword absent from the resume for their target role>", "<...>", "<...>"]
    }},
    "bullet_point_analysis": {{
        "score": <number 0-100>,
        "feedback": "<specific feedback referencing actual bullets from the resume>",
        "weak_bullet": "<copy an exact weak bullet from the extracted facts word for word>",
        "improved_bullet": "<rewrite of that exact bullet — preserve real numbers, use [X] placeholders for missing metrics>"
    }},
    "bullet_rewrites": [
        {{"original": "<an exact bullet copied word-for-word from the extracted roles' bullets>", "rewrite": "<stronger version — action verb + specific impact + metric or [X] placeholder>"}},
        {{"original": "<another exact bullet>", "rewrite": "<stronger version>"}},
        {{"original": "<a third exact bullet>", "rewrite": "<stronger version>"}}
    ],
    "top_strengths": [
        "<a strength quoting an actual job title, company, bullet, or skill from the extracted facts>",
        "<another strength pulled directly from actual resume content>",
        "<third strength grounded in something literally written in the resume>"
    ],
    "critical_improvements": [
        {{"priority": "HIGH", "section": "<section name>", "issue": "<quote the exact weak text or name the specific missing element>", "fix": "<exact rewrite or precise action — never generic advice>"}},
        {{"priority": "HIGH", "section": "<section name>", "issue": "<quote the exact weak text or name the specific missing element>", "fix": "<exact rewrite or precise action>"}},
        {{"priority": "MEDIUM", "section": "<section name>", "issue": "<quote the exact weak text or name the specific missing element>", "fix": "<exact rewrite or precise action>"}}
    ],
    "competitive_gap": {{
        "intro": "<one honest sentence: what the strongest candidates for their target role/industry typically have>",
        "candidates_have": ["<a credential, skill, or experience top candidates in this field usually have>", "<another>", "<another>"],
        "you_are_missing": ["<which of those THIS candidate lacks, based on the extracted facts>", "<another, or empty if they have most>"]
    }},
    "interview_probability": "<exactly one of: Low, Medium, High>",
    "target_roles": ["<role matching their actual experience level and background>", "<role>", "<role>"]
}}

HARD REQUIREMENTS:
- "requirement_match" MUST contain 5-8 items{" using the provided requirement list verbatim" if jd_requirements else ""}.
- "bullet_rewrites" MUST contain exactly 3 items, each "original" copied exactly from the extracted bullets. If fewer than 3 bullets exist, use the weakest sentences present in the resume.
- critical_improvements MUST be an array with exactly 3 objects.
- All four ats_breakdown values MUST be numbers between 0 and 100.
Only return the JSON. No markdown, no backticks, no explanation.

RAW RESUME TEXT:
{text}
{facts_context}
{jd_context}
"""

    result = ai_json(prompt, temperature=0.15, max_tokens=4500)

    # ── Validate bullet_rewrites originals against the real resume text ──
    def _in_resume(s: str) -> bool:
        norm = re.sub(r"\s+", " ", (s or "")).strip().lower()
        hay = re.sub(r"\s+", " ", text).strip().lower()
        return len(norm) > 12 and norm[:60] in hay

    verified_rewrites = []
    for b in result.get("bullet_rewrites", []) or []:
        b["verified"] = _in_resume(b.get("original", ""))
        verified_rewrites.append(b)
    if verified_rewrites:
        result["bullet_rewrites"] = verified_rewrites

    # ── Deterministic grounding of scores ──
    bd = result.get("ats_breakdown") or {}
    kw = _num(bd.get("keywords"))
    fmt_ai = _num(bd.get("formatting"))
    struct = _num(bd.get("structure"))
    content = _num(bd.get("content_quality"))

    # Formatting: blend AI judgment with the MEASURED parse signal (50/50)
    fmt = round(0.5 * fmt_ai + 0.5 * parse_score)

    # Keywords + job match: when a JD checklist exists, blend with the MEASURED
    # requirement-match percentage so the score is grounded in the actual posting
    req_match = result.get("requirement_match") or []
    if jd_requirements and req_match:
        found = sum(1 for r in req_match if r.get("found"))
        match_pct = round(100 * found / max(len(req_match), 1))
        kw = round(0.6 * kw + 0.4 * match_pct)
        jm_ai = _num(result.get("job_match_score"), default=match_pct)
        result["job_match_score"] = round(0.5 * jm_ai + 0.5 * match_pct)

    weighted = round(kw * 0.40 + fmt * 0.30 + struct * 0.20 + content * 0.10)
    result["ats_score"] = weighted
    result["ats_breakdown"] = {
        "keywords": round(kw),
        "formatting": fmt,
        "structure": round(struct),
        "content_quality": round(content),
    }
    result["ats_weights"] = {"keywords": 40, "formatting": 30, "structure": 20, "content_quality": 10}
    result["parse_score"] = parse_score
    result["parse_flags"] = parse_flags
    result["input_quality"] = input_quality
    result["input_tips"] = input_tips
    if jd_meta:
        result["jd_meta"] = jd_meta
    return result


# ────────────────────────────────────────────────────────────────────
#  Remaining endpoints — unchanged behavior, now using the robust
#  ai_json helper so malformed JSON gets one repair attempt
# ────────────────────────────────────────────────────────────────────

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

YOUR MISSION: Transform every weak, duty-based line into a strong, achievement-driven bullet. The rewritten resume should be dramatically better than the original — not a light edit — while remaining 100% TRUTHFUL to the candidate's real experience.

THE BULLET FORMULA: [Powerful action verb] + [specific accomplishment] + [quantified impact].

TRUTHFULNESS RULES (highest priority — violating these harms the candidate):
- NEVER claim skills, tools, platforms, certifications, frameworks, or types of experience that the original resume does not contain. If the target role wants Salesforce and the resume never mentions Salesforce, do NOT write a summary line or bullet implying they used it. A fabricated skill gets the candidate humiliated in the interview and destroys trust in this product.
- NEVER import activities or numbers from the JOB DESCRIPTION into the candidate's experience (e.g. if the JD says "50+ calls/day", do not write a bullet claiming the candidate made 50+ calls/day unless the original resume says so).
- The professional summary may describe ONLY what the original resume evidences. No "proven ability in X" or "skilled in Y" for things never done.
- Weave a missing keyword into experience ONLY where genuinely equivalent experience exists (e.g. "kept track of leads in a spreadsheet" can honestly become "maintained lead pipeline records"). Missing keywords with NO supporting experience must NOT appear as claimed experience — instead, end the resume with a short section titled "TARGET SKILLS TO DEVELOP" listing them, so the candidate knows exactly what to learn for this role.
- EVERY numeric value in your output must either appear in the original resume or be a bracketed placeholder like "[X]", "[X]%", "[$X]K". Writing an invented realistic-looking specific (e.g. "30+", "95%", "12 leads") is a violation.

RULES:
- Keep ALL real experience, companies, job titles, dates, and education exactly as given — NEVER fabricate jobs, degrees, or employers
- PRESERVE any real numbers and details already in the resume. Where the original lacks numbers, add a BRACKETED PLACEHOLDER like "[X]%", "[X]+", or "[$X]K" instead of inventing a fake specific number — this signals the candidate must insert their real figure and keeps them honest
- Start bullets with strong, varied action verbs (Spearheaded, Engineered, Drove, Optimized, Launched, Negotiated). Never reuse the same verb or start with "Responsible for", "Helped with", or "Worked on"
- Weave in missing keywords ONLY per the truthfulness rules above; unsupported keywords go in "TARGET SKILLS TO DEVELOP"
- Write a sharp 2-3 line professional summary at the top tailored to the target role, grounded strictly in real experience
- Clear section headers: SUMMARY, EXPERIENCE, EDUCATION, SKILLS (plus TARGET SKILLS TO DEVELOP if needed)
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
    return ai_json(prompt, temperature=0.5, max_tokens=4000)


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
    return ai_json(prompt, temperature=0.5, max_tokens=2000)


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
    return ai_json(prompt, temperature=0.4, max_tokens=3000)


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
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=300,
        )
        polished = response.choices[0].message.content.strip()
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

        raw = ai_json(prompt, temperature=0.6, max_tokens=max_t)
        if isinstance(raw, list):
            limit = 10 if mode == "skills" else 5
            return {"bullets": [str(b) for b in raw][:limit]}
        return {"bullets": []}
    except Exception as e:
        print("Suggest error:", str(e))
        return {"bullets": []}


@app.post("/verify-license")
async def verify_license(data: dict):
    """Verify a Lemon Squeezy license key so premium can't be unlocked by guessing a URL."""
    key = data.get("license_key", "").strip()
    if not key:
        return {"valid": False, "error": "Please enter your license key."}
    try:
        resp = requests.post(
            "https://api.lemonsqueezy.com/v1/licenses/validate",
            data={"license_key": key},
            headers={"Accept": "application/json"},
            timeout=10,
        )
        result = resp.json()
        # Optional hardening: set these env vars in Render to reject keys from
        # other Lemon Squeezy products (recommended by LS docs)
        expected_store = os.getenv("LS_STORE_ID", "")
        expected_product = os.getenv("LS_PRODUCT_ID", "")
        meta = result.get("meta") or {}
        if expected_store and str(meta.get("store_id", "")) != str(expected_store):
            return {"valid": False, "error": "That license key isn't valid for this product."}
        if expected_product and str(meta.get("product_id", "")) != str(expected_product):
            return {"valid": False, "error": "That license key isn't valid for this product."}
        if result.get("valid") is True:
            return {"valid": True}
        lic = result.get("license_key")
        if lic and lic.get("status") == "active":
            return {"valid": True}
        return {"valid": False, "error": "That license key isn't valid. Please check and try again."}
    except Exception as e:
        print("License verify error:", str(e))
        return {"valid": False, "error": "Couldn't verify right now — please try again in a moment."}


@app.post("/feedback")
async def save_feedback(data: dict):
    rating = data.get("rating", "")
    message = data.get("message", "")
    try:
        feedback_line = f"[FEEDBACK] {rating}★ — {message}"
        requests.post(GOOGLE_SHEET_URL, json={"email": feedback_line}, timeout=5)
        print("Feedback sent to Google Sheet:", rating, str(message)[:50])
    except Exception as e:
        print("Google Sheet error:", str(e))
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
    try:
        requests.post(GOOGLE_SHEET_URL, json={"email": email}, timeout=5)
        print("Email sent to Google Sheet:", email)
    except Exception as e:
        print("Google Sheet error:", str(e))
    try:
        with open("emails.csv", "a") as f:
            f.write(f"{email}\n")
    except Exception:
        pass
    return {"message": "Email saved!"}