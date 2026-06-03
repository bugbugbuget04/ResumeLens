import { useState, useEffect, useRef } from "react";
import axios from "axios";

const CHECKOUT_URL = "https://resumelens.lemonsqueezy.com/checkout/buy/aa1a1cb6-75f1-4536-b9c4-7c5553d65dbd";
const API = "https://resumelens-cm11.onrender.com";

function ResumeLensLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="2" width="18" height="22" rx="2" fill="#6366f1" opacity="0.15" />
      <rect x="4" y="2" width="18" height="22" rx="2" stroke="#6366f1" strokeWidth="1.5" />
      <line x1="8" y1="8" x2="18" y2="8" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="12" x2="16" y2="12" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="8" y1="16" x2="18" y2="16" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <circle cx="22" cy="22" r="6" fill="#0f172a" stroke="#818cf8" strokeWidth="2" />
      <circle cx="22" cy="22" r="3" fill="#6366f1" opacity="0.3" />
      <line x1="26.5" y1="26.5" x2="30" y2="30" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
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
  const fileRef = useRef<File | null>(null);

  // Rewrite state
  const [rewriting, setRewriting] = useState(false);
  const [rewriteResult, setRewriteResult] = useState<any>(null);
  const [rewriteError, setRewriteError] = useState("");

  // Cover letter state
  const [clTone, setClTone] = useState<"professional" | "conversational" | "bold">("professional");
  const [clHiringManager, setClHiringManager] = useState("");
  const [clLoading, setClLoading] = useState(false);
  const [clResult, setClResult] = useState<any>(null);
  const [clError, setClError] = useState("");
  const [clCopied, setClCopied] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("resumelens_result");
      const savedEmail = localStorage.getItem("resumelens_email_submitted");
      const savedIndustry = localStorage.getItem("resumelens_industry");
      const savedCompany = localStorage.getItem("resumelens_company");
      const savedPremium = localStorage.getItem("resumelens_premium");
      const savedRewrite = localStorage.getItem("resumelens_rewrite");
      const savedCL = localStorage.getItem("resumelens_coverletter");
      if (saved) setResult(JSON.parse(saved));
      if (savedEmail === "true") setEmailSubmitted(true);
      if (savedIndustry) setIndustry(savedIndustry);
      if (savedCompany) setTargetCompany(savedCompany);
      if (savedPremium === "true") setPremium(true);
      if (savedRewrite) setRewriteResult(JSON.parse(savedRewrite));
      if (savedCL) setClResult(JSON.parse(savedCL));

      const params = new URLSearchParams(window.location.search);
      if (params.get("paid") === "true") {
        setPremium(true);
        localStorage.setItem("resumelens_premium", "true");
        window.history.replaceState({}, "", window.location.pathname);
      }
    } catch (e) {}
  }, []);

  const handleCheckout = () => {
    if (result) localStorage.setItem("resumelens_result", JSON.stringify(result));
    if (email) localStorage.setItem("resumelens_email_submitted", "true");
    if (industry) localStorage.setItem("resumelens_industry", industry);
    if (targetCompany) localStorage.setItem("resumelens_company", targetCompany);
    const successUrl = encodeURIComponent(window.location.origin + "?paid=true");
    window.location.href = `${CHECKOUT_URL}?checkout[success_url]=${successUrl}`;
  };

  const handleGoHome = () => {
    setResult(null);
    setFile(null);
    fileRef.current = null;
    setPremium(false);
    setEmailSubmitted(false);
    setIndustry("");
    setJobDescription("");
    setTargetCompany("");
    setRewriteResult(null);
    setRewriteError("");
    setClResult(null);
    setClError("");
    setClHiringManager("");
    localStorage.clear();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    fileRef.current = file;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("industry", industry);
    formData.append("job_description", jobDescription);
    formData.append("target_company", targetCompany);
    try {
      const res = await axios.post(`${API}/analyze`, formData);
      setResult(res.data);
      localStorage.setItem("resumelens_result", JSON.stringify(res.data));
      localStorage.setItem("resumelens_industry", industry);
      localStorage.setItem("resumelens_company", targetCompany);
    } catch (err) {
      alert("Something went wrong. Make sure your backend is running!");
    }
    setLoading(false);
  };

  const handleRewrite = async () => {
    if (!fileRef.current) {
      setRewriteError("Please re-upload your resume file — we don't store it between sessions for privacy.");
      return;
    }
    setRewriting(true);
    setRewriteError("");
    const formData = new FormData();
    formData.append("file", fileRef.current);
    formData.append("industry", industry);
    formData.append("job_description", jobDescription);
    formData.append("target_company", targetCompany);
    formData.append("analysis", JSON.stringify(result));
    try {
      const res = await axios.post(`${API}/rewrite`, formData);
      setRewriteResult(res.data);
      localStorage.setItem("resumelens_rewrite", JSON.stringify(res.data));
    } catch (err) {
      setRewriteError("Rewrite failed — please try again.");
    }
    setRewriting(false);
  };

  const handleCoverLetter = async () => {
    if (!fileRef.current) {
      setClError("Please re-upload your resume file — we don't store it between sessions for privacy.");
      return;
    }
    setClLoading(true);
    setClError("");
    const formData = new FormData();
    formData.append("file", fileRef.current);
    formData.append("job_description", jobDescription);
    formData.append("target_company", targetCompany);
    formData.append("industry", industry);
    formData.append("tone", clTone);
    formData.append("hiring_manager", clHiringManager);
    try {
      const res = await axios.post(`${API}/cover-letter`, formData);
      setClResult(res.data);
      localStorage.setItem("resumelens_coverletter", JSON.stringify(res.data));
    } catch (err) {
      setClError("Cover letter generation failed — please try again.");
    }
    setClLoading(false);
  };

  const handleCopyCL = () => {
    if (!clResult?.cover_letter) return;
    navigator.clipboard.writeText(clResult.cover_letter);
    setClCopied(true);
    setTimeout(() => setClCopied(false), 2000);
  };

  const handleDownloadCLPDF = () => {
    if (!clResult?.cover_letter) return;
    const text = clResult.cover_letter;
    const paragraphs = text.split("\n").map((line: string) =>
      line.trim() ? `<p>${line.trim()}</p>` : `<br/>`
    ).join("\n");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Cover Letter — ResumeLens</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Lato', Arial, sans-serif;
      font-size: 11.5pt;
      line-height: 1.7;
      color: #1a1a1a;
      padding: 1in 0.9in;
      max-width: 8.5in;
      margin: 0 auto;
    }
    p { margin-bottom: 6px; }
    @media print { body { padding: 0.7in 0.8in; } }
  </style>
