import Icon from "@/components/Icon";

export default function SkillsResultCard({ gapScore, summaryNote, matchPct, partialPct, missingPct, aiWarning }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (gapScore / 100) * circumference;

  return (
    <div className="bg-inverse-surface text-on-primary-fixed rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl border border-outline-variant/10 group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-primary/30 transition-colors duration-1000" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-[60px] pointer-events-none" />
      
      {aiWarning && (
        <div className="absolute top-4 right-4 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 z-20">
          <Icon name="warning" className="text-[12px]" /> Single AI Mode
        </div>
      )}

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative w-32 h-32 flex-shrink-0 drop-shadow-xl">
            <svg className="w-full h-full transform -rotate-90">
              <circle className="text-white/10" cx="64" cy="64" fill="transparent" r={radius} stroke="currentColor" strokeWidth="12" />
              <circle 
                className="text-primary-fixed-dim drop-shadow-[0_0_8px_rgba(183,196,255,0.4)] transition-all duration-1000 ease-out" 
                cx="64" cy="64" fill="transparent" r={radius} stroke="currentColor" 
                strokeDasharray={circumference} strokeDashoffset={offset}
                strokeWidth="12" strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-extrabold text-white font-headline">{gapScore}<span className="text-lg opacity-70">%</span></span>
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-3 font-headline leading-tight">
              You&apos;re {gapScore}% ready for this role
            </h3>
            <p className="text-primary-fixed-dim max-w-xl mb-6 text-sm md:text-base leading-relaxed font-body font-medium">
              {summaryNote || "Analysis complete."}
            </p>
            <div className="w-full max-w-xl h-3 md:h-4 bg-white/10 rounded-full flex overflow-hidden shadow-inner border border-white/5">
              <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${matchPct}%` }} />
              <div className="h-full bg-amber-400 transition-all duration-1000" style={{ width: `${partialPct}%` }} />
              <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${missingPct}%` }} />
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6 mt-4 text-[9px] md:text-[10px] font-extrabold uppercase tracking-widest text-white/60 font-headline">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Matched ({Math.round(matchPct)}%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Partial ({Math.round(partialPct)}%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Missing ({Math.round(missingPct)}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
