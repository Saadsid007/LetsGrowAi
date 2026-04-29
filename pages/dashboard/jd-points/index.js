import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import Icon from '@/components/Icon';
import { toast } from 'sonner';

export default function JDPointsPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Input State
  const [jdText, setJdText] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [sections, setSections] = useState({
    summary: true,
    objective: true,
    skills: true,
    projects: true,
    bullets: true
  });
  const [experienceLevel, setExperienceLevel] = useState('Fresher');

  // Result State
  const [generatedData, setGeneratedData] = useState(null);
  const [savedId, setSavedId] = useState(null);

  // Edit State
  const [editingSection, setEditingSection] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const handleFetchJD = async () => {
    if (!jobUrl.trim()) {
      setError('Please provide a Job URL.');
      return;
    }
    setIsFetching(true);
    setError(null);
    try {
      const res = await fetch('/api/resume/fetch-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobUrl })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch job description');
      setJdText(data.jdText);
      toast.success('Job description fetched successfully!');
    } catch (err) {
      setError(err.message);
      toast.error('Failed to fetch JD. Please paste it manually.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleGenerate = async () => {
    if (!jdText.trim() && !jobUrl.trim()) {
      setError('Please provide a Job Description or URL.');
      return;
    }

    const sectionsToGenerate = Object.keys(sections).filter(k => sections[k]);
    if (sectionsToGenerate.length === 0) {
      setError('Please select at least one section to generate.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setActiveStep(2);

    try {
      const res = await fetch('/api/resume/jd-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jdText,
          jobUrl,
          sectionsToGenerate,
          userInfo: { experienceLevel }
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || data.message || 'Failed to generate');

      setGeneratedData(data);
      setSavedId(data.savedId);
      setActiveStep(3);
    } catch (err) {
      setError(err.message);
      setActiveStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (section) => {
    if (!savedId) return;
    setIsRegenerating(section);
    try {
      const res = await fetch('/api/resume/jd-points/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ savedId, section })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to regenerate');
      
      setGeneratedData(prev => {
        const newData = { ...prev };
        if (section === 'summary') newData.result.summary = data.newContent;
        if (section === 'objective') newData.result.objective = data.newContent;
        if (section === 'skills') newData.result.skills = data.newContent;
        if (section === 'bullets') newData.result.experienceBullets = data.newContent;
        if (section.startsWith('project')) {
          const idx = parseInt(section.replace('project', ''));
          newData.result.projects[idx] = data.newContent;
        }
        return newData;
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setIsRegenerating(null);
    }
  };

  const startEditing = (section, currentContent) => {
    setEditingSection(section);
    setEditContent(currentContent);
  };

  const handleSaveEdit = async () => {
    if (!savedId || !editingSection) return;
    setIsSaving(true);
    try {
      // Build updated result object based on editingSection
      const editedResult = {};
      if (editingSection === 'summary') editedResult.summary = editContent;
      else if (editingSection === 'objective') editedResult.objective = editContent;
      // Note: for complex objects like skills and projects, we'd need a more complex UI.
      // For now, supporting plain text sections.

      const res = await fetch('/api/resume/jd-points/save', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ savedId, editedResult })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to save');
      
      setGeneratedData(prev => {
        const newData = { ...prev };
        if (editingSection === 'summary') newData.result.summary = editContent;
        if (editingSection === 'objective') newData.result.objective = editContent;
        return newData;
      });
      setEditingSection(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <WorkspaceLayout>
      <Head>
        <title>JD to Resume Points | LetsGrowAi</title>
      </Head>

      <div className="flex-1 w-full p-4 md:p-8 space-y-8 overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            JD to Resume Points Generator
          </h1>
          <p className="text-slate-500 mt-2">
            Paste a job description and our AI will extract key points and generate a tailored summary, skills, and projects for your resume.
          </p>
        </div>

        {/* STEP 1: INPUT */}
        {activeStep === 1 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-start gap-3">
                <Icon name="auto_awesome" className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">Paste Job Description</label>
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="w-full h-64 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-700">Or use Job URL (Optional)</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                      placeholder="https://linkedin.com/jobs/..."
                      className="flex-1 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <button
                      onClick={handleFetchJD}
                      disabled={isFetching}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                      {isFetching ? (
                        <Icon name="sync" className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icon name="download" className="w-4 h-4" />
                      )}
                      Fetch
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">Your Experience Level</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                  >
                    <option value="Fresher">Fresher (0 Years)</option>
                    <option value="1-3 Years">1-3 Years</option>
                    <option value="3-5 Years">3-5 Years</option>
                    <option value="5+ Years">5+ Years</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">Sections to Generate</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(sections).map(([key, value]) => (
                      <label key={key} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setSections(s => ({ ...s, [key]: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700 capitalize">{key}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
                >
                  <Icon name="auto_awesome" className="w-5 h-5" />
                  Generate Resume Points
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: LOADING */}
        {activeStep === 2 && (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-full">
                <Icon name="auto_awesome" className="w-8 h-8 text-white animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Analyzing & Generating...</h3>
              <p className="text-slate-500 mt-2">Cerebras and Gemini are working in parallel.</p>
            </div>
            
            <div className="w-full max-w-md space-y-3 mt-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 animate-[shimmer_1.5s_infinite] w-1/2"
                    style={{ transform: `translateX(${(i-1)*20}%)` }}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: RESULTS */}
        {activeStep === 3 && generatedData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Sidebar: JD Analysis */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Icon name="track_changes" className="w-5 h-5 text-blue-600" />
                  JD Analysis
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detected Role</span>
                    <p className="font-medium text-slate-800 mt-1">{generatedData.jdAnalysis?.detectedRole || 'Unknown'}</p>
                  </div>
                  
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Match Score</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${generatedData.jdAnalysis?.matchScore || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-slate-700">{generatedData.jdAnalysis?.matchScore || 0}%</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Key Skills Needed</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(generatedData.jdAnalysis?.keyTechnicalSkills || []).map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => router.push(`/dashboard/resume?jdPointsId=${savedId}`)}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                Use in Resume Builder
                <Icon name="chevron_right" className="w-5 h-5" />
              </button>
            </div>

            {/* Main Content: Generated Sections */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Summary */}
              {generatedData.result?.summary && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Icon name="description" className="w-5 h-5 text-blue-600" />
                      Professional Summary
                    </h3>
                    <div className="flex gap-2">
                      {editingSection !== 'summary' && (
                        <button onClick={() => startEditing('summary', generatedData.result.summary)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Icon name="edit" className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleRegenerate('summary')} disabled={isRegenerating === 'summary'} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Icon name="refresh" className={`w-4 h-4 ${isRegenerating === 'summary' ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                  
                  {editingSection === 'summary' ? (
                    <div className="space-y-3">
                      <textarea 
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        className="w-full h-32 p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 text-sm leading-relaxed"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingSection(null)} className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                        <button onClick={handleSaveEdit} disabled={isSaving} className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2">
                          <Icon name="save" className="w-4 h-4" /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-700 leading-relaxed text-sm">{generatedData.result.summary}</p>
                  )}
                </div>
              )}

              {/* Objective */}
              {generatedData.result?.objective && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Icon name="track_changes" className="w-5 h-5 text-blue-600" />
                      Objective Statement
                    </h3>
                    <div className="flex gap-2">
                      {editingSection !== 'objective' && (
                        <button onClick={() => startEditing('objective', generatedData.result.objective)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Icon name="edit" className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleRegenerate('objective')} disabled={isRegenerating === 'objective'} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Icon name="refresh" className={`w-4 h-4 ${isRegenerating === 'objective' ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                  
                  {editingSection === 'objective' ? (
                     <div className="space-y-3">
                     <textarea 
                       value={editContent}
                       onChange={e => setEditContent(e.target.value)}
                       className="w-full h-24 p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 text-sm leading-relaxed"
                     />
                       <div className="flex justify-end gap-2">
                         <button onClick={() => setEditingSection(null)} className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                         <button onClick={handleSaveEdit} disabled={isSaving} className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2">
                           <Icon name="save" className="w-4 h-4" /> Save
                         </button>
                       </div>
                   </div>
                  ) : (
                    <p className="text-slate-700 leading-relaxed text-sm">{generatedData.result.objective}</p>
                  )}
                </div>
              )}

              {/* Skills */}
              {generatedData.result?.skills && generatedData.result.skills.technical?.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Icon name="build" className="w-5 h-5 text-blue-600" />
                      Skills
                    </h3>
                    <button onClick={() => handleRegenerate('skills')} disabled={isRegenerating === 'skills'} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Icon name="refresh" className={`w-4 h-4 ${isRegenerating === 'skills' ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Technical</h4>
                      <div className="flex flex-wrap gap-2">
                        {generatedData.result.skills.technical.map((skill, i) => (
                          <span key={i} className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${skill.status === 'matched' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                            {skill.status === 'matched' && <Icon name="check_circle" className="w-3 h-3" />}
                            {skill.name}
                            {skill.status === 'suggested' && <span className="text-[10px] opacity-75 ml-1">(Suggested)</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Projects */}
              {generatedData.result?.projects && generatedData.result.projects.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Icon name="work" className="w-5 h-5 text-blue-600" />
                    Recommended Projects
                  </h3>
                  
                  {generatedData.result.projects.map((project, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-slate-800">{project.name}</h4>
                          <p className="text-sm text-slate-500">{project.tagline}</p>
                        </div>
                        <button onClick={() => handleRegenerate(`project${idx}`)} disabled={isRegenerating === `project${idx}`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shrink-0">
                          <Icon name="refresh" className={`w-4 h-4 ${isRegenerating === `project${idx}` ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                      <p className="text-sm text-slate-700 mt-3">{project.description}</p>
                      
                      <div className="mt-4">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Key Accomplishments</span>
                        <ul className="space-y-2">
                          {(project.bullets || []).map((bullet, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex flex-wrap gap-1.5">
                          {(project.techStack || []).map((tech, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bullets */}
              {generatedData.result?.experienceBullets && generatedData.result.experienceBullets.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Icon name="work" className="w-5 h-5 text-blue-600" />
                      Experience Bullets
                    </h3>
                    <button onClick={() => handleRegenerate('bullets')} disabled={isRegenerating === 'bullets'} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Icon name="refresh" className={`w-4 h-4 ${isRegenerating === 'bullets' ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  
                  <ul className="space-y-3">
                    {generatedData.result.experienceBullets.map((bullet, i) => (
                      <li key={i} className="text-sm text-slate-700 flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-blue-500 mt-0.5 font-bold">•</span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </WorkspaceLayout>
  );
}
