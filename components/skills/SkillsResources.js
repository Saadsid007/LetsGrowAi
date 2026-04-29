import { useState } from "react";
import Icon from "@/components/Icon";

export default function SkillsResources({ missingSkills, company }) {
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [resources, setResources] = useState({});
  const [loading, setLoading] = useState(false);

  const toggleSkill = (skill) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const fetchResources = async () => {
    if (selectedSkills.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/skills/fetch-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: selectedSkills, company }),
      });
      const data = await res.json();
      if (data.success) setResources(data.resources || {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getIcon = (type) => {
    if (type === "video") return { name: "smart_display", color: "text-red-500" };
    if (type === "course") return { name: "school", color: "text-amber-500" };
    if (type === "docs") return { name: "description", color: "text-blue-500" };
    if (type === "practice") return { name: "code", color: "text-emerald-500" };
    return { name: "link", color: "text-primary" };
  };

  const hasResults = Object.keys(resources).length > 0;

  return (
    <div className="pt-10 border-t border-outline-variant/20">
      <h3 className="font-extrabold text-2xl md:text-3xl mb-2 font-headline text-on-surface tracking-tight">
        Learning Resources
      </h3>
      <p className="text-sm text-on-surface-variant mb-6">Select which missing skills you want resources for, then click search.</p>

      {/* Skill Selector */}
      <div className="flex flex-wrap gap-2.5 mb-6">
        {missingSkills.map((s, i) => {
          const isSelected = selectedSkills.includes(s.skill);
          return (
            <button
              key={i}
              onClick={() => toggleSkill(s.skill)}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                isSelected 
                  ? "bg-primary text-on-primary border-primary shadow-md" 
                  : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/20 hover:border-primary/40"
              }`}
            >
              {isSelected && <Icon name="check" className="text-[14px] mr-1 inline" />}
              {s.skill}
            </button>
          );
        })}
      </div>

      <button
        onClick={fetchResources}
        disabled={selectedSkills.length === 0 || loading}
        className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:-translate-y-0.5 active:scale-[0.99] transition-all shadow-md flex items-center gap-2 font-headline text-sm disabled:opacity-50 disabled:pointer-events-none mb-8"
      >
        {loading ? "Searching..." : `Find Resources (${selectedSkills.length})`}
        {!loading && <Icon name="search" className="text-[18px]" />}
      </button>

      {/* Resource Cards */}
      {hasResults && (
        <div className="space-y-6">
          {Object.entries(resources).map(([skill, resList]) => (
            resList.length > 0 && (
              <div key={skill} className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden hover:shadow-md transition-shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2.5 py-1 bg-error-container text-on-error-container text-[9px] font-extrabold rounded-md uppercase tracking-widest">Missing</span>
                  <h4 className="text-lg font-extrabold font-headline text-on-surface">Master {skill}</h4>
                </div>
                <div className="flex flex-wrap gap-3">
                  {resList.map((r, rIdx) => {
                    const icon = getIcon(r.type);
                    return (
                      <a key={rIdx} href={r.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs font-bold font-headline text-on-surface-variant hover:text-primary hover:bg-primary/5 bg-surface-container px-4 py-2.5 rounded-lg transition-colors border border-outline-variant/20 max-w-[220px]"
                      >
                        <Icon name={icon.name} className={`text-[16px] ${icon.color} shrink-0`} />
                        <span className="truncate">{r.title || r.domain}</span>
                      </a>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant mt-4 pt-4 border-t border-outline-variant/10">
                  <Icon name="schedule" className="text-primary text-[16px]" />
                  <span className="text-xs font-semibold">{resList[0]?.estimatedTime || "~2 weeks"}</span>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
