import { useState } from "react";
import axios from "axios";

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

type ExperienceEntry = {
  title: string;
  company: string;
  dates: string;
  bullets: string[];
};

type EducationEntry = {
  degree: string;
  school: string;
  dates: string;
  detail: string;
};

type ProjectEntry = {
  name: string;
  detail: string;
};

export default function Builder() {
  // Contact
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [targetRole, setTargetRole] = useState("");

  // Summary
  const [summary, setSummary] = useState("");

  // Experience
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([
    { title: "", company: "", dates: "", bullets: [""] },
  ]);

  // Education
  const [educations, setEducations] = useState<EducationEntry[]>([
    { degree: "", school: "", dates: "", detail: "" },
  ]);

  // Skills
  const [skills, setSkills] = useState("");

  // Projects
  const [projects, setProjects] = useState<ProjectEntry[]>([
    { name: "", detail: "" },
  ]);

  // AI polish loading tracking
  const [polishing, setPolishing] = useState<string>("");

  // Template + accent color
  const [template, setTemplate] = useState<"classic" | "corporate" | "tech" | "minimal" | "executive" | "creative" | "boldheader" | "sectioned" | "twotone" | "modern" | "refined" | "compact">("classic");
  const [accent, setAccent] = useState("#2563eb");

  // Bullet suggestions
  const [suggestFor, setSuggestFor] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);

  const goHome = () => { window.location.href = "/"; };

  const polish = async (text: string, fieldType: string, key: string, apply: (v: string) => void) => {
    if (!text.trim()) return;
    setPolishing(key);
    try {
      const res = await axios.post(`${API}/polish`, { text, field_type: fieldType, role: targetRole });
      if (res.data?.polished) apply(res.data.polished);
    } catch {}
    setPolishing("");
  };

  const fetchSuggestions = async (expIndex: number) => {
    const title = experiences[expIndex].title.trim();
    if (!title) { alert("Enter a job title first, then I'll suggest bullet points for it."); return; }
    setSuggestFor(expIndex);
    setSuggestLoading(true);
    setSuggestions([]);
    try {
      const res = await axios.post(`${API}/suggest-bullets`, { job_title: title });
      if (res.data?.bullets) setSuggestions(res.data.bullets);
    } catch {}
    setSuggestLoading(false);
  };

  const addSuggestionToExp = (expIndex: number, bullet: string) => {
    const copy = [...experiences];
    // fill the first empty bullet, or append a new one
    const emptyIdx = copy[expIndex].bullets.findIndex(b => !b.trim());
    if (emptyIdx >= 0) copy[expIndex].bullets[emptyIdx] = bullet;
    else copy[expIndex].bullets.push(bullet);
    setExperiences(copy);
  };

  // Experience handlers
  const updateExp = (i: number, field: keyof ExperienceEntry, value: any) => {
    const copy = [...experiences];
    (copy[i] as any)[field] = value;
    setExperiences(copy);
  };
  const updateExpBullet = (i: number, bi: number, value: string) => {
    const copy = [...experiences];
    copy[i].bullets[bi] = value;
    setExperiences(copy);
  };
  const addExpBullet = (i: number) => {
    const copy = [...experiences];
    copy[i].bullets.push("");
    setExperiences(copy);
  };
  const removeExpBullet = (i: number, bi: number) => {
    const copy = [...experiences];
    copy[i].bullets.splice(bi, 1);
    if (copy[i].bullets.length === 0) copy[i].bullets.push("");
    setExperiences(copy);
  };
  const addExperience = () => setExperiences([...experiences, { title: "", company: "", dates: "", bullets: [""] }]);
  const removeExperience = (i: number) => {
    const copy = experiences.filter((_, idx) => idx !== i);
    setExperiences(copy.length ? copy : [{ title: "", company: "", dates: "", bullets: [""] }]);
  };

  // Education handlers
  const updateEdu = (i: number, field: keyof EducationEntry, value: string) => {
    const copy = [...educations];
    copy[i][field] = value;
    setEducations(copy);
  };
  const addEducation = () => setEducations([...educations, { degree: "", school: "", dates: "", detail: "" }]);
  const removeEducation = (i: number) => {
    const copy = educations.filter((_, idx) => idx !== i);
    setEducations(copy.length ? copy : [{ degree: "", school: "", dates: "", detail: "" }]);
  };

  // Project handlers
  const updateProj = (i: number, field: keyof ProjectEntry, value: string) => {
    const copy = [...projects];
    copy[i][field] = value;
    setProjects(copy);
  };
  const addProject = () => setProjects([...projects, { name: "", detail: "" }]);
  const removeProject = (i: number) => {
    const copy = projects.filter((_, idx) => idx !== i);
    setProjects(copy.length ? copy : [{ name: "", detail: "" }]);
  };

  const downloadPDF = () => {
    const expHtml = experiences.filter(e => e.title || e.company).map(e => `
      <div class="entry">
        <div class="entry-head"><span class="entry-title">${e.title || ""}${e.company ? " — " + e.company : ""}</span><span class="entry-dates">${e.dates || ""}</span></div>
        <ul>${e.bullets.filter(b => b.trim()).map(b => `<li>${b}</li>`).join("")}</ul>
      </div>`).join("");

    const eduHtml = educations.filter(ed => ed.degree || ed.school).map(ed => `
      <div class="entry">
        <div class="entry-head"><span class="entry-title">${ed.degree || ""}${ed.school ? ", " + ed.school : ""}</span><span class="entry-dates">${ed.dates || ""}</span></div>
        ${ed.detail ? `<p class="detail">${ed.detail}</p>` : ""}
      </div>`).join("");

    const projHtml = projects.filter(p => p.name || p.detail).map(p => `
      <div class="entry">
        <div class="entry-head"><span class="entry-title">${p.name || ""}</span></div>
        ${p.detail ? `<p class="detail">${p.detail}</p>` : ""}
      </div>`).join("");

    const contactLine = [email, phone, location, linkedin].filter(Boolean).join("  •  ");

    // Template-specific CSS. ATS-safe = single column, no sidebars/boxes. Visual = boxed/sidebar (best for human review).
    const templates: Record<string, string> = {
      // ── ATS-SAFE (single column) ──
      classic: `
        body{font-family:'Lato',Arial,sans-serif;font-size:10.5pt;line-height:1.5;color:#1a1a1a;padding:0.7in 0.75in;max-width:8.5in;margin:0 auto}
        h1{font-size:22pt;font-weight:700;letter-spacing:0.02em;margin-bottom:2px;color:#1a1a1a}
        .contact{font-size:9.5pt;color:#555;margin-bottom:14px}
        h2{font-size:10.5pt;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;border-bottom:1.5px solid #1a1a1a;padding-bottom:2px;margin-top:16px;margin-bottom:7px;color:#1a1a1a}
        .entry-title{font-weight:700;font-size:10.5pt}`,
      corporate: `
        body{font-family:Georgia,'Times New Roman',serif;font-size:10.5pt;line-height:1.5;color:#1a2233;padding:0.7in 0.8in;max-width:8.5in;margin:0 auto}
        h1{font-size:21pt;font-weight:700;letter-spacing:0.03em;margin-bottom:3px;color:#1a2233}
        .contact{font-size:9.5pt;color:#556;margin-bottom:14px;border-bottom:2px solid #1a2233;padding-bottom:9px}
        h2{font-size:10.5pt;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-top:15px;margin-bottom:6px;color:#1a2233}
        .entry-title{font-weight:700;font-size:10.5pt}`,
      tech: `
        body{font-family:'Lato',Arial,sans-serif;font-size:10.5pt;line-height:1.5;color:#1f2937;padding:0.7in 0.75in;max-width:8.5in;margin:0 auto}
        h1{font-size:22pt;font-weight:700;margin-bottom:2px;color:${accent};font-family:'Courier New',monospace}
        .contact{font-size:9.5pt;color:#6b7280;margin-bottom:14px;font-family:'Courier New',monospace}
        h2{font-size:10.5pt;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;margin-top:16px;margin-bottom:7px;color:${accent};font-family:'Courier New',monospace}
        h2:before{content:"// ";opacity:0.6}
        .entry-title{font-weight:700;font-size:10.5pt;color:#111827}`,
      minimal: `
        body{font-family:'Lato',Arial,sans-serif;font-size:10.5pt;line-height:1.6;color:#333;padding:0.85in 0.9in;max-width:8.5in;margin:0 auto;font-weight:400}
        h1{font-size:20pt;font-weight:400;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:4px;color:#111}
        .contact{font-size:9pt;color:#888;margin-bottom:22px;letter-spacing:0.04em}
        h2{font-size:9pt;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin-top:20px;margin-bottom:8px;color:#999}
        .entry-title{font-weight:700;font-size:10.5pt;color:#222}`,
      executive: `
        body{font-family:Georgia,'Times New Roman',serif;font-size:10.5pt;line-height:1.55;color:#222;padding:0.75in 0.8in;max-width:8.5in;margin:0 auto}
        h1{font-size:24pt;font-weight:700;letter-spacing:0.04em;margin-bottom:4px;text-align:center;color:#1a1a1a}
        .contact{font-size:9.5pt;color:#666;margin-bottom:16px;text-align:center;border-bottom:1px solid #ccc;padding-bottom:10px}
        h2{font-size:11pt;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin-top:16px;margin-bottom:7px;color:#333;text-align:center}
        .entry-title{font-weight:700;font-size:10.5pt}`,
      // ── VISUAL (boxed / header bands — best for human review) ──
      creative: `
        body{font-family:'Lato',Arial,sans-serif;font-size:10.5pt;line-height:1.5;color:#222;padding:0;max-width:8.5in;margin:0 auto}
        .header-block{background:${accent};color:#fff;padding:0.45in 0.75in}
        .header-block h1{font-size:27pt;font-weight:700;color:#fff;margin-bottom:3px;letter-spacing:0.02em}
        .header-block .contact{font-size:9.5pt;color:#fff;opacity:0.92;margin-bottom:0}
        .body-pad{padding:0.3in 0.75in 0.6in}
        h1{font-size:27pt;font-weight:700}
        .contact{font-size:9.5pt;margin-bottom:14px}
        h2{font-size:11pt;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${accent};margin-top:15px;margin-bottom:6px;display:inline-block;border-bottom:3px solid ${accent};padding-bottom:1px}
        .entry-title{font-weight:700;font-size:10.5pt}`,
      boldheader: `
        body{font-family:'Lato',Arial,sans-serif;font-size:10.5pt;line-height:1.5;color:#1a1a1a;padding:0 0 0.6in 0;max-width:8.5in;margin:0 auto}
        .header-block{background:${accent};color:#fff;padding:0.5in 0.75in;margin-bottom:16px;text-align:center}
        .header-block h1{font-size:28pt;font-weight:700;color:#fff;margin-bottom:3px}
        .header-block .contact{font-size:9.5pt;color:#fff;opacity:0.9;margin-bottom:0}
        .body-pad{padding:0 0.75in}
        h1{font-size:28pt;font-weight:700}
        .contact{font-size:9.5pt;color:#555;margin-bottom:14px}
        h2{font-size:11pt;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${accent};border-bottom:2px solid ${accent};padding-bottom:2px;margin-top:16px;margin-bottom:7px}
        .entry-title{font-weight:700;font-size:10.5pt}`,
      sectioned: `
        body{font-family:'Lato',Arial,sans-serif;font-size:10.5pt;line-height:1.5;color:#1a1a1a;padding:0.5in 0.6in;max-width:8.5in;margin:0 auto;background:#fff}
        h1{font-size:23pt;font-weight:700;margin-bottom:2px;color:${accent}}
        .contact{font-size:9.5pt;color:#555;margin-bottom:14px}
        h2{font-size:10pt;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#fff;background:${accent};padding:4px 10px;margin-top:14px;margin-bottom:8px;border-radius:3px}
        .entry{border-left:3px solid ${accent}33;padding-left:10px;margin-bottom:10px}
        .entry-title{font-weight:700;font-size:10.5pt}`,
      twotone: `
        body{font-family:'Lato',Arial,sans-serif;font-size:10.5pt;line-height:1.5;color:#1a1a1a;padding:0;max-width:8.5in;margin:0 auto}
        .header-block{border-left:10px solid ${accent};padding:0.5in 0.75in 0.2in}
        .header-block h1{font-size:26pt;font-weight:700;color:${accent};margin-bottom:3px}
        .header-block .contact{font-size:9.5pt;color:#555;margin-bottom:0}
        .body-pad{padding:0.1in 0.75in 0.6in;border-left:10px solid ${accent}22;margin-left:0}
        h1{font-size:26pt;font-weight:700}
        .contact{font-size:9.5pt;color:#555;margin-bottom:14px}
        h2{font-size:10.5pt;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${accent};margin-top:15px;margin-bottom:6px;border-bottom:1.5px solid ${accent}55;padding-bottom:2px}
        .entry-title{font-weight:700;font-size:10.5pt}`,
      // ── extra ATS-safe ──
      modern: `
        body{font-family:'Lato',Arial,sans-serif;font-size:10.5pt;line-height:1.5;color:#1f2937;padding:0.7in 0.75in;max-width:8.5in;margin:0 auto}
        h1{font-size:24pt;font-weight:700;letter-spacing:0.01em;margin-bottom:2px;color:${accent}}
        .contact{font-size:9.5pt;color:#6b7280;margin-bottom:14px}
        h2{font-size:11pt;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;border-bottom:2px solid ${accent};padding-bottom:3px;margin-top:16px;margin-bottom:7px;color:${accent}}
        .entry-title{font-weight:700;font-size:10.5pt;color:#111827}`,
      refined: `
        body{font-family:Georgia,'Times New Roman',serif;font-size:10.5pt;line-height:1.5;color:#2a2a2a;padding:0.75in 0.85in;max-width:8.5in;margin:0 auto}
        h1{font-size:22pt;font-weight:700;letter-spacing:0.02em;margin-bottom:3px;color:${accent}}
        .contact{font-size:9.5pt;color:#777;margin-bottom:15px;font-style:italic}
        h2{font-size:10.5pt;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-top:16px;margin-bottom:6px;color:${accent};border-bottom:1px solid #ddd;padding-bottom:2px}
        .entry-title{font-weight:700;font-size:10.5pt}`,
      compact: `
        body{font-family:'Lato',Arial,sans-serif;font-size:9.5pt;line-height:1.35;color:#1a1a1a;padding:0.5in 0.6in;max-width:8.5in;margin:0 auto}
        h1{font-size:18pt;font-weight:700;margin-bottom:1px}
        .contact{font-size:8.5pt;color:#555;margin-bottom:9px}
        h2{font-size:9.5pt;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid #999;padding-bottom:1px;margin-top:10px;margin-bottom:4px}
        .entry{margin-bottom:6px!important}
        .entry-title{font-weight:700;font-size:9.5pt}`,
    };

    // Which templates use the header-block wrapper layout
    const headerBlockTemplates = ["creative", "boldheader", "twotone"];

    const sharedCss = `
      *{margin:0;padding:0;box-sizing:border-box}
      .summary{margin-bottom:4px}
      .entry{margin-bottom:9px}
      .entry-head{display:flex;justify-content:space-between;align-items:baseline}
      .entry-dates{font-size:9pt;color:#666;white-space:nowrap;padding-left:10px}
      ul{margin:3px 0 0 16px}
      li{margin-bottom:2px}
      .detail{font-size:10pt;margin-top:1px}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`;

    const sectionsHtml = `
${summary ? `<h2>Summary</h2><p class="summary">${summary}</p>` : ""}
${expHtml ? `<h2>Experience</h2>${expHtml}` : ""}
${eduHtml ? `<h2>Education</h2>${eduHtml}` : ""}
${skills ? `<h2>Skills</h2><p>${skills}</p>` : ""}
${projHtml ? `<h2>Projects</h2>${projHtml}` : ""}`;

    const bodyInner = headerBlockTemplates.includes(template)
      ? `<div class="header-block"><h1>${name || "Your Name"}</h1><div class="contact">${contactLine}</div></div><div class="body-pad">${sectionsHtml}<div style="margin-top:24px;border-top:1px solid #ddd;padding-top:8px;font-size:8pt;color:#999;text-align:center;">Built with ResumeLenz · resumelenz.com</div></div>`
      : `<h1>${name || "Your Name"}</h1><div class="contact">${contactLine}</div>${sectionsHtml}<div style="margin-top:24px;border-top:1px solid #ddd;padding-top:8px;font-size:8pt;color:#999;text-align:center;">Built with ResumeLenz · resumelenz.com</div>`;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${name || "Resume"}</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap');
${sharedCss}
${templates[template]}
</style></head>
<body>${bodyInner}</body></html>`;

    const win = window.open("", "_blank");
    if (!win) { alert("Allow popups to download your PDF."); return; }
    win.document.write(html); win.document.close(); win.focus();
    setTimeout(() => win.print(), 600);
  };

  const inputCls = "w-full bg-stone-50 border border-stone-300 focus:border-yellow-400 rounded-lg px-3 py-2 text-stone-900 outline-none transition-all text-sm";
  const labelCls = "text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1 block";

  const PolishBtn = ({ k, onClick }: { k: string; onClick: () => void }) => (
    <button onClick={onClick} disabled={polishing === k}
      className="text-xs font-bold px-2 py-1 rounded-md bg-yellow-100 border border-yellow-300 text-yellow-700 hover:bg-yellow-200 transition-all disabled:opacity-50 shrink-0">
      {polishing === k ? "…" : "✨ AI"}
    </button>
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <nav className="border-b border-stone-200 bg-white px-6 py-4 flex justify-between items-center">
        <button onClick={goHome} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer">
          <ResumeLensLogo size={32} />
          <span className="text-lg font-bold text-stone-900">ResumeLens</span>
        </button>
        <button onClick={goHome} className="text-stone-500 hover:text-stone-800 text-sm font-semibold transition-all">
          ← Back to Analyzer
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-stone-900 mb-2">Resume Builder</h1>
          <p className="text-stone-600">Fill it in, watch it build live, download a clean PDF — free.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* ── FORM SIDE ── */}
          <div className="space-y-5">
            {/* Contact */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-stone-900 mb-3">👤 Contact</h2>
              <div className="space-y-2">
                <div><label className={labelCls}>Full Name</label><input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={labelCls}>Email</label><input className={inputCls} value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@email.com" /></div>
                  <div><label className={labelCls}>Phone</label><input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={labelCls}>Location</label><input className={inputCls} value={location} onChange={e => setLocation(e.target.value)} placeholder="New York, NY" /></div>
                  <div><label className={labelCls}>LinkedIn / Site</label><input className={inputCls} value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="linkedin.com/in/jane" /></div>
                </div>
                <div><label className={labelCls}>Target Role (helps AI polish)</label><input className={inputCls} value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. Software Engineer" /></div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-stone-900 mb-3">📝 Professional Summary</h2>
              <div className="flex gap-2 items-start">
                <textarea className={inputCls} rows={3} value={summary} onChange={e => setSummary(e.target.value)} placeholder="A short pitch about who you are professionally..." />
                <PolishBtn k="summary" onClick={() => polish(summary, "summary", "summary", setSummary)} />
              </div>
            </div>

            {/* Experience */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-stone-900 mb-3">💼 Experience</h2>
              {experiences.map((exp, i) => (
                <div key={i} className="border border-stone-200 rounded-xl p-3 mb-3">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input className={inputCls} value={exp.title} onChange={e => updateExp(i, "title", e.target.value)} placeholder="Job Title" />
                    <input className={inputCls} value={exp.company} onChange={e => updateExp(i, "company", e.target.value)} placeholder="Company" />
                  </div>
                  <input className={inputCls + " mb-2"} value={exp.dates} onChange={e => updateExp(i, "dates", e.target.value)} placeholder="Jan 2022 – Present" />
                  <div className="flex items-center justify-between mb-1">
                    <label className={labelCls + " mb-0"}>What you did</label>
                    <button onClick={() => fetchSuggestions(i)}
                      className="text-xs font-bold px-2 py-1 rounded-md bg-yellow-100 border border-yellow-300 text-yellow-700 hover:bg-yellow-200 transition-all">
                      💡 Suggest bullets
                    </button>
                  </div>
                  {/* Suggestions panel */}
                  {suggestFor === i && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                      {suggestLoading ? (
                        <div className="flex items-center gap-2 text-yellow-700 text-sm"><Spinner color="text-yellow-600" /> Generating ideas for "{exp.title}"…</div>
                      ) : suggestions.length > 0 ? (
                        <>
                          <p className="text-xs font-semibold text-stone-600 mb-2">Tap any to add it (you can edit after):</p>
                          <div className="space-y-1.5">
                            {suggestions.map((s, si) => (
                              <button key={si} onClick={() => addSuggestionToExp(i, s)}
                                className="w-full text-left text-sm text-stone-700 bg-white border border-stone-200 rounded-lg px-3 py-2 hover:border-yellow-400 hover:bg-yellow-50 transition-all">
                                + {s}
                              </button>
                            ))}
                          </div>
                          <button onClick={() => { setSuggestFor(null); setSuggestions([]); }}
                            className="text-xs text-stone-400 hover:text-stone-600 underline mt-2">Close suggestions</button>
                        </>
                      ) : (
                        <p className="text-sm text-stone-500">No suggestions returned — try again.</p>
                      )}
                    </div>
                  )}
                  {exp.bullets.map((b, bi) => (
                    <div key={bi} className="flex gap-2 items-start mb-2">
                      <textarea className={inputCls} rows={2} value={b} onChange={e => updateExpBullet(i, bi, e.target.value)} placeholder="Describe an achievement..." />
                      <div className="flex flex-col gap-1 shrink-0">
                        <PolishBtn k={`exp-${i}-${bi}`} onClick={() => polish(b, "bullet", `exp-${i}-${bi}`, (v) => updateExpBullet(i, bi, v))} />
                        <button onClick={() => removeExpBullet(i, bi)} className="text-xs text-stone-400 hover:text-red-500 px-2 py-1">✕</button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between">
                    <button onClick={() => addExpBullet(i)} className="text-xs font-semibold text-yellow-700 hover:text-yellow-800">+ Add bullet</button>
                    <button onClick={() => removeExperience(i)} className="text-xs font-semibold text-stone-400 hover:text-red-500">Remove job</button>
                  </div>
                </div>
              ))}
              <button onClick={addExperience} className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 py-2 rounded-lg font-semibold text-sm transition-all">+ Add another job</button>
            </div>

            {/* Education */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-stone-900 mb-3">🎓 Education</h2>
              {educations.map((edu, i) => (
                <div key={i} className="border border-stone-200 rounded-xl p-3 mb-3">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input className={inputCls} value={edu.degree} onChange={e => updateEdu(i, "degree", e.target.value)} placeholder="Degree" />
                    <input className={inputCls} value={edu.school} onChange={e => updateEdu(i, "school", e.target.value)} placeholder="School" />
                  </div>
                  <input className={inputCls + " mb-2"} value={edu.dates} onChange={e => updateEdu(i, "dates", e.target.value)} placeholder="2018 – 2022" />
                  <input className={inputCls} value={edu.detail} onChange={e => updateEdu(i, "detail", e.target.value)} placeholder="GPA, honors, relevant coursework (optional)" />
                  <button onClick={() => removeEducation(i)} className="text-xs font-semibold text-stone-400 hover:text-red-500 mt-2">Remove</button>
                </div>
              ))}
              <button onClick={addEducation} className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 py-2 rounded-lg font-semibold text-sm transition-all">+ Add education</button>
            </div>

            {/* Skills */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-stone-900 mb-3">🛠️ Skills</h2>
              <div className="flex gap-2 items-start">
                <textarea className={inputCls} rows={2} value={skills} onChange={e => setSkills(e.target.value)} placeholder="Python, React, SQL, Project Management..." />
                <PolishBtn k="skills" onClick={() => polish(skills, "skill", "skills", setSkills)} />
              </div>
            </div>

            {/* Projects */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-stone-900 mb-3">🚀 Projects</h2>
              {projects.map((proj, i) => (
                <div key={i} className="border border-stone-200 rounded-xl p-3 mb-3">
                  <input className={inputCls + " mb-2"} value={proj.name} onChange={e => updateProj(i, "name", e.target.value)} placeholder="Project name" />
                  <div className="flex gap-2 items-start">
                    <textarea className={inputCls} rows={2} value={proj.detail} onChange={e => updateProj(i, "detail", e.target.value)} placeholder="What it does and what you used..." />
                    <PolishBtn k={`proj-${i}`} onClick={() => polish(proj.detail, "bullet", `proj-${i}`, (v) => updateProj(i, "detail", v))} />
                  </div>
                  <button onClick={() => removeProject(i)} className="text-xs font-semibold text-stone-400 hover:text-red-500 mt-2">Remove</button>
                </div>
              ))}
              <button onClick={addProject} className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 py-2 rounded-lg font-semibold text-sm transition-all">+ Add project</button>
            </div>

            {/* Template gallery */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-stone-900 mb-1">🎨 Choose a Template</h2>
              <p className="text-stone-500 text-xs mb-4">Pick a design that fits your field. ATS-Safe styles are best for online job-board applications; Visual styles look striking when you're emailing a person directly or in creative fields.</p>

              {/* ATS-Safe group */}
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">✅ ATS-Safe</span>
                <span className="text-stone-400 text-xs">Passes resume-scanning robots · best for online applications</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {([
                  { id: "classic", label: "Classic", tip: "Universal — works for any role" },
                  { id: "corporate", label: "Corporate", tip: "Finance, law, consulting, banking" },
                  { id: "tech", label: "Tech", tip: "Software, data, IT, engineering" },
                  { id: "minimal", label: "Minimal", tip: "Clean & airy — any modern role" },
                  { id: "executive", label: "Executive", tip: "Senior & leadership roles" },
                  { id: "modern", label: "Modern", tip: "Colored headers — versatile" },
                  { id: "refined", label: "Refined", tip: "Serif + color — polished" },
                  { id: "compact", label: "Compact", tip: "Fits more — for long careers" },
                ] as const).map((t) => (
                  <button key={t.id} onClick={() => setTemplate(t.id)}
                    className={`text-left p-2.5 rounded-lg border transition-all ${template === t.id ? "bg-yellow-50 border-yellow-400" : "bg-stone-50 border-stone-200 hover:border-yellow-300"}`}>
                    <div className="font-bold text-xs text-stone-900">{t.label}</div>
                    <div className="text-stone-500 text-[10px] leading-tight mt-0.5">{t.tip}</div>
                  </button>
                ))}
              </div>

              {/* Visual group */}
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">⚠️ Visual</span>
                <span className="text-stone-400 text-xs">Eye-catching · best when a human reads it directly</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {([
                  { id: "creative", label: "Creative", tip: "Design, marketing, media" },
                  { id: "boldheader", label: "Bold Header", tip: "Make a strong first impression" },
                  { id: "sectioned", label: "Sectioned", tip: "Colored section bars, organized" },
                  { id: "twotone", label: "Two-Tone", tip: "Accent side band, stylish" },
                ] as const).map((t) => (
                  <button key={t.id} onClick={() => setTemplate(t.id)}
                    className={`text-left p-2.5 rounded-lg border transition-all ${template === t.id ? "bg-yellow-50 border-yellow-400" : "bg-stone-50 border-stone-200 hover:border-yellow-300"}`}>
                    <div className="font-bold text-xs text-stone-900">{t.label}</div>
                    <div className="text-stone-500 text-[10px] leading-tight mt-0.5">{t.tip}</div>
                  </button>
                ))}
              </div>

              {/* Accent color — for templates that use it */}
              {["tech", "creative", "boldheader", "sectioned", "twotone", "modern", "refined"].includes(template) && (
                <div className="border-t border-stone-100 pt-3">
                  <label className={labelCls}>Accent Color</label>
                  <div className="flex gap-2 flex-wrap items-center">
                    {["#2563eb", "#0d9488", "#7c3aed", "#be123c", "#b45309", "#15803d", "#1a1a1a"].map((c) => (
                      <button key={c} onClick={() => setAccent(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${accent === c ? "border-stone-800 scale-110" : "border-stone-200"}`}
                        style={{ backgroundColor: c }} aria-label={`Accent ${c}`} />
                    ))}
                    <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-stone-300 bg-white" aria-label="Custom color" />
                  </div>
                </div>
              )}
            </div>

            <button onClick={downloadPDF} className="w-full bg-yellow-400 hover:bg-yellow-500 text-stone-900 py-4 rounded-xl font-black text-lg transition-all">
              📥 Download My Resume PDF
            </button>
            <p className="text-center text-stone-400 text-xs">Opens a print dialog — choose "Save as PDF"</p>
          </div>

          {/* ── LIVE PREVIEW SIDE ── */}
          <div className="lg:sticky lg:top-6 h-fit">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2 text-center">Live Preview · {template} template</p>
            <div className="bg-white border border-stone-300 rounded-xl shadow-lg p-8 text-sm" style={{ minHeight: "600px", fontFamily: (template === "executive" || template === "corporate" || template === "refined") ? "Georgia, serif" : "inherit" }}>
              <div className="text-2xl font-black" style={{ color: ["tech", "creative", "boldheader", "sectioned", "twotone", "modern", "refined"].includes(template) ? accent : "#1c1917", textAlign: (template === "executive" || template === "boldheader") ? "center" : "left", fontFamily: template === "tech" ? "monospace" : "inherit" }}>{name || "Your Name"}</div>
              <div className="text-xs text-stone-500 mb-4" style={{ textAlign: (template === "executive" || template === "boldheader") ? "center" : "left" }}>
                {[email, phone, location, linkedin].filter(Boolean).join("  •  ") || "your contact info"}
              </div>

              {summary && (<><div className="font-bold uppercase tracking-wide text-stone-800 border-b border-stone-800 pb-0.5 mb-1.5 mt-3 text-xs">Summary</div><p className="text-stone-700 mb-2">{summary}</p></>)}

              {experiences.some(e => e.title || e.company) && (
                <><div className="font-bold uppercase tracking-wide text-stone-800 border-b border-stone-800 pb-0.5 mb-1.5 mt-3 text-xs">Experience</div>
                {experiences.filter(e => e.title || e.company).map((e, i) => (
                  <div key={i} className="mb-2">
                    <div className="flex justify-between"><span className="font-bold text-stone-900">{e.title}{e.company ? ` — ${e.company}` : ""}</span><span className="text-xs text-stone-500">{e.dates}</span></div>
                    <ul className="list-disc ml-4 text-stone-700">{e.bullets.filter(b => b.trim()).map((b, bi) => <li key={bi}>{b}</li>)}</ul>
                  </div>
                ))}</>
              )}

              {educations.some(ed => ed.degree || ed.school) && (
                <><div className="font-bold uppercase tracking-wide text-stone-800 border-b border-stone-800 pb-0.5 mb-1.5 mt-3 text-xs">Education</div>
                {educations.filter(ed => ed.degree || ed.school).map((ed, i) => (
                  <div key={i} className="mb-2">
                    <div className="flex justify-between"><span className="font-bold text-stone-900">{ed.degree}{ed.school ? `, ${ed.school}` : ""}</span><span className="text-xs text-stone-500">{ed.dates}</span></div>
                    {ed.detail && <p className="text-stone-700">{ed.detail}</p>}
                  </div>
                ))}</>
              )}

              {skills && (<><div className="font-bold uppercase tracking-wide text-stone-800 border-b border-stone-800 pb-0.5 mb-1.5 mt-3 text-xs">Skills</div><p className="text-stone-700 mb-2">{skills}</p></>)}

              {projects.some(p => p.name || p.detail) && (
                <><div className="font-bold uppercase tracking-wide text-stone-800 border-b border-stone-800 pb-0.5 mb-1.5 mt-3 text-xs">Projects</div>
                {projects.filter(p => p.name || p.detail).map((p, i) => (
                  <div key={i} className="mb-2">
                    <div className="font-bold text-stone-900">{p.name}</div>
                    {p.detail && <p className="text-stone-700">{p.detail}</p>}
                  </div>
                ))}</>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}