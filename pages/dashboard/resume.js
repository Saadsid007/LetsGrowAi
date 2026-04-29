import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import Icon from "@/components/Icon";
import ResumePreview from "@/components/resume/ResumePreview";
import PageLoader from "@/components/PageLoader";

const BASE_SECTIONS = [
  { key: 'personal',       label: 'Personal Info', icon: 'person' },
  { key: 'summary',        label: 'Summary',        icon: 'subject' },
  { key: 'experience',     label: 'Experience',     icon: 'work' },
  { key: 'education',      label: 'Education',      icon: 'school' },
  { key: 'skills',         label: 'Skills',         icon: 'psychology' },
  { key: 'projects',       label: 'Projects',       icon: 'code' },
  { key: 'certifications', label: 'Certifications', icon: 'workspace_premium' },
];

export default function ResumeBuilder() {
  const router = useRouter();
  const { jdPointsId } = router.query;
  const [showJDModal, setShowJDModal] = useState(false);
  const [jdData, setJdData] = useState(null);

  const [activeMobileTab, setActiveMobileTab] = useState("editor");
  const [resumeData, setResumeData] = useState(null);
  const [resumeHistory, setResumeHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isSaving, setIsSaving]     = useState(false);
  const [activeSection, setActiveSection] = useState('personal');
  const [enhancing, setEnhancing]   = useState({});

  // ─── LOAD ────────────────────────────────────────────────────────────
  useEffect(() => { loadResumes(); }, []);

  const loadResumes = async () => {
    try {
      const res  = await fetch('/api/resume/all');
      const body = await res.json();
      if (body.success) {
        setResumeHistory(body.data.resumes || []);
        if (body.data.count === 0) {
          const cr  = await fetch('/api/resume/create', { method: 'POST' });
          const crb = await cr.json();
          if (crb.success) setResumeData(crb.data);
        } else {
          setResumeData(body.data.resumes[0]);
        }
      }
    } catch (e) { console.error('[loadResumes]', e); }
  };

  // ─── DEBOUNCED AUTO-SAVE ──────────────────────────────────────────────
  useEffect(() => {
    if (!resumeData) return;
    const t = setTimeout(() => doSave(resumeData), 1500);
    return () => clearTimeout(t);
  }, [resumeData]);

  const doSave = async (d) => {
    setIsSaving(true);
    try {
      await fetch(`/api/resume/${d._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: d.title, templateId: d.templateId, sections: d.sections }),
      });
    } catch (e) { console.error('[doSave]', e); }
    finally { setIsSaving(false); }
  };

  // ─── LOAD JD POINTS IF IN URL ─────────────────────────────────────────
  useEffect(() => {
    if (jdPointsId && resumeData && !jdData) {
      fetch(`/api/resume/jd-points/${jdPointsId}`)
        .then(res => res.json())
        .then(body => {
          if (body.success) {
            setJdData(body.data);
            setShowJDModal(true);
          }
        });
    }
  }, [jdPointsId, resumeData, jdData]);

  const applyJDPoints = () => {
    if (!jdData) return;
    
    setResumeData(p => {
      const next = { ...p };
      const res = jdData.result;
      
      if (res.summary && res.summary.length > 0) {
        next.sections.personal = { ...next.sections.personal, summary: res.summary };
      }
      
      if (res.skills) {
        const nextSkills = { ...next.sections.skills };
        if (res.skills.technical?.length > 0) {
          const techNames = res.skills.technical.map(s => s.name);
          nextSkills.technical = [...new Set([...(nextSkills.technical || []), ...techNames])];
        }
        if (res.skills.tools?.length > 0) {
          const toolNames = res.skills.tools.map(s => s.name);
          nextSkills.tools = [...new Set([...(nextSkills.tools || []), ...toolNames])];
        }
        if (res.skills.soft?.length > 0) {
          nextSkills.soft = [...new Set([...(nextSkills.soft || []), ...res.skills.soft])];
        }
        next.sections.skills = nextSkills;
      }
      
      if (res.projects?.length > 0) {
        const newProj = res.projects.map(pr => ({
          title: pr.name,
          description: pr.description,
          techStack: pr.techStack || [],
          bullets: pr.bullets || [],
          liveUrl: pr.liveUrl || '',
          githubUrl: pr.githubUrl || ''
        }));
        const currentProjects = next.sections.projects || [];
        const uniqueNewProj = newProj.filter(np => !currentProjects.some(cp => cp.title === np.title));
        next.sections.projects = [...currentProjects, ...uniqueNewProj];
      }
      
      if (res.experienceBullets?.length > 0 && next.sections.experience?.length > 0) {
        next.sections.experience[0].bullets = [...(next.sections.experience[0].bullets || []), ...res.experienceBullets];
      }
      
      return next;
    });
    
    setShowJDModal(false);
    router.replace('/dashboard/resume', undefined, { shallow: true });
  };

  // ─── STATE HELPERS ────────────────────────────────────────────────────
  const setPersonal = (field, val) =>
    setResumeData(p => ({ ...p, sections: { ...p.sections, personal: { ...p.sections.personal, [field]: val } } }));

  const setArr = (section, idx, field, val) =>
    setResumeData(p => {
      const arr = [...(p.sections[section] || [])];
      arr[idx] = { ...arr[idx], [field]: val };
      return { ...p, sections: { ...p.sections, [section]: arr } };
    });

  const addItem = (section, blank) =>
    setResumeData(p => ({ ...p, sections: { ...p.sections, [section]: [...(p.sections[section] || []), blank] } }));

  const removeItem = (section, idx) =>
    setResumeData(p => {
      const arr = [...(p.sections[section] || [])];
      arr.splice(idx, 1);
      return { ...p, sections: { ...p.sections, [section]: arr } };
    });

  const setSkill = (cat, val) =>
    setResumeData(p => ({
      ...p,
      sections: { ...p.sections, skills: { ...p.sections.skills, [cat]: val.split(',').map(s => s.trim()).filter(Boolean) } }
    }));

  // ─── SECTION REORDER ─────────────────────────────────────────────────
  const shiftSection = (idx, dir) => {
    const order = [...(resumeData.sections.layoutOrder || [])];
    const target = idx + dir;
    if (target < 0 || target >= order.length) return;
    [order[idx], order[target]] = [order[target], order[idx]];
    setResumeData(p => ({ ...p, sections: { ...p.sections, layoutOrder: order } }));
  };

  const toggleSection = (key) => {
    const order = [...(resumeData.sections.layoutOrder || [])];
    const next = order.includes(key) ? order.filter(k => k !== key) : [...order, key];
    setResumeData(p => ({ ...p, sections: { ...p.sections, layoutOrder: next } }));
  };

  const setSectionTitle = (key, title) => {
    setResumeData(p => ({
      ...p,
      sections: { ...p.sections, sectionTitles: { ...(p.sections.sectionTitles || {}), [key]: title } }
    }));
  };

  const addCustomSection = () => {
    const id = `custom_${Date.now()}`;
    const newSec = { id, title: 'New Section', content: '' };
    setResumeData(p => ({
      ...p,
      sections: { 
        ...p.sections, 
        customSections: [...(p.sections.customSections || []), newSec],
        layoutOrder: [...(p.sections.layoutOrder || []), id]
      }
    }));
    setActiveSection(id);
  };

  const setCustomSection = (id, field, val) => {
    setResumeData(p => {
      const arr = [...(p.sections.customSections || [])];
      const idx = arr.findIndex(x => x.id === id);
      if (idx !== -1) arr[idx] = { ...arr[idx], [field]: val };
      return { ...p, sections: { ...p.sections, customSections: arr } };
    });
  };

  const deleteCustomSection = (id) => {
    setResumeData(p => {
      const arr = (p.sections.customSections || []).filter(x => x.id !== id);
      const order = (p.sections.layoutOrder || []).filter(x => x !== id);
      return { ...p, sections: { ...p.sections, customSections: arr, layoutOrder: order } };
    });
    if (activeSection === id) setActiveSection('personal');
  };

  // ─── AI ENHANCE ──────────────────────────────────────────────────────
  const aiEnhance = async (type, extra = {}) => {
    const key = `${type}_${extra.experienceIndex ?? extra.projectIndex ?? 0}`;
    setEnhancing(p => ({ ...p, [key]: true }));
    try {
      const res  = await fetch(`/api/resume/${resumeData._id}/enhance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...extra }),
      });
      const body = await res.json();
      if (!body.success) { alert(body.error || 'AI failed'); return; }
      if (!body.aiUsed) { alert(body.warning || 'AI unavailable'); return; }
      if (type === 'summary')  setPersonal('summary', body.data.summary);
      if (type === 'bullets')  setArr('experience', extra.experienceIndex, 'bullets', body.data.enhanced);
      if (type === 'project')  setArr('projects',   extra.projectIndex,   'bullets', body.data.bullets);
    } catch (e) { alert('AI request failed.'); }
    finally { setEnhancing(p => ({ ...p, [key]: false })); }
  };

  // ─── PDF EXPORT & RESET ───────────────────────────────────────────────
  const resetResume = () => {
    if (confirm('Are you sure you want to reset all resume data? This cannot be undone.')) {
      setResumeData(p => ({
        ...p,
        sections: {
          personal: {},
          experience: [],
          education: [],
          skills: {},
          projects: [],
          certifications: [],
          customSections: [],
          sectionTitles: {},
          layoutOrder: ['personal', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications']
        }
      }));
    }
  };

  const exportPDF = async () => {
    try {
      const res  = await fetch(`/api/resume/${resumeData._id}/export-pdf`, { method: 'POST' });
      const body = await res.json();
      if (body.success && body.data?.pdfUrl) window.open(body.data.pdfUrl, '_blank');
      else alert(body.error || 'Export failed');
    } catch { alert('Export request failed.'); }
  };

  // ─── LOADING STATE ────────────────────────────────────────────────────
  if (!resumeData) return <PageLoader message="Fetching your resume data..." />;

  const layoutOrder = resumeData.sections?.layoutOrder || [];

  const allSectionsConfig = [
    ...BASE_SECTIONS.map(s => ({ ...s, label: resumeData.sections?.sectionTitles?.[s.key] || s.label })),
    ...(resumeData.sections?.customSections || []).map(cs => ({
      key: cs.id,
      label: resumeData.sections?.sectionTitles?.[cs.id] || cs.title || 'Custom Section',
      icon: 'article'
    }))
  ];

  // ─── SECTION EDITORS ─────────────────────────────────────────────────
  const renderEditor = () => {
    const exp  = resumeData.sections?.experience     || [];
    const edu  = resumeData.sections?.education      || [];
    const sk   = resumeData.sections?.skills         || {};
    const proj = resumeData.sections?.projects       || [];
    const cert = resumeData.sections?.certifications || [];

    switch (activeSection) {

      /* ── PERSONAL ── */
      case 'personal': return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { f: 'fullName', l: 'Full Name' }, { f: 'email', l: 'Email' },
            { f: 'phone',    l: 'Phone' },     { f: 'location', l: 'Location' },
            { f: 'linkedin', l: 'LinkedIn URL' }, { f: 'github', l: 'GitHub URL' },
            { f: 'portfolio', l: 'Portfolio URL' },
          ].map(({ f, l }) => (
            <div key={f} className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-outline">{l}</label>
              <input
                value={resumeData.sections.personal?.[f] || ''}
                onChange={e => setPersonal(f, e.target.value)}
                className="bg-surface-container-low border-b-2 border-transparent focus:border-primary p-3 rounded-t text-sm outline-none"
              />
            </div>
          ))}
        </div>
      );

      /* ── SUMMARY ── */
      case 'summary': return (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 bg-primary/5 border border-primary/20 p-4 rounded-xl">
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Let Cerebras AI write a powerful 3-sentence summary based on your profile, skills, and experience.
            </p>
            <button
              onClick={() => aiEnhance('summary')}
              disabled={enhancing['summary_0']}
              className="flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg shrink-0 hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-60"
            >
              <Icon name="auto_awesome" className={`text-sm ${enhancing['summary_0'] ? 'animate-spin' : ''}`} />
              {enhancing['summary_0'] ? 'Generating...' : 'AI Generate'}
            </button>
          </div>
          <textarea
            value={resumeData.sections.personal?.summary || ''}
            onChange={e => setPersonal('summary', e.target.value)}
            rows={6}
            className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary rounded-xl p-4 text-sm outline-none resize-y leading-relaxed"
            placeholder="Briefly describe your professional background, key skills, and career goals..."
          />
        </div>
      );

      /* ── EXPERIENCE ── */
      case 'experience': return (
        <div className="space-y-6">
          {exp.map((ex, idx) => (
            <div key={idx} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20 shadow-sm relative group">
              <button
                onClick={() => removeItem('experience', idx)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-error-container text-outline hover:text-error transition-all"
              ><Icon name="close" className="text-sm" /></button>

              <div className="grid grid-cols-2 gap-4 mb-5">
                {[['company','Company'], ['role','Role / Title'], ['location','Location'], ['startDate','Start (e.g. Jan 2022)'], ['endDate', 'End (or Present)']].map(([f, l]) => (
                  <div key={f} className={f === 'location' || f === 'role' ? 'col-span-2 sm:col-span-1' : ''}>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-outline block mb-1">{l}</label>
                    <input
                      value={ex[f] || ''}
                      onChange={e => setArr('experience', idx, f, e.target.value)}
                      placeholder={f === 'endDate' ? 'Present' : ''}
                      className="w-full bg-surface-container-low border-b-2 border-transparent focus:border-primary p-2.5 rounded-t text-sm outline-none"
                    />
                  </div>
                ))}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Bullet Points (one per line)</label>
                  <button
                    onClick={() => aiEnhance('bullets', { experienceIndex: idx })}
                    disabled={enhancing[`bullets_${idx}`]}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-all disabled:opacity-60"
                  >
                    <Icon name="auto_awesome" className={`text-[12px] ${enhancing[`bullets_${idx}`] ? 'animate-spin' : ''}`} />
                    {enhancing[`bullets_${idx}`] ? 'Enhancing...' : 'AI Enhance'}
                  </button>
                </div>
                <textarea
                  value={(ex.bullets || []).join('\n')}
                  onChange={e => setArr('experience', idx, 'bullets', e.target.value.split('\n'))}
                  rows={4}
                  className="w-full bg-surface-container-low border-b-2 border-transparent focus:border-primary rounded-t p-3 text-sm outline-none resize-y"
                  placeholder="Led a team of 5 engineers to ship..."
                />
              </div>
            </div>
          ))}
          <button
            onClick={() => addItem('experience', { company: '', role: '', location: '', startDate: '', endDate: '', bullets: [] })}
            className="w-full py-4 border-2 border-dashed border-outline-variant/40 rounded-xl text-primary font-bold text-sm hover:bg-primary/5 hover:border-primary/50 transition-all flex items-center justify-center gap-2"
          >
            <Icon name="add_circle" /> Add Experience
          </button>
        </div>
      );

      /* ── EDUCATION ── */
      case 'education': return (
        <div className="space-y-6">
          {edu.map((ed, idx) => (
            <div key={idx} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20 shadow-sm relative group">
              <button onClick={() => removeItem('education', idx)} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-error-container text-outline hover:text-error transition-all"><Icon name="close" className="text-sm" /></button>
              <div className="grid grid-cols-2 gap-4">
                {[['institution','Institution / University'], ['degree','Degree'], ['field','Field of Study'], ['grade','Grade / GPA'], ['startDate','Start Year'], ['endDate','End Year']].map(([f, l]) => (
                  <div key={f} className={f === 'institution' ? 'col-span-2' : ''}>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-outline block mb-1">{l}</label>
                    <input value={ed[f] || ''} onChange={e => setArr('education', idx, f, e.target.value)} className="w-full bg-surface-container-low border-b-2 border-transparent focus:border-primary p-2.5 rounded-t text-sm outline-none" />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => addItem('education', { institution: '', degree: '', field: '', grade: '', startDate: '', endDate: '' })} className="w-full py-4 border-2 border-dashed border-outline-variant/40 rounded-xl text-primary font-bold text-sm hover:bg-primary/5 hover:border-primary/50 transition-all flex items-center justify-center gap-2">
            <Icon name="add_circle" /> Add Education
          </button>
        </div>
      );

      /* ── SKILLS ── */
      case 'skills': return (
        <div className="space-y-5">
          {[
            { cat: 'technical', l: 'Technical Skills', placeholder: 'React, Node.js, Python, MongoDB...' },
            { cat: 'tools',     l: 'Tools & Platforms', placeholder: 'Docker, AWS, GitHub, Figma...' },
            { cat: 'soft',      l: 'Soft Skills',       placeholder: 'Leadership, Communication, Agile...' },
          ].map(({ cat, l, placeholder }) => (
            <div key={cat}>
              <label className="text-[10px] font-bold uppercase tracking-widest text-outline block mb-1.5">{l}</label>
              <input
                value={(sk[cat] || []).join(', ')}
                onChange={e => setSkill(cat, e.target.value)}
                placeholder={placeholder}
                className="w-full bg-surface-container-low border-b-2 border-transparent focus:border-primary p-3 rounded-t text-sm outline-none"
              />
              <p className="text-[10px] text-outline mt-1">Separate each with a comma</p>
            </div>
          ))}
        </div>
      );

      /* ── PROJECTS ── */
      case 'projects': return (
        <div className="space-y-6">
          {proj.map((pr, idx) => (
            <div key={idx} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20 shadow-sm relative group">
              <button onClick={() => removeItem('projects', idx)} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-error-container text-outline hover:text-error transition-all"><Icon name="close" className="text-sm" /></button>
              <div className="grid grid-cols-1 gap-4 mb-5">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-outline block mb-1">Project Title</label>
                  <input value={pr.title || ''} onChange={e => setArr('projects', idx, 'title', e.target.value)} className="w-full bg-surface-container-low border-b-2 border-transparent focus:border-primary p-2.5 rounded-t text-sm outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-outline block mb-1">Tech Stack (comma separated)</label>
                  <input value={(pr.techStack || []).join(', ')} onChange={e => setArr('projects', idx, 'techStack', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="w-full bg-surface-container-low border-b-2 border-transparent focus:border-primary p-2.5 rounded-t text-sm outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-outline block mb-1">Live URL</label>
                    <input value={pr.liveUrl || ''} onChange={e => setArr('projects', idx, 'liveUrl', e.target.value)} className="w-full bg-surface-container-low border-b-2 border-transparent focus:border-primary p-2.5 rounded-t text-sm outline-none" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-outline block mb-1">GitHub URL</label>
                    <input value={pr.githubUrl || ''} onChange={e => setArr('projects', idx, 'githubUrl', e.target.value)} className="w-full bg-surface-container-low border-b-2 border-transparent focus:border-primary p-2.5 rounded-t text-sm outline-none" placeholder="https://..." />
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Description / Bullet Points</label>
                  <button
                    onClick={() => aiEnhance('project', { projectIndex: idx })}
                    disabled={enhancing[`project_${idx}`]}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-all disabled:opacity-60"
                    title="Convert description into 3 strong bullet points"
                  >
                    <Icon name="auto_awesome" className={`text-[12px] ${enhancing[`project_${idx}`] ? 'animate-spin' : ''}`} />
                    {enhancing[`project_${idx}`] ? 'Rewriting...' : 'AI Format'}
                  </button>
                </div>
                <textarea
                  value={(pr.bullets || []).filter(Boolean).length > 0 ? (pr.bullets || []).join('\n') : (pr.description || '')}
                  onChange={e => {
                    const v = e.target.value;
                    if (v.includes('\n')) setArr('projects', idx, 'bullets', v.split('\n'));
                    else setArr('projects', idx, 'description', v);
                  }}
                  rows={4}
                  className="w-full bg-surface-container-low border-b-2 border-transparent focus:border-primary rounded-t p-3 text-sm outline-none resize-y"
                  placeholder="Describe what you built, or paste bullets (one per line after AI formats)..."
                />
              </div>
            </div>
          ))}
          <button onClick={() => addItem('projects', { title: '', description: '', techStack: [], bullets: [] })} className="w-full py-4 border-2 border-dashed border-outline-variant/40 rounded-xl text-primary font-bold text-sm hover:bg-primary/5 hover:border-primary/50 transition-all flex items-center justify-center gap-2">
            <Icon name="add_circle" /> Add Project
          </button>
        </div>
      );

      /* ── CERTIFICATIONS ── */
      case 'certifications': return (
        <div className="space-y-6">
          {cert.map((c, idx) => (
            <div key={idx} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20 shadow-sm relative group">
              <button onClick={() => removeItem('certifications', idx)} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-error-container text-outline hover:text-error transition-all"><Icon name="close" className="text-sm" /></button>
              <div className="grid grid-cols-2 gap-4">
                {[['name','Certificate Name'], ['issuer','Issued by'], ['issueDate','Issue Date'], ['expiryDate','Expiry Date'], ['credentialUrl','Credential URL']].map(([f, l]) => (
                  <div key={f} className={f === 'credentialUrl' || f === 'name' ? 'col-span-2' : ''}>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-outline block mb-1">{l}</label>
                    <input value={c[f] || ''} onChange={e => setArr('certifications', idx, f, e.target.value)} className="w-full bg-surface-container-low border-b-2 border-transparent focus:border-primary p-2.5 rounded-t text-sm outline-none" />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => addItem('certifications', { name: '', issuer: '', issueDate: '', expiryDate: '', credentialUrl: '' })} className="w-full py-4 border-2 border-dashed border-outline-variant/40 rounded-xl text-primary font-bold text-sm hover:bg-primary/5 hover:border-primary/50 transition-all flex items-center justify-center gap-2">
            <Icon name="add_circle" /> Add Certification
          </button>
        </div>
      );

      default: {
        if (activeSection.startsWith('custom_')) {
          const cs = (resumeData.sections?.customSections || []).find(x => x.id === activeSection);
          if (!cs) return null;
          return (
            <div className="space-y-4">
              <div className="flex justify-end mb-2">
                 <button onClick={() => deleteCustomSection(cs.id)} className="text-xs text-error font-bold flex items-center gap-1 hover:underline"><Icon name="delete" className="text-sm" /> Delete Section</button>
              </div>
              <textarea
                value={cs.content || ''}
                onChange={e => setCustomSection(cs.id, 'content', e.target.value)}
                rows={10}
                className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary rounded-xl p-4 text-sm outline-none resize-y leading-relaxed"
                placeholder="Enter section content (e.g. Volunteer Work, Publications, Hobbies)..."
              />
            </div>
          );
        }
        return (
          <p className="text-on-surface-variant text-sm">Select a section from the left panel.</p>
        );
      }
    }
  };

  // ────────────────────────────────────────────────────────────────────
  return (
    <>
      {showJDModal && jdData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Apply Generated JD Points?</h2>
            <p className="text-sm text-slate-600 mb-6">
              We found tailored points for <strong>{jdData.jdAnalysis?.detectedRole}</strong>. 
              Would you like to merge the summary, skills, and projects into your current resume?
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowJDModal(false);
                  router.replace('/dashboard/resume', undefined, { shallow: true });
                }} 
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                No, skip
              </button>
              <button 
                onClick={applyJDPoints}
                className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-xl transition-colors shadow-sm flex items-center gap-2"
              >
                <Icon name="auto_awesome" className="text-sm" /> Apply Points
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">Exported Resumes</h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-700">
                <Icon name="close" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar">
              {resumeHistory.filter(r => r.pdfUrl).length === 0 ? (
                <p className="text-sm text-slate-500">No exported resumes found.</p>
              ) : (
                resumeHistory.filter(r => r.pdfUrl).map((r, i) => (
                  <div key={r._id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors bg-slate-50">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{r.title || `Resume ${i + 1}`}</p>
                      <p className="text-xs text-slate-500">Updated: {new Date(r.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <a href={r.pdfUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1">
                      <Icon name="download" className="text-sm" /> Download
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <Head>
        <title>Resume Builder | LetsGrowAI</title>
      </Head>

      {/* ══ LEFT: Layout & Theme panel ══ */}
      <aside className={`bg-surface-container-low flex flex-col overflow-y-auto custom-scrollbar transition-all duration-300 absolute lg:relative z-30 lg:z-auto h-full ${activeMobileTab === "tools" ? "w-full inset-0" : "-translate-x-full lg:translate-x-0 lg:w-[280px]"}`}>
        <div className="p-6 pb-24 lg:pb-8 space-y-8">

          {/* Sections reorder list */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface opacity-60 mb-4 flex items-center gap-2">
              <Icon name="layers" className="text-sm" /> Layout Order
            </h3>
            <ul className="space-y-1.5">
              {layoutOrder.map((key, idx) => {
                const def = allSectionsConfig.find(s => s.key === key);
                if (!def) return null;
                const active = activeSection === key;
                return (
                  <li key={key}
                    onClick={() => setActiveSection(key)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${active ? 'bg-primary text-on-primary shadow shadow-primary/20' : 'hover:bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'}`}
                  >
                    <span className="flex items-center gap-2.5 text-[13px] font-medium truncate pr-2">
                      <Icon name={def.icon} className="text-[17px] opacity-80 shrink-0" />
                      <span className="truncate">{def.label}</span>
                    </span>
                    <div className={`flex items-center gap-0.5 shrink-0 ${active ? 'text-on-primary/70' : 'text-outline'}`}>
                      {idx > 0 && <button onClick={e => { e.stopPropagation(); shiftSection(idx, -1); }} className={`p-0.5 rounded hover:${active ? 'bg-white/20' : 'bg-surface-container-low'}`}><Icon name="arrow_upward" className="text-[13px]" /></button>}
                      {idx < layoutOrder.length - 1 && <button onClick={e => { e.stopPropagation(); shiftSection(idx, 1); }} className={`p-0.5 rounded hover:${active ? 'bg-white/20' : 'bg-surface-container-low'}`}><Icon name="arrow_downward" className="text-[13px]" /></button>}
                      {key !== 'personal' && <button onClick={e => { e.stopPropagation(); toggleSection(key); }} className="p-0.5 ml-1 rounded hover:text-error" title="Hide"><Icon name="visibility_off" className="text-[13px]" /></button>}
                    </div>
                  </li>
                );
              })}
            </ul>

            <button onClick={addCustomSection} className="w-full mt-3 py-2.5 border border-dashed border-outline-variant/40 rounded-xl text-primary font-bold text-[11px] uppercase tracking-wider hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
              <Icon name="add" className="text-sm" /> Add Custom Section
            </button>

            {/* Hidden sections re-add */}
            {allSectionsConfig.filter(s => !layoutOrder.includes(s.key)).length > 0 && (
              <div className="mt-5 pt-4 border-t border-outline-variant/20">
                <p className="text-[10px] font-bold uppercase text-outline mb-2">Hidden — Click to Restore</p>
                <div className="flex flex-wrap gap-2">
                  {allSectionsConfig.filter(s => !layoutOrder.includes(s.key)).map(s => (
                    <button key={s.key} onClick={() => toggleSection(s.key)} className="px-3 py-1.5 text-xs rounded-full border border-outline-variant/30 text-outline hover:border-primary hover:text-primary hover:bg-primary/5 flex items-center gap-1 transition-all">
                      <Icon name="add" className="text-[11px]" /> {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Theme picker */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface opacity-60 mb-4">Resume Theme</h3>
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
              {[
                { id: 'ats-friendly', label: 'ATS Friendly', desc: 'Traditional, safe for scanners' },
                { id: 'clean',        label: 'Clean',         desc: 'Minimal, whitespace-first' },
                { id: 'modern',       label: 'Modern',        desc: 'Blue accents, bold headers' },
              ].map(t => (
                <div key={t.id}
                  onClick={() => setResumeData(p => ({ ...p, templateId: t.id }))}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${resumeData.templateId === t.id ? 'border-primary bg-primary/5' : 'border-outline-variant/20 hover:border-primary/40 bg-surface-container-lowest'}`}
                >
                  <div className={`text-xs font-bold ${resumeData.templateId === t.id ? 'text-primary' : 'text-on-surface'}`}>{t.label}</div>
                  <div className="text-[10px] text-on-surface-variant mt-0.5 hidden lg:block">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ══ CENTER: Form Editor ══ */}
      <section className={`flex-1 bg-surface flex flex-col overflow-hidden relative z-20 ${activeMobileTab === "editor" ? "flex" : "hidden lg:flex"}`}>
        <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-32 custom-scrollbar">
          <div className="max-w-2xl mx-auto">

            {/* Header */}
            <div className="mb-8">
              <span className="text-primary text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-1">
                <span className="w-5 h-[2px] bg-primary rounded-full inline-block" /> Editor
              </span>
              <div className="flex items-center justify-between">
                {activeSection !== 'personal' ? (
                  <input
                    value={resumeData.sections?.sectionTitles?.[activeSection] !== undefined ? resumeData.sections.sectionTitles[activeSection] : (allSectionsConfig.find(s => s.key === activeSection)?.label || '')}
                    onChange={e => setSectionTitle(activeSection, e.target.value)}
                    className="text-3xl lg:text-4xl font-extrabold font-headline text-on-surface bg-transparent border-b-2 border-transparent hover:border-outline-variant focus:border-primary outline-none transition-all w-2/3"
                    placeholder="Section Title"
                  />
                ) : (
                  <h2 className="text-3xl lg:text-4xl font-extrabold font-headline text-on-surface capitalize">
                    {allSectionsConfig.find(s => s.key === activeSection)?.label || activeSection}
                  </h2>
                )}
                {isSaving && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    <Icon name="sync" className="text-[12px] animate-spin" /> Saving...
                  </span>
                )}
              </div>
            </div>

            {renderEditor()}
          </div>
        </div>
      </section>

      {/* ══ RIGHT: Live Preview ══ */}
      <aside className={`bg-surface-container-low flex flex-col p-4 md:p-6 overflow-hidden transition-all absolute inset-0 z-40 lg:relative lg:z-auto h-full ${activeMobileTab === "preview" ? "flex" : "hidden xl:flex xl:w-[460px]"}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-on-surface flex items-center gap-2 font-headline">
            <Icon name="visibility" className="text-outline" /> Live Preview
          </h3>
          <div className="flex gap-2">
            <button onClick={() => setActiveMobileTab("editor")} className="xl:hidden p-1.5 rounded-lg bg-surface-container-lowest hover:text-primary">
              <Icon name="close" />
            </button>
            <button onClick={() => setShowHistoryModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold text-outline hover:bg-surface-container-high transition-colors hidden md:flex">
              <Icon name="history" className="text-[16px]" /> History
            </button>
            <button onClick={resetResume} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold text-error hover:bg-error/10 transition-colors hidden md:flex" title="Clear all resume data">
              <Icon name="restart_alt" className="text-[16px]" /> Reset
            </button>
            <button onClick={exportPDF} className="flex items-center gap-1.5 bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:scale-95 transition-all">
              <Icon name="download" className="text-sm" /> Export PDF
            </button>
          </div>
        </div>

        <ResumePreview data={resumeData} />
      </aside>

      {/* ══ MOBILE NAV ══ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container-lowest border-t border-outline-variant/20 flex z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.06)]">
        {[
          { tab: 'tools',   label: 'Layout',  icon: 'layers' },
          { tab: 'editor',  label: 'Edit',    icon: 'edit_document' },
          { tab: 'preview', label: 'Preview', icon: 'visibility' },
        ].map(({ tab, label, icon }) => (
          <button key={tab} onClick={() => setActiveMobileTab(tab)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${activeMobileTab === tab ? 'text-primary' : 'text-on-surface-variant'}`}
          >
            <Icon name={icon} className="text-[22px]" filled={activeMobileTab === tab} />
            <span className="text-[10px] font-bold tracking-wide">{label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

ResumeBuilder.getLayout = function getLayout(page) {
  return <WorkspaceLayout>{page}</WorkspaceLayout>;
};
