import { useState, useEffect, useRef } from "react";
import Icon from "@/components/Icon";

// Common tech skills for autocomplete suggestions
const PREDEFINED_SKILLS = [
  "JavaScript","TypeScript","Python","Java","C++","C#","Go","Rust","Ruby","PHP","Swift","Kotlin",
  "React","Next.js","Vue.js","Angular","Svelte","Node.js","Express.js","Django","Flask","Spring Boot",
  "HTML","CSS","Tailwind CSS","Bootstrap","SASS","Material UI",
  "MongoDB","PostgreSQL","MySQL","Redis","Firebase","Supabase","DynamoDB",
  "Docker","Kubernetes","AWS","GCP","Azure","Terraform","CI/CD","Jenkins","GitHub Actions",
  "Git","Linux","Nginx","GraphQL","REST API","WebSockets","gRPC",
  "React Native","Flutter","Electron",
  "TensorFlow","PyTorch","Machine Learning","Deep Learning","NLP","Computer Vision",
  "System Design","Data Structures","Algorithms","OOP","Design Patterns","Microservices",
  "SQL","NoSQL","Prisma","Mongoose","Sequelize",
  "Jest","Cypress","Selenium","Mocha","Testing",
  "Figma","UI/UX","Responsive Design",
  "Agile","Scrum","Jira","Confluence",
  "Blockchain","Solidity","Web3",
  "RabbitMQ","Kafka","ElasticSearch","Prometheus","Grafana"
];

export default function SkillsPopup({ isOpen, onClose, currentSkills, onSkillAdded }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return; }
    const lower = query.toLowerCase();
    const filtered = PREDEFINED_SKILLS.filter(s =>
      s.toLowerCase().includes(lower) &&
      !currentSkills.some(cs => cs.toLowerCase() === s.toLowerCase())
    ).slice(0, 8);
    setSuggestions(filtered);
  }, [query, currentSkills]);

  const addSkill = async (skillName) => {
    const trimmed = skillName.trim();
    if (!trimmed || currentSkills.some(s => s.toLowerCase() === trimmed.toLowerCase())) return;
    setAdding(true);
    try {
      const res = await fetch("/api/skills/add-skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: trimmed }),
      });
      const data = await res.json();
      if (data.success) {
        onSkillAdded(data.skills);
        setQuery("");
        setSuggestions([]);
      }
    } catch (e) { console.error(e); }
    finally { setAdding(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && query.trim()) {
      e.preventDefault();
      addSkill(query);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg border border-outline-variant/20 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/15">
          <div>
            <h3 className="text-xl font-extrabold font-headline text-on-surface">Add Skills</h3>
            <p className="text-xs text-on-surface-variant mt-1">Type to search or press Enter to add</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors">
            <Icon name="close" className="text-on-surface-variant" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 pb-3">
          <div className="relative">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. React, Docker, Python..."
              className="w-full pl-12 pr-4 py-3.5 bg-surface-container border-2 border-outline-variant/15 focus:border-primary/40 rounded-xl text-on-surface outline-none transition-all text-sm font-medium"
              disabled={adding}
            />
          </div>

          {/* Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div className="mt-2 border border-outline-variant/15 rounded-xl overflow-hidden bg-surface-container-lowest shadow-lg max-h-52 overflow-y-auto custom-scrollbar">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => addSkill(s)}
                  className="w-full text-left px-4 py-3 hover:bg-primary/5 text-sm font-medium text-on-surface transition-colors flex items-center justify-between border-b border-outline-variant/5 last:border-0"
                >
                  {s}
                  <Icon name="add" className="text-primary text-[18px]" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Current Skills */}
        <div className="px-6 pb-6">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Your Skills ({currentSkills.length})</p>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar">
            {currentSkills.map(skill => (
              <span key={skill} className="px-3 py-1.5 bg-primary/10 text-primary font-bold text-xs rounded-full border border-primary/15">
                {skill}
              </span>
            ))}
            {currentSkills.length === 0 && (
              <p className="text-sm text-on-surface-variant">No skills added yet. Start typing above!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
