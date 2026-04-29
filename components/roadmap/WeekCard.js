import Icon from "@/components/Icon";

export default function WeekCard({ week, onToggleTopic, onFetchResources }) {
  const completedCount = week.topics?.filter(t => t.completed).length || 0;
  const totalCount = week.topics?.length || 0;
  const isComplete = week.completed || (totalCount > 0 && completedCount === totalCount);
  const isInProgress = completedCount > 0 && !isComplete;

  return (
    <div className={`bg-white rounded-2xl p-6 md:p-8 relative overflow-hidden group border ${isComplete ? 'shadow-sm border-outline-variant/10' : isInProgress ? 'shadow-[0_15px_40px_rgba(33,112,228,0.08)] border-2 border-secondary-container/20' : 'shadow-sm border-outline-variant/10'}`}>
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-2.5 ${isComplete ? 'bg-primary' : isInProgress ? 'bg-secondary-container shadow-[0_0_15px_rgba(33,112,228,0.5)]' : 'bg-outline-variant/20'}`}></div>

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold font-headline uppercase tracking-widest border ${isComplete ? 'bg-primary/5 text-primary border-primary/20' : isInProgress ? 'bg-secondary-fixed text-on-secondary-fixed border-secondary-container/20' : 'bg-surface-container text-on-surface-variant border-outline-variant/10'}`}>
            Week {week.weekNumber}
          </span>
          <h3 className="text-lg font-extrabold font-headline tracking-tight text-on-surface">{week.title}</h3>
        </div>
        {isComplete && <Icon name="check_circle" className="text-primary text-[24px]" filled />}
        {isInProgress && (
          <span className="text-[10px] font-extrabold text-secondary-container bg-secondary-fixed/50 px-3 py-1.5 rounded-full font-headline uppercase tracking-widest shadow-sm">
            IN PROGRESS
          </span>
        )}
      </div>

      {/* Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div>
          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 border-b-2 border-secondary/20 inline-block pb-1 font-headline">Key Topics</h4>
          <ul className="space-y-2.5 mt-1">
            {week.topics?.map((topic, i) => (
              <li key={i} onClick={() => onToggleTopic?.(week.weekNumber, topic.name)}
                className="flex items-center gap-3 text-sm font-medium text-on-surface-variant cursor-pointer hover:text-on-surface transition-colors group/topic">
                <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${topic.completed ? 'bg-primary border-primary text-white' : 'border-outline-variant/40 group-hover/topic:border-primary/50'}`}>
                  {topic.completed && <Icon name="check" className="text-[14px]" />}
                </span>
                <span className={topic.completed ? 'line-through opacity-60' : ''}>{topic.name}</span>
                {topic.estimatedHours && <span className="text-[10px] text-outline-variant ml-auto">{topic.estimatedHours}h</span>}
              </li>
            ))}
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 border-b-2 border-secondary/20 inline-block pb-1 font-headline">Resources</h4>
          {week.topics?.some(t => t.resources?.length > 0) ? (
            <div className="space-y-2 mt-1">
              {week.topics.filter(t => t.resources?.length > 0).flatMap(t => t.resources).slice(0, 4).map((r, i) => (
                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-primary font-bold hover:underline bg-primary/5 p-2.5 rounded-lg transition-colors border border-primary/10">
                  <Icon name={r.type === 'video' ? 'play_circle' : 'menu_book'} className="text-[18px]" />
                  <span className="truncate flex-1">{r.title}</span>
                  <span className="text-[9px] text-outline-variant shrink-0">{r.platform}</span>
                </a>
              ))}
            </div>
          ) : (
            <button onClick={() => onFetchResources?.(week.topics?.map(t => t.name) || [])}
              className="mt-1 w-full py-3 rounded-xl border-2 border-dashed border-primary/20 text-primary text-xs font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
              <Icon name="search" className="text-[16px]" /> Fetch Resources for this Week
            </button>
          )}
        </div>
      </div>

      {/* Footer: Project + Milestone */}
      {(week.weeklyProject || week.milestone) && (
        <div className="mt-6 pt-4 border-t border-outline-variant/10 flex flex-wrap items-center gap-4">
          {week.weeklyProject && (
            <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant font-headline uppercase tracking-wide">
              <Icon name="terminal" className="text-[16px] text-slate-400" /> {week.weeklyProject}
            </div>
          )}
          {week.milestone && (
            <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant font-headline uppercase tracking-wide">
              <Icon name="emoji_events" className="text-[16px] text-amber-500" /> {week.milestone}
            </div>
          )}
        </div>
      )}

      {week.replanningNote && (
        <div className="mt-3 text-[11px] text-on-surface-variant italic bg-surface-container-low rounded-lg p-3">
          ⚡ {week.replanningNote}
        </div>
      )}
    </div>
  );
}