</head>
<body>
${paragraphs}
<div style="margin-top:32px; border-top:1px solid #eee; padding-top:10px; font-size:8pt; color:#aaa; text-align:center;">
  Written by ResumeLens AI · resumelens.com
</div>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) { alert("Please allow popups to download the PDF."); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
  };

  const handleDownloadTxt = () => {
    if (!rewriteResult?.rewritten_resume) return;
    const blob = new Blob([rewriteResult.rewritten_resume], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rewritten_resume.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadResumePDF = () => {
    if (!rewriteResult?.rewritten_resume) return;
    const text = rewriteResult.rewritten_resume;
    const lines = text.split("\n");
    const htmlLines = lines.map((line: string) => {
      const trimmed = line.trim();
      if (/^[A-Z\s&\/]{4,}$/.test(trimmed) && trimmed.length > 2) return `<h2>${trimmed}</h2>`;
      if (!trimmed) return `<br/>`;
      return `<p>${trimmed}</p>`;
    }).join("\n");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Rewritten Resume — ResumeLens</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Lato', Arial, sans-serif; font-size: 11pt; line-height: 1.55; color: #1a1a1a; padding: 0.85in 0.8in; max-width: 8.5in; margin: 0 auto; }
    h2 { font-size: 10pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; border-bottom: 1.5px solid #1a1a1a; padding-bottom: 3px; margin-top: 18px; margin-bottom: 6px; }
    p { margin-bottom: 2px; font-size: 10.5pt; }
    @media print { body { padding: 0.5in 0.6in; } h2 { page-break-after: avoid; } }
  </style>
</head>
<body>
${htmlLines}
<div style="margin-top:24px; border-top:1px solid #ddd; padding-top:8px; font-size:8pt; color:#999; text-align:center;">Optimized by ResumeLens · resumelens.com</div>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) { alert("Please allow popups for this site to download the PDF."); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
  };

  const scoreColor = (score: number) => score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400";
  const scoreBarColor = (score: number) => score >= 80 ? "bg-emerald-400" : score >= 60 ? "bg-amber-400" : "bg-red-400";

  const getJobLinks = (roles: string[]) =>
    roles?.map((role) => ({
      role,
      indeed: `https://www.indeed.com/jobs?q=${encodeURIComponent(role)}&l=United+States`,
      linkedin: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(role)}&location=United%20States`,
      ziprecruiter: `https://www.ziprecruiter.com/jobs-search?search=${encodeURIComponent(role)}&location=United+States`,
      glassdoor: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(role)}&locT=N&locId=1`,
    }));

  // Shared re-upload block used by both rewriter and cover letter
  const ReUploadBlock = ({ inputId, label }: { inputId: string; label: string }) => (
    <>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
        <span className="text-amber-400 mt-0.5">⚠️</span>
        <div>
          <p className="text-amber-300 text-sm font-semibold">Re-upload your resume to use {label}</p>
          <p className="text-amber-400/70 text-xs mt-0.5">Files are never stored — re-upload to continue</p>
        </div>
      </div>
      <div
        className="border border-dashed border-indigo-500/40 hover:border-indigo-400 rounded-xl p-6 mb-4 text-center cursor-pointer transition-all"
        onClick={() => document.getElementById(inputId)?.click()}
      >
        <p className="text-indigo-400 text-sm font-semibold">📄 Click to re-upload your resume PDF</p>
        <input
          id={inputId}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => { fileRef.current = e.target.files?.[0] || null; }}
        />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <button onClick={handleGoHome} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer">
          <ResumeLensLogo size={32} />
          <span className="text-lg font-bold text-white">ResumeLens</span>
        </button>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm hidden md:block">Free AI resume analysis in 30 seconds</span>
          <button onClick={handleCheckout} className="bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">
            Get Full Report — $3.99
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* ── UPLOAD SCREEN ── */}
        {!result && (
          <>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-indigo-400 text-sm font-medium mb-6">
                ✨ AI-Powered Resume Analysis
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
                Is Your Resume<br />
                <span className="text-indigo-400">Getting You Hired?</span>
              </h1>
              <p className="text-gray-400 text-xl mb-3">Get an expert AI score in 30 seconds — completely free</p>
              <div className="flex justify-center gap-6 text-sm text-gray-500">
                <span>✓ ATS Analysis</span>
                <span>✓ Expert Feedback</span>
                <span>✓ US Job Market</span>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <div
                className="border-2 border-dashed border-gray-700 hover:border-indigo-500 rounded-xl p-12 mb-6 text-center cursor-pointer transition-all"
                onClick={() => document.getElementById("fileInput")?.click()}
              >
                <div className="text-5xl mb-4">📄</div>
                <p className="text-white font-semibold text-lg">Drop your resume here</p>
                <p className="text-gray-500 text-sm mt-1">PDF files only</p>
                <input id="fileInput" name="fileInput" type="file" accept=".pdf" className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>

              {file && (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2 mb-4">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-emerald-400 text-sm font-medium">{file.name} ready</span>
                </div>
              )}

              <select value={industry} onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-white mb-3 outline-none transition-all">
                <option value="">Select your industry (optional)</option>
                <option value="tech">Technology / Software</option>
                <option value="finance">Finance / Banking</option>
                <option value="healthcare">Healthcare / Medical</option>
                <option value="marketing">Marketing / Advertising</option>
                <option value="engineering">Engineering</option>
                <option value="sales">Sales / Business Development</option>
                <option value="design">Design / Creative</option>
                <option value="education">Education</option>
                <option value="legal">Legal</option>
                <option value="consulting">Consulting</option>
              </select>

              <input type="text" placeholder="🏢 Target company e.g. Google, Amazon (optional)"
                value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-white mb-3 outline-none transition-all" />

              <textarea placeholder="📋 Paste the job description here for better matching (optional)"
                value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
                rows={4} className="w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-white mb-4 outline-none transition-all resize-none" />

              <button onClick={handleAnalyze} disabled={!file || loading}
                className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-white py-4 rounded-xl font-bold text-lg transition-all">
                {loading ? "⏳ Analyzing your resume..." : "Analyze My Resume — It's Free →"}
              </button>
              <p className="text-center text-gray-600 text-xs mt-3">🔒 Your resume is never stored</p>
            </div>

            <div className="mt-16">
              <p className="text-center text-gray-500 text-sm font-medium uppercase tracking-widest mb-8">How it works</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { step: "01", title: "Upload", desc: "Drop your PDF resume" },
                  { step: "02", title: "Analyze", desc: "AI reviews every section" },
                  { step: "03", title: "Improve", desc: "Get actionable fixes" },
                ].map((item) => (
                  <div key={item.step} className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
                    <div className="text-indigo-400 font-black text-2xl mb-2">{item.step}</div>
                    <div className="text-white font-semibold mb-1">{item.title}</div>
                    <div className="text-gray-500 text-sm">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── EMAIL GATE ── */}
        {result && !emailSubmitted && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
            <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">📊</div>
            <h2 className="text-2xl font-black text-white mb-2">Your Results Are Ready!</h2>
            <p className="text-gray-400 mb-8">Enter your email to unlock your full score and analysis</p>
            <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-white text-center mb-4 outline-none transition-all" />
            <button
              onClick={async () => {
                if (email) {
                  try { await axios.post(`${API}/save-email`, { email }); } catch {}
                  setEmailSubmitted(true);
                  localStorage.setItem("resumelens_email_submitted", "true");
                }
              }}
              disabled={!email}
              className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-white py-3 rounded-xl font-bold transition-all">
              See My Results →
            </button>
            <p className="text-gray-600 text-xs mt-3">No spam. Unsubscribe anytime.</p>
          </div>
        )}

        {/* ── RESULTS ── */}
        {result && emailSubmitted && (
          <div className="space-y-4">

            {/* Score Hero */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-4">Overall Score</p>
              <div className={`text-8xl font-black ${scoreColor(result.overall_score)}`}>
                {result.overall_score}<span className="text-3xl text-gray-600">/100</span>
              </div>
              <p className="text-gray-400 mt-4 max-w-lg mx-auto leading-relaxed">{result.summary}</p>
              <div className="flex justify-center gap-3 mt-5 flex-wrap">
                {result.interview_probability && (
                  <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-sm font-medium">
                    🎯 Interview: {result.interview_probability}
                  </span>
                )}
                {result.ats_score && (
                  <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm font-medium">
                    🤖 ATS: {result.ats_score}/100
                  </span>
                )}
                {targetCompany && <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-sm font-medium">🏢 {targetCompany}</span>}
                {industry && <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium">💼 {industry}</span>}
              </div>
            </div>

            {/* Job Match */}
            {result.job_match_score && jobDescription && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="font-bold text-white text-base mb-4">🎯 Job Description Match</h2>
                <div className="flex items-center gap-4 mb-3">
                  <div className={`text-5xl font-black ${scoreColor(result.job_match_score)}`}>{result.job_match_score}%</div>
                  <p className="text-gray-400 text-sm">{result.job_match_feedback}</p>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div className={`h-2 rounded-full ${scoreBarColor(result.job_match_score)}`} style={{ width: `${result.job_match_score}%` }} />
                </div>
              </div>
            )}

            {/* Section Scores */}
            {result.section_scores && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="font-bold text-white text-base mb-5">📊 Section Scores</h2>
                <div className="space-y-4">
                  {Object.entries(result.section_scores).map(([key, val]: any) => (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400 capitalize">{key.replace(/_/g, " ")}</span>
                        <span className={`font-bold ${scoreColor(val)}`}>{val}/100</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${scoreBarColor(val)}`} style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="font-bold text-white text-base mb-4">💪 Top Strengths</h2>
              <div className="space-y-2">
                {result.top_strengths?.map((s: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-4 py-3">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span className="text-gray-300 text-sm">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Improvements */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="font-bold text-white text-base mb-4">🚨 Critical Improvements</h2>
              {result.critical_improvements?.slice(0, 1).map((item: any, i: number) => (
                <div key={i} className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{item.priority}</span>
                    <span className="text-red-400 font-semibold text-sm">{item.section}</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{item.issue}</p>
                  {premium && (
                    <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 mt-2">
                      <p className="text-xs text-gray-500 font-medium mb-1">✏️ How to fix:</p>
                      <p className="text-gray-300 text-sm">{item.fix}</p>
                    </div>
                  )}
                </div>
              ))}
              {!premium && result.critical_improvements?.length > 1 && (
                <div className="relative">
                  <div className="blur-sm pointer-events-none space-y-3">
                    {result.critical_improvements?.slice(1).map((_: any, i: number) => (
                      <div key={i} className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">HIGH</span>
                          <span className="text-red-400 font-semibold text-sm">Hidden Issue</span>
                        </div>
                        <p className="text-gray-400 text-sm">This critical issue is hidden...</p>
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-xl p-5 text-center">
                      <p className="text-xl mb-1">🔒</p>
                      <p className="font-bold text-white">{Math.max(0, (result.critical_improvements?.length || 0) - 1)} more issues found</p>
                      <p className="text-gray-500 text-sm mt-1 mb-3">Unlock all fixes for $3.99</p>
                      <button onClick={handleCheckout} className="bg-indigo-500 hover:bg-indigo-400 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all">
                        Unlock Full Report — $3.99 →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Keywords */}
            {!premium ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
                <h2 className="font-bold text-white text-base mb-4">🔑 Keyword Analysis</h2>
                <div className="blur-sm pointer-events-none flex flex-wrap gap-2">
                  {["React", "Python", "SQL", "Leadership", "Agile"].map((k) => (
                    <span key={k} className="bg-gray-800 border border-gray-700 px-3 py-1 rounded-full text-sm text-gray-400">{k}</span>
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <button onClick={handleCheckout} className="bg-amber-500 hover:bg-amber-400 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all">
                    🔒 Unlock Keywords — $3.99 →
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="font-bold text-white text-base mb-4">🔑 Keyword Analysis</h2>
                <div className="mb-4">
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-2">✓ Strong Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {result.keyword_analysis?.strong_keywords?.map((k: string) => (
                      <span key={k} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm">{k}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">✗ Missing Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {result.keyword_analysis?.missing_keywords?.map((k: string) => (
                      <span key={k} className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">{k}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bullet Rewrite */}
            {premium && result.bullet_point_analysis && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="font-bold text-white text-base mb-4">✏️ Bullet Point Rewrite</h2>
                <p className="text-gray-500 text-sm mb-4">{result.bullet_point_analysis.feedback}</p>
                <div className="space-y-3">
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                    <p className="text-xs font-bold text-red-400 mb-2">✗ WEAK</p>
                    <p className="text-gray-400 text-sm">{result.bullet_point_analysis.weak_bullet}</p>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-xs font-bold text-emerald-400 mb-2">✓ IMPROVED</p>
                    <p className="text-gray-300 text-sm">{result.bullet_point_analysis.improved_bullet}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── AI RESUME REWRITER ── */}
            {premium && (
              <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <h2 className="font-black text-white text-lg">AI Resume Rewriter</h2>
                    <p className="text-indigo-300 text-xs font-medium">Included with your Full Report</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-5">Rewrites your entire resume — stronger bullets, better keywords, clean formatting — ready to download as PDF.</p>

                {!rewriteResult && !rewriting && (
                  <>
                    {!fileRef.current && <ReUploadBlock inputId="rewriteFileInput" label="the rewriter" />}
                    <button onClick={handleRewrite} className="w-full bg-indigo-500 hover:bg-indigo-400 text-white py-3.5 rounded-xl font-bold text-base transition-all">
                      ✨ Rewrite My Resume with AI →
                    </button>
                    {rewriteError && <p className="text-red-400 text-sm mt-3 text-center">{rewriteError}</p>}
                  </>
                )}

                {rewriting && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center gap-3 text-indigo-400">
                      <Spinner />
                      <span className="font-semibold">Rewriting your resume… ~20 seconds</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">AI is optimizing every bullet point and section</p>
                  </div>
                )}

                {rewriteResult && (
                  <div className="space-y-4">
                    {rewriteResult.changes_made?.length > 0 && (
                      <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-4">
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-3">✓ Changes Made</p>
                        <ul className="space-y-1.5">
                          {rewriteResult.changes_made.map((change: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                              <span className="text-emerald-400 mt-0.5 shrink-0">•</span>{change}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {rewriteResult.keywords_added?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide mb-2">Keywords Added</p>
                        <div className="flex flex-wrap gap-2">
                          {rewriteResult.keywords_added.map((k: string) => (
                            <span key={k} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-xs font-semibold">{k}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="bg-gray-950 border border-gray-700 rounded-xl p-4 max-h-64 overflow-y-auto">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Preview</p>
                      <pre className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap font-mono">
                        {rewriteResult.rewritten_resume?.slice(0, 800)}{rewriteResult.rewritten_resume?.length > 800 ? "\n…" : ""}
                      </pre>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleDownloadResumePDF}
                        className="flex-1 bg-indigo-500 hover:bg-indigo-400 text-white py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                        📥 Download as PDF
                      </button>
                      <button onClick={handleDownloadTxt}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                        📄 Download as .txt
                      </button>
                    </div>
                    <p className="text-gray-600 text-xs text-center">PDF opens a print dialog — choose "Save as PDF" in your browser</p>
                    <button onClick={() => { setRewriteResult(null); localStorage.removeItem("resumelens_rewrite"); }}
                      className="w-full text-xs text-gray-600 hover:text-gray-400 underline text-center py-1 transition-all">
                      ↺ Generate a new rewrite
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── COVER LETTER GENERATOR ── */}
            {premium && (
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">✉️</span>
                  <div>
                    <h2 className="font-black text-white text-lg">AI Cover Letter Generator</h2>
                    <p className="text-emerald-300 text-xs font-medium">Included with your Full Report</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-5">
                  Generates a tailored, interview-winning cover letter based on your resume
                  {jobDescription ? " and the job description you provided" : ""}.
                </p>

                {!clResult && !clLoading && (
                  <>
                    {!fileRef.current && <ReUploadBlock inputId="clFileInput" label="the cover letter generator" />}

                    {/* Tone selector */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tone</p>
                      <div className="grid grid-cols-3 gap-2">
                        {(["professional", "conversational", "bold"] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setClTone(t)}
                            className={`py-2 rounded-lg text-sm font-semibold border transition-all capitalize ${
                              clTone === t
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "bg-gray-800 border-gray-700 text-gray-400 hover:border-emerald-500/50"
                            }`}
                          >
                            {t === "professional" ? "🎩 Professional" : t === "conversational" ? "💬 Conversational" : "⚡ Bold"}
                          </button>
                        ))}
                      </div>
                      <p className="text-gray-600 text-xs mt-2">
                        {clTone === "professional" && "Formal, polished — ideal for corporate roles"}
                        {clTone === "conversational" && "Warm and human — great for startups and creative roles"}
                        {clTone === "bold" && "Punchy and memorable — stands out from 500 other applicants"}
                      </p>
                    </div>

                    {/* Optional hiring manager name */}
                    <input
                      type="text"
                      placeholder="👤 Hiring manager name (optional, e.g. Sarah Johnson)"
                      value={clHiringManager}
                      onChange={(e) => setClHiringManager(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-white mb-4 outline-none transition-all text-sm"
                    />

                    <button onClick={handleCoverLetter}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-3.5 rounded-xl font-bold text-base transition-all">
                      ✉️ Generate My Cover Letter →
                    </button>
                    {clError && <p className="text-red-400 text-sm mt-3 text-center">{clError}</p>}
                  </>
                )}

                {clLoading && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center gap-3 text-emerald-400">
                      <Spinner />
                      <span className="font-semibold">Writing your cover letter… ~15 seconds</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">AI is tailoring every paragraph to your experience</p>
                  </div>
                )}

                {clResult && (
                  <div className="space-y-4">
                    {/* Subject line */}
                    {clResult.subject_line && (
                      <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-4">
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-1">📧 Suggested Email Subject</p>
                        <p className="text-white text-sm font-semibold">{clResult.subject_line}</p>
                      </div>
                    )}

                    {/* Key points */}
                    {clResult.key_points?.length > 0 && (
                      <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-4">
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-3">✓ How It Was Tailored</p>
                        <ul className="space-y-1.5">
                          {clResult.key_points.map((pt: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                              <span className="text-emerald-400 mt-0.5 shrink-0">•</span>{pt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Cover letter text */}
                    <div className="bg-gray-950 border border-gray-700 rounded-xl p-5">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Cover Letter</p>
                      <pre className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                        {clResult.cover_letter}
                      </pre>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <button onClick={handleCopyCL}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                          clCopied ? "bg-emerald-600 text-white" : "bg-emerald-500 hover:bg-emerald-400 text-white"
                        }`}>
                        {clCopied ? "✓ Copied!" : "📋 Copy to Clipboard"}
                      </button>
                      <button onClick={handleDownloadCLPDF}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                        📥 Download as PDF
                      </button>
                    </div>
                    <p className="text-gray-600 text-xs text-center">PDF opens a print dialog — choose "Save as PDF" in your browser</p>

                    <button onClick={() => { setClResult(null); localStorage.removeItem("resumelens_coverletter"); }}
                      className="w-full text-xs text-gray-600 hover:text-gray-400 underline text-center py-1 transition-all">
                      ↺ Generate a new cover letter
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Job Board Links */}
            {result.target_roles && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="font-bold text-white text-base mb-2">🔎 Find Matching Jobs</h2>
                <p className="text-gray-500 text-sm mb-4">Based on your profile, apply to these roles now:</p>
                <div className="space-y-3">
                  {getJobLinks(result.target_roles)?.map((item: any, i: number) => (
                    <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                      <p className="text-white font-semibold text-sm mb-3">{item.role}</p>
                      <div className="flex flex-wrap gap-2">
                        <a href={item.indeed} target="_blank" rel="noopener noreferrer" className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-500/20 transition-all">Indeed →</a>
                        <a href={item.linkedin} target="_blank" rel="noopener noreferrer" className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-500/20 transition-all">LinkedIn →</a>
                        <a href={item.ziprecruiter} target="_blank" rel="noopener noreferrer" className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-500/20 transition-all">ZipRecruiter →</a>
                        <a href={item.glassdoor} target="_blank" rel="noopener noreferrer" className="bg-pink-500/10 border border-pink-500/20 text-pink-400 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-pink-500/20 transition-all">Glassdoor →</a>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-gray-600 text-xs mt-3 text-center">Clicking these links helps support ResumeLens for free 💙</p>
              </div>
            )}

            {/* Target Roles */}
            {result.target_roles && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="font-bold text-white text-base mb-4">🎯 Best Fit Roles</h2>
                <div className="flex flex-wrap gap-2">
                  {result.target_roles?.map((r: string, i: number) => (
                    <span key={i} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-4 py-2 rounded-full text-sm font-semibold">{r}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Free CTA */}
            {!premium && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-8 text-center">
                <p className="text-2xl font-black text-white mb-2">🚀 Get Your Full Expert Report</p>
                <p className="text-gray-400 mb-2">Unlock all critical fixes, keyword analysis, bullet rewrites, and ATS optimization</p>
                <p className="text-indigo-400 text-sm font-semibold mb-6">✨ Plus: AI resume rewrite + AI cover letter + PDF downloads</p>
                <button onClick={handleCheckout} className="bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-4 rounded-xl font-black text-lg transition-all">
                  Unlock Full Report — $3.99
                </button>
                <p className="text-gray-600 text-xs mt-3">One-time payment • Instant access • Everything included</p>
              </div>
            )}

            <button onClick={handleGoHome} className="w-full text-sm text-gray-600 hover:text-gray-400 underline text-center py-2 transition-all">
              ← Analyze another resume
            </button>
          </div>
        )}
      </div>

      <footer className="border-t border-gray-800 py-8 mt-16">
        <div className="max-w-3xl mx-auto px-4 flex justify-between items-center">
          <button onClick={handleGoHome} className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
            <ResumeLensLogo size={24} />
            <span className="text-gray-500 text-sm">ResumeLens</span>
          </button>
          <p className="text-gray-600 text-xs">© 2026 ResumeLens. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}