import Icon from "@/components/Icon";

export default function ProgressSidebar({ roadmap }) {
  const p = roadmap?.progress || {};
  const pct = p.percentComplete || 0;
  const streak = p.currentStreak || 0;
  const circumference = 2 * Math.PI * 76; // r=76
  const offset = circumference - (pct / 100) * circumference;

  // Find next milestone
  const nextMilestone = roadmap?.weeks?.find(w => !w.completed && w.milestone);

  return (
    <aside className="w-full xl:w-80 shrink-0 space-y-6">
      
      {/* Progress Ring */}
      <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-[0_10px_40px_rgba(15,23,42,0.03)] border border-outline-variant/5 flex flex-col items-center justify-center text-center">
        <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-8 font-headline">Overall Progress</h3>
        
        <div className="relative w-44 h-44 mb-8 drop-shadow-xl">
          <svg className="w-full h-full transform -rotate-90">
            <circle className="text-[#eaedff]" cx="88" cy="88" fill="transparent" r="76" stroke="currentColor" strokeWidth="12"></circle>
            <circle 
               className="text-primary transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(0,55,176,0.4)]" 
               cx="88" cy="88" fill="transparent" r="76" stroke="currentColor" 
               strokeDasharray={circumference}
               strokeDashoffset={offset}
               strokeLinecap="round" 
               strokeWidth="12"
            ></circle>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-extrabold font-headline mb-0.5">{pct}%</span>
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em] font-headline">Done</span>
          </div>
        </div>
        
        <div className="w-full pt-6 border-t border-outline-variant/10">
          <p className="text-xs text-on-surface-variant font-medium">
            {p.completedTopics || 0} of {p.totalTopics || 0} topics completed
          </p>
        </div>
      </div>

      {/* Streak Card */}
      <div className="bg-inverse-surface rounded-3xl p-8 text-white overflow-hidden relative shadow-2xl border border-[#3b4b6b]">
        <div className="absolute -right-6 -bottom-6 opacity-[0.03]">
          <Icon name="local_fire_department" className="text-[180px]" filled />
        </div>
        
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center shadow-inner border border-secondary-container/30">
            <Icon name="local_fire_department" className="text-secondary-fixed text-[24px]" filled />
          </div>
          <div>
            <div className="text-3xl font-extrabold font-headline leading-none text-white drop-shadow-md">{streak} day</div>
            <div className="text-xs text-white/60 font-bold uppercase tracking-widest mt-1 font-headline">Learning Streak</div>
          </div>
        </div>
        
        <div className="flex gap-2 mt-2 relative z-10">
          {[...Array(7)].map((_, i) => (
            <div key={i} className={`flex-1 h-2 rounded-full ${i < Math.min(streak, 7) ? 'bg-secondary-container shadow-[0_0_8px_rgba(33,112,228,0.5)]' : 'bg-white/10 border border-white/5'}`}></div>
          ))}
        </div>
      </div>

      {/* Next Milestone */}
      {nextMilestone && (
        <div className="bg-[#366175]/10 border-2 border-[#366175]/20 rounded-3xl p-8 hover:bg-[#366175]/15 transition-colors cursor-pointer group">
          <h3 className="text-[10px] font-extrabold text-tertiary-container uppercase tracking-widest mb-4 font-headline">Next Milestone</h3>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-extrabold font-headline text-tertiary-container">Week {nextMilestone.weekNumber}</span>
              <p className="text-xs text-tertiary-container/80 font-bold mt-1">{nextMilestone.milestone}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-tertiary-container/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon name="emoji_events" className="text-tertiary-container text-[28px]" />
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Projects */}
      {roadmap?.portfolioProjects?.length > 0 && (
        <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10 shadow-sm">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4 font-headline">Portfolio Projects</h3>
          <ul className="space-y-3">
            {roadmap.portfolioProjects.map((proj, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-on-surface-variant">
                <Icon name="code" className="text-primary text-[16px] mt-0.5 shrink-0" />
                <span>{proj}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
