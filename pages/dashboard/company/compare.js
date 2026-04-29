import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import CompanyLayout from "@/components/CompanyLayout";
import Icon from "@/components/Icon";

export default function CompanyComparison() {
  const router = useRouter();
  
  const [c1Name, setC1Name] = useState("");
  const [c2Name, setC2Name] = useState("");
  const [role, setRole] = useState("Software Engineer");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  // Auto-fill from query params
  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.c1) setC1Name(router.query.c1);
    if (router.query.c2) setC2Name(router.query.c2);
    if (router.query.role) setRole(router.query.role);
  }, [router.isReady, router.query]);

  const handleCompare = async (e) => {
    e?.preventDefault();
    if (!c1Name || !c2Name) {
      return setError("Please enter both companies to compare.");
    }
    if (c1Name.toLowerCase() === c2Name.toLowerCase()) {
      return setError("Please enter two distinct companies.");
    }

    setLoading(true);
    setError("");
    setResult(null);
    setExpandedRow(null);

    try {
      const res = await fetch('/api/company/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company1: c1Name, company2: c2Name, role })
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to compare companies");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getWinnerStyle = (winner, side) => {
    if (winner === side) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (winner === 'tie') return 'bg-amber-50 text-amber-700 border border-amber-200';
    return 'bg-slate-50 text-slate-500 border border-slate-200';
  };

  return (
    <>
      <Head>
        <title>Compare Companies | LetsGrowAi</title>
      </Head>

      <div className="w-full max-w-6xl mx-auto p-6 md:p-8 space-y-10 pb-20">
        
        {/* Header */}
        <header className="space-y-3">
          <div className="flex items-center gap-2">
             <Icon name="compare_arrows" className="text-secondary text-[20px]" />
             <span className="text-secondary font-extrabold text-[10px] uppercase tracking-widest border-b-2 border-secondary/30 pb-0.5 font-headline">Intelligence Engine</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight font-headline">Company Comparison</h1>
          <p className="text-on-surface-variant max-w-2xl text-sm md:text-base font-medium leading-relaxed">
             Analyze and compare employment metrics side-by-side to make data-driven career decisions with our AI-powered insights.
          </p>
        </header>

        {/* Input Form */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-[0_4px_20px_rgba(15,23,42,0.03)] border border-outline-variant/10">
          <form onSubmit={handleCompare} className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 w-full space-y-2">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wide">Company 1</label>
              <input 
                value={c1Name} onChange={e => setC1Name(e.target.value)} disabled={loading}
                className="w-full bg-surface-container-low border border-outline-variant/20 focus:border-primary/50 rounded-xl px-4 py-3 outline-none transition-colors font-medium" 
                placeholder="e.g. Google" 
              />
            </div>
            
            <div className="hidden md:flex w-10 h-10 shrink-0 rounded-full bg-primary/10 items-center justify-center mb-1 text-primary font-bold">VS</div>

            <div className="flex-1 w-full space-y-2">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wide">Company 2</label>
              <input 
                value={c2Name} onChange={e => setC2Name(e.target.value)} disabled={loading}
                className="w-full bg-surface-container-low border border-outline-variant/20 focus:border-primary/50 rounded-xl px-4 py-3 outline-none transition-colors font-medium" 
                placeholder="e.g. TCS" 
              />
            </div>

            <div className="flex-1 w-full space-y-2">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wide">Target Role</label>
              <input 
                value={role} onChange={e => setRole(e.target.value)} disabled={loading}
                className="w-full bg-surface-container-low border border-outline-variant/20 focus:border-primary/50 rounded-xl px-4 py-3 outline-none transition-colors font-medium" 
                placeholder="e.g. Software Engineer" 
              />
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full md:w-auto h-[48px] px-8 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 shrink-0"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Analyzing...
                </>
              ) : 'Compare'}
            </button>
          </form>
          {error && <p className="text-error text-sm font-bold mt-4">{error}</p>}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <p className="text-on-surface-variant font-bold animate-pulse text-center">
              Running deep AI analysis on both companies...<br/>
              <span className="text-xs text-outline">This may take up to 60 seconds</span>
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-8">

            {/* Scorecard Header */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-stretch">
              {/* Company 1 Card */}
              <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-[0_4px_20px_rgba(15,23,42,0.03)] border border-outline-variant/10 relative group hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-5 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-3 shrink-0 shadow-sm border border-outline-variant/10">
                    <span className="text-3xl font-black text-primary font-headline uppercase">{result.company1.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold font-headline text-on-surface">{result.company1.name}</h2>
                    <p className="text-on-surface-variant text-sm font-medium">{result.company1.report?.overview?.industry} • {result.company1.report?.overview?.headquarters}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/5 text-center">
                    <span className="text-3xl font-black text-primary font-headline">{result.verdict.scorecard?.company1Wins || 0}</span>
                    <span className="block text-[10px] text-outline font-extrabold uppercase tracking-widest font-headline mt-1">Wins</span>
                  </div>
                  <div className="flex-1 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/5 text-center">
                    <span className="text-3xl font-extrabold text-on-surface font-headline">{result.company1.report?.culture?.overallRating || 'N/A'}</span>
                    <span className="block text-[10px] text-outline font-extrabold uppercase tracking-widest font-headline mt-1">Rating</span>
                  </div>
                </div>
              </div>

              {/* VS Divider */}
              <div className="flex flex-row md:flex-col items-center justify-center gap-4 py-4 md:py-0">
                 <div className="h-px w-full md:w-px md:h-full bg-outline-variant/30 flex-1 rounded-full"></div>
                 <div className="w-14 h-14 rounded-full bg-inverse-surface border-2 border-white shadow-xl flex items-center justify-center text-white font-extrabold font-headline text-lg z-10">VS</div>
                 <div className="h-px w-full md:w-px md:h-full bg-outline-variant/30 flex-1 rounded-full"></div>
              </div>

              {/* Company 2 Card */}
              <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-[0_4px_20px_rgba(15,23,42,0.03)] border border-outline-variant/10 relative group hover:border-secondary/30 transition-colors">
                <div className="flex items-center gap-5 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary/10 to-primary/10 flex items-center justify-center p-3 shrink-0 shadow-sm border border-outline-variant/10">
                    <span className="text-3xl font-black text-secondary font-headline uppercase">{result.company2.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold font-headline text-on-surface">{result.company2.name}</h2>
                    <p className="text-on-surface-variant text-sm font-medium">{result.company2.report?.overview?.industry} • {result.company2.report?.overview?.headquarters}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/5 text-center">
                    <span className="text-3xl font-black text-secondary font-headline">{result.verdict.scorecard?.company2Wins || 0}</span>
                    <span className="block text-[10px] text-outline font-extrabold uppercase tracking-widest font-headline mt-1">Wins</span>
                  </div>
                  <div className="flex-1 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/5 text-center">
                    <span className="text-3xl font-extrabold text-on-surface font-headline">{result.company2.report?.culture?.overallRating || 'N/A'}</span>
                    <span className="block text-[10px] text-outline font-extrabold uppercase tracking-widest font-headline mt-1">Rating</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Verdict Banner */}
            <section className="bg-inverse-surface rounded-3xl p-8 text-inverse-on-surface relative overflow-hidden shadow-2xl border border-[#3b4b6b]">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Icon name="psychology" className="text-[140px] -mt-10 -mr-10" filled />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="bg-white/10 p-3.5 rounded-2xl shrink-0 border border-white/20 shadow-inner">
                  <Icon name="auto_awesome" className="text-secondary-fixed text-[28px]" filled />
                </div>
                <div className="space-y-3 flex-1">
                  <h3 className="text-white font-extrabold font-headline text-lg md:text-xl drop-shadow-sm">AI Verdict</h3>
                  <p className="text-white/80 text-sm md:text-base font-medium leading-relaxed italic max-w-3xl">
                    "{result.verdict.overallVerdict}"
                  </p>
                  {result.verdict.bottomLine && (
                    <p className="text-secondary-fixed font-extrabold text-sm mt-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10 inline-block">
                      💡 {result.verdict.bottomLine}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Detailed Metric Comparison Table */}
            <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(15,23,42,0.03)] border border-outline-variant/10">
              <div className="grid grid-cols-12 bg-surface-container-low text-on-surface-variant font-extrabold font-headline text-[10px] uppercase tracking-widest p-5 border-b border-outline-variant/10">
                <div className="col-span-4 px-4 pl-8">Metric Data</div>
                <div className="col-span-4 px-4 text-center">{result.company1.name}</div>
                <div className="col-span-4 px-4 text-center">{result.company2.name}</div>
              </div>

              <div className="divide-y divide-outline-variant/10">
                {result.verdict.comparisonTable?.map((row, idx) => (
                  <div key={idx}>
                    <div 
                      className="grid grid-cols-12 p-6 md:p-7 hover:bg-primary/5 transition-colors group cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                    >
                      <div className="col-span-4 flex items-center gap-4 pl-2">
                        <div className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center shadow-sm border border-outline-variant/10 group-hover:border-primary/20 transition-colors">
                          <Icon name={row.icon || "analytics"} className="text-primary text-[20px]" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-sm md:text-base text-on-surface font-headline">{row.category}</span>
                          <span className="text-[10px] text-outline font-medium hidden sm:block">{row.winnerReason}</span>
                        </div>
                      </div>
                      <div className="col-span-4 flex justify-center items-center px-2">
                        <div className={`px-4 py-2 rounded-xl text-xs md:text-sm font-extrabold font-headline tracking-wide shadow-sm text-center max-w-[200px] ${getWinnerStyle(row.winner, '1')}`}>
                          {row.company1Value}
                        </div>
                      </div>
                      <div className="col-span-4 flex justify-center items-center px-2">
                        <div className={`px-4 py-2 rounded-xl text-xs md:text-sm font-extrabold font-headline tracking-wide shadow-sm text-center max-w-[200px] ${getWinnerStyle(row.winner, '2')}`}>
                          {row.company2Value}
                        </div>
                      </div>
                    </div>
                    {/* Expanded detail panel */}
                    {expandedRow === idx && row.detailedAnalysis && (
                      <div className="px-8 pb-6 -mt-2">
                        <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 flex gap-3">
                          <Icon name="lightbulb" className="text-primary text-[20px] shrink-0 mt-0.5" />
                          <p className="text-sm text-on-surface-variant font-medium leading-relaxed">{row.detailedAnalysis}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Red Flags */}
            {result.verdict.redFlags && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-error/10 shadow-sm">
                  <h4 className="font-extrabold font-headline text-base mb-5 flex items-center gap-3 text-error">
                    <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center">
                      <Icon name="flag" className="text-error text-[16px]" />
                    </div>
                    Red Flags — {result.company1.name}
                  </h4>
                  <ul className="space-y-3">
                    {result.verdict.redFlags.company1?.map((flag, i) => (
                      <li key={i} className="flex gap-3 items-start text-sm text-on-surface-variant font-medium">
                        <Icon name="warning" className="text-error/60 text-[16px] shrink-0 mt-0.5" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-error/10 shadow-sm">
                  <h4 className="font-extrabold font-headline text-base mb-5 flex items-center gap-3 text-error">
                    <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center">
                      <Icon name="flag" className="text-error text-[16px]" />
                    </div>
                    Red Flags — {result.company2.name}
                  </h4>
                  <ul className="space-y-3">
                    {result.verdict.redFlags.company2?.map((flag, i) => (
                      <li key={i} className="flex gap-3 items-start text-sm text-on-surface-variant font-medium">
                        <Icon name="warning" className="text-error/60 text-[16px] shrink-0 mt-0.5" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Recommendation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { key: 'fresher', icon: 'school', label: 'Best for Freshers', color: 'primary' },
                { key: 'experienced', icon: 'work', label: 'Best for Experienced', color: 'secondary' },
                { key: 'workLifeBalance', icon: 'balance', label: 'Best Work-Life Balance', color: 'emerald' },
                { key: 'highCTC', icon: 'payments', label: 'Best for High CTC', color: 'amber' },
                { key: 'careerGrowth', icon: 'trending_up', label: 'Best Career Growth', color: 'purple' },
              ].map((rec) => (
                <div key={rec.key} className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 shadow-sm hover:-translate-y-1 transition-transform">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-9 h-9 rounded-xl bg-${rec.color === 'primary' ? 'primary' : rec.color === 'secondary' ? 'secondary' : rec.color + '-500'}/10 flex items-center justify-center`}>
                      <Icon name={rec.icon} className={`text-${rec.color === 'primary' ? 'primary' : rec.color === 'secondary' ? 'secondary' : rec.color + '-600'} text-[18px]`} />
                    </div>
                    <h5 className="font-extrabold font-headline text-sm text-on-surface">{rec.label}</h5>
                  </div>
                  <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                    {result.verdict.recommendFor?.[rec.key]}
                  </p>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>
    </>
  );
}

// Attach nested sub-navigation layout
CompanyComparison.getLayout = function getLayout(page) {
  return <CompanyLayout>{page}</CompanyLayout>;
};
