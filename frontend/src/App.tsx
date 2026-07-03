import { useState, useEffect, useRef } from "react";
import type { RefObject } from "react";
import axios from "axios";
import Builder from "./Builder";
import Legal from "./Legal";

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

// Playful hand-drawn doodles scattered in the background
function Doodles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }} aria-hidden="true">

      {/* ── Statue of Liberty (NYC) — teal/green — top left ── */}
      <svg className="absolute top-20 left-6 doodle-float-slow hidden md:block" width="70" height="150" viewBox="0 0 70 150" fill="none" opacity="0.8">
        {/* torch arm */}
        <line x1="42" y1="40" x2="52" y2="14" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M50 14 Q 52 6, 54 14 Q 56 8, 52 4 Q 48 8, 50 14 Z" fill="#fbbf24" stroke="#0d9488" strokeWidth="1.5" />
        {/* head + crown */}
        <circle cx="35" cy="34" r="7" fill="#5eead4" stroke="#0d9488" strokeWidth="2" />
        <path d="M28 30 L26 24 M31 28 L30 21 M35 27 L35 20 M39 28 L40 21 M42 30 L44 24" stroke="#0d9488" strokeWidth="1.8" strokeLinecap="round" />
        {/* robe body */}
        <path d="M35 41 Q 26 50, 24 78 Q 23 95, 28 110 L 42 110 Q 47 95, 46 78 Q 44 50, 35 41 Z" fill="#5eead4" stroke="#0d9488" strokeWidth="2" />
        <line x1="30" y1="60" x2="40" y2="62" stroke="#0d9488" strokeWidth="1" opacity="0.6" />
        <line x1="29" y1="72" x2="41" y2="74" stroke="#0d9488" strokeWidth="1" opacity="0.6" />
        {/* tablet */}
        <rect x="40" y="58" width="12" height="16" rx="1" fill="#99f6e4" stroke="#0d9488" strokeWidth="1.8" transform="rotate(18 46 66)" />
        {/* pedestal */}
        <rect x="22" y="110" width="26" height="14" fill="#99f6e4" stroke="#0d9488" strokeWidth="2" />
        <rect x="18" y="124" width="34" height="10" fill="#5eead4" stroke="#0d9488" strokeWidth="2" />
      </svg>

      {/* ── Golden Gate Bridge (SF) — international orange — top right ── */}
      <svg className="absolute top-24 right-8 doodle-float hidden md:block" width="170" height="90" viewBox="0 0 170 90" fill="none" opacity="0.8">
        <line x1="5" y1="80" x2="165" y2="80" stroke="#c1440e" strokeWidth="2.5" />
        {/* towers */}
        <line x1="45" y1="80" x2="45" y2="12" stroke="#c1440e" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="125" y1="80" x2="125" y2="12" stroke="#c1440e" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="40" y1="22" x2="50" y2="22" stroke="#c1440e" strokeWidth="2.5" />
        <line x1="120" y1="22" x2="130" y2="22" stroke="#c1440e" strokeWidth="2.5" />
        {/* main suspension cables */}
        <path d="M5 50 Q 45 14, 85 46 Q 125 14, 165 50" stroke="#e8590c" strokeWidth="2.5" fill="none" />
        {/* vertical suspenders */}
        <line x1="20" y1="40" x2="20" y2="80" stroke="#e8590c" strokeWidth="1" opacity="0.6" />
        <line x1="65" y1="36" x2="65" y2="80" stroke="#e8590c" strokeWidth="1" opacity="0.6" />
        <line x1="105" y1="36" x2="105" y2="80" stroke="#e8590c" strokeWidth="1" opacity="0.6" />
        <line x1="150" y1="40" x2="150" y2="80" stroke="#e8590c" strokeWidth="1" opacity="0.6" />
      </svg>

      {/* ── Empire State Building (NYC) — amber — left mid ── */}
      <svg className="absolute top-[42%] left-4 doodle-float hidden lg:block" width="60" height="160" viewBox="0 0 60 160" fill="none" opacity="0.75">
        <line x1="30" y1="4" x2="30" y2="22" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
        <rect x="26" y="22" width="8" height="20" fill="#fcd34d" stroke="#d97706" strokeWidth="1.5" />
        <rect x="20" y="42" width="20" height="30" fill="#fde68a" stroke="#d97706" strokeWidth="1.8" />
        <rect x="14" y="72" width="32" height="80" fill="#fcd34d" stroke="#d97706" strokeWidth="2" />
        {/* windows */}
        <line x1="22" y1="84" x2="38" y2="84" stroke="#d97706" strokeWidth="0.8" opacity="0.5" />
        <line x1="22" y1="98" x2="38" y2="98" stroke="#d97706" strokeWidth="0.8" opacity="0.5" />
        <line x1="22" y1="112" x2="38" y2="112" stroke="#d97706" strokeWidth="0.8" opacity="0.5" />
        <line x1="22" y1="126" x2="38" y2="126" stroke="#d97706" strokeWidth="0.8" opacity="0.5" />
        <line x1="30" y1="72" x2="30" y2="152" stroke="#d97706" strokeWidth="0.8" opacity="0.5" />
      </svg>

      {/* ── Space Needle (Seattle) — slate blue — right mid ── */}
      <svg className="absolute top-[46%] right-6 doodle-float-slow hidden lg:block" width="80" height="160" viewBox="0 0 80 160" fill="none" opacity="0.8">
        <line x1="40" y1="2" x2="40" y2="18" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
        {/* saucer */}
        <ellipse cx="40" cy="30" rx="26" ry="9" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
        <path d="M18 26 Q 40 40, 62 26" stroke="#475569" strokeWidth="1.5" fill="none" />
        {/* legs */}
        <path d="M34 38 Q 30 90, 24 150" stroke="#475569" strokeWidth="2.5" fill="none" />
        <path d="M46 38 Q 50 90, 56 150" stroke="#475569" strokeWidth="2.5" fill="none" />
        <path d="M40 38 L 40 150" stroke="#475569" strokeWidth="1.5" opacity="0.5" />
        <path d="M30 100 Q 40 108, 50 100" stroke="#475569" strokeWidth="1.5" fill="none" />
        <line x1="22" y1="150" x2="58" y2="150" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      {/* ── US Capitol (DC) — warm stone — bottom left ── */}
      <svg className="absolute bottom-24 left-8 doodle-float hidden md:block" width="130" height="90" viewBox="0 0 130 90" fill="none" opacity="0.8">
        {/* dome */}
        <path d="M50 38 Q 65 6, 80 38 Z" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="2" />
        <line x1="65" y1="4" x2="65" y2="38" stroke="#a8a29e" strokeWidth="1" opacity="0.5" />
        <circle cx="65" cy="6" r="2" fill="#a8a29e" />
        <rect x="55" y="38" width="20" height="8" fill="#d6d3d1" stroke="#a8a29e" strokeWidth="1.5" />
        {/* main building */}
        <rect x="20" y="46" width="90" height="32" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="2" />
        {/* columns */}
        <line x1="30" y1="50" x2="30" y2="74" stroke="#a8a29e" strokeWidth="1.5" />
        <line x1="40" y1="50" x2="40" y2="74" stroke="#a8a29e" strokeWidth="1.5" />
        <line x1="90" y1="50" x2="90" y2="74" stroke="#a8a29e" strokeWidth="1.5" />
        <line x1="100" y1="50" x2="100" y2="74" stroke="#a8a29e" strokeWidth="1.5" />
        <line x1="14" y1="78" x2="116" y2="78" stroke="#a8a29e" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      {/* ── Gateway Arch (St. Louis) — silver/grey — bottom center ── */}
      <svg className="absolute bottom-1/4 left-1/2 doodle-float-slow hidden lg:block" width="90" height="100" viewBox="0 0 90 100" fill="none" opacity="0.7">
        <path d="M10 95 Q 45 0, 80 95" stroke="#94a3b8" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M20 95 Q 45 18, 70 95" stroke="#cbd5e1" strokeWidth="2" fill="none" opacity="0.7" />
      </svg>

      {/* ── Bass Pro Pyramid (Memphis) — deep green — bottom right ── */}
      <svg className="absolute bottom-28 right-10 doodle-float hidden lg:block" width="110" height="100" viewBox="0 0 110 100" fill="none" opacity="0.75">
        <path d="M55 8 L 100 90 L 10 90 Z" fill="#bbf7d0" stroke="#15803d" strokeWidth="2.5" strokeLinejoin="round" />
        {/* cross hatch panels */}
        <path d="M55 8 L 55 90 M30 49 L 80 49 M20 70 L 90 70" stroke="#15803d" strokeWidth="1" opacity="0.5" />
        <path d="M55 8 L 32 50 L 18 84 M55 8 L 78 50 L 92 84" stroke="#15803d" strokeWidth="1" opacity="0.45" />
      </svg>

      {/* ── A couple of subtle accent doodles to fill gaps ── */}
      <svg className="absolute top-1/3 left-1/3 doodle-spin-slow hidden lg:block" width="26" height="26" viewBox="0 0 26 26" fill="none">
        <path d="M13 3 L15 11 L23 13 L15 15 L13 23 L11 15 L3 13 L11 11 Z" fill="#fbbf24" opacity="0.5" />
      </svg>
      <svg className="absolute bottom-1/3 right-1/3 doodle-float hidden lg:block" width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="6" stroke="#3b82f6" strokeWidth="2.5" fill="none" opacity="0.45" />
      </svg>
    </div>
  );
}

