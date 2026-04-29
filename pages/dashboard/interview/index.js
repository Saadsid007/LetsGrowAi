import Head from "next/head";
import { useState } from "react";
import { useRouter } from "next/router";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import Icon from "@/components/Icon";

export default function InterviewSetup() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    interviewType: 'technical',
    role: '',
    difficulty: 'medium',
    company: '',
    jobDescription: '',
    focusAreas: '',
    totalQuestions: 10,
    // Mix breakdown (only used when type is 'mixed')
    mixTechnical: 4,
    mixHr: 3,
    mixDesign: 3
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTypeSelect = (type) => setFormData({ ...formData, interviewType: type });
  const handleDifficultySelect = (diff) => setFormData({ ...formData, difficulty: diff });

  // When total questions change in mixed mode, redistribute evenly
  const handleTotalChange = (val) => {
    const total = Math.min(Math.max(val, 5), 15);
    if (formData.interviewType === 'mixed') {
      const third = Math.floor(total / 3);
      const remainder = total - third * 3;
      setFormData({ ...formData, totalQuestions: total, mixTechnical: third + remainder, mixHr: third, mixDesign: third });
    } else {
      setFormData({ ...formData, totalQuestions: total });
    }
  };

  // Adjust one mix slider, redistribute the rest
  const handleMixChange = (field, val) => {
    const remaining = formData.totalQuestions - val;
    const otherFields = ['mixTechnical', 'mixHr', 'mixDesign'].filter(f => f !== field);
    const otherTotal = otherFields.reduce((sum, f) => sum + formData[f], 0);
    
    const newData = { ...formData, [field]: val };
    if (otherTotal > 0) {
      otherFields.forEach(f => {
        newData[f] = Math.max(1, Math.round((formData[f] / otherTotal) * remaining));
      });
      // Fix rounding
      const sum = otherFields.reduce((s, f) => s + newData[f], 0) + val;
      if (sum !== formData.totalQuestions) {
        newData[otherFields[0]] += formData.totalQuestions - sum;
      }
    }
    setFormData(newData);
  };

  const startInterview = async () => {
    if (!formData.role || !formData.company) {
      setError("Role and Company are required.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const payload = {
        company: formData.company,
        role: formData.role,
        interviewType: formData.interviewType,
        difficulty: formData.difficulty,
        totalQuestions: formData.totalQuestions,
        jobDescription: formData.jobDescription,
        focusAreas: formData.focusAreas,
      };

      // If mixed, add the breakdown context to focusAreas
      if (formData.interviewType === 'mixed') {
        payload.focusAreas = `${formData.focusAreas || ''}\n[Interview Mix: ${formData.mixTechnical} Technical, ${formData.mixHr} HR/Behavioral, ${formData.mixDesign} System Design questions]`.trim();
      }

      const res = await fetch('/api/interview/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (data.success) {
        router.push(`/dashboard/interview/live?sessionId=${data.sessionId}`);
      } else {
        setError(data.error || "Failed to start session.");
        setIsLoading(false);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  // Estimate time based on difficulty and question count
  const estimateTime = () => {
    const perQ = formData.difficulty === 'fresher' ? 2 : formData.difficulty === 'medium' ? 3 : 4;
    const total = formData.totalQuestions * perQ;
    return `~${total}-${total + 5} minutes`;
  };

  return (
    <>
      <Head>
        <title>Mock Interview Setup | LetsGrowAi</title>
      </Head>

      <div className="flex-1 w-full bg-surface overflow-y-auto custom-scrollbar relative z-10">
        <main className="flex flex-col items-center justify-center min-h-full p-4 py-8 md:py-14 relative w-full">
          {/* Loading Overlay */}
          {isLoading && (
             <div className="absolute inset-0 z-50 bg-surface/80 backdrop-blur-md flex flex-col items-center justify-center">
                <div className="w-16 h-16 relative flex items-center justify-center mb-4">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <Icon name="bolt" className="text-secondary animate-pulse absolute" />
                </div>
                <h3 className="font-headline font-extrabold text-xl text-on-surface">Initializing Interview...</h3>
                <p className="text-sm font-body text-on-surface-variant mt-2 text-center px-4 max-w-sm">Fetching corporate data, building AI models, and preparing your personalized session.</p>
             </div>
          )}

          <div className="w-full max-w-[750px] bg-surface-container-lowest rounded-3xl p-6 md:p-12 shadow-[0_8px_40px_rgba(15,23,42,0.06)] border border-outline-variant/20 relative z-10">
            {/* Heading */}
            <div className="mb-10 text-center">
              <h1 className="text-3xl md:text-5xl font-headline font-extrabold text-on-surface mb-3 tracking-tight">
                Configure Your Session
              </h1>
              <p className="text-on-surface-variant font-body text-sm md:text-base leading-relaxed max-w-lg mx-auto">
                Customize your mock interview environment. The more details you provide, the smarter our AI mentor becomes.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-error/10 border border-error/20 text-error rounded-xl flex items-center gap-3">
                <Icon name="error" />
                <span className="font-body text-sm font-bold">{error}</span>
              </div>
            )}

            {/* Form Container */}
            <div className="flex flex-col gap-8 md:gap-10">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Company */}
                <section>
                  <label className="block text-xs font-extrabold font-headline text-outline uppercase tracking-widest mb-3">
                    Target Company <span className="text-error">*</span>
                  </label>
                  <div className="relative group">
                    <input
                      className="w-full bg-surface-container-low border-b-2 border-transparent rounded-t-xl rounded-b-none p-4 md:p-5 focus:ring-0 focus:border-b-2 focus:border-secondary focus:bg-surface-container-lowest transition-all outline-none font-body text-on-surface shadow-inner text-sm md:text-base placeholder:text-outline/50"
                      placeholder="e.g. Google, Amazon, TCS"
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                    />
                    <Icon name="business" className="absolute right-5 top-1/2 -translate-y-1/2 text-outline/50 group-focus-within:text-secondary transition-colors" />
                  </div>
                </section>

                {/* Role */}
                <section>
                  <label className="block text-xs font-extrabold font-headline text-outline uppercase tracking-widest mb-3">
                    Target Role <span className="text-error">*</span>
                  </label>
                  <div className="relative group">
                    <input
                      className="w-full bg-surface-container-low border-b-2 border-transparent rounded-t-xl rounded-b-none p-4 md:p-5 focus:ring-0 focus:border-b-2 focus:border-secondary focus:bg-surface-container-lowest transition-all outline-none font-body text-on-surface shadow-inner text-sm md:text-base placeholder:text-outline/50"
                      placeholder="e.g. Senior Frontend Engineer"
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                    />
                    <Icon name="work" className="absolute right-5 top-1/2 -translate-y-1/2 text-outline/50 group-focus-within:text-secondary transition-colors" />
                  </div>
                </section>
              </div>

              {/* Advanced Context (Optional) */}
              <section className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10">
                <div className="flex items-center gap-2 mb-6">
                  <Icon name="auto_awesome" className="text-primary" filled/>
                  <h3 className="font-headline font-extrabold text-on-surface text-lg">Hyper-Personalization Context</h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-[11px] font-bold font-body text-on-surface-variant mb-2">
                      Job Description (Optional)
                    </label>
                    <textarea 
                      className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-sm font-body focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-outline-variant resize-none min-h-[120px]"
                      placeholder="Paste the exact JD here to let the AI tailor questions specifically to the company's requirements."
                      value={formData.jobDescription}
                      onChange={(e) => setFormData({...formData, jobDescription: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold font-body text-on-surface-variant mb-2">
                      Specific Focus Areas / Context (Optional)
                    </label>
                    <textarea 
                      className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-sm font-body focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-outline-variant resize-none min-h-[80px]"
                      placeholder="e.g. 'Ask me deeply about React Server Components and System Design tradeoffs' or 'Focus heavily on my lack of experience with Kubernetes.'"
                      value={formData.focusAreas}
                      onChange={(e) => setFormData({...formData, focusAreas: e.target.value})}
                    />
                  </div>
                </div>
              </section>

              {/* Settings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Interview Type */}
                <section>
                  <label className="block text-xs font-extrabold font-headline text-outline uppercase tracking-widest mb-3">
                    Interview Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['technical', 'hr', 'system-design', 'mixed'].map(type => (
                      <div 
                        key={type}
                        onClick={() => handleTypeSelect(type)}
                        className={`p-3 md:p-4 rounded-xl cursor-pointer transition-all flex flex-col items-center text-center border-2 ${formData.interviewType === type ? 'border-primary bg-primary/5 shadow-sm scale-[1.02]' : 'border-outline-variant/10 hover:border-primary/30 hover:bg-surface-container'}`}
                      >
                        <Icon name={type === 'hr' ? 'groups' : type === 'technical' ? 'code' : type === 'system-design' ? 'account_tree' : 'shuffle'} className={`text-2xl mb-1 ${formData.interviewType === type ? 'text-primary' : 'text-on-surface-variant'}`} />
                        <span className={`font-headline font-semibold text-xs md:text-sm capitalize ${formData.interviewType === type ? 'text-primary' : 'text-on-surface-variant'}`}>{type.replace('-', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 2. Difficulty Level */}
                <section>
                  <label className="block text-xs font-extrabold font-headline text-outline uppercase tracking-widest mb-3">
                    Difficulty Level
                  </label>
                  <div className="flex flex-col gap-3">
                    {['fresher', 'medium', 'senior'].map(diff => (
                      <button 
                        key={diff}
                        onClick={() => handleDifficultySelect(diff)}
                        className={`px-6 py-3.5 rounded-xl border-2 transition-all font-body text-sm font-bold capitalize flex items-center justify-between ${formData.difficulty === diff ? 'border-primary bg-primary text-on-primary shadow-[0_4px_15px_rgba(0,55,176,0.2)]' : 'border-outline-variant/20 text-on-surface-variant hover:border-primary/30 hover:bg-surface-container'}`}
                      >
                        <span>{diff === 'medium' ? 'Intermediate / 2-4 YOE' : diff === 'senior' ? 'Senior / 5+ YOE' : 'Fresher / Entry Level'}</span>
                        {formData.difficulty === diff && <Icon name="check_circle" className="text-white text-lg"/>}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              {/* 3. Number of Questions */}
              <section className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="block text-xs font-extrabold font-headline text-outline uppercase tracking-widest mb-1">
                      Number of Questions
                    </label>
                    <p className="text-[11px] text-on-surface-variant font-body">Min 5, Max 15</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleTotalChange(formData.totalQuestions - 1)} 
                      disabled={formData.totalQuestions <= 5}
                      className="w-10 h-10 rounded-full border-2 border-outline-variant/30 text-on-surface-variant hover:border-primary hover:text-primary transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Icon name="remove" />
                    </button>
                    <span className="text-3xl font-headline font-extrabold text-on-surface w-10 text-center tabular-nums">{formData.totalQuestions}</span>
                    <button 
                      onClick={() => handleTotalChange(formData.totalQuestions + 1)} 
                      disabled={formData.totalQuestions >= 15}
                      className="w-10 h-10 rounded-full border-2 border-outline-variant/30 text-on-surface-variant hover:border-primary hover:text-primary transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Icon name="add" />
                    </button>
                  </div>
                </div>

                {/* Mix Breakdown (only for Mixed type) */}
                {formData.interviewType === 'mixed' && (
                  <div className="mt-6 pt-6 border-t border-outline-variant/20 space-y-5">
                    <p className="text-[11px] font-bold text-primary uppercase tracking-widest font-headline">Custom Mix Breakdown</p>
                    
                    {[
                      { field: 'mixTechnical', label: 'Technical / Coding', icon: 'code', color: 'text-primary' },
                      { field: 'mixHr', label: 'HR / Behavioral', icon: 'groups', color: 'text-secondary' },
                      { field: 'mixDesign', label: 'System Design', icon: 'account_tree', color: 'text-tertiary' }
                    ].map(({ field, label, icon, color }) => (
                      <div key={field} className="flex items-center gap-4">
                        <Icon name={icon} className={`${color} text-xl w-8`} />
                        <span className="font-body text-sm text-on-surface font-bold flex-1">{label}</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => formData[field] > 1 && handleMixChange(field, formData[field] - 1)}
                            disabled={formData[field] <= 1}
                            className="w-8 h-8 rounded-full border border-outline-variant/30 text-on-surface-variant hover:border-primary transition-colors flex items-center justify-center text-sm disabled:opacity-30"
                          >
                            <Icon name="remove" className="text-sm"/>
                          </button>
                          <span className="text-lg font-headline font-extrabold w-6 text-center tabular-nums">{formData[field]}</span>
                          <button 
                            onClick={() => {
                              const otherFields = ['mixTechnical', 'mixHr', 'mixDesign'].filter(f => f !== field);
                              const maxAllowed = formData.totalQuestions - otherFields.reduce((s, f) => s + 1, 0); // leave at least 1 for each other
                              if (formData[field] < maxAllowed) handleMixChange(field, formData[field] + 1);
                            }}
                            className="w-8 h-8 rounded-full border border-outline-variant/30 text-on-surface-variant hover:border-primary transition-colors flex items-center justify-center text-sm"
                          >
                            <Icon name="add" className="text-sm"/>
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex justify-end text-[11px] font-bold text-outline font-headline uppercase tracking-widest pt-2 border-t border-outline-variant/10">
                      Total: {formData.mixTechnical + formData.mixHr + formData.mixDesign} / {formData.totalQuestions}
                    </div>
                  </div>
                )}
              </section>

              {/* Footer Action */}
              <div className="pt-6 border-t border-outline-variant/20 mt-4 space-y-4">
                <button
                  onClick={startInterview}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-primary to-secondary text-on-primary py-4 rounded-xl font-headline font-extrabold text-lg flex items-center justify-center gap-3 hover:shadow-[0_10px_30px_rgba(0,55,176,0.3)] hover:-translate-y-0.5 transition-all group disabled:opacity-70 disabled:pointer-events-none"
                >
                  Enter Interview Portal
                  <Icon name="door_front" className="group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex justify-center flex-wrap gap-4 text-outline font-body text-[11px] font-bold uppercase tracking-widest">
                   <span className="flex items-center gap-1"><Icon name="mic" className="text-[14px]"/> Requires Microphone</span>
                   <span className="flex items-center gap-1"><Icon name="fullscreen" className="text-[14px]"/> Full Screen Only</span>
                   <span className="flex items-center gap-1"><Icon name="schedule" className="text-[14px]"/> {estimateTime()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Background Elements */}
          <div className="absolute top-0 left-0 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10 -translate-x-1/2 -translate-y-1/2"></div>
        </main>
      </div>
    </>
  );
}

// Hook it into the Workspace Layout
InterviewSetup.getLayout = function getLayout(page) {
  return <WorkspaceLayout>{page}</WorkspaceLayout>;
};
