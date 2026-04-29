import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import CompanyLayout from "@/components/CompanyLayout";
import Icon from "@/components/Icon";

export default function CompanyProfile() {
  const router = useRouter();
  const { slug } = router.query;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!router.isReady || !slug) return;
    
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        // 1. Try to fetch from cache first
        let res = await fetch(`/api/company/${slug}`);
        let d = await res.json();
        
        if (d.success) {
          return setData(d);
        }
        
        // 2. If not in cache (404), trigger the live AI research pipeline automatically
        if (d.error === 'NOT_FOUND') {
          res = await fetch('/api/company/research', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company: slug, role: 'Software Engineer' }) // default role fallback
          });
          d = await res.json();
          
          if (d.success) {
             return setData(d);
          }
        }
        
        // 3. If it failed both, show error
        setError(d.message || "Failed to analyze company. Please try another name.");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router.isReady, slug]);

  const handleSave = async () => {
    if (!data?.report?.overview?.companyName) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/company/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          companySlug: slug, 
          companyName: data.report.overview.companyName 
        })
      });
      const d = await res.json();
      if (d.success) setSaved(true);
      else if (d.error === 'ALREADY_SAVED') setSaved(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="text-on-surface-variant font-bold animate-pulse">Loading company insights...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Icon name="error_outline" className="text-error text-[48px] mb-4" />
        <h2 className="text-2xl font-extrabold text-on-surface mb-2 font-headline">Profile Not Found</h2>
        <p className="text-on-surface-variant mb-6">{error || "This company profile could not be loaded."}</p>
        <button 
          onClick={() => router.push('/dashboard/company')}
          className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          Return to Search
        </button>
      </div>
    );
  }

  const { report } = data;
  const { overview, interviewProcess, commonQuestions, culture, salary, aiPrepTips } = report;

  return (
    <>
      <Head>
        <title>{overview.companyName} | Company Profile</title>
      </Head>

      <div className="w-full max-w-7xl mx-auto p-6 md:p-8 space-y-10 pb-20">
        
        {/* Page Header / Company Profile Summary */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Logo Wrapper (Dynamic initial letter fallback) */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white shadow-md border border-outline-variant/10 flex items-center justify-center p-5 shrink-0 relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-100 transition-opacity"></div>
               <span className="text-5xl font-black text-primary font-headline uppercase">{overview.companyName.charAt(0)}</span>
            </div>
            
            {/* Meta Descriptions */}
            <div>
              <div className="flex items-center gap-3 mb-2.5">
                <h1 className="text-3xl md:text-4xl font-extrabold font-headline tracking-tight text-on-surface">{overview.companyName}</h1>
                <Icon name="verified" className="text-secondary text-[24px]" filled />
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-[#1b495c] text-white text-[10px] font-extrabold font-headline uppercase tracking-widest rounded-full shadow-sm">{overview.industry}</span>
                <span className="px-3 py-1 bg-[#1b495c] text-white text-[10px] font-extrabold font-headline uppercase tracking-widest rounded-full shadow-sm">{overview.size} Employees</span>
                <span className="px-3 py-1 bg-[#1b495c] text-white text-[10px] font-extrabold font-headline uppercase tracking-widest rounded-full shadow-sm">{overview.headquarters}</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-extrabold text-on-surface">{culture.overallRating || '4.0'}</span>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map(s => (
                       <Icon key={s} name={s <= (culture.overallRating || 4) ? "star" : "star_rate"} className="text-[16px]" filled />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-outline uppercase tracking-wider font-headline">Overall</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex gap-3 w-full sm:w-auto mt-4 lg:mt-0">
            <button 
              onClick={() => router.push(`/dashboard/company/compare?c1=${slug}`)}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl border-2 border-outline-variant/30 text-slate-600 font-extrabold font-headline text-sm hover:bg-surface-container hover:text-on-surface transition-colors"
            >
               Compare
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving || saved}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-white font-extrabold font-headline text-sm shadow-[0_8px_20px_rgba(0,88,190,0.25)] hover:shadow-[0_12px_24px_rgba(0,88,190,0.3)] hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-80 disabled:cursor-not-allowed ${saved ? 'bg-emerald-600' : 'bg-secondary'}`}
            >
               <Icon name={saved ? "bookmark_added" : "bookmark_add"} className="text-[18px]" />
               {saved ? 'Saved' : isSaving ? 'Saving...' : 'Track Insights'}
            </button>
          </div>
        </div>

        {/* Local Tab Navigation (Scrollable on mobile) */}
        <div className="flex gap-8 overflow-x-auto custom-scrollbar border-b border-outline-variant/20 -mx-6 px-6 md:mx-0 md:px-0">
          <button className="whitespace-nowrap pb-4 text-sm font-extrabold text-primary border-b-[3px] border-primary font-headline">Overview</button>
          <button className="whitespace-nowrap pb-4 text-sm font-bold text-outline hover:text-on-surface transition-colors font-headline">Interview Intelligence</button>
          <button className="whitespace-nowrap pb-4 text-sm font-bold text-outline hover:text-on-surface transition-colors font-headline">Salary & Packages</button>
          <button className="whitespace-nowrap pb-4 text-sm font-bold text-outline hover:text-on-surface transition-colors font-headline">Reviews</button>
        </div>

        {/* Bento Grid Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* AI Culture Box */}
          <div className="col-span-1 lg:col-span-8 bg-inverse-surface rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group shadow-xl border border-[#3b4b6b]">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700 pointer-events-none">
              <Icon name="auto_awesome" className="text-[180px] -mt-10 -mr-10" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3.5 py-1.5 bg-white/10 border border-white/20 text-white text-[10px] font-extrabold font-headline tracking-widest uppercase rounded-full flex items-center gap-1.5 shadow-sm">
                  <Icon name="token" className="text-[14px]" /> GEMINI POWERED
                </span>
                <span className="text-white/50 text-[10px] font-bold font-headline uppercase tracking-widest">Updated {data.cacheAge || 'recently'}</span>
              </div>
              
              <h3 className="text-2xl md:text-3xl font-extrabold font-headline mb-4 text-white drop-shadow-sm tracking-tight">AI Prep Tips</h3>
              <p className="text-white/70 leading-relaxed mb-6 max-w-2xl text-sm md:text-base">
                {aiPrepTips.companySpecificInsight}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                 <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                    <h5 className="text-emerald-400 font-bold text-xs uppercase mb-2">DOs</h5>
                    <ul className="text-white/80 text-sm space-y-1 list-disc pl-4">
                       {aiPrepTips.dosAndDonts.dos.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                 </div>
                 <div className="flex-1 bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                    <h5 className="text-red-400 font-bold text-xs uppercase mb-2">DONTs</h5>
                    <ul className="text-white/80 text-sm space-y-1 list-disc pl-4">
                       {aiPrepTips.dosAndDonts.donts.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                 </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 relative z-10 mt-4">
              {aiPrepTips.mustFocusAreas.map((area, idx) => (
                <div key={idx} className="flex items-center gap-2.5 bg-black/20 border border-white/10 px-4 py-2.5 rounded-xl shadow-inner backdrop-blur-sm hover:bg-white/10 transition-colors cursor-help" title={area.specificTip}>
                  <Icon name="psychology" className="text-secondary-fixed text-[18px]" />
                  <span className="text-sm font-semibold text-white/90">{area.area}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Work Life Balance Box */}
          <div className="col-span-1 lg:col-span-4 bg-surface-container-lowest rounded-3xl p-8 flex flex-col shadow-[0_4px_20px_rgba(15,23,42,0.03)] border border-outline-variant/10">
            <h4 className="text-lg font-extrabold font-headline mb-8 text-on-surface">Work Life Balance</h4>
            
            <div className="flex flex-col gap-8 flex-1 justify-center">
              <div className="relative h-4 bg-surface-container rounded-full overflow-hidden shadow-inner border border-outline-variant/5">
                <div className="absolute h-full bg-primary rounded-full shadow-[0_0_10px_rgba(0,55,176,0.3)]" style={{ width: `\${(culture.workLifeBalance / 5) * 100}%` }}></div>
              </div>
              
              <div className="flex justify-between items-end">
                <div className="flex items-baseline">
                  <span className="text-4xl font-extrabold font-headline tracking-tight">{culture.workLifeBalance || 'N/A'}</span>
                  <span className="text-outline font-bold text-sm ml-1.5">/ 5.0</span>
                </div>
                <span className="text-secondary font-extrabold font-headline uppercase tracking-widest text-xs py-1 px-3 bg-secondary/10 rounded-lg">
                  {culture.workLifeBalance > 4 ? 'Excellent' : culture.workLifeBalance > 3 ? 'Good' : 'Variable'}
                </span>
              </div>
              
              <p className="text-xs text-on-surface-variant leading-relaxed font-medium bg-surface-container-low p-4 rounded-xl border border-outline-variant/5">
                <span className="font-bold text-on-surface block mb-1">Company Description</span>
                {overview.productDescription}
              </p>
            </div>
          </div>

          {/* Tech Stack Box */}
          <div className="col-span-1 lg:col-span-4 bg-surface-container-lowest rounded-3xl p-8 shadow-[0_4px_20px_rgba(15,23,42,0.03)] border border-outline-variant/10">
            <div className="flex items-center gap-2 mb-6 border-b border-primary/20 pb-2 mr-auto" style={{width: 'fit-content'}}>
               <Icon name="terminal" className="text-primary text-[18px]" />
               <h4 className="text-[11px] font-extrabold font-headline text-primary uppercase tracking-widest">Tech Stack</h4>
            </div>
            
            <div className="flex flex-wrap gap-2.5">
              {overview.techStack && overview.techStack.length > 0 ? overview.techStack.map(tech => (
                 <span key={tech} className="px-3 py-1.5 bg-surface-container-low border border-outline-variant/10 text-on-surface-variant hover:text-primary hover:border-primary/30 transition-colors cursor-pointer rounded-lg text-xs font-bold shadow-sm">
                    {tech}
                 </span>
              )) : (
                 <span className="text-sm text-outline">No specific stack found</span>
              )}
            </div>
          </div>

          {/* Pros & Cons Box */}
          <div className="col-span-1 lg:col-span-8 bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(15,23,42,0.03)] border border-outline-variant/10 flex flex-col sm:flex-row">
            {/* Pros */}
            <div className="flex-1 p-8 sm:border-r border-outline-variant/10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                   <Icon name="thumb_up" className="text-emerald-600 text-[20px]" filled />
                </div>
                <h4 className="font-extrabold font-headline text-lg">The Pros</h4>
              </div>
              <ul className="space-y-5">
                {culture.pros?.map((pro, idx) => (
                  <li key={idx} className="flex gap-4 items-start text-sm text-on-surface-variant font-medium">
                    <Icon name="check_circle" className="text-emerald-500 text-[18px] shrink-0 mt-0.5" filled />
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
            {/* Cons */}
            <div className="flex-1 p-8 bg-[#fefcff] border-t sm:border-t-0 sm:border-l border-error/5">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-error/5 flex items-center justify-center">
                   <Icon name="thumb_down" className="text-error border-error text-[20px]" filled />
                </div>
                <h4 className="font-extrabold font-headline text-lg">The Cons</h4>
              </div>
              <ul className="space-y-5">
                {culture.cons?.map((con, idx) => (
                  <li key={idx} className="flex gap-4 items-start text-sm text-on-surface-variant font-medium">
                    <Icon name="cancel" className="text-error text-[18px] shrink-0 mt-0.5" filled />
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section Divider: Interview Intelligence */}
          <div className="col-span-1 lg:col-span-12 mt-10 mb-2">
            <h3 className="text-2xl font-extrabold font-headline text-on-surface tracking-tight">Interview Intelligence</h3>
            <p className="text-outline font-medium text-sm mt-1">{interviewProcess.sourcedFrom}</p>
          </div>

          {/* Timeline Card */}
          <div className="col-span-1 lg:col-span-12 bg-surface-container-lowest rounded-3xl p-8 shadow-[0_4px_20px_rgba(15,23,42,0.03)] border border-outline-variant/10 overflow-x-auto">
            <div className="min-w-[700px] flex justify-between items-center relative py-6 px-4">
              <div className="absolute h-[3px] bg-surface-container-high top-1/2 left-10 right-10 -translate-y-1/2 z-0 rounded-full"></div>
              {interviewProcess.rounds?.map((stage, idx) => (
                 <div key={idx} className="relative z-10 flex flex-col items-center gap-4 bg-white px-2 group cursor-help" title={stage.description}>
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white font-extrabold text-xl shadow-[0_8px_20px_rgba(0,55,176,0.3)] group-hover:scale-110 transition-transform border-[3px] border-white">
                       {stage.number || idx + 1}
                    </div>
                    <div className="text-center">
                       <p className="font-extrabold text-sm mb-1">{stage.name}</p>
                       <p className="text-[11px] text-outline font-bold uppercase tracking-wide bg-surface-container-low px-2 py-1 rounded-md">{stage.duration}</p>
                    </div>
                 </div>
              ))}
            </div>
          </div>

          {/* Common Questions */}
          <div className="col-span-1 lg:col-span-7 bg-surface-container-lowest rounded-3xl p-8 shadow-[0_4px_20px_rgba(15,23,42,0.03)] border border-outline-variant/10">
            <h4 className="text-lg font-extrabold font-headline mb-6">Common Technical Questions</h4>
            <div className="space-y-4">
               {commonQuestions.technical?.map((q, idx) => (
                 <div key={idx} className="p-5 bg-surface-container-low rounded-2xl border-l-[4px] border-primary shadow-sm hover:-translate-y-0.5 transition-transform">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-2.5">
                       <p className="text-sm font-bold text-on-surface leading-snug">"{q.question}"</p>
                       <span className={`shrink-0 text-[9px] font-extrabold font-headline px-2.5 py-1 rounded-md uppercase tracking-widest border ${q.frequency === 'high' ? 'bg-error/10 text-error border-error/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                          {q.frequency} Freq
                       </span>
                    </div>
                    <p className="text-[13px] text-on-surface-variant font-medium flex items-center gap-2">
                       <Icon name="info" className="text-[16px] text-primary opacity-60" /> Topic: {q.topic}
                    </p>
                 </div>
               ))}
            </div>
          </div>

          {/* Salary Card */}
          <div className="col-span-1 lg:col-span-5 bg-surface-container-lowest rounded-3xl p-8 shadow-[0_4px_20px_rgba(15,23,42,0.03)] border border-outline-variant/10 flex flex-col">
            <h4 className="text-lg font-extrabold font-headline mb-8">Base Salary Distribution ({salary.role})</h4>
            <div className="space-y-8 flex-1">
               <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between items-end mb-1">
                     <span className="text-xs font-extrabold text-on-surface uppercase tracking-wide font-headline">Fresher</span>
                     <span className="text-sm font-black text-primary">{salary.fresher?.min} - {salary.fresher?.max}</span>
                  </div>
                  <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden shadow-inner border border-outline-variant/10">
                     <div className="h-full w-[40%] bg-gradient-to-r from-primary to-secondary rounded-full shadow-md"></div>
                  </div>
               </div>
               <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between items-end mb-1">
                     <span className="text-xs font-extrabold text-on-surface uppercase tracking-wide font-headline">Mid-Level</span>
                     <span className="text-sm font-black text-primary">{salary.midLevel?.min} - {salary.midLevel?.max}</span>
                  </div>
                  <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden shadow-inner border border-outline-variant/10">
                     <div className="h-full w-[60%] bg-gradient-to-r from-primary to-secondary rounded-full shadow-md"></div>
                  </div>
               </div>
               <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between items-end mb-1">
                     <span className="text-xs font-extrabold text-on-surface uppercase tracking-wide font-headline">Senior</span>
                     <span className="text-sm font-black text-primary">{salary.senior?.min} - {salary.senior?.max}</span>
                  </div>
                  <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden shadow-inner border border-outline-variant/10">
                     <div className="h-full w-[85%] bg-gradient-to-r from-primary to-secondary rounded-full shadow-md"></div>
                  </div>
               </div>
            </div>
            <div className="mt-8 pt-6 border-t border-outline-variant/10 bg-primary/5 -mx-8 px-8 -mb-8 pb-8 rounded-b-3xl">
               <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 border border-primary/20 shadow-sm">
                     <Icon name="monetization_on" className="text-primary text-[20px]" filled />
                  </div>
                  <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                     <span className="font-extrabold text-primary font-headline block mb-0.5">Additional Perks</span>
                     <strong>Bonus:</strong> {salary.joiningBonus} <br/> <strong>Stocks:</strong> {salary.stockOptions}
                  </p>
               </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

// Map to nested layout
CompanyProfile.getLayout = function getLayout(page) {
  return <CompanyLayout>{page}</CompanyLayout>;
};