export default function App() {
  const [isBuilderPath] = useState(
    () => typeof window !== "undefined" && window.location.pathname.replace(/\/$/, "") === "/build"
  );
  const [isLegalPath] = useState(
    () => typeof window !== "undefined" && ["/legal", "/terms", "/privacy"].includes(window.location.pathname.replace(/\/$/, ""))
  );

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [premium, setPremium] = useState(false);
  const [licenseKey, setLicenseKey] = useState("");
  const [licenseError, setLicenseError] = useState("");
  const [verifying, setVerifying] = useState(false);
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
  // reuploadCount forces a re-render when a file is re-uploaded so the UI updates
  const [reuploadCount, setReuploadCount] = useState(0);
  void reuploadCount;

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
      // Every visitor lands on the fresh upload page (no saved analysis restored).
      // Premium is only restored if it was unlocked via a VERIFIED license key
      // (stored after server-side verification), so it can't be faked with a URL.
      const savedPremium = localStorage.getItem("resumelens_premium");
      if (savedPremium === "true") setPremium(true);
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
    window.location.href = CHECKOUT_URL;
  };

  const verifyLicense = async () => {
    if (!licenseKey.trim()) { setLicenseError("Please enter your license key."); return; }
    setVerifying(true);
    setLicenseError("");
    try {
      const res = await axios.post(`${API}/verify-license`, { license_key: licenseKey.trim() });
      if (res.data?.valid) {
        setPremium(true);
        localStorage.setItem("resumelens_premium", "true");
        setLicenseError("");
      } else {
        setLicenseError(res.data?.error || "That license key isn't valid.");
      }
    } catch {
      setLicenseError("Couldn't verify right now — please try again in a moment.");
    }
    setVerifying(false);
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
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Cover Letter — ResumeLenz</title><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='2' width='18' height='22' rx='2' fill='none' stroke='%23eab308' stroke-width='1.5'/%3E%3Ccircle cx='22' cy='22' r='6' fill='%231c1917' stroke='%23facc15' stroke-width='2'/%3E%3Cline x1='26.5' y1='26.5' x2='30' y2='30' stroke='%23facc15' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E"/>
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
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Resume — ResumeLenz</title><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='2' width='18' height='22' rx='2' fill='none' stroke='%23eab308' stroke-width='1.5'/%3E%3Ccircle cx='22' cy='22' r='6' fill='%231c1917' stroke='%23facc15' stroke-width='2'/%3E%3Cline x1='26.5' y1='26.5' x2='30' y2='30' stroke='%23facc15' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E"/>
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

  const ReUploadBlock = ({ inputRef, onFile }: { inputRef: RefObject<HTMLInputElement | null>; onFile: (f: File) => void }) => (
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

  // Render the Resume Builder page at /build (after all hooks are declared)
  if (isBuilderPath) return <Builder />;
  if (isLegalPath) return <Legal />;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 relative">
      <Doodles />
      <nav className="relative z-10 border-b border-stone-200 bg-white px-6 py-4 flex justify-between items-center">
        <button onClick={handleGoHome} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer">
          <ResumeLensLogo size={32} />
          <span className="text-lg font-bold text-stone-900">ResumeLens</span>
        </button>
        <div className="flex items-center gap-4">
          <a href="/build" className="text-stone-600 hover:text-stone-900 text-sm font-semibold transition-all hidden sm:block">📝 Build Resume</a>
          <span className="text-stone-500 text-sm hidden md:block">Free AI resume analysis in 30 seconds</span>
          <button onClick={handleCheckout} className="bg-yellow-400 hover:bg-yellow-500 text-stone-900 px-4 py-2 rounded-lg text-sm font-semibold transition-all">
            Get Full Report — $3.99
          </button>
        </div>
      </nav>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">

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

                <optgroup label="Technology & Software">
                  <option value="software-engineering">Software Engineering</option>
                  <option value="frontend-dev">Frontend Development</option>
                  <option value="backend-dev">Backend Development</option>
                  <option value="fullstack-dev">Full-Stack Development</option>
                  <option value="mobile-dev">Mobile Development (iOS/Android)</option>
                  <option value="data-science">Data Science</option>
                  <option value="machine-learning">Machine Learning / AI</option>
                  <option value="data-engineering">Data Engineering</option>
                  <option value="data-analytics">Data / Business Analytics</option>
                  <option value="devops-cloud">DevOps / Cloud / Infrastructure</option>
                  <option value="cybersecurity">Cybersecurity</option>
                  <option value="qa-testing">QA / Test Engineering</option>
                  <option value="it-support">IT Support / SysAdmin</option>
                  <option value="network-engineering">Network Engineering</option>
                  <option value="database-admin">Database Administration</option>
                  <option value="product-management">Product Management</option>
                  <option value="ux-ui-design">UX / UI Design</option>
                  <option value="game-dev">Game Development</option>
                  <option value="blockchain">Blockchain / Web3</option>
                </optgroup>

                <optgroup label="Sales">
                  <option value="inside-sales">Inside Sales</option>
                  <option value="outside-field-sales">Outside / Field Sales</option>
                  <option value="account-executive">Account Executive</option>
                  <option value="account-management">Account Management</option>
                  <option value="sales-development-sdr">Sales Development (SDR/BDR)</option>
                  <option value="business-development">Business Development</option>
                  <option value="sales-engineering">Sales Engineering</option>
                  <option value="retail-sales">Retail Sales</option>
                  <option value="channel-partnerships">Channel / Partnerships</option>
                  <option value="sales-management">Sales Management</option>
                </optgroup>

                <optgroup label="Management & Business">
                  <option value="general-management">General Management</option>
                  <option value="operations-management">Operations Management</option>
                  <option value="project-management">Project Management</option>
                  <option value="program-management">Program Management</option>
                  <option value="product-ops">Product Operations</option>
                  <option value="strategy">Strategy / Corporate Development</option>
                  <option value="management-consulting">Management Consulting</option>
                  <option value="supply-chain">Supply Chain / Logistics</option>
                  <option value="procurement">Procurement / Purchasing</option>
                  <option value="business-analyst">Business Analyst</option>
                  <option value="entrepreneurship">Entrepreneurship / Founder</option>
                </optgroup>

                <optgroup label="Finance & Accounting">
                  <option value="investment-banking">Investment Banking</option>
                  <option value="corporate-finance">Corporate Finance</option>
                  <option value="financial-analysis">Financial Analysis (FP&A)</option>
                  <option value="accounting">Accounting</option>
                  <option value="audit">Audit</option>
                  <option value="tax">Tax</option>
                  <option value="private-equity-vc">Private Equity / VC</option>
                  <option value="asset-wealth-management">Asset / Wealth Management</option>
                  <option value="risk-compliance">Risk / Compliance</option>
                  <option value="actuarial">Actuarial / Insurance</option>
                  <option value="fintech">Fintech</option>
                </optgroup>

                <optgroup label="Marketing & Communications">
                  <option value="digital-marketing">Digital Marketing</option>
                  <option value="content-marketing">Content Marketing</option>
                  <option value="seo-sem">SEO / SEM</option>
                  <option value="social-media">Social Media</option>
                  <option value="brand-marketing">Brand Marketing</option>
                  <option value="product-marketing">Product Marketing</option>
                  <option value="growth-marketing">Growth Marketing</option>
                  <option value="pr-communications">PR / Communications</option>
                  <option value="advertising">Advertising</option>
                </optgroup>

                <optgroup label="Healthcare & Medical">
                  <option value="nursing">Nursing</option>
                  <option value="physician">Physician / Doctor</option>
                  <option value="allied-health">Allied Health (PT/OT/Radiology)</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="dental">Dental</option>
                  <option value="mental-health">Mental Health / Counseling</option>
                  <option value="healthcare-admin">Healthcare Administration</option>
                  <option value="medical-research">Medical / Clinical Research</option>
                  <option value="public-health">Public Health</option>
                  <option value="biotech-pharma">Biotech / Pharmaceuticals</option>
                  <option value="medical-devices">Medical Devices</option>
                  <option value="veterinary">Veterinary</option>
                </optgroup>

                <optgroup label="Engineering">
                  <option value="mechanical-engineering">Mechanical Engineering</option>
                  <option value="electrical-engineering">Electrical Engineering</option>
                  <option value="civil-engineering">Civil Engineering</option>
                  <option value="chemical-engineering">Chemical Engineering</option>
                  <option value="aerospace-engineering">Aerospace Engineering</option>
                  <option value="industrial-engineering">Industrial / Manufacturing Engineering</option>
                  <option value="biomedical-engineering">Biomedical Engineering</option>
                  <option value="environmental-engineering">Environmental Engineering</option>
                  <option value="structural-engineering">Structural Engineering</option>
                  <option value="automotive-engineering">Automotive Engineering</option>
                  <option value="petroleum-energy">Petroleum / Energy Engineering</option>
                </optgroup>

                <optgroup label="Creative & Design">
                  <option value="graphic-design">Graphic Design</option>
                  <option value="product-industrial-design">Product / Industrial Design</option>
                  <option value="motion-video">Motion / Video / Film</option>
                  <option value="writing-editing">Writing / Editing</option>
                  <option value="photography">Photography</option>
                  <option value="art-direction">Art Direction</option>
                  <option value="architecture">Architecture</option>
                </optgroup>

                <optgroup label="Other Fields">
                  <option value="human-resources">Human Resources / Recruiting</option>
                  <option value="education">Education / Teaching</option>
                  <option value="legal">Legal</option>
                  <option value="customer-service">Customer Service / Support</option>
                  <option value="hospitality">Hospitality / Tourism</option>
                  <option value="real-estate">Real Estate</option>
                  <option value="government-nonprofit">Government / Nonprofit</option>
                  <option value="skilled-trades">Skilled Trades / Construction</option>
                  <option value="science-research">Science / Research</option>
                  <option value="logistics-transport">Logistics / Transportation</option>
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

              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Job Description <span className="text-yellow-600 normal-case font-bold">· best results</span></label>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-2">
                <p className="text-xs text-yellow-800">💡 <span className="font-semibold">Pro tip:</span> Pasting the actual job posting gives you a precise requirement-by-requirement match and far more specific feedback. It's the #1 thing that makes your analysis sharper.</p>
              </div>
              <textarea placeholder="📋 Paste the full job description here for precise matching"
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
                  <div key={item.step} className="bg-white border border-stone-200 rounded-xl p-5 text-center shadow-sm rl-card">
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

            {/* ── FUNDAMENTAL MISMATCH WARNING ── */}
            {result.fundamental_mismatch && (
              <>
                {/* Bold banner */}
                <div className="bg-red-500 text-white rounded-2xl p-5 flex items-start gap-3 shadow-lg">
                  <span className="text-2xl shrink-0">⚠️</span>
                  <div>
                    <p className="font-black text-base mb-1">Hold on — this role may not be the right fit</p>
                    <p className="text-red-50 text-sm leading-relaxed">{result.mismatch_warning}</p>
                  </div>
                </div>

                {/* Reality Check card */}
                <div className="bg-white border-2 border-red-200 rounded-2xl p-6 shadow-sm rl-card">
                  <h2 className="font-black text-stone-900 text-base mb-2 flex items-center gap-2">
                    <span>🎯</span> Reality Check
                  </h2>
                  <p className="text-stone-600 text-sm mb-4 leading-relaxed">
                    We want to be honest with you — applying to this specific role as-is is unlikely to succeed, and that's okay. Here's what this role typically requires that your resume doesn't yet show:
                  </p>
                  {result.mismatch_requirements?.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {result.mismatch_requirements.map((req: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                          <span className="text-red-500 mt-0.5 shrink-0">✗</span>
                          <span className="text-stone-700 text-sm">{req}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <p className="text-emerald-700 text-sm font-semibold mb-1">💡 The good news</p>
                    <p className="text-stone-600 text-sm leading-relaxed">
                      Your skills are valuable — they're just a better match for different roles. Scroll down to "Best Fit Roles" below to see positions that actually align with your background.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Score Hero */}
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center shadow-sm rl-card">
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
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm rl-card">
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
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm rl-card">
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

            {/* Input quality guidance — shown when input was thin */}
            {result.input_tips && result.input_tips.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-blue-900 text-sm mb-2">💡 Get an even sharper analysis</h2>
                <p className="text-blue-700 text-xs mb-3">Your results are based on what you provided. Add the following for more specific, personalized feedback:</p>
                <ul className="space-y-1.5">
                  {result.input_tips.map((tip: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-blue-800"><span className="text-blue-400 mt-0.5">→</span>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recruiter First Impression */}
            {result.recruiter_first_impression && (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm rl-card">
                <h2 className="font-bold text-stone-900 text-base mb-2">👀 Recruiter's First 6 Seconds</h2>
                <p className="text-stone-500 text-xs mb-4">What a recruiter notices when they first glance at your resume — before reading a word in detail.</p>
                <div className="bg-stone-50 border-l-4 border-yellow-400 rounded-r-xl px-4 py-3">
                  <p className="text-stone-700 text-sm whitespace-pre-line leading-relaxed">{result.recruiter_first_impression}</p>
                </div>
              </div>
            )}

            {/* Requirement Match Table */}
            {result.requirement_match && result.requirement_match.length > 0 && (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm rl-card">
                <h2 className="font-bold text-stone-900 text-base mb-2">🎯 Requirement Match</h2>
                <p className="text-stone-500 text-xs mb-4">How your resume stacks up against what this role actually requires.</p>
                <div className="space-y-1.5">
                  {result.requirement_match.map((r: any, i: number) => (
                    <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2 ${r.found ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                      <span className="text-stone-700 text-sm font-medium">{r.requirement}</span>
                      <span className={`text-sm font-bold shrink-0 ml-3 ${r.found ? "text-emerald-600" : "text-red-500"}`}>{r.found ? "✓ Found" : "✗ Missing"}</span>
                    </div>
                  ))}
                </div>
                {(() => {
                  const total = result.requirement_match.length;
                  const found = result.requirement_match.filter((r: any) => r.found).length;
                  const pct = Math.round((found / total) * 100);
                  return (
                    <div className="mt-4 text-center bg-stone-50 rounded-xl py-3">
                      <span className="text-stone-500 text-xs uppercase tracking-wide">Match Score</span>
                      <div className={`text-2xl font-black ${pct >= 70 ? "text-emerald-600" : pct >= 40 ? "text-yellow-500" : "text-red-500"}`}>{pct}%</div>
                      <span className="text-stone-400 text-xs">{found} of {total} requirements met</span>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Strengths */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm rl-card">
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
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm rl-card">
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
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm rl-card">
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

            {/* Bullet Rewrites — 1 free, rest premium */}
            {(result.bullet_rewrites?.length > 0 || result.bullet_point_analysis) && (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm rl-card">
                <h2 className="font-bold text-stone-900 text-base mb-2">✏️ Bullet Point Rewrites</h2>
                <p className="text-stone-500 text-sm mb-4">We took real bullets from your resume and made them stronger.</p>
                <div className="space-y-4">
                  {(result.bullet_rewrites && result.bullet_rewrites.length > 0
                    ? result.bullet_rewrites
                    : [{ original: result.bullet_point_analysis?.weak_bullet, rewrite: result.bullet_point_analysis?.improved_bullet }]
                  ).map((b: any, i: number) => {
                    const locked = !premium && i > 0;
                    return (
                      <div key={i} className="space-y-2">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <p className="text-xs font-bold text-red-500 mb-2">✗ BEFORE</p>
                          <p className="text-stone-600 text-sm">{b.original}</p>
                        </div>
                        <div className={`bg-emerald-50 border border-emerald-200 rounded-xl p-4 ${locked ? "relative overflow-hidden" : ""}`}>
                          <p className="text-xs font-bold text-emerald-600 mb-2">✓ AFTER</p>
                          <p className={`text-stone-700 text-sm ${locked ? "blur-sm select-none" : ""}`}>{locked ? "Unlock the full report to see this improved bullet point with metrics and impact baked in." : b.rewrite}</p>
                          {locked && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="bg-stone-900 text-white text-xs font-bold px-3 py-1.5 rounded-full">🔒 Premium</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!premium && result.bullet_rewrites?.length > 1 && (
                  <p className="text-center text-stone-400 text-xs mt-4">+ {result.bullet_rewrites.length - 1} more rewrites in the full report</p>
                )}
              </div>
            )}

            {/* Competitive Gap Analysis */}
            {result.competitive_gap && result.competitive_gap.candidates_have?.length > 0 && (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm rl-card">
                <h2 className="font-bold text-stone-900 text-base mb-2">📊 Competitive Gap</h2>
                <p className="text-stone-500 text-xs mb-4">{result.competitive_gap.intro}</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Top candidates have</p>
                    <div className="space-y-1.5">
                      {result.competitive_gap.candidates_have.map((c: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-stone-700"><span className="text-stone-400 mt-0.5">•</span>{c}</div>
                      ))}
                    </div>
                  </div>
                  {result.competitive_gap.you_are_missing?.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-2">You're missing</p>
                      <div className="space-y-1.5">
                        {result.competitive_gap.you_are_missing.map((c: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-stone-700"><span className="text-red-400 mt-0.5">✗</span>{c}</div>
                        ))}
                      </div>
                    </div>
                  )}
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
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm rl-card">
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
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm rl-card">
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

                {/* License key entry — for after they've paid */}
                <div className="mt-6 pt-6 border-t border-yellow-300/60">
                  <p className="text-stone-600 text-sm font-semibold mb-2">Already purchased? Enter your license key</p>
                  <p className="text-stone-500 text-xs mb-3">Check your email receipt from Lemon Squeezy for your license key.</p>
                  <div className="flex gap-2 max-w-md mx-auto">
                    <input
                      type="text"
                      value={licenseKey}
                      onChange={(e) => { setLicenseKey(e.target.value); setLicenseError(""); }}
                      placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                      className="flex-1 bg-white border border-stone-300 focus:border-yellow-400 rounded-lg px-3 py-2 text-stone-900 text-sm outline-none transition-all"
                    />
                    <button
                      onClick={verifyLicense}
                      disabled={verifying}
                      className="bg-stone-900 hover:bg-stone-800 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-60 whitespace-nowrap"
                    >
                      {verifying ? "Checking…" : "Unlock"}
                    </button>
                  </div>
                  {licenseError && <p className="text-red-500 text-xs mt-2">{licenseError}</p>}
                </div>
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

      <footer className="relative z-10 border-t border-stone-200 bg-white py-8 mt-16">
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <button onClick={handleGoHome} className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
            <ResumeLensLogo size={24} />
            <span className="text-stone-500 text-sm">ResumeLenz</span>
          </button>
          <div className="flex items-center gap-4">
            <a href="/terms" className="text-stone-400 hover:text-stone-700 text-xs">Terms</a>
            <a href="/privacy" className="text-stone-400 hover:text-stone-700 text-xs">Privacy</a>
            <p className="text-stone-400 text-xs">© 2026 ResumeLenz. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        /* Doodle motion */
        @keyframes doodleFloat { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-12px) rotate(4deg); } }
        @keyframes doodleFloatSlow { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-8px) rotate(-3deg); } }
        @keyframes doodleSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .doodle-float { animation: doodleFloat 6s ease-in-out infinite; }
        .doodle-float-slow { animation: doodleFloatSlow 9s ease-in-out infinite; }
        .doodle-spin { animation: doodleSpin 24s linear infinite; }
        .doodle-spin-slow { animation: doodleSpin 40s linear infinite; }

        /* Snappy tactile press on all buttons */
        button {
          transition: transform 0.08s cubic-bezier(0.4,0,0.2,1), box-shadow 0.15s ease, background-color 0.15s ease !important;
        }
        button:hover:not(:disabled) { transform: translateY(-2px); }
        button:active:not(:disabled) { transform: translateY(1px) scale(0.98); }

        /* Cards lift gently on hover */
        .rl-card { transition: transform 0.12s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s ease; }
        .rl-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px -8px rgba(0,0,0,0.12); }
      `}</style>
    </div>
  );
}