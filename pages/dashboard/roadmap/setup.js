import Head from "next/head";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/DashboardLayout";
import Icon from "@/components/Icon";
import { useState, useEffect } from "react";

const LEVELS = [
  { val: "beginner", label: "Beginner", icon: "🌱", desc: "Just starting out" },
  { val: "intermediate", label: "Intermediate", icon: "⚡", desc: "Some experience" },
  { val: "advanced", label: "Advanced", icon: "🚀", desc: "Deep knowledge" },
];
const STYLES = [
  { val: "video", label: "Video", icon: "🎬" },
  { val: "reading", label: "Reading", icon: "📖" },
  { val: "project", label: "Projects", icon: "🛠️" },
  { val: "mixed", label: "Mixed", icon: "🎯" },
];
const DEADLINES = [
  { val: "1month", label: "1 Month" },
  { val: "3months", label: "3 Months" },
  { val: "6months", label: "6 Months" },
  { val: "1year", label: "1 Year" },
];

export default function RoadmapSetup() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [currentLevel, setCurrentLevel] = useState("beginner");
  const [dailyHours, setDailyHours] = useState(2);
  const [learningStyle, setLearningStyle] = useState("mixed");
  const [targetDeadline, setTargetDeadline] = useState("3months");
  const [budget, setBudget] = useState("free");
  const [importSkillAnalysisId, setImportSkillAnalysisId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState([]);
  const [forecaster, setForecaster] = useState(null);
  const [forecasterLoading, setForecasterLoading] = useState(false);

  // Pre-fill from query params (from Skill Gap Analyzer redirect)
  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.goal) setGoal(router.query.goal);
    if (router.query.analysisId) setImportSkillAnalysisId(router.query.analysisId);
  }, [router.isReady, router.query]);

  // Fetch templates
  useEffect(() => {
    fetch("/api/roadmap/templates")
      .then(r => r.json())
      .then(d => { if (d.success) setTemplates(d.templates || []); })
      .catch(console.error);
  }, []);

  // Debounced forecaster on goal change
  useEffect(() => {
    if (!goal || goal.length < 8) { setForecaster(null); return; }
    setForecasterLoading(true);
    const match = goal.match(/become (?:a |an )?(.+)$/i);
    const role = match ? match[1].trim() : goal.split(' ').slice(0, 4).join(' ');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/roadmap/forecaster?role=${encodeURIComponent(role)}`);
        const d = await res.json();
        if (d.success) setForecaster(d.forecaster);
      } catch (e) { console.error(e); }
      finally { setForecasterLoading(false); }
    }, 1200);
    return () => clearTimeout(timer);
  }, [goal]);

  const handleGenerate = async () => {
    setError("");
    if (!goal || goal.trim().length < 10)
      return setError("Please describe your career goal (at least 10 characters).");
    setIsGenerating(true);
    try {
      const res = await fetch("/api/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, currentLevel, dailyHours, learningStyle, targetDeadline, budget, importSkillAnalysisId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.message || "Generation failed");
      router.push(`/dashboard/roadmap/view?id=${data.roadmap._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyTemplate = (t) => {
    setGoal(`I want to become a ${t.role}`);
    setCurrentLevel(t.difficulty || "beginner");
    const dl = t.defaultDuration || "";
    if (dl.includes("6")) setTargetDeadline("6months");
    else if (dl.includes("1")) setTargetDeadline("1year");
    else setTargetDeadline("3months");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Head>
        <title>Setup Roadmap | LetsGrowAi</title>
        <meta name="description" content="Configure your AI-powered career roadmap." />
      </Head>

      <div className="flex-1 overflow-y-auto custom-scrollbar w-full relative pb-24">
        {/* Ambient bg */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[130px] -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/4 rounded-full blur-[100px] translate-y-1/4 -translate-x-1/4" />
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10 md:px-10 md:py-14 w-full space-y-10">

          {/* PAGE HEADER */}
          <div className="text-center md:text-left">
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-primary mb-3 font-headline">
              Curator AI Engine
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-3">
              Build Your Career Roadmap
            </h1>
            <p className="text-on-surface-variant text-sm md:text-base leading-relaxed max-w-2xl">
              Tell us your destination. Our AI will analyze the 2026 job market and craft a week-by-week learning plan tailored to you.
            </p>
            {importSkillAnalysisId && (
              <div className="mt-4 inline-flex items-center gap-2.5 bg-primary/8 border border-primary/20 text-primary rounded-xl px-4 py-2.5 text-sm font-bold">
                <Icon name="link" className="text-[18px]" />
                Missing skills from your Skill Gap Analysis will be imported automatically.
              </div>
            )}
          </div>

          {/* MAIN FORM CARD */}
          <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-slate-200/80 overflow-hidden">

            {/* ── GOAL ── */}
            <div className="p-7 md:p-10 border-b border-slate-100">
              <label className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-4 font-headline">
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">1</span>
                Your Career Goal
              </label>
              <textarea
                id="goal-input"
                value={goal}
                onChange={e => setGoal(e.target.value)}
                rows={3}
                placeholder="e.g. I want to become a Senior Data Scientist specializing in AI/ML for fintech…"
                className="w-full resize-none outline-none text-slate-800 text-base leading-relaxed placeholder:text-slate-300 font-body bg-transparent"
              />
              {/* Forecaster inline */}
              {(forecasterLoading || forecaster) && (
                <div className="mt-4 flex items-start gap-3 p-4 bg-primary/4 border border-primary/15 rounded-xl">
                  <Icon name="auto_awesome" className="text-primary text-[18px] mt-0.5 shrink-0" filled />
                  {forecasterLoading ? (
                    <p className="text-sm text-primary/70 font-medium animate-pulse">Fetching 2026 market data…</p>
                  ) : (
                    <div className="space-y-0.5">
                      {forecaster?.demandSignal && <p className="text-sm text-slate-600">📈 {forecaster.demandSignal}</p>}
                      {forecaster?.salarySignal && <p className="text-sm text-slate-600">💰 {forecaster.salarySignal}</p>}
                      {forecaster?.jobsSignal && <p className="text-sm text-slate-600">💼 {forecaster.jobsSignal}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── LEVEL ── */}
            <div className="p-7 md:p-10 border-b border-slate-100">
              <label className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-5 font-headline">
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">2</span>
                Current Proficiency Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {LEVELS.map(l => (
                  <button key={l.val} id={`level-${l.val}`} onClick={() => setCurrentLevel(l.val)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${currentLevel === l.val ? "border-primary bg-primary/5 shadow-sm" : "border-slate-200 hover:border-primary/40 hover:bg-slate-50"}`}>
                    <span className="text-2xl mb-2 block">{l.icon}</span>
                    <span className={`block text-sm font-extrabold font-headline ${currentLevel === l.val ? "text-primary" : "text-slate-700"}`}>{l.label}</span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">{l.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── HOURS + DEADLINE ── */}
            <div className="p-7 md:p-10 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Daily Hours */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <label className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-400 font-headline">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">3</span>
                    Daily Study Time
                  </label>
                  <span className="bg-primary text-white text-xs font-extrabold px-3 py-1 rounded-full font-headline">
                    {dailyHours}h / day
                  </span>
                </div>
                <input
                  type="range" min="1" max="8" step="1"
                  value={dailyHours}
                  onChange={e => setDailyHours(parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg accent-primary cursor-pointer"
                />
                <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  <span>1h Casual</span>
                  <span>8h Intensive</span>
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-5 font-headline">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">4</span>
                  Target Deadline
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {DEADLINES.map(d => (
                    <button key={d.val} id={`deadline-${d.val}`} onClick={() => setTargetDeadline(d.val)}
                      className={`py-3 rounded-xl text-xs font-extrabold font-headline transition-all ${targetDeadline === d.val ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── STYLE + BUDGET ── */}
            <div className="p-7 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Learning Style */}
              <div>
                <label className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-5 font-headline">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">5</span>
                  Learning Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map(s => (
                    <button key={s.val} id={`style-${s.val}`} onClick={() => setLearningStyle(s.val)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-bold font-headline transition-all ${learningStyle === s.val ? "border-primary bg-primary/5 text-primary" : "border-slate-200 text-slate-600 hover:border-primary/30"}`}>
                      <span>{s.icon}</span> {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-5 font-headline">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">6</span>
                  Resource Budget
                </label>
                <div className="flex flex-col gap-2">
                  {[
                    { val: "free", icon: "🆓", label: "Free Resources Only", desc: "YouTube, docs, open courses" },
                    { val: "paid", icon: "💎", label: "Free + Paid", desc: "Udemy, Coursera, books" },
                  ].map(b => (
                    <button key={b.val} id={`budget-${b.val}`} onClick={() => setBudget(b.val)}
                      className={`flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all ${budget === b.val ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/30"}`}>
                      <span className="text-2xl">{b.icon}</span>
                      <div>
                        <span className={`block text-sm font-extrabold font-headline ${budget === b.val ? "text-primary" : "text-slate-700"}`}>{b.label}</span>
                        <span className="text-[11px] text-slate-400">{b.desc}</span>
                      </div>
                      {budget === b.val && <Icon name="check_circle" className="text-primary text-xl ml-auto" filled />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm font-bold">
              <Icon name="error" className="text-xl text-red-500 shrink-0" />
              {error}
            </div>
          )}

          {/* GENERATE BUTTON */}
          <button
            id="generate-roadmap-btn"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white py-5 rounded-2xl font-extrabold font-headline text-lg shadow-[0_10px_30px_rgba(0,55,176,0.25)] hover:shadow-[0_14px_40px_rgba(0,55,176,0.35)] hover:-translate-y-1 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-3 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
            {isGenerating ? (
              <>
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
                <span className="relative z-10">AI is generating your roadmap…</span>
              </>
            ) : (
              <>
                <span className="relative z-10">Generate My Personalized Roadmap</span>
                <Icon name="bolt" className="relative z-10 text-yellow-300" filled />
              </>
            )}
          </button>

          {/* TEMPLATES */}
          {templates.length > 0 && (
            <section>
              <h2 className="text-xl font-extrabold font-headline text-on-surface mb-2">Or start from a template</h2>
              <p className="text-on-surface-variant text-sm mb-6">Click any template to pre-fill the form above, then customize and generate.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(t => (
                  <button key={t.id} onClick={() => applyTemplate(t)}
                    className="group text-left bg-white rounded-2xl p-6 border border-slate-200 hover:border-primary/40 hover:shadow-lg transition-all active:scale-[0.98]">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-primary/8 rounded-xl flex items-center justify-center">
                        <Icon name="school" className="text-primary text-[20px]" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-sm font-headline leading-tight">{t.title}</h3>
                        <p className="text-[11px] text-slate-400 capitalize">{t.difficulty} · {t.defaultDuration}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {t.coreSkills?.slice(0, 4).map(s => (
                        <span key={s} className="px-2.5 py-1 bg-primary/6 text-primary text-[10px] font-bold rounded-full border border-primary/10">{s}</span>
                      ))}
                      {(t.coreSkills?.length || 0) > 4 && (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full">+{t.coreSkills.length - 4}</span>
                      )}
                    </div>
                    <p className="mt-4 text-[11px] font-bold text-primary group-hover:underline font-headline">Use this template →</p>
                  </button>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </>
  );
}

RoadmapSetup.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
