import Head from "next/head";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/DashboardLayout";
import Icon from "@/components/Icon";
import PageLoader from "@/components/PageLoader";
import SkillsPopup from "@/components/skills/SkillsPopup";
import SkillsResultCard from "@/components/skills/SkillsResultCard";
import SkillsBreakdown from "@/components/skills/SkillsBreakdown";
import SkillsResources from "@/components/skills/SkillsResources";
import { useState, useRef, useEffect, useCallback } from "react";

export default function SkillGapAnalyzer() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("paste-jd");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [userSkills, setUserSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);

  const [inputs, setInputs] = useState({
    jdText: "", jdUrl: "", jobTitle: "", company: "", role: "",
    experienceLevel: "1-3yr", resumeFile: null,
  });
  const fileInputRef = useRef(null);

  // Per-tab cached results — persisted in sessionStorage
  const [tabResults, setTabResults] = useState({});

  // Restore saved results from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('skillGapResults');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') setTabResults(parsed);
      }
    } catch (e) { console.warn('Failed to load cached results', e); }
  }, []);

  // Persist tabResults to sessionStorage on every change
  useEffect(() => {
    try { sessionStorage.setItem('skillGapResults', JSON.stringify(tabResults)); }
    catch (e) { console.warn('Failed to save results', e); }
  }, [tabResults]);

  // Load user skills on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/skills/my-skills");
        const data = await res.json();
        if (data.success) setUserSkills(data.skills || []);
      } catch (e) { console.error(e); }
      finally { setLoadingSkills(false); }
    })();
  }, []);

  const currentResult = tabResults[activeTab] || null;

  const handleInputChange = (e) => {
    setInputs(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleFileChange = (e) => {
    if (e.target.files?.[0]) setInputs(prev => ({ ...prev, resumeFile: e.target.files[0] }));
  };

  const handleAnalyze = async () => {
    setError("");
    if (activeTab === "paste-jd" && inputs.jdText.length < 50) return setError("Paste a valid JD (min 50 chars).");
    if (activeTab === "job-title" && !inputs.jobTitle) return setError("Enter a job title.");
    if (activeTab === "company-role" && (!inputs.company || !inputs.role)) return setError("Enter company & role.");
    if (activeTab === "resume-upload" && !inputs.resumeFile) return setError("Upload a resume PDF.");

    setIsAnalyzing(true);
    try {
      let response;
      if (activeTab === "resume-upload") {
        const fd = new FormData();
        fd.append("inputType", activeTab);
        fd.append("resumePDF", inputs.resumeFile);
        if (inputs.jdText) fd.append("jdText", inputs.jdText);
        response = await fetch("/api/skills/analyze", { method: "POST", body: fd });
      } else {
        response = await fetch("/api/skills/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputType: activeTab, ...inputs }),
        });
      }
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || data.error || "Analysis failed");
      setTabResults(prev => ({ ...prev, [activeTab]: data }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddSkillToProfile = useCallback(async (skillName) => {
    try {
      const res = await fetch("/api/skills/add-skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: skillName }),
      });
      const data = await res.json();
      if (data.success) setUserSkills(data.skills);
    } catch (e) { console.error(e); }
  }, []);

  // Derived data from current tab's result
  let matchedSkills = [], partialSkills = [], missingSkills = [];
  let totalSkills = 0, matchPct = 0, partialPct = 0, missingPct = 0;
  if (currentResult?.result) {
    const r = currentResult.result;
    matchedSkills = (r.confirmed || []).filter(s => s.confidence === "full");
    partialSkills = (r.confirmed || []).filter(s => s.confidence === "partial");
    missingSkills = [...(r.highPriority || []), ...(r.mediumPriority || []), ...(r.lowPriority || [])];
    totalSkills = matchedSkills.length + partialSkills.length + missingSkills.length;
    if (totalSkills > 0) {
      matchPct = (matchedSkills.length / totalSkills) * 100;
      partialPct = (partialSkills.length / totalSkills) * 100;
      missingPct = (missingSkills.length / totalSkills) * 100;
    }
  }
  const gapScore = currentResult?.result?.gapScore || 0;

  if (loadingSkills) return <PageLoader message="Loading your profile..." />;
  if (isAnalyzing) return <PageLoader message="AI is analyzing your skills..." />;

  return (
    <>
      <Head><title>Skill Gap Analyzer | LetsGrowAi</title></Head>
      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full pb-20">
        {/* HEADER */}
        <section className="mb-10 md:mb-12">
          <div className="mb-8">
            <span className="text-primary font-bold text-[10px] md:text-xs tracking-widest uppercase mb-2 block border-b-2 border-primary/30 w-fit pb-1 font-headline">Precision Analytics</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight mb-2 font-headline">Skill Gap Analyzer</h2>
            <p className="text-on-surface-variant text-base md:text-lg max-w-2xl leading-relaxed font-body">Compare your profile against any JD, role, or company to find exactly what you're missing.</p>
          </div>

          {/* YOUR CURRENT SKILLS - always visible on tabs 1-3 */}
          {activeTab !== "resume-upload" && (
            <div className="bg-surface-container-low rounded-2xl p-5 md:p-6 border border-outline-variant/10 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-sm text-on-surface font-headline uppercase tracking-wide">Your Current Skills</h3>
                <button onClick={() => setShowPopup(true)} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                  <Icon name="add" className="text-[16px]" /> Add More Skills
                </button>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {userSkills.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No skills in profile. <button onClick={() => setShowPopup(true)} className="text-primary font-bold hover:underline">Add skills</button> to get started.</p>
                ) : userSkills.map(skill => (
                  <span key={skill} className="px-4 py-1.5 bg-surface-container-highest text-primary font-bold text-xs rounded-full border border-primary/10 shadow-sm">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* TABS + INPUT */}
          <div className="bg-surface-container-low rounded-2xl p-5 md:p-8 border border-outline-variant/10 shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
            <div className="flex gap-4 mb-6 border-b border-outline-variant/20 overflow-x-auto hide-scrollbar">
              {[
                { id: "paste-jd", label: "Paste JD" },
                { id: "job-title", label: "Job Title" },
                { id: "company-role", label: "Company + Role" },
                { id: "resume-upload", label: "Resume + JD" },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 md:pb-4 px-2 font-bold transition-all whitespace-nowrap text-sm md:text-base font-headline border-b-2 ${activeTab === tab.id ? "text-primary border-primary" : "text-on-surface-variant border-transparent hover:text-on-surface"}`}
                >{tab.label}</button>
              ))}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl flex items-center gap-3 text-sm font-bold border border-error/20">
                <Icon name="error" /> {error}
              </div>
            )}

            <div className="mb-6 space-y-4">
              {activeTab === "paste-jd" && (
                <>
                  <textarea name="jdText" value={inputs.jdText} onChange={handleInputChange}
                    className="w-full bg-surface-container-lowest border-2 border-outline-variant/10 focus:border-primary/30 rounded-xl p-4 md:p-6 text-on-surface focus:ring-4 focus:ring-primary/5 outline-none placeholder:text-outline-variant/60 font-body text-sm md:text-base transition-all resize-y custom-scrollbar"
                    placeholder="Paste the full job description text here..." rows="6" />
                  {/* URL Scraper Section */}
                  <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest"><div className="h-px flex-1 bg-outline-variant/20" /> OR import from URL <div className="h-px flex-1 bg-outline-variant/20" /></div>
                  <div className="flex gap-3">
                    <input type="text" name="jdUrl" value={inputs.jdUrl} onChange={handleInputChange}
                      placeholder="https://naukri.com/job/... or linkedin.com/jobs/..."
                      className="flex-1 bg-surface-container-lowest border-2 border-outline-variant/10 focus:border-primary/30 rounded-xl p-4 text-on-surface outline-none text-sm transition-all" />
                    <button onClick={async () => {
                      if (!inputs.jdUrl) return;
                      setError("");
                      try {
                        const res = await fetch("/api/skills/fetch-jd", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: inputs.jdUrl }) });
                        const data = await res.json();
                        if (data.success) setInputs(prev => ({ ...prev, jdText: data.jdText, jdUrl: "" }));
                        else setError(data.message || data.error);
                      } catch (e) { setError("Failed to fetch JD from URL."); }
                    }} className="px-5 py-3 bg-surface-container-highest text-on-surface font-bold rounded-xl border border-outline-variant/15 hover:bg-primary/5 hover:text-primary transition-all text-sm flex items-center gap-2 shrink-0">
                      <Icon name="download" className="text-[18px]" /> Fetch
                    </button>
                  </div>
                </>
              )}

              {activeTab === "job-title" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Job Title</label>
                    <input type="text" name="jobTitle" value={inputs.jobTitle} onChange={handleInputChange} placeholder="e.g. Frontend Developer"
                      className="w-full bg-surface-container-lowest border-2 border-outline-variant/10 focus:border-primary/30 rounded-xl p-4 text-on-surface outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Experience Level</label>
                    <select name="experienceLevel" value={inputs.experienceLevel} onChange={handleInputChange}
                      className="w-full bg-surface-container-lowest border-2 border-outline-variant/10 focus:border-primary/30 rounded-xl p-4 text-on-surface outline-none transition-all">
                      <option value="fresher">Fresher</option><option value="1-3yr">Junior (1-3yr)</option><option value="3-5yr">Mid (3-5yr)</option><option value="5yr+">Senior (5yr+)</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === "company-role" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Target Company</label>
                    <input type="text" name="company" value={inputs.company} onChange={handleInputChange} placeholder="e.g. Google"
                      className="w-full bg-surface-container-lowest border-2 border-outline-variant/10 focus:border-primary/30 rounded-xl p-4 text-on-surface outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Target Role</label>
                    <input type="text" name="role" value={inputs.role} onChange={handleInputChange} placeholder="e.g. SDE 2"
                      className="w-full bg-surface-container-lowest border-2 border-outline-variant/10 focus:border-primary/30 rounded-xl p-4 text-on-surface outline-none transition-all" />
                  </div>
                </div>
              )}

              {activeTab === "resume-upload" && (
                <div className="space-y-4">
                  <div onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-outline-variant/30 hover:border-primary/50 bg-surface-container-lowest rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3">
                    <Icon name="upload_file" className="text-4xl text-primary/60" />
                    {inputs.resumeFile ? <span className="font-bold text-on-surface">{inputs.resumeFile.name}</span> : <><span className="font-bold text-on-surface">Click to upload resume</span><span className="text-xs text-on-surface-variant">PDF only (Max 5MB)</span></>}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf" className="hidden" />
                  </div>
                  <textarea name="jdText" value={inputs.jdText} onChange={handleInputChange}
                    className="w-full bg-surface-container-lowest border-2 border-outline-variant/10 focus:border-primary/30 rounded-xl p-4 text-on-surface outline-none placeholder:text-outline-variant/60 text-sm transition-all resize-y custom-scrollbar"
                    placeholder="Paste JD to compare against resume..." rows="4" />
                </div>
              )}
            </div>

            <button onClick={handleAnalyze} disabled={isAnalyzing}
              className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl hover:-translate-y-0.5 active:scale-[0.99] transition-all shadow-[0_8px_20px_rgba(0,55,176,0.2)] flex items-center justify-center gap-2 font-headline text-[15px] disabled:opacity-50 disabled:pointer-events-none">
              {isAnalyzing ? "Analyzing..." : "Analyze My Skills"} {!isAnalyzing && <Icon name="arrow_forward" className="text-[18px]" />}
            </button>
          </div>
        </section>

        {/* RESULTS - persisted per tab */}
        {currentResult && (
          <section className="space-y-10 md:space-y-12">
            <SkillsResultCard gapScore={gapScore} summaryNote={currentResult.result?.summaryNote} matchPct={matchPct} partialPct={partialPct} missingPct={missingPct} aiWarning={currentResult.aiWarning} />

            {currentResult.companyInsights?.insiderTips?.length > 0 && (
              <div className="bg-surface-container-low border border-primary/20 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <h4 className="font-extrabold text-lg flex items-center gap-2 mb-4 font-headline text-on-surface">
                  <Icon name="lightbulb" className="text-primary text-xl" filled /> Company Insider Tips
                </h4>
                <ul className="space-y-3">
                  {currentResult.companyInsights.insiderTips.map((tip, i) => (
                    <li key={i} className="flex gap-3 text-sm text-on-surface-variant"><span className="text-primary font-bold mt-0.5">•</span> {tip}</li>
                  ))}
                </ul>
              </div>
            )}

            <SkillsBreakdown matchedSkills={matchedSkills} partialSkills={partialSkills} missingSkills={missingSkills} onAddSkillToProfile={handleAddSkillToProfile} />

            {missingSkills.length > 0 && (
              <SkillsResources missingSkills={missingSkills} company={currentResult.inputType === "company-role" ? inputs.company : undefined} />
            )}

            {/* Bottom CTA */}
            {missingSkills.length > 0 && (
              <div className="py-12 flex justify-center border-t border-outline-variant/20 mt-12">
                <button 
                  onClick={() => {
                    // Build goal from current analysis context
                    const goalText = currentResult.inputType === 'job-title' 
                      ? `I want to become a ${inputs.jobTitle}`
                      : currentResult.inputType === 'company-role'
                      ? `I want to become a ${inputs.role} at ${inputs.company}`
                      : `I want to master the skills from my analysis`;
                    
                    const params = new URLSearchParams({ goal: goalText });
                    if (currentResult._id) params.set('analysisId', currentResult._id);
                    router.push(`/dashboard/roadmap/setup?${params.toString()}`);
                  }}
                  className="px-8 md:px-10 py-5 bg-gradient-to-r from-primary to-secondary text-on-primary font-extrabold text-base md:text-lg rounded-2xl shadow-[0_10px_30px_rgba(0,55,176,0.25)] hover:shadow-[0_12px_40px_rgba(0,55,176,0.3)] hover:-translate-y-1 transition-all flex items-center gap-3 md:gap-4 w-full md:w-auto justify-center font-headline relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                  <span className="relative z-10">Add Missing Skills to Roadmap</span>
                  <Icon name="auto_awesome" className="relative z-10" filled />
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      {/* POPUP */}
      <SkillsPopup isOpen={showPopup} onClose={() => setShowPopup(false)} currentSkills={userSkills} onSkillAdded={setUserSkills} />
    </>
  );
}

SkillGapAnalyzer.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
