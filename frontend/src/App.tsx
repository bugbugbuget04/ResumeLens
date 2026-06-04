import { useState, useEffect, useRef } from "react";
import axios from "axios";

const CHECKOUT_URL = "https://resumelens.lemonsqueezy.com/checkout/buy/aa1a1cb6-75f1-4536-b9c4-7c5553d65dbd";
const API = "https://resumelens-cm11.onrender.com";

function ResumeLensLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="2" width="18" height="22" rx="2" fill="#eab308" opacity="0.15" />
      <rect x="4" y="2" width="18" height="22" rx="2" stroke="#eab308" strokeWidth="1.5" />
      <line x1="8" y1="8" x2="18" y2="8" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="12" x2="16" y2="12" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="8" y1="16" x2="18" y2="16" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <circle cx="22" cy="22" r="6" fill="#1c1917" stroke="#facc15" strokeWidth="2" />
      <circle cx="22" cy="22" r="3" fill="#eab308" opacity="0.3" />
      <line x1="26.5" y1="26.5" x2="30" y2="30" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Spinner({ color = "text-yellow-500" }: { color?: string }) {
  return (
    <svg className={`animate-spin h-5 w-5 ${color}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="w-full bg-stone-200 rounded-full h-1.5">
      <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
    </div>
  );
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [premium, setPremium] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [industry, setIndustry] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const fileRef = useRef<File | null>(null);

  const rewriteInputRef = useRef<HTMLInputElement>(null);
  const clInputRef = useRef<HTMLInputElement>(null);
  const [reuploadCount, setReuploadCount] = useState(0);

  // Rewrite state
  const [rewriting, setRewriting] = useState(false);
  const [rewriteResult, setRewriteResult] = useState<any>(null);
  const [rewriteError, setRewriteError] = useState("");

  // Cover letter state
  const [clTone, setClTone] = useState<"professional" | "conversational" | "bold">("professional");
  const [clHiringManager, setClHiringManager] = useState("");
  const [clWhyThisJob, setClWhyThisJob] = useState("");
  const [clLoading, setClLoading] = useState(false);
  const [clResult, setClResult] = useState<any>(null);
  const [clError, setClError] = useState("");
  const [clCopied, setClCopied] = useState(false);

  // LinkedIn state
  const [liText, setLiText] = useState("");
  const [liTargetRole, setLiTargetRole] = useState("");
  const [liLoading, setLiLoading] = useState(false);
  const [liResult, setLiResult] = useState<any>(null);
  const [liError, setLiError] = useState("");
  const [liCopiedHeadline, setLiCopiedHeadline] = useState(false);
  const [liCopiedAbout, setLiCopiedAbout] = useState(false);

  // Feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackDismissed, setFeedbackDismissed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("resumelens_result");
      const savedEmail = localStorage.getItem("resumelens_email_submitted");
      const savedIndustry = localStorage.getItem("resumelens_industry");
      const savedCompany = localStorage.getItem("resumelens_company");
      const savedPremium = localStorage.getItem("resumelens_premium");
      const savedRewrite = localStorage.getItem("resumelens_rewrite");
      const savedCL = localStorage.getItem("resumelens_coverletter");
      const savedLI = localStorage.getItem("resumelens_linkedin");
      if (saved) setResult(JSON.parse(saved));
      if (savedEmail === "true") setEmailSubmitted(true);
      if (savedIndustry) setIndustry(savedIndustry);
      if (savedCompany) setTargetCompany(savedCompany);
      if (savedPremium === "true") setPremium(true);
      if (savedRewrite) setRewriteResult(JSON.parse(savedRewrite));
      if (savedCL) setClResult(JSON.parse(savedCL));
      if (savedLI) setLiResult(JSON.parse(savedLI));

      const params = new URLSearchParams(window.location.search);
      if (params.get("paid") === "true") {
        setPremium(true);
        localStorage.setItem("resumelens_premium", "true");
        window.history.replaceState({}, "", window.location.pathname);
      }
    } catch (e) {}
  }, []);

  // Show feedback popup 8 seconds after results appear (once per session)
  useEffect(() => {
    if (result && emailSubmitted && !feedbackDismissed && !feedbackSent) {
      const timer = setTimeout(() => setShowFeedback(true), 8000);
      return () => clearTimeout(timer);
    }
  }, [result, emailSubmitted, feedbackDismissed, feedbackSent]);

  const handleCheckout = () => {
    if (result) localStorage.setItem("resumelens_result", JSON.stringify(result));
    if (email) localStorage.setItem("resumelens_email_submitted", "true");
    if (industry) localStorage.setItem("resumelens_industry", industry);
    if (targetCompany) localStorage.setItem("resumelens_company", targetCompany);
    const successUrl = encodeURIComponent(window.location.origin + "?paid=true");
    window.location.href = `${CHECKOUT_URL}?checkout[success_url]=${successUrl}`;
  };

  const handleGoHome = () => {
    setResult(null); setFile(null); fileRef.current = null;
    setPremium(false); setEmailSubmitted(false);
    setIndustry(""); setJobDescription(""); setTargetCompany(""); setTargetRole(""); setExperienceLevel("");
    setRewriteResult(null); setRewriteError("");
    setClResult(null); setClError(""); setClHiringManager(""); setClWhyThisJob("");
    setLiResult(null); setLiError(""); setLiText(""); setLiTargetRole("");
    setShowFeedback(false); setFeedbackDismissed(false); setFeedbackSent(false);
    localStorage.clear();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    fileRef.current = file;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("industry", industry);
    fd.append("job_description", jobDescription);
    fd.append("target_company", targetCompany);
    fd.append("target_role", targetRole);
    fd.append("experience_level", experienceLevel);
    try {
      const res = await axios.post(`${API}/analyze`, fd);
      setResult(res.data);
      localStorage.setItem("resumelens_result", JSON.stringify(res.data));
      localStorage.setItem("resumelens_industry", industry);
      localStorage.setItem("resumelens_company", targetCompany);
    } catch { alert("Something went wrong. Make sure your backend is running!"); }
    setLoading(false);
  };

  const handleRewrite = async () => {
    if (!fileRef.current) { setRewriteError("Please re-upload your resume — files are never stored for privacy."); return; }
    setRewriting(true); setRewriteError("");
    const fd = new FormData();
    fd.append("file", fileRef.current);
    fd.append("industry", industry); fd.append("job_description", jobDescription);
    fd.append("target_company", targetCompany); fd.append("target_role", targetRole);
    fd.append("experience_level", experienceLevel); fd.append("analysis", JSON.stringify(result));
    try {
      const res = await axios.post(`${API}/rewrite`, fd);
      setRewriteResult(res.data);
      localStorage.setItem("resumelens_rewrite", JSON.stringify(res.data));
    } catch { setRewriteError("Rewrite failed — please try again."); }
    setRewriting(false);
  };

  const handleCoverLetter = async () => {
    if (!fileRef.current) { setClError("Please re-upload your resume — files are never stored for privacy."); return; }
    setClLoading(true); setClError("");
    const fd = new FormData();
    fd.append("file", fileRef.current);
    fd.append("job_description", jobDescription); fd.append("target_company", targetCompany);
    fd.append("industry", industry); fd.append("target_role", targetRole);
    fd.append("tone", clTone); fd.append("hiring_manager", clHiringManager);
    fd.append("why_this_job", clWhyThisJob);
    try {
      const res = await axios.post(`${API}/cover-letter`, fd);
      setClResult(res.data);
      localStorage.setItem("resumelens_coverletter", JSON.stringify(res.data));
    } catch { setClError("Cover letter generation failed — please try again."); }
    setClLoading(false);
  };

  const handleLinkedIn = async () => {
    if (!liText.trim()) { setLiError("Please paste your LinkedIn profile text."); return; }
    setLiLoading(true); setLiError("");
    const fd = new FormData();
    fd.append("headline", liText);
    fd.append("about", liText);
    fd.append("experience", "");
    fd.append("industry", industry);
    fd.append("target_role", liTargetRole);
    try {
      const res = await axios.post(`${API}/linkedin`, fd);
      setLiResult(res.data);
      localStorage.setItem("resumelens_linkedin", JSON.stringify(res.data));
    } catch { setLiError("LinkedIn analysis failed — please try again."); }
    setLiLoading(false);
  };

  const handleSendFeedback = async () => {
    try {
      await axios.post(`${API}/feedback`, { rating: feedbackRating, message: feedbackMessage });
    } catch {}
    setFeedbackSent(true);
    setTimeout(() => setShowFeedback(false), 2000);
  };

  const copy = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const handleDownloadCLPDF = () => {
    if (!clResult?.cover_letter) return;
    const paragraphs = clResult.cover_letter.split("\n").map((l: string) => l.trim() ? `<p>${l.trim()}</p>` : `<br/>`).join("\n");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Cover Letter</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Lato',Arial,sans-serif;font-size:11.5pt;line-height:1.7;color:#1a1a1a;padding:1in 0.9in;max-width:8.5in;margin:0 auto}p{margin-bottom:6px}
@media print{body{padding:0.7in 0.8in}}</style></head><body>${paragraphs}
<div style="margin-top:32px;border-top:1px solid #eee;padding-top:10px;font-size:8pt;color:#aaa;text-align:center;">Written by ResumeLenz AI · resumelenz.com</div></body></html>`;
    const win = window.open("", "_blank");
    if (!win) { alert("Allow popups to download PDF."); return; }
    win.document.write(html); win.document.close(); win.focus();
    setTimeout(() => win.print(), 600);
  };

  const handleDownloadResumePDF = () => {
    if (!rewriteResult?.rewritten_resume) return;
    const htmlLines = rewriteResult.rewritten_resume.split("\n").map((line: string) => {
      const t = line.trim();
      if (/^[A-Z\s&/]{4,}$/.test(t) && t.length > 2) return `<h2>${t}</h2>`;
      if (!t) return `<br/>`;
      return `<p>${t}</p>`;
    }).join("\n");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Resume</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Lato',Arial,sans-serif;font-size:11pt;line-height:1.55;color:#1a1a1a;padding:0.85in 0.8in;max-width:8.5in;margin:0 auto}
h2{font-size:10pt;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;border-bottom:1.5px solid #1a1a1a;padding-bottom:3px;margin-top:18px;margin-bottom:6px}
p{margin-bottom:2px;font-size:10.5pt}@media print{body{padding:0.5in 0.6in}}</style></head>
<body>${htmlLines}<div style="margin-top:24px;border-top:1px solid #ddd;padding-top:8px;font-size:8pt;color:#999;text-align:center;">Optimized by ResumeLenz · resumelenz.com</div></body></html>`;
    const win = window.open("", "_blank");
    if (!win) { alert("Allow popups to download PDF."); return; }
    win.document.write(html); win.document.close(); win.focus();
    setTimeout(() => win.print(), 600);
  };

  const handleDownloadTxt = () => {
    if (!rewriteResult?.rewritten_resume) return;
    const blob = new Blob([rewriteResult.rewritten_resume], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "rewritten_resume.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const sc = (s: number) => s >= 80 ? "text-emerald-600" : s >= 60 ? "text-yellow-600" : "text-red-500";
  const sbc = (s: number) => s >= 80 ? "bg-emerald-500" : s >= 60 ? "bg-yellow-400" : "bg-red-400";

  const getJobLinks = (roles: string[]) => roles?.map((role) => ({
    role,
    indeed: `https://www.indeed.com/jobs?q=${encodeURIComponent(role)}&l=United+States`,
    linkedin: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(role)}&location=United%20States`,
    ziprecruiter: `https://www.ziprecruiter.com/jobs-search?search=${encodeURIComponent(role)}&location=United+States`,
    glassdoor: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(role)}&locT=N&locId=1`,
  }));

  const ReUploadBlock = ({ inputRef, onFile }: { inputRef: React.RefObject<HTMLInputElement>; onFile: (f: File) => void }) => (
    <>
      <div className="bg-yellow-100 border border-yellow-300 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
        <span className="text-yellow-600 mt-0.5">⚠️</span>
        <div>
          <p className="text-yellow-800 text-sm font-semibold">Re-upload your resume to continue</p>
          <p className="text-yellow-700/70 text-xs mt-0.5">Files are never stored — re-upload to continue</p>
        </div>
      </div>
      <div className="border border-dashed border-yellow-400 hover:border-yellow-500 rounded-xl p-6 mb-4 text-center cursor-pointer transition-all"
        onClick={() => inputRef.current?.click()}>
        <p className="text-yellow-700 text-sm font-semibold">📄 Click to re-upload your resume PDF</p>
        <input ref={inputRef} type="file" accept=".pdf" className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { fileRef.current = f; onFile(f); }
          }} />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <nav className="border-b border-stone-200 bg-white px-6 py-4 flex justify-between items-center">
        <button onClick={handleGoHome} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer">
          <ResumeLensLogo size={32} />
          <span className="text-lg font-bold text-stone-900">ResumeLens</span>
        </button>
        <div className="flex items-center gap-4">
          <span className="text-stone-500 text-sm hidden md:block">Free AI resume analysis in 30 seconds</span>
          <button onClick={handleCheckout} className="bg-yellow-400 hover:bg-yellow-500 text-stone-900 px-4 py-2 rounded-lg text-sm font-semibold transition-all">
            Get Full Report — $3.99
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* ── UPLOAD SCREEN ── */}
        {!result && (
          <>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-yellow-100 border border-yellow-300 rounded-full px-4 py-1.5 text-yellow-700 text-sm font-medium mb-6">
                ✨ AI-Powered Resume Analysis
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-stone-900 mb-4 leading-tight">
                Is Your Resume<br /><span className="text-yellow-500">Getting You Hired?</span>
              </h1>
              <p className="text-stone-600 text-xl mb-3">Get an expert AI score in 30 seconds — completely free</p>
              <div className="flex justify-center gap-6 text-sm text-stone-500">
                <span>✓ ATS Analysis</span><span>✓ Expert Feedback</span><span>✓ US Job Market</span>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
              <div className="border-2 border-dashed border-stone-300 hover:border-yellow-400 rounded-xl p-12 mb-6 text-center cursor-pointer transition-all"
                onClick={() => document.getElementById("fileInput")?.click()}>
                <div className="text-5xl mb-4">📄</div>
                <p className="text-stone-900 font-semibold text-lg">Drop your resume here</p>
                <p className="text-stone-500 text-sm mt-1">PDF files only</p>
                <input id="fileInput" type="file" accept=".pdf" className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
              {file && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 mb-4">
                  <span className="text-emerald-600">✓</span>
                  <span className="text-emerald-700 text-sm font-medium">{file.name} ready</span>
                </div>
              )}

              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Industry</label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 focus:border-yellow-400 rounded-xl px-4 py-3 text-stone-900 mb-3 outline-none transition-all">
                <option value="">Select your industry (optional)</option>
                <optgroup label="Technology">
                  <option value="software-engineering">Software Engineering</option>
                  <option value="data-science">Data Science / AI / ML</option>
                  <option value="product-management">Product Management</option>
                  <option value="devops-cloud">DevOps / Cloud / Infrastructure</option>
                  <option value="cybersecurity">Cybersecurity</option>
                  <option value="it-support">IT Support / SysAdmin</option>
                  <option value="ux-ui-design">UX / UI Design</option>
                </optgroup>
                <optgroup label="Business & Finance">
                  <option value="finance-banking">Finance / Banking</option>
                  <option value="accounting">Accounting</option>
                  <option value="consulting">Consulting</option>
                  <option value="sales">Sales / Business Development</option>
                  <option value="marketing">Marketing / Advertising</option>
                  <option value="hr">Human Resources</option>
                  <option value="operations">Operations / Supply Chain</option>
                </optgroup>
                <optgroup label="Other Fields">
                  <option value="healthcare">Healthcare / Medical</option>
                  <option value="engineering">Engineering (Mechanical/Civil/etc)</option>
                  <option value="education">Education / Teaching</option>
                  <option value="legal">Legal</option>
                  <option value="creative">Creative / Design / Media</option>
                  <option value="customer-service">Customer Service</option>
                </optgroup>
              </select>

              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Experience Level</label>
              <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 focus:border-yellow-400 rounded-xl px-4 py-3 text-stone-900 mb-3 outline-none transition-all">
                <option value="">Select your level (optional)</option>
                <option value="student-intern">Student / Intern</option>
                <option value="entry-level">Entry Level (0-2 years)</option>
                <option value="mid-level">Mid Level (3-5 years)</option>
                <option value="senior">Senior (6-10 years)</option>
                <option value="lead-manager">Lead / Manager (10+ years)</option>
                <option value="executive">Executive / Director</option>
              </select>

              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Target Role</label>
              <input type="text" placeholder='🎯 e.g. "Cybersecurity Analyst", "Product Manager" (optional)'
                value={targetRole} onChange={(e) => setTargetRole(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 focus:border-yellow-400 rounded-xl px-4 py-3 text-stone-900 mb-3 outline-none transition-all" />

              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Target Company</label>
              <input type="text" placeholder="🏢 e.g. Google, Amazon (optional)"
                value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 focus:border-yellow-400 rounded-xl px-4 py-3 text-stone-900 mb-3 outline-none transition-all" />

              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Job Description</label>
              <textarea placeholder="📋 Paste the full job description here for precise matching (optional)"
                value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
                rows={4} className="w-full bg-stone-50 border border-stone-300 focus:border-yellow-400 rounded-xl px-4 py-3 text-stone-900 mb-4 outline-none transition-all resize-none" />

              <button onClick={handleAnalyze} disabled={!file || loading}
                className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-40 text-stone-900 py-4 rounded-xl font-bold text-lg transition-all">
                {loading ? "⏳ Analyzing your resume..." : "Analyze My Resume — It's Free →"}
              </button>
              <p className="text-center text-stone-400 text-xs mt-3">🔒 Your resume is never stored</p>
            </div>

            <div className="mt-16">
              <p className="text-center text-stone-400 text-sm font-medium uppercase tracking-widest mb-8">How it works</p>
              <div className="grid grid-cols-3 gap-4">
                {[{ step: "01", title: "Upload", desc: "Drop your PDF resume" },
                  { step: "02", title: "Analyze", desc: "AI reviews every section" },
                  { step: "03", title: "Improve", desc: "Get actionable fixes" }].map((item) => (
                  <div key={item.step} className="bg-white border border-stone-200 rounded-xl p-5 text-center shadow-sm">
                    <div className="text-yellow-500 font-black text-2xl mb-2">{item.step}</div>
                    <div className="text-stone-900 font-semibold mb-1">{item.title}</div>
                    <div className="text-stone-500 text-sm">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── EMAIL GATE ── */}
        {result && !emailSubmitted && (
          <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center shadow-sm">
            <div className="w-16 h-16 bg-yellow-100 border border-yellow-300 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">📊</div>
            <h2 className="text-2xl font-black text-stone-900 mb-2">Your Results Are Ready!</h2>
            <p className="text-stone-600 mb-8">Enter your email to unlock your full score and analysis</p>
            <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 focus:border-yellow-400 rounded-xl px-4 py-3 text-stone-900 text-center mb-4 outline-none transition-all" />
            <button onClick={async () => {
                if (email) {
                  try { await axios.post(`${API}/save-email`, { email }); } catch {}
                  setEmailSubmitted(true);
                  localStorage.setItem("resumelens_email_submitted", "true");
                }
              }} disabled={!email}
              className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-40 text-stone-900 py-3 rounded-xl font-bold transition-all">
              See My Results →
            </button>
            <p className="text-stone-400 text-xs mt-3">No spam. Unsubscribe anytime.</p>
          </div>
        )}

        {/* ── RESULTS ── */}
        {result && emailSubmitted && (
          <div className="space-y-4">

            {/* Score Hero */}
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center shadow-sm">
              <p className="text-stone-400 text-xs font-semibold uppercase tracking-widest mb-4">Overall Score</p>
              <div className={`text-8xl font-black ${sc(result.overall_score)}`}>
                {result.overall_score}<span className="text-3xl text-stone-300">/100</span>
              </div>
              <p className="text-stone-600 mt-4 max-w-lg mx-auto leading-relaxed">{result.summary}</p>
              <div className="flex justify-center gap-3 mt-5 flex-wrap">
                {result.interview_probability && <span className="bg-yellow-100 border border-yellow-300 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">🎯 Interview: {result.interview_probability}</span>}
                {result.ats_score && <span className="bg-stone-100 border border-stone-300 text-stone-700 px-3 py-1 rounded-full text-sm font-medium">🤖 ATS: {result.ats_score}/100</span>}
                {targetCompany && <span className="bg-orange-100 border border-orange-300 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">🏢 {targetCompany}</span>}
                {industry && <span className="bg-emerald-100 border border-emerald-300 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">💼 {industry.replace(/-/g, " ")}</span>}
              </div>
            </div>

            {/* Job Match */}
            {result.job_match_score && jobDescription && (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-stone-900 text-base mb-4">🎯 Job Description Match</h2>
                <div className="flex items-center gap-4 mb-3">
                  <div className={`text-5xl font-black ${sc(result.job_match_score)}`}>{result.job_match_score}%</div>
                  <p className="text-stone-600 text-sm">{result.job_match_feedback}</p>
                </div>
                <ScoreBar score={result.job_match_score} color={sbc(result.job_match_score)} />
              </div>
            )}

            {/* Section Scores */}
            {result.section_scores && (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-stone-900 text-base mb-5">📊 Section Scores</h2>
                <div className="space-y-4">
                  {Object.entries(result.section_scores).map(([key, val]: any) => (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-stone-500 capitalize">{key.replace(/_/g, " ")}</span>
                        <span className={`font-bold ${sc(val)}`}>{val}/100</span>
                      </div>
                      <ScoreBar score={val} color={sbc(val)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-stone-900 text-base mb-4">💪 Top Strengths</h2>
              <div className="space-y-2">
                {result.top_strengths?.map((s: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span className="text-stone-700 text-sm">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Improvements */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-stone-900 text-base mb-4">🚨 Critical Improvements</h2>
              {result.critical_improvements?.slice(0, 1).map((item: any, i: number) => (
                <div key={i} className="bg-red-50 border border-red-200 rounded-xl p-4 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{item.priority}</span>
                    <span className="text-red-600 font-semibold text-sm">{item.section}</span>
                  </div>
                  <p className="text-stone-600 text-sm mb-2">{item.issue}</p>
                  {premium && (
                    <div className="bg-stone-50 rounded-lg p-3 border border-stone-200 mt-2">
                      <p className="text-xs text-stone-500 font-medium mb-1">✏️ How to fix:</p>
                      <p className="text-stone-700 text-sm">{item.fix}</p>
                    </div>
                  )}
                </div>
              ))}
              {!premium && result.critical_improvements?.length > 1 && (
                <div className="relative">
                  <div className="blur-sm pointer-events-none space-y-3">
                    {result.critical_improvements?.slice(1).map((_: any, i: number) => (
                      <div key={i} className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">HIGH</span>
                          <span className="text-red-600 font-semibold text-sm">Hidden Issue</span>
                        </div>
                        <p className="text-stone-600 text-sm">This critical issue is hidden...</p>
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white border border-stone-200 rounded-xl shadow-xl p-5 text-center">
                      <p className="text-xl mb-1">🔒</p>
                      <p className="font-bold text-stone-900">{Math.max(0, (result.critical_improvements?.length || 0) - 1)} more issues found</p>
                      <p className="text-stone-500 text-sm mt-1 mb-3">Unlock all fixes for $3.99</p>
                      <button onClick={handleCheckout} className="bg-yellow-400 hover:bg-yellow-500 text-stone-900 px-5 py-2 rounded-lg font-bold text-sm transition-all">Unlock Full Report — $3.99 →</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Keywords */}
            {!premium ? (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 relative overflow-hidden shadow-sm">
                <h2 className="font-bold text-stone-900 text-base mb-4">🔑 Keyword Analysis</h2>
                <div className="blur-sm pointer-events-none flex flex-wrap gap-2">
                  {["React", "Python", "SQL", "Leadership", "Agile"].map((k) => (
                    <span key={k} className="bg-stone-100 border border-stone-300 px-3 py-1 rounded-full text-sm text-stone-500">{k}</span>
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <button onClick={handleCheckout} className="bg-yellow-400 hover:bg-yellow-500 text-stone-900 px-5 py-2 rounded-lg font-bold text-sm transition-all">🔒 Unlock Keywords — $3.99 →</button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-stone-900 text-base mb-4">🔑 Keyword Analysis</h2>
                <div className="mb-4">
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">✓ Strong Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {result.keyword_analysis?.strong_keywords?.map((k: string) => (
                      <span key={k} className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-sm">{k}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">✗ Missing Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {result.keyword_analysis?.missing_keywords?.map((k: string) => (
                      <span key={k} className="bg-red-50 border border-red-200 text-red-600 px-3 py-1 rounded-full text-sm">{k}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bullet Rewrite */}
            {premium && result.bullet_point_analysis && (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-stone-900 text-base mb-4">✏️ Bullet Point Rewrite</h2>
                <p className="text-stone-500 text-sm mb-4">{result.bullet_point_analysis.feedback}</p>
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-red-500 mb-2">✗ WEAK</p>
                    <p className="text-stone-600 text-sm">{result.bullet_point_analysis.weak_bullet}</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-emerald-600 mb-2">✓ IMPROVED</p>
                    <p className="text-stone-700 text-sm">{result.bullet_point_analysis.improved_bullet}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── AI RESUME REWRITER ── */}
            {premium && (
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-300 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <h2 className="font-black text-stone-900 text-lg">AI Resume Rewriter</h2>
                    <p className="text-yellow-700 text-xs font-medium">Included with your Full Report</p>
                  </div>
                </div>
                <p className="text-stone-600 text-sm mb-5">Rewrites your entire resume — stronger bullets, better keywords, clean formatting — ready to download as PDF.</p>
                {!rewriteResult && !rewriting && (
                  <>
                    {!fileRef.current && <ReUploadBlock inputRef={rewriteInputRef} onFile={() => setReuploadCount(c => c + 1)} />}
                    {fileRef.current && (
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 mb-4">
                        <span className="text-emerald-600">✓</span>
                        <span className="text-emerald-700 text-sm font-medium">{fileRef.current.name} ready</span>
                      </div>
                    )}
                    <button onClick={handleRewrite} className="w-full bg-yellow-400 hover:bg-yellow-500 text-stone-900 py-3.5 rounded-xl font-bold text-base transition-all">✨ Rewrite My Resume with AI →</button>
                    {rewriteError && <p className="text-red-500 text-sm mt-3 text-center">{rewriteError}</p>}
                  </>
                )}
                {rewriting && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center gap-3 text-yellow-600"><Spinner /><span className="font-semibold">Rewriting your resume… ~20 seconds</span></div>
                    <p className="text-stone-500 text-xs mt-2">AI is optimizing every bullet point and section</p>
                  </div>
                )}
                {rewriteResult && (
                  <div className="space-y-4">
                    {rewriteResult.changes_made?.length > 0 && (
                      <div className="bg-white border border-stone-200 rounded-xl p-4">
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-3">✓ Changes Made</p>
                        <ul className="space-y-1.5">
                          {rewriteResult.changes_made.map((c: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-stone-700"><span className="text-emerald-600 mt-0.5 shrink-0">•</span>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {rewriteResult.keywords_added?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-yellow-700 uppercase tracking-wide mb-2">Keywords Added</p>
                        <div className="flex flex-wrap gap-2">
                          {rewriteResult.keywords_added.map((k: string) => (
                            <span key={k} className="bg-yellow-100 border border-yellow-300 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">{k}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 max-h-64 overflow-y-auto">
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-3">Preview</p>
                      <pre className="text-stone-700 text-xs leading-relaxed whitespace-pre-wrap font-mono">
                        {rewriteResult.rewritten_resume?.slice(0, 800)}{rewriteResult.rewritten_resume?.length > 800 ? "\n…" : ""}
                      </pre>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleDownloadResumePDF} className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-stone-900 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">📥 Download as PDF</button>
                      <button onClick={handleDownloadTxt} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">📄 Download as .txt</button>
                    </div>
                    <p className="text-stone-400 text-xs text-center">PDF opens a print dialog — choose "Save as PDF" in your browser</p>
                    <button onClick={() => { setRewriteResult(null); localStorage.removeItem("resumelens_rewrite"); }}
                      className="w-full text-xs text-stone-400 hover:text-stone-600 underline text-center py-1 transition-all">↺ Generate a new rewrite</button>
                  </div>
                )}
              </div>
            )}

            {/* ── COVER LETTER ── */}
            {premium && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">✉️</span>
                  <div>
                    <h2 className="font-black text-stone-900 text-lg">AI Cover Letter Generator</h2>
                    <p className="text-emerald-700 text-xs font-medium">Included with your Full Report</p>
                  </div>
                </div>
                <p className="text-stone-600 text-sm mb-5">Tailored, interview-winning cover letter based on your resume{jobDescription ? " and the job description you provided" : ""}.</p>
                {!clResult && !clLoading && (
                  <>
                    {!fileRef.current && <ReUploadBlock inputRef={clInputRef} onFile={() => setReuploadCount(c => c + 1)} />}
                    {fileRef.current && (
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 mb-4">
                        <span className="text-emerald-600">✓</span>
                        <span className="text-emerald-700 text-sm font-medium">{fileRef.current.name} ready</span>
                      </div>
                    )}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Tone</p>
                      <div className="grid grid-cols-3 gap-2">
                        {(["professional", "conversational", "bold"] as const).map((t) => (
                          <button key={t} onClick={() => setClTone(t)}
                            className={`py-2 rounded-lg text-sm font-semibold border transition-all ${clTone === t ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-stone-300 text-stone-500 hover:border-emerald-400"}`}>
                            {t === "professional" ? "🎩 Professional" : t === "conversational" ? "💬 Conversational" : "⚡ Bold"}
                          </button>
                        ))}
                      </div>
                      <p className="text-stone-500 text-xs mt-2">
                        {clTone === "professional" && "Formal, polished — ideal for corporate roles"}
                        {clTone === "conversational" && "Warm and human — great for startups and creative roles"}
                        {clTone === "bold" && "Punchy and memorable — stands out from 500 other applicants"}
                      </p>
                    </div>
                    <input type="text" placeholder="👤 Hiring manager name (optional, e.g. Sarah Johnson)"
                      value={clHiringManager} onChange={(e) => setClHiringManager(e.target.value)}
                      className="w-full bg-white border border-stone-300 focus:border-emerald-400 rounded-xl px-4 py-3 text-stone-900 mb-3 outline-none transition-all text-sm" />
                    <textarea placeholder="💭 Why do you want this job? One line makes your letter far more personal (optional)"
                      value={clWhyThisJob} onChange={(e) => setClWhyThisJob(e.target.value)}
                      rows={2} className="w-full bg-white border border-stone-300 focus:border-emerald-400 rounded-xl px-4 py-3 text-stone-900 mb-4 outline-none transition-all text-sm resize-none" />
                    <button onClick={handleCoverLetter} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-base transition-all">✉️ Generate My Cover Letter →</button>
                    {clError && <p className="text-red-500 text-sm mt-3 text-center">{clError}</p>}
                  </>
                )}
                {clLoading && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center gap-3 text-emerald-600"><Spinner color="text-emerald-600" /><span className="font-semibold">Writing your cover letter… ~15 seconds</span></div>
                    <p className="text-stone-500 text-xs mt-2">Tailoring every paragraph to your experience</p>
                  </div>
                )}
                {clResult && (
                  <div className="space-y-4">
                    {clResult.subject_line && (
                      <div className="bg-white border border-stone-200 rounded-xl p-4">
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">📧 Suggested Email Subject</p>
                        <p className="text-stone-900 text-sm font-semibold">{clResult.subject_line}</p>
                      </div>
                    )}
                    {clResult.key_points?.length > 0 && (
                      <div className="bg-white border border-stone-200 rounded-xl p-4">
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-3">✓ How It Was Tailored</p>
                        <ul className="space-y-1.5">
                          {clResult.key_points.map((pt: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-stone-700"><span className="text-emerald-600 mt-0.5 shrink-0">•</span>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-5">
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-3">Cover Letter</p>
                      <pre className="text-stone-800 text-sm leading-relaxed whitespace-pre-wrap font-sans">{clResult.cover_letter}</pre>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => copy(clResult.cover_letter, setClCopied)}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${clCopied ? "bg-emerald-600 text-white" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}>
                        {clCopied ? "✓ Copied!" : "📋 Copy to Clipboard"}
                      </button>
                      <button onClick={handleDownloadCLPDF} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">📥 Download as PDF</button>
                    </div>
                    <p className="text-stone-400 text-xs text-center">PDF opens a print dialog — choose "Save as PDF"</p>
                    <button onClick={() => { setClResult(null); localStorage.removeItem("resumelens_coverletter"); }}
                      className="w-full text-xs text-stone-400 hover:text-stone-600 underline text-center py-1 transition-all">↺ Generate a new cover letter</button>
                  </div>
                )}
              </div>
            )}

            {/* ── LINKEDIN ANALYZER ── */}
            {premium && (
              <div className="bg-gradient-to-br from-stone-100 to-stone-50 border border-stone-300 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">💼</span>
                  <div>
                    <h2 className="font-black text-stone-900 text-lg">LinkedIn Profile Optimizer</h2>
                    <p className="text-stone-500 text-xs font-medium">Included with your Full Report</p>
                  </div>
                </div>
                <p className="text-stone-600 text-sm mb-2">
                  Paste your LinkedIn profile text — headline, about section, anything — and AI scores + rewrites it so recruiters find and contact you.
                </p>
                <p className="text-stone-400 text-xs mb-5">
                  💡 How to get it: Go to your LinkedIn profile → click "About" → copy the text. Then copy your headline from the top of your profile.
                </p>

                {!liResult && !liLoading && (
                  <>
                    <div className="space-y-3 mb-4">
                      <div>
                        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Paste Your LinkedIn Profile Text</label>
                        <textarea
                          placeholder={`Paste your LinkedIn headline and About section here.\n\nExample:\nHeadline: Software Engineer at Acme Corp\n\nAbout: I am a software engineer with 3 years of experience...`}
                          value={liText} onChange={(e) => setLiText(e.target.value)}
                          rows={8} className="w-full bg-white border border-stone-300 focus:border-yellow-400 rounded-xl px-4 py-3 text-stone-900 outline-none transition-all resize-none text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Target Role <span className="text-stone-400 normal-case font-normal">(optional)</span></label>
                        <input type="text" placeholder='e.g. "Product Manager", "Data Scientist"'
                          value={liTargetRole} onChange={(e) => setLiTargetRole(e.target.value)}
                          className="w-full bg-white border border-stone-300 focus:border-yellow-400 rounded-xl px-4 py-3 text-stone-900 outline-none transition-all text-sm" />
                      </div>
                    </div>
                    <button onClick={handleLinkedIn} disabled={!liText.trim()}
                      className="w-full bg-stone-800 hover:bg-stone-900 disabled:opacity-40 text-white py-3.5 rounded-xl font-bold text-base transition-all">
                      💼 Analyze & Optimize My LinkedIn →
                    </button>
                    {liError && <p className="text-red-500 text-sm mt-3 text-center">{liError}</p>}
                  </>
                )}

                {liLoading && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center gap-3 text-stone-700"><Spinner color="text-stone-700" /><span className="font-semibold">Analyzing your LinkedIn profile… ~15 seconds</span></div>
                    <p className="text-stone-500 text-xs mt-2">AI is scoring and rewriting your headline and About section</p>
                  </div>
                )}

                {liResult && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Overall", score: liResult.overall_score },
                        { label: "Headline", score: liResult.headline_score },
                        { label: "About Section", score: liResult.about_score },
                        { label: "Keywords", score: liResult.keywords_score },
                      ].map(({ label, score }) => (
                        <div key={label} className="bg-white border border-stone-200 rounded-xl p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-stone-500 text-xs font-semibold">{label}</span>
                            <span className={`font-black text-lg ${sc(score)}`}>{score}</span>
                          </div>
                          <ScoreBar score={score} color={sbc(score)} />
                        </div>
                      ))}
                    </div>
                    {liResult.score_summary && (
                      <div className="bg-white border border-stone-200 rounded-xl p-4">
                        <p className="text-stone-700 text-sm leading-relaxed">{liResult.score_summary}</p>
                      </div>
                    )}
                    <div className="bg-white border border-stone-300 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-stone-700 uppercase tracking-wide">✨ Rewritten Headline</p>
                        <button onClick={() => copy(liResult.rewritten_headline, setLiCopiedHeadline)}
                          className={`text-xs font-bold px-3 py-1 rounded-lg transition-all ${liCopiedHeadline ? "bg-stone-800 text-white" : "bg-stone-200 text-stone-700 hover:bg-stone-300"}`}>
                          {liCopiedHeadline ? "✓ Copied" : "Copy"}
                        </button>
                      </div>
                      <p className="text-stone-900 text-sm font-semibold leading-relaxed">{liResult.rewritten_headline}</p>
                      <p className="text-stone-400 text-xs mt-2">{liResult.headline_feedback}</p>
                    </div>
                    <div className="bg-white border border-stone-300 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-stone-700 uppercase tracking-wide">✨ Rewritten About Section</p>
                        <button onClick={() => copy(liResult.rewritten_about, setLiCopiedAbout)}
                          className={`text-xs font-bold px-3 py-1 rounded-lg transition-all ${liCopiedAbout ? "bg-stone-800 text-white" : "bg-stone-200 text-stone-700 hover:bg-stone-300"}`}>
                          {liCopiedAbout ? "✓ Copied" : "Copy"}
                        </button>
                      </div>
                      <pre className="text-stone-800 text-sm leading-relaxed whitespace-pre-wrap font-sans">{liResult.rewritten_about}</pre>
                      <p className="text-stone-400 text-xs mt-3">{liResult.about_feedback}</p>
                    </div>
                    {liResult.missing_keywords?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-2">🔍 Missing Keywords Recruiters Search For</p>
                        <div className="flex flex-wrap gap-2">
                          {liResult.missing_keywords.map((k: string) => (
                            <span key={k} className="bg-red-50 border border-red-200 text-red-600 px-3 py-1 rounded-full text-xs font-semibold">{k}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {liResult.quick_wins?.length > 0 && (
                      <div className="bg-white border border-stone-200 rounded-xl p-4">
                        <p className="text-xs font-bold text-yellow-700 uppercase tracking-wide mb-3">⚡ Quick Wins — Do These Today</p>
                        <ul className="space-y-2">
                          {liResult.quick_wins.map((w: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                              <span className="text-yellow-600 mt-0.5 shrink-0">{i + 1}.</span>{w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <button onClick={() => { setLiResult(null); localStorage.removeItem("resumelens_linkedin"); }}
                      className="w-full text-xs text-stone-400 hover:text-stone-600 underline text-center py-1 transition-all">
                      ↺ Analyze a different profile
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Job Board Links */}
            {result.target_roles && (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-stone-900 text-base mb-2">🔎 Find Matching Jobs</h2>
                <p className="text-stone-500 text-sm mb-4">Based on your profile, apply to these roles now:</p>
                <div className="space-y-3">
                  {getJobLinks(result.target_roles)?.map((item: any, i: number) => (
                    <div key={i} className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                      <p className="text-stone-900 font-semibold text-sm mb-3">{item.role}</p>
                      <div className="flex flex-wrap gap-2">
                        <a href={item.indeed} target="_blank" rel="noopener noreferrer" className="bg-yellow-100 border border-yellow-300 text-yellow-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-yellow-200 transition-all">Indeed →</a>
                        <a href={item.linkedin} target="_blank" rel="noopener noreferrer" className="bg-blue-100 border border-blue-300 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-200 transition-all">LinkedIn →</a>
                        <a href={item.ziprecruiter} target="_blank" rel="noopener noreferrer" className="bg-emerald-100 border border-emerald-300 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-200 transition-all">ZipRecruiter →</a>
                        <a href={item.glassdoor} target="_blank" rel="noopener noreferrer" className="bg-pink-100 border border-pink-300 text-pink-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-pink-200 transition-all">Glassdoor →</a>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-stone-400 text-xs mt-3 text-center">Clicking these links helps support ResumeLenz for free 💛</p>
              </div>
            )}

            {/* Target Roles */}
            {result.target_roles && (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-stone-900 text-base mb-4">🎯 Best Fit Roles</h2>
                <div className="flex flex-wrap gap-2">
                  {result.target_roles?.map((r: string, i: number) => (
                    <span key={i} className="bg-yellow-100 border border-yellow-300 text-yellow-700 px-4 py-2 rounded-full text-sm font-semibold">{r}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Free CTA */}
            {!premium && (
              <div className="bg-gradient-to-br from-yellow-100 to-amber-100 border border-yellow-300 rounded-2xl p-8 text-center">
                <p className="text-2xl font-black text-stone-900 mb-2">🚀 Get Your Full Expert Report</p>
                <p className="text-stone-600 mb-2">Unlock all critical fixes, keyword analysis, bullet rewrites, and ATS optimization</p>
                <div className="flex flex-wrap justify-center gap-2 text-sm mb-6">
                  <span className="text-yellow-700 font-semibold">✨ AI Resume Rewrite</span>
                  <span className="text-stone-400">•</span>
                  <span className="text-emerald-600 font-semibold">✉️ Cover Letter</span>
                  <span className="text-stone-400">•</span>
                  <span className="text-stone-700 font-semibold">💼 LinkedIn Optimizer</span>
                  <span className="text-stone-400">•</span>
                  <span className="text-orange-600 font-semibold">📥 PDF Downloads</span>
                </div>
                <button onClick={handleCheckout} className="bg-yellow-400 hover:bg-yellow-500 text-stone-900 px-8 py-4 rounded-xl font-black text-lg transition-all">
                  Unlock Full Report — $3.99
                </button>
                <p className="text-stone-500 text-xs mt-3">One-time payment • Instant access • Everything included</p>
              </div>
            )}

            <button onClick={handleGoHome} className="w-full text-sm text-stone-400 hover:text-stone-600 underline text-center py-2 transition-all">
              ← Analyze another resume
            </button>
          </div>
        )}
      </div>

      {/* ── FEEDBACK POPUP ── */}
      {showFeedback && (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-white border border-stone-200 rounded-2xl shadow-2xl p-5 animate-[fadeIn_0.3s_ease]">
          <button onClick={() => { setShowFeedback(false); setFeedbackDismissed(true); }}
            className="absolute top-3 right-3 text-stone-400 hover:text-stone-600 text-lg leading-none">×</button>
          {!feedbackSent ? (
            <>
              <p className="font-bold text-stone-900 text-sm mb-1">How's your experience? 💛</p>
              <p className="text-stone-500 text-xs mb-3">Your feedback helps us improve ResumeLens</p>
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setFeedbackRating(star)}
                    className={`text-2xl transition-all ${star <= feedbackRating ? "grayscale-0 scale-110" : "grayscale opacity-40"}`}>
                    ⭐
                  </button>
                ))}
              </div>
              <textarea placeholder="Anything we can improve? (optional)"
                value={feedbackMessage} onChange={(e) => setFeedbackMessage(e.target.value)}
                rows={2} className="w-full bg-stone-50 border border-stone-300 focus:border-yellow-400 rounded-lg px-3 py-2 text-stone-900 text-sm outline-none transition-all resize-none mb-3" />
              <button onClick={handleSendFeedback} disabled={feedbackRating === 0}
                className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-40 text-stone-900 py-2 rounded-lg font-bold text-sm transition-all">
                Send Feedback
              </button>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-3xl mb-2">🎉</p>
              <p className="font-bold text-stone-900 text-sm">Thank you!</p>
              <p className="text-stone-500 text-xs mt-1">Your feedback means a lot.</p>
            </div>
          )}
        </div>
      )}

      <footer className="border-t border-stone-200 bg-white py-8 mt-16">
        <div className="max-w-3xl mx-auto px-4 flex justify-between items-center">
          <button onClick={handleGoHome} className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
            <ResumeLensLogo size={24} />
            <span className="text-stone-500 text-sm">ResumeLenz</span>
          </button>
          <p className="text-stone-400 text-xs">© 2026 ResumeLenz. All rights reserved.</p>
        </div>
      </footer>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}