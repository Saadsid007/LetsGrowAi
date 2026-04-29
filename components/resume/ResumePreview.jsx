import React from 'react';

export default function ResumePreview({ data }) {
  if (!data) return (
    <div className="flex-1 flex items-center justify-center opacity-50 text-sm text-on-surface-variant">
      Loading preview...
    </div>
  );

  const s = data.sections || {};
  const personal = s.personal || {};
  const experience = s.experience || [];
  const education = s.education || [];
  const skills = s.skills || {};
  const projects = s.projects || [];
  const certifications = s.certifications || [];
  const customSections = s.customSections || [];
  const sectionTitles = s.sectionTitles || {};
  const layoutOrder = s.layoutOrder || ['personal', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications'];
  const theme = data.templateId || 'ats-friendly';

  // Reference to measure container height
  const containerRef = React.useRef(null);
  React.useEffect(() => {
    if (containerRef.current) {
      // Very rough A4 page equivalent in pixels (assuming ~1000px height for preview)
      const isOverflowing = containerRef.current.scrollHeight > 1120;
      if (isOverflowing && experience.length === 0) {
        // Find a way to alert safely without spamming
        if (!window.__resumeOverflowAlerted) {
          alert('Note: Your content is exceeding 1 page, but you have not added any Experience. It is highly recommended to keep your resume to 1 page if you lack professional experience.');
          window.__resumeOverflowAlerted = true;
        }
      }
    }
  });

  const themeStyles = {
    clean: {
      bg: 'bg-white',
      font: 'font-sans',
      name: 'text-[#2b2b2b] text-xl font-light tracking-wide',
      header: 'text-[#2b2b2b] font-semibold text-[10px] uppercase tracking-wider border-b border-[#e0e0e0] pb-1 mb-2',
      accent: 'text-[#555]',
    },
    modern: {
      bg: 'bg-[#fafafa]',
      font: 'font-sans',
      name: 'text-[#1a1a1a] text-2xl font-bold tracking-tight',
      header: 'text-[#2563eb] font-bold text-[10px] uppercase tracking-widest border-b-2 border-[#2563eb]/20 pb-1 mb-2',
      accent: 'text-[#2563eb]',
    },
    'ats-friendly': {
      bg: 'bg-white',
      font: 'font-serif',
      name: 'text-black text-2xl font-bold',
      header: 'text-black font-bold text-[11px] uppercase border-b-[1.5px] border-black pb-0.5 mb-1.5',
      accent: 'text-black',
    },
  };

  const style = themeStyles[theme] || themeStyles['ats-friendly'];

  const renderSection = (sectionKey) => {
    switch (sectionKey) {
      case 'personal':
        return null; // rendered at top always

      case 'experience':
        if (!experience.length) return null;
        return (
          <div key="experience" className="mb-4">
            <div className={style.header}>{sectionTitles['experience'] || 'Experience'}</div>
            <div className="space-y-3">
              {experience.map((exp, idx) => (
                <div key={idx}>
                  <div className="flex justify-between font-bold text-slate-900 text-[10.5px]">
                    <span>{exp.company}</span>
                    <span className="font-normal text-slate-600">{exp.startDate} {exp.startDate ? '–' : ''} {exp.endDate || (exp.startDate ? 'Present' : '')}</span>
                  </div>
                  <div className="italic text-slate-700 text-[9.5px] mb-0.5">
                    {exp.role}
                    {exp.location ? <span className="not-italic opacity-70 ml-1">| {exp.location}</span> : null}
                  </div>
                  {exp.bullets && exp.bullets.filter(Boolean).length > 0 && (
                    <ul className="list-disc pl-3.5 space-y-[2px] text-slate-700 text-[9px] mt-1">
                      {exp.bullets.filter(Boolean).map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'education':
        if (!education.length) return null;
        return (
          <div key="education" className="mb-4">
            <div className={style.header}>{sectionTitles['education'] || 'Education'}</div>
            <div className="space-y-2">
              {education.map((edu, idx) => (
                <div key={idx} className="flex justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-[10.5px]">{edu.institution}</div>
                    <div className="text-slate-700 text-[9.5px]">
                      {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                    </div>
                    {edu.grade && <div className="text-slate-500 text-[9px]">Grade: {edu.grade}</div>}
                  </div>
                  <div className="text-slate-800 text-[10px] shrink-0 ml-2">
                    {edu.startDate} {edu.startDate ? '–' : ''} {edu.endDate || (edu.startDate ? 'Present' : '')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'skills': {
        const hasTech = skills.technical && skills.technical.length > 0;
        const hasTools = skills.tools && skills.tools.length > 0;
        const hasSoft = skills.soft && skills.soft.length > 0;
        if (!hasTech && !hasTools && !hasSoft) return null;
        return (
          <div key="skills" className="mb-4">
            <div className={style.header}>{sectionTitles['skills'] || 'Skills & Technologies'}</div>
            <div className="text-slate-800 text-[10px] leading-relaxed space-y-0.5">
              {hasTech && <div><strong>Technical:</strong> {skills.technical.join(', ')}</div>}
              {hasTools && <div><strong>Tools:</strong> {skills.tools.join(', ')}</div>}
              {hasSoft && <div><strong>Soft Skills:</strong> {skills.soft.join(', ')}</div>}
            </div>
          </div>
        );
      }

      case 'projects':
        if (!projects.length) return null;
        return (
          <div key="projects" className="mb-4">
            <div className={style.header}>{sectionTitles['projects'] || 'Projects'}</div>
            <div className="space-y-3">
              {projects.map((proj, idx) => (
                <div key={idx}>
                  <div className="flex justify-between font-bold text-slate-900 text-[10.5px]">
                    <span className="flex items-center gap-1">
                      {proj.title}
                      {proj.liveUrl && (
                        <a className="text-[#2563eb] font-normal text-[8px]" href={proj.liveUrl} target="_blank" rel="noreferrer">(Live)</a>
                      )}
                    </span>
                  </div>
                  {proj.techStack && proj.techStack.length > 0 && (
                    <div className="italic text-slate-600 text-[9px]">Tech: {proj.techStack.join(', ')}</div>
                  )}
                  {proj.bullets && proj.bullets.filter(Boolean).length > 0 ? (
                    <ul className="list-disc pl-3.5 space-y-[2px] text-slate-700 text-[9px] mt-1">
                      {proj.bullets.filter(Boolean).map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  ) : proj.description ? (
                    <p className="text-slate-700 text-[9px] mt-1">{proj.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        );

      case 'certifications':
        if (!certifications.length) return null;
        return (
          <div key="certifications" className="mb-4">
            <div className={style.header}>{sectionTitles['certifications'] || 'Certifications'}</div>
            <div className="space-y-1.5">
              {certifications.map((cert, idx) => (
                <div key={idx} className="flex justify-between text-[10px]">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    {cert.name}
                    {cert.credentialUrl && <a className="text-[#2563eb] font-normal text-[8px]" href={cert.credentialUrl} target="_blank" rel="noreferrer">(Link)</a>}
                    {cert.issuer && <span className="font-normal italic text-slate-600"> | {cert.issuer}</span>}
                  </span>
                  <span className="text-slate-700 shrink-0 ml-2">{cert.issueDate}</span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        if (sectionKey.startsWith('custom_')) {
          const cs = customSections.find(x => x.id === sectionKey);
          if (!cs || (!cs.title && !cs.content)) return null;
          return (
            <div key={sectionKey} className="mb-4">
              <div className={style.header}>{sectionTitles[sectionKey] || cs.title}</div>
              <div className="text-slate-800 text-[10px] leading-relaxed whitespace-pre-wrap">
                {cs.content}
              </div>
            </div>
          );
        }
        return null;
    }
  };

  return (
    <div className={`flex-1 ${style.bg} shadow-2xl rounded-sm overflow-hidden flex flex-col relative origin-top mx-auto w-full`}>
      {/* Corner fold effect */}
      <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-black/5 to-transparent z-10 pointer-events-none rounded-bl-sm" />

      {/* Adjust text size dynamically if not enough content to make it stretch gracefully */}
      <div 
        ref={containerRef}
        className={`flex-1 p-6 md:p-8 flex flex-col ${style.font} text-[10px] md:text-[11px] leading-normal custom-scrollbar overflow-y-auto min-h-[842px]
          ${(!experience.length && !projects.length) ? 'md:text-[12px] leading-loose gap-2' : ''}
        `}
      >

        {/* Personal Info Header — Always at top */}
        <div className="text-center space-y-1.5 mb-5">
          <div className={style.name}>{personal.fullName || 'Full Name'}</div>
          <div className={`flex flex-wrap justify-center items-center gap-x-2 text-[9.5px] ${style.accent} opacity-90`}>
            {personal.email && <a href={`mailto:${personal.email}`} className="hover:underline">{personal.email}</a>}
            {personal.phone && <><span>•</span><a href={`tel:${personal.phone.replace(/[^0-9+]/g, '')}`} className="hover:underline">{personal.phone}</a></>}
            {personal.location && <><span>•</span><span>{personal.location}</span></>}
            {personal.linkedin && <><span>•</span><a href={personal.linkedin.startsWith('http') ? personal.linkedin : `https://${personal.linkedin}`} target="_blank" rel="noreferrer" className="hover:underline">{personal.linkedin.replace(/^https?:\/\//, '')}</a></>}
            {personal.github && <><span>•</span><a href={personal.github.startsWith('http') ? personal.github : `https://${personal.github}`} target="_blank" rel="noreferrer" className="hover:underline">{personal.github.replace(/^https?:\/\//, '')}</a></>}
            {personal.portfolio && <><span>•</span><a href={personal.portfolio.startsWith('http') ? personal.portfolio : `https://${personal.portfolio}`} target="_blank" rel="noreferrer" className="hover:underline">{personal.portfolio.replace(/^https?:\/\//, '')}</a></>}
          </div>
        </div>

        {/* Summary — pinned right after header if present in layoutOrder */}
        {personal.summary && layoutOrder.includes('summary') && (
          <div className="mb-4 text-slate-800 text-[10px] leading-relaxed">
            <div className={style.header}>{sectionTitles['summary'] || 'Summary'}</div>
            <p>{personal.summary}</p>
          </div>
        )}

        {/* Dynamic Sections in User-defined order */}
        {layoutOrder.map(renderSection)}

      </div>
    </div>
  );
}
