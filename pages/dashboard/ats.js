import Head from "next/head";
import { useState, useEffect, useRef } from "react";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import Icon from "@/components/Icon";
import PageLoader from "@/components/PageLoader";

// Score color helper
function scoreColor(s) {
  if (s >= 80) return { text: 'text-emerald-600', bg: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  if (s >= 60) return { text: 'text-amber-500',   bg: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-800 border-amber-200' };
  return         { text: 'text-red-500',     bg: 'bg-red-500',     badge: 'bg-red-100 text-red-800 border-red-200' };
}

function ScoreBar({ label, value }) {
  const c = scoreColor(value);
  return (
    <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 hover:border-outline-variant/30 transition-colors">
      <div className="flex justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</span>
        <span className={`text-sm font-extrabold font-headline ${c.text}`}>{value ?? '--'}%</span>
      </div>
      <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden shadow-inner">
        <div className={`${c.bg} h-2 rounded-full transition-all duration-1000`} style={{ width: `${value ?? 0}%` }} />
      </div>
    </div>
  );
}

export default function ATSScorer() {
  const [resumes,       setResumes]       = useState([]);
  const [activeTab,     setActiveTab]     = useState('existing'); // 'existing' | 'upload'
  const [selectedId,    setSelectedId]    = useState('');
  const [isLoading,     setIsLoading]     = useState(true);
  const [uploadedText,  setUploadedText]  = useState('');
  const [uploadedName,  setUploadedName]  = useState('');
  const [jd,            setJd]            = useState('');
  const [analyzing,     setAnalyzing]     = useState(false);
  const [tailoring,     setTailoring]     = useState(false);
  const [report,        setReport]        = useState(null);   // ATSReport
  const [tailorData,    setTailorData]    = useState(null);   // TailorSuggestions
  const [isDragging,    setIsDragging]    = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    fetch('/api/resume/all')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setResumes(d.data.resumes);
          if (d.data.resumes.length > 0) setSelectedId(d.data.resumes[0]._id);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  // ─── FILE UPLOAD ──────────────────────────────────────────────────────
  const handleFile = async (file) => {
    if (!file) return;
    if (!file.name.endsWith('.pdf')) { alert('Only PDF files are supported.'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('File must be under 5MB.'); return; }

    setUploadedName(file.name);
    setUploadedText('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res  = await fetch('/api/parse-pdf', { method: 'POST', body: file, headers: { 'Content-Type': 'application/pdf' } });
      const body = await res.json();
      if (body.success) {
        setUploadedText(body.text);
      } else {
        alert('Failed to parse PDF: ' + (body.error || 'Unknown error'));
      }
    } catch {
      alert('PDF parsing failed. Try a different file.');
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  // ─── ANALYZE ─────────────────────────────────────────────────────────
  const analyze = async () => {
    if (jd.trim().length < 100) { alert('Job description must be at least 100 characters.'); return; }

    if (activeTab === 'existing') {
      if (!selectedId) { alert('Please select a resume.'); return; }
    } else {
      if (!uploadedText) { alert('Please upload and parse a PDF first.'); return; }
    }

    setAnalyzing(true);
    setReport(null);
    setTailorData(null);

    try {
      let res, body;
      if (activeTab === 'existing') {
        res  = await fetch(`/api/resume/${selectedId}/ats-score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobDescription: jd }),
        });
        body = await res.json();
        if (!body.success) { alert(body.error || 'Analysis failed'); return; }
        setReport(body.data.atsReport);
      } else {
        // Uploaded PDF: use the raw ATS score endpoint
        res = await fetch(`/api/ats-score-raw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobDescription: jd, resumeText: uploadedText }),
        });
        body = await res.json();
        if (!body.success) { alert(body.error || 'Analysis failed'); return; }
        setReport(body.data.atsReport);
      }
    } catch {
      alert('Analysis request failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  // ─── TAILOR ───────────────────────────────────────────────────────────
  const tailor = async () => {
    if (!jd.trim()) { alert('Enter a Job Description first.'); return; }
    if (activeTab === 'existing' && !selectedId) { alert('Select a resume first.'); return; }
    if (activeTab === 'upload' && !uploadedText) { alert('Upload and parse a PDF first.'); return; }

    setTailoring(true);
    setTailorData(null);
    try {
      let res, body;
      if (activeTab === 'existing') {
        res  = await fetch(`/api/resume/${selectedId}/tailor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobDescription: jd }),
        });
      } else {
        res  = await fetch(`/api/tailor-raw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobDescription: jd, resumeText: uploadedText }),
        });
      }
      
      body = await res.json();
      if (!body.success) { alert(body.error || 'Tailoring failed'); return; }
      setTailorData(body.data.suggestions);
    } catch {
      alert('Tailor request failed.');
    } finally {
      setTailoring(false);
    }
  };

  const score = report?.overallScore ?? null;
  const sc    = score !== null ? scoreColor(score) : null;
  const circumference = 527.78;
  const strokeOffset  = score !== null ? circumference * (1 - score / 100) : circumference;

  const scoreLabel = score === null ? '' : score >= 80 ? 'Great Match!' : score >= 60 ? 'Good Start' : 'Needs Work';

  if (isLoading) return <PageLoader message="Loading ATS Engine..." />;

  return (
    <>
      <Head><title>ATS Scorer | LetsGrowAI</title></Head>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface">
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">ATS Scorer</h1>
            <p className="text-on-surface-variant max-w-2xl text-sm md:text-base leading-relaxed">
              Match your resume against any job description using Gemini AI. Get a score, missing keywords, and actionable fixes in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* ─── LEFT: Input panel ─── */}
            <section className="lg:col-span-5 space-y-6">
              <div className="bg-surface-container-lowest rounded-2xl p-6 md:p-8 shadow-sm border border-outline-variant/10">

                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-surface-container-low p-1 rounded-xl">
                  {[
                    { id: 'existing', label: 'My Resumes' },
                    { id: 'upload',   label: 'Upload PDF' },
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === tab.id ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                    >{tab.label}</button>
                  ))}
                </div>

                {/* Resume selection */}
                {activeTab === 'existing' ? (
                  <div className="mb-6">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 block">Select Resume</label>
                    {resumes.length === 0 ? (
                      <p className="text-sm text-on-surface-variant italic">No resumes found. Go to Resume Builder to create one.</p>
                    ) : (
                      <select
                        value={selectedId}
                        onChange={e => setSelectedId(e.target.value)}
                        className="w-full bg-surface-container-low border-b-2 border-transparent focus:border-primary p-3 text-sm rounded-t outline-none"
                      >
                        {resumes.map(r => (
                          <option key={r._id} value={r._id}>{r.title} (v{r.version})</option>
                        ))}
                      </select>
                    )}
                  </div>
                ) : (
                  <div className="mb-6">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 block">Upload Resume (PDF)</label>
                    <div
                      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={onDrop}
                      onClick={() => fileRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center text-center cursor-pointer transition-all ${isDragging ? 'border-primary bg-primary/5' : 'border-outline-variant/50 hover:border-primary/60 hover:bg-primary/3'}`}
                    >
                      <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors ${isDragging ? 'bg-primary/10' : 'bg-surface-container-low'}`}>
                        <Icon name="upload_file" className={`text-3xl transition-colors ${isDragging ? 'text-primary' : 'text-outline'}`} />
                      </div>
                      {uploadedName ? (
                        <div>
                          <p className="text-sm font-bold text-emerald-600 flex items-center gap-1"><Icon name="check_circle" className="text-base" filled /> {uploadedName}</p>
                          <p className="text-[11px] text-on-surface-variant mt-1">{uploadedText ? 'Parsed successfully — ready to analyze' : 'Parsing...'}</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-on-surface mb-1">Drag & drop or click to upload</p>
                          <p className="text-[11px] text-on-surface-variant uppercase tracking-wide">PDF only — Max 5MB</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Job Description */}
                <div className="mb-6">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 block">Job Description</label>
                  <textarea
                    value={jd}
                    onChange={e => setJd(e.target.value)}
                    rows={9}
                    className="w-full bg-surface-container-low border-b-2 border-transparent focus:border-primary rounded-t p-4 text-sm outline-none resize-y custom-scrollbar leading-relaxed placeholder:text-outline-variant"
                    placeholder="Paste the full job description here (min 100 characters)..."
                  />
                  <p className={`text-[10px] mt-1 ${jd.length < 100 ? 'text-outline' : 'text-emerald-600'}`}>
                    {jd.length} / 100 minimum characters
                  </p>
                </div>

                <button
                  onClick={analyze}
                  disabled={analyzing}
                  className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95 transition-all shadow-lg hover:shadow-primary/30 font-headline disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {analyzing ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing with Gemini AI...</>
                  ) : (
                    <><Icon name="query_stats" className="text-lg" /> Analyze Resume</>
                  )}
                </button>
              </div>
            </section>

            {/* ─── RIGHT: Results panel ─── */}
            <section className="lg:col-span-7 space-y-6">
              {!report ? (
                <div className="bg-surface-container-lowest rounded-2xl p-12 border border-outline-variant/10 flex flex-col items-center justify-center text-center min-h-[400px]">
                  <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center mb-6">
                    <Icon name="analytics" className="text-4xl text-outline" />
                  </div>
                  <h3 className="text-lg font-bold text-on-surface mb-2 font-headline">Run Your First Analysis</h3>
                  <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed">
                    Select or upload your resume, paste a job description, and Gemini AI will give you a detailed ATS compatibility report.
                  </p>
                </div>
              ) : (
                <div className="bg-surface-container-lowest rounded-2xl p-6 md:p-8 border border-outline-variant/10 shadow-sm space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-56 h-56 bg-primary/5 blur-3xl rounded-full pointer-events-none" />

                  {/* Score Hero */}
                  <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
                    <div className="relative w-44 h-44 flex-shrink-0">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="88" cy="88" r="76" fill="transparent" stroke="currentColor" className="text-surface-container-low" strokeWidth="14" />
                        <circle cx="88" cy="88" r="76" fill="transparent" stroke="currentColor" className={sc.text} strokeWidth="14"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeOffset}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-5xl font-extrabold font-headline ${sc.text}`}>{score}</span>
                        <span className="text-[10px] font-bold text-on-surface-variant tracking-widest mt-1">ATS SCORE</span>
                      </div>
                    </div>
                    <div className="text-center sm:text-left">
                      <h2 className="text-2xl font-extrabold text-on-surface font-headline mb-2">{scoreLabel}</h2>
                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${sc.badge}`}>
                          {score >= 80 ? 'Ready to Apply' : score >= 60 ? 'Needs Some Work' : 'Major Updates Needed'}
                        </span>
                      </div>
                      {report.strengths?.length > 0 && (
                        <div className="mt-4 space-y-1">
                          {report.strengths.map((s, i) => (
                            <p key={i} className="text-xs text-emerald-700 flex items-start gap-1"><Icon name="check" className="text-sm shrink-0 mt-0.5" filled /> {s}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metric Bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ScoreBar label="Keyword Match"       value={report.breakdown?.keywordMatch} />
                    <ScoreBar label="Format Score"        value={report.breakdown?.formatScore} />
                    <ScoreBar label="Section Completeness" value={report.breakdown?.sectionCompleteness} />
                    <ScoreBar label="Readability"         value={report.breakdown?.readabilityScore} />
                  </div>

                  {/* Missing Keywords */}
                  {report.missingKeywords?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2 uppercase tracking-wider font-headline">
                        <Icon name="error" className="text-error" filled /> Missing Keywords
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {report.missingKeywords.map(kw => (
                          <span key={kw} className="bg-error-container/40 text-error border border-error/20 px-3 py-1.5 rounded-full text-xs font-bold">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Present Keywords */}
                  {report.presentKeywords?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2 uppercase tracking-wider font-headline">
                        <Icon name="check_circle" className="text-emerald-500" filled /> Matched Keywords
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {report.presentKeywords.map(kw => (
                          <span key={kw} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-bold">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {report.suggestions?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-on-surface mb-3 uppercase tracking-wider font-headline">Critical Suggestions</h3>
                      <div className="space-y-3">
                        {report.suggestions.map((s, i) => (
                          <div key={i} className="bg-surface-container-low p-4 rounded-xl border border-amber-200/40 flex items-start gap-3">
                            <div className="bg-amber-100/60 p-2 rounded-lg shrink-0"><Icon name="warning" className="text-amber-600" filled /></div>
                            <p className="text-sm text-on-surface-variant leading-relaxed">{s}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Format Issues */}
                  {report.formatIssues?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-on-surface mb-3 uppercase tracking-wider font-headline">Format Issues</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {report.formatIssues.map((f, i) => <li key={i} className="text-sm text-on-surface-variant">{f}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Tailor CTA */}
                  <div className="pt-4 border-t border-outline-variant/20">
                    {!tailorData ? (
                      <button
                        onClick={tailor}
                        disabled={tailoring}
                        className="w-full bg-gradient-to-r from-primary to-secondary text-on-primary font-extrabold py-4 rounded-xl flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 transition-all text-sm uppercase tracking-wider disabled:opacity-60 relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                        {tailoring ? (
                          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin relative z-10" /> Generating Suggestions...</>
                        ) : (
                          <><Icon name="auto_awesome" className="relative z-10" filled /> <span className="relative z-10">Tailor Resume for this JD</span></>
                        )}
                      </button>
                    ) : (
                      <div className="space-y-5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider font-headline flex items-center gap-2"><Icon name="auto_awesome" className="text-primary" /> Tailor Suggestions</h3>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${scoreColor(tailorData.estimatedScoreAfter).badge}`}>
                            Predicted: {tailorData.estimatedScoreAfter}%
                          </span>
                        </div>

                        {tailorData.newSummary && (
                          <div>
                            <p className="text-[10px] uppercase font-bold text-outline mb-1">Suggested New Summary</p>
                            <p className="bg-surface-container-low p-4 rounded-xl text-sm text-on-surface-variant leading-relaxed italic border border-outline-variant/20">{tailorData.newSummary}</p>
                          </div>
                        )}

                        {tailorData.skillsToAdd?.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase font-bold text-outline mb-2">Skills to Add</p>
                            <div className="flex flex-wrap gap-2">{tailorData.skillsToAdd.map(s => <span key={s} className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold">{s}</span>)}</div>
                          </div>
                        )}

                        {tailorData.keywordsToWeave?.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase font-bold text-outline mb-2">Keywords to Weave In</p>
                            <div className="flex flex-wrap gap-2">{tailorData.keywordsToWeave.map(k => <span key={k} className="bg-secondary/10 text-secondary-foreground border border-secondary/20 px-3 py-1 rounded-full text-xs font-medium">{k}</span>)}</div>
                          </div>
                        )}

                        {tailorData.bulletImprovements?.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase font-bold text-outline mb-3">Bullet Point Improvements</p>
                            <div className="space-y-4">
                              {tailorData.bulletImprovements.map((b, i) => (
                                <div key={i} className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/20">
                                  <p className="text-[10px] font-bold text-outline uppercase mb-1">{b.section}</p>
                                  <p className="text-xs text-red-500 line-through mb-1 leading-relaxed">{b.original}</p>
                                  <p className="text-xs text-emerald-700 font-medium leading-relaxed">{b.improved}</p>
                                  <p className="text-[10px] text-on-surface-variant mt-1 italic">{b.reason}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <button onClick={() => setTailorData(null)} className="text-xs text-outline hover:text-on-surface transition-colors">← Clear suggestions</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </>
  );
}

ATSScorer.getLayout = function getLayout(page) {
  return <WorkspaceLayout>{page}</WorkspaceLayout>;
};
