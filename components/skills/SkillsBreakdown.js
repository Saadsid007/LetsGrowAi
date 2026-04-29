import { useState } from "react";
import Icon from "@/components/Icon";

export default function SkillsBreakdown({ matchedSkills, partialSkills, missingSkills, onAddSkillToProfile }) {
  const [addingSkill, setAddingSkill] = useState(null);

  const handleAdd = async (skillName) => {
    setAddingSkill(skillName);
    await onAddSkillToProfile(skillName);
    setAddingSkill(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
      {/* Column 1: Have */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-outline-variant/20">
          <Icon name="check_circle" className="text-emerald-500 text-[20px]" filled />
          <h4 className="font-extrabold text-sm uppercase tracking-wide font-headline">Skills You Have</h4>
          <span className="ml-auto text-xs text-on-surface-variant font-bold">{matchedSkills.length}</span>
        </div>
        <div className="space-y-3">
          {matchedSkills.length === 0 ? (
            <div className="text-sm text-on-surface-variant p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/10 text-center">No fully matched skills.</div>
          ) : matchedSkills.map((s, i) => (
            <div key={i} className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between group hover:shadow-md transition-shadow border border-outline-variant/10 border-l-4 border-l-emerald-500">
              <span className="font-bold text-[13px] md:text-sm text-on-surface font-headline">{s.skill}</span>
              <Icon name="task_alt" className="text-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>

      {/* Column 2: Partial */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-outline-variant/20">
          <Icon name="warning" className="text-amber-500 text-[20px]" filled />
          <h4 className="font-extrabold text-sm uppercase tracking-wide font-headline">Partial Match</h4>
          <span className="ml-auto text-xs text-on-surface-variant font-bold">{partialSkills.length}</span>
        </div>
        <div className="space-y-3">
          {partialSkills.length === 0 ? (
            <div className="text-sm text-on-surface-variant p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/10 text-center">No partial matches.</div>
          ) : partialSkills.map((s, i) => (
            <div key={i} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 border-l-4 border-l-amber-400 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-[13px] md:text-sm font-headline text-on-surface">{s.skill}</span>
                <span className="px-2 py-1 bg-amber-100 text-amber-800 text-[9px] font-extrabold rounded uppercase tracking-widest leading-none">Review</span>
              </div>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed font-body">{s.note || "Deepen your knowledge."}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Column 3: Missing */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-outline-variant/20">
          <Icon name="error" className="text-error text-[20px]" filled />
          <h4 className="font-extrabold text-sm uppercase tracking-wide font-headline">Missing Skills</h4>
          <span className="ml-auto text-xs text-on-surface-variant font-bold">{missingSkills.length}</span>
        </div>
        <div className="space-y-3">
          {missingSkills.length === 0 ? (
            <div className="text-sm text-on-surface-variant p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/10 text-center">No missing skills!</div>
          ) : missingSkills.map((s, i) => (
            <div key={i} className={`bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between group hover:shadow-md transition-shadow border border-outline-variant/10 ${s.priority === 'high' ? 'bg-error-container/10 border-error/20 border-l-4 border-l-error' : ''}`}>
              <div>
                <span className={`font-bold text-[13px] md:text-sm block font-headline ${s.priority === 'high' ? 'text-error mb-1' : 'text-on-surface'}`}>{s.skill}</span>
                {s.priority === 'high' && <span className="text-[9px] text-error font-extrabold uppercase tracking-widest opacity-80">Priority: High</span>}
              </div>
              <button 
                onClick={() => handleAdd(s.skill)} 
                disabled={addingSkill === s.skill}
                className="p-1 hover:bg-primary/10 rounded-full transition-colors disabled:opacity-50"
                title="Add to my profile"
              >
                {addingSkill === s.skill ? (
                  <Icon name="hourglass_empty" className="text-primary animate-spin" />
                ) : (
                  <Icon name="add_circle" className="text-outline-variant group-hover:text-primary transition-colors cursor-pointer" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
