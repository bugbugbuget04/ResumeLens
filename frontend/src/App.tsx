import { useState } from "react";
import axios from "axios";

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

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("industry", industry);
    formData.append("job_description", jobDescription);
    formData.append("target_company", targetCompany);
    try {
      const res = await axios.post("http://localhost:8000/analyze", formData);
      setResult(res.data);
    } catch (err) {
      alert("Something went wrong. Make sure your backend is running!");
    }
    setLoading(false);
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-red-400";
  };

  const scoreBarColor = (score: number) => {
    if (score >= 80) return "bg-emerald-400";
    if (score >= 60) return "bg-amber-400";
    return "bg-red-400";
  };

  const getJobLinks = (roles: string[]) => {
    return roles?.map((role) => ({
      role,
      indeed: `https://www.indeed.com/jobs?q=${encodeURIComponent(role)}&l=United+States`,
      linkedin: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(role)}&location=United%20States`,
      ziprecruiter: `https://www.ziprecruiter.com/jobs-search?search=${encodeURIComponent(role)}&location=United+States`,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-black text-sm">RL</div>
          <span className="text-lg font-bold text-white">ResumeLens</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm hidden md:block">Trusted by 10,000+ job seekers</span>
          <button className="bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">
            Get Full Report — $4.99
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">

        {!result && (
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-indigo-400 text-sm font-medium mb-6">
              ✨ AI-Powered Resume Analysis
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
              Is Your Resume<br />
              <span className="text-indigo-400">Getting You Hired?</span>
            </h1>
            <p className="text-gray-400 text-xl mb-3">
              Get an expert AI score in 30 seconds — completely free
            </p>
            <div className="flex justify-center gap-6 text-sm text-gray-500">
              <span>✓ ATS Analysis</span>
              <span>✓ Expert Feedback</span>
              <span>✓ US Job Market</span>
            </div>
          </div>
        )}

        {!result && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <div
              className="border-2 border-dashed border-gray-700 hover:border-indigo-500 rounded-xl p-12 mb-6 text-center cursor-pointer transition-all"
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <div className="text-5xl mb-4">📄</div>
              <p className="text-white font-semibold text-lg">Drop your resume here</p>
              <p className="text-gray-500 text-sm mt-1">PDF files only</p>
              <input
                id="fileInput"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            {file && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2 mb-4">
                <span className="text-emerald-400">✓</span>
                <span className="text-emerald-400 text-sm font-medium">{file.name} ready</span>
              </div>
            )}

            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-white mb-3 outline-none transition-all"
            >
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

            <input
              type="text"
              placeholder="🏢 Target company e.g. Google, Amazon (optional)"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-white mb-3 outline-none transition-all"
            />

            <textarea
              placeholder="📋 Paste the job description here for better matching (optional)"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-white mb-4 outline-none transition-all resize-none"
            />

            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-white py-4 rounded-xl font-bold text-lg transition-all"
            >
              {loading ? "⏳ Analyzing your resume..." : "Analyze My Resume — It's Free →"}
            </button>
            <p className="text-center text-gray-600 text-xs mt-3">🔒 Your resume is never stored</p>
          </div>
        )}

        {!result && (
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
        )}

        {result && !emailSubmitted && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
            <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">📊</div>
            <h2 className="text-2xl font-black text-white mb-2">Your Results Are Ready!</h2>
            <p className="text-gray-400 mb-8">Enter your email to unlock your full score and analysis</p>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-white text-center mb-4 outline-none transition-all"
            />
            <button
              onClick={async () => {
                if (email) {
                  try {
                    await axios.post("http://localhost:8000/save-email", { email });
                  } catch (err) {
                    console.log("Email save failed silently");
                  }
                  setEmailSubmitted(true);
                }
              }}
              disabled={!email}
              className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-white py-3 rounded-xl font-bold transition-all"
            >
              See My Results →
            </button>
            <p className="text-gray-600 text-xs mt-3">No spam. Unsubscribe anytime.</p>
          </div>
        )}

        {result && emailSubmitted && (
          <div className="space-y-4">

            {/* Score Hero */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-4">Overall Score</p>
              <div className={`text-8xl font-black ${scoreColor(result.overall_score)}`}>
                {result.overall_score}
                <span className="text-3xl text-gray-600">/100</span>
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
                {targetCompany && (
                  <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-sm font-medium">
                    🏢 {targetCompany}
                  </span>
                )}
                {industry && (
                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium">
                    💼 {industry}
                  </span>
                )}
              </div>
            </div>

            {/* Job Match Score */}
            {result.job_match_score && jobDescription && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="font-bold text-white text-base mb-4">🎯 Job Description Match</h2>
                <div className="flex items-center gap-4 mb-3">
                  <div className={`text-5xl font-black ${scoreColor(result.job_match_score)}`}>
                    {result.job_match_score}%
                  </div>
                  <p className="text-gray-400 text-sm">{result.job_match_feedback}</p>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div className={`h-2 rounded-full ${scoreBarColor(result.job_match_score)} transition-all`} style={{ width: `${result.job_match_score}%` }} />
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
                        <div className={`h-1.5 rounded-full ${scoreBarColor(val)} transition-all`} style={{ width: `${val}%` }} />
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
                      <p className="text-gray-500 text-sm mt-1 mb-3">Unlock all fixes for $4.99</p>
                      <button onClick={() => setPremium(true)} className="bg-indigo-500 hover:bg-indigo-400 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all">
                        Unlock Full Report →
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
                  <button onClick={() => setPremium(true)} className="bg-amber-500 hover:bg-amber-400 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all">
                    🔒 Unlock Keywords →
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
                        <a href={item.indeed} target="_blank" rel="noopener noreferrer"
                          className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-500/20 transition-all">
                          Indeed →
                        </a>
                        <a href={item.linkedin} target="_blank" rel="noopener noreferrer"
                          className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-500/20 transition-all">
                          LinkedIn →
                        </a>
                        <a href={item.ziprecruiter} target="_blank" rel="noopener noreferrer"
                          className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-500/20 transition-all">
                          ZipRecruiter →
                        </a>
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

            {/* CTA */}
            {!premium && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-8 text-center">
                <p className="text-2xl font-black text-white mb-2">🚀 Get Your Full Expert Report</p>
                <p className="text-gray-400 mb-6">Unlock all critical fixes, keyword analysis, bullet rewrites, and ATS optimization</p>
                <button onClick={() => setPremium(true)} className="bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-4 rounded-xl font-black text-lg transition-all">
                  Unlock Full Report — $4.99
                </button>
                <p className="text-gray-600 text-xs mt-3">One-time payment • Instant access</p>
              </div>
            )}

            <button
              onClick={() => { setResult(null); setFile(null); setPremium(false); setEmailSubmitted(false); setIndustry(""); setJobDescription(""); setTargetCompany(""); }}
              className="w-full text-sm text-gray-600 hover:text-gray-400 underline text-center py-2 transition-all"
            >
              ← Analyze another resume
            </button>
          </div>
        )}
      </div>

      <footer className="border-t border-gray-800 py-8 mt-16">
        <div className="max-w-3xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-500 rounded-md flex items-center justify-center font-black text-xs">RL</div>
            <span className="text-gray-500 text-sm">ResumeLens</span>
          </div>
          <p className="text-gray-600 text-xs">© 2026 ResumeLens. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}