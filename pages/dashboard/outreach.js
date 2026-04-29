import Head from "next/head";
import DashboardLayout from "@/components/DashboardLayout";
import Icon from "@/components/Icon";
import PageLoader from "@/components/PageLoader";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function ColdOutreach() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [messageType, setMessageType] = useState('linkedin');
  const [recipientName, setRecipientName] = useState('');
  const [recipientRole, setRecipientRole] = useState('');
  const [company, setCompany] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [senderName, setSenderName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [senderGoal, setSenderGoal] = useState('');
  const [tone, setTone] = useState('professional');

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingSequence, setIsGeneratingSequence] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);
  const [activeVersionTab, setActiveVersionTab] = useState(1);
  const [activeSequenceTab, setActiveSequenceTab] = useState(null); // e.g. 4, 10, 21

  useEffect(() => {
    // Optionally fetch user info to prefill senderName and targetRole
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          // Pre-fill if we had a session endpoint, but for now we just use empty defaults
        }
      } catch (e) {}
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  const handleGenerate = async () => {
    if (!recipientName || !recipientRole || !company || !senderGoal) {
      toast.error('Please fill in all required fields (Name, Role, Company, Goal)');
      return;
    }

    setIsGenerating(true);
    setGeneratedData(null);
    setActiveSequenceTab(null);

    try {
      const res = await fetch('/api/outreach/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageType,
          recipientName,
          recipientRole,
          company,
          linkedinUrl,
          senderGoal,
          tone
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate message');

      setGeneratedData(data);
      setActiveVersionTab(data.versions && data.versions.length > 0 ? data.versions[0].version : 1);
      toast.success('Message generated successfully!');
      
      if (data.pathDowngraded) {
        toast.info(`Note: Downgraded to standard generation (${data.downgradeReason})`);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSequence = async () => {
    if (!generatedData || !generatedData.messageId) return;
    
    setIsGeneratingSequence(true);
    try {
      const res = await fetch('/api/outreach/sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: generatedData.messageId,
          selectedVersion: activeVersionTab
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate sequence');

      // Update generatedData to include the sequence
      setGeneratedData(prev => {
        // Find the active version and attach the sequence to it (locally for UI)
        const newVersions = prev.versions.map(v => 
          v.version === activeVersionTab ? { ...v, followUpSequence: data.sequence } : v
        );
        return { ...prev, versions: newVersions };
      });
      
      toast.success('Follow-up sequence generated!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsGeneratingSequence(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!activeVersionData) return;
    try {
      const res = await fetch('/api/outreach/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${messageType} to ${recipientRole} at ${company}`,
          messageType,
          baseMessage: activeSequenceTab === null ? activeVersionData.message : sequenceDataToRender.message,
          messageId: generatedData.messageId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save template');
      toast.success('Saved to templates!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (isLoading) return <PageLoader message="Powering up outreach metrics..." />;

  // Helper to get active version data
  const activeVersionData = generatedData?.versions?.find(v => v.version === activeVersionTab);
  const activeQualityScore = generatedData?.quality?.scores?.find(s => s.version === activeVersionTab);
  
  // To handle if user clicked a follow up tab instead of the main message tab
  const sequenceDataToRender = activeSequenceTab !== null && activeVersionData?.followUpSequence 
    ? activeVersionData.followUpSequence.find(seq => seq.day === activeSequenceTab)
    : null;

  return (
    <>
      <Head>
        <title>Cold Outreach Generator | LetsGrowAi</title>
      </Head>

      <div className="flex flex-col lg:flex-row min-h-screen lg:min-h-0 lg:h-[calc(100vh-64px)] w-full bg-surface">
        
        {/* LEFT: INPUT PANEL */}
        <section className="w-full lg:w-[40%] xl:w-[35%] bg-surface-container-lowest lg:bg-surface-container-low overflow-y-visible lg:overflow-y-auto px-6 sm:px-8 py-8 border-b lg:border-b-0 lg:border-r border-outline-variant/10 shadow-[4px_0_24px_rgba(15,23,42,0.02)] z-10 custom-scrollbar">
          <div className="max-w-xl mx-auto space-y-8 pb-12 lg:pb-8">
            
            <header>
              <span className="text-[10px] font-extrabold text-primary font-headline tracking-widest uppercase border-b-2 border-primary/40 pb-1">Outreach Engine</span>
              <h1 className="text-2xl md:text-3xl font-extrabold mt-4 text-on-surface font-headline tracking-tight">Generate Your Message</h1>
              <p className="text-on-surface-variant font-medium mt-2 text-sm text-balance">Craft high-conversion personalized outreach powered by AI.</p>
            </header>

            {/* Section 1 — Message Type */}
            <div className="space-y-4">
              <label className="text-[10px] font-extrabold text-on-surface uppercase tracking-widest font-headline">Select Message Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'linkedin', icon: 'person_add', label: 'LinkedIn Connection' },
                  { id: 'email', icon: 'mail', label: 'Cold Email' },
                  { id: 'referral', icon: 'connect_without_contact', label: 'Ask for Referral' },
                  { id: 'thankyou', icon: 'sentiment_satisfied', label: 'Post-Interview Thank You' },
                ].map((type) => (
                  <button 
                    key={type.id}
                    onClick={() => setMessageType(type.id)}
                    className={`p-4 rounded-xl border flex items-start gap-3 text-left transition-all ${
                      messageType === type.id 
                        ? 'bg-primary/5 border-primary/20 shadow-inner' 
                        : 'bg-white border-outline-variant/20 shadow-[0_4px_10px_rgba(15,23,42,0.02)] hover:border-primary/20 hover:-translate-y-0.5 group'
                    }`}
                  >
                    <Icon name={type.icon} className={`text-[20px] ${messageType === type.id ? 'text-primary' : 'text-slate-400 group-hover:text-primary transition-colors'}`} />
                    <span className={`text-[13px] font-bold font-headline leading-tight mt-0.5 ${messageType === type.id ? 'text-primary' : 'text-slate-600 transition-colors group-hover:text-primary'}`}>
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2 — Recipient Details */}
            <div className="space-y-4 pt-4 border-t border-outline-variant/10">
              <label className="text-[10px] font-extrabold text-on-surface uppercase tracking-widest font-headline">Recipient Details</label>
              
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase ml-1 font-headline flex items-center gap-1">
                  <Icon name="link" className="text-[12px]" /> LinkedIn URL <span className="text-primary opacity-80">(Optional - for deep personalization)</span>
                </span>
                <input 
                  value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)}
                  className="w-full bg-white border border-outline-variant/20 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/20 transition-all font-medium outline-none" 
                  placeholder="https://linkedin.com/in/..." type="text" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase ml-1 font-headline">Full Name*</span>
                  <input value={recipientName} onChange={e => setRecipientName(e.target.value)} className="w-full bg-white border border-outline-variant/20 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/20 transition-all font-medium outline-none" placeholder="e.g. Sarah Chen" type="text" />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase ml-1 font-headline">Current Role*</span>
                  <input value={recipientRole} onChange={e => setRecipientRole(e.target.value)} className="w-full bg-white border border-outline-variant/20 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/20 transition-all font-medium outline-none" placeholder="e.g. Product Director" type="text" />
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase ml-1 font-headline">Company*</span>
                <input value={company} onChange={e => setCompany(e.target.value)} className="w-full bg-white border border-outline-variant/20 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/20 transition-all font-medium outline-none" placeholder="e.g. Anthropic" type="text" />
              </div>
            </div>

            {/* Section 3 — Your Context */}
            <div className="space-y-4 pt-4 border-t border-outline-variant/10">
              <label className="text-[10px] font-extrabold text-on-surface uppercase tracking-widest font-headline">Your Context</label>
              
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase ml-1 font-headline">Reason / Context / Goal*</span>
                <textarea 
                   value={senderGoal} onChange={e => setSenderGoal(e.target.value)}
                   className="w-full bg-white border border-outline-variant/20 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/20 transition-all resize-none min-h-[100px] font-medium outline-none" 
                   placeholder="e.g. I followed your recent AI talk and would love to ask a quick question about..."
                ></textarea>
              </div>
            </div>

            {/* Section 4 — Tone */}
            <div className="space-y-4 pt-4 border-t border-outline-variant/10 pb-6">
              <label className="text-[10px] font-extrabold text-on-surface uppercase tracking-widest font-headline">Tone Selector</label>
              <div className="flex bg-surface-container-lowest p-1 rounded-xl shadow-sm border border-outline-variant/10">
                {['professional', 'confident', 'friendly'].map((t) => (
                  <button 
                    key={t}
                    onClick={() => setTone(t)}
                    className={`flex-1 py-2 text-xs font-bold font-headline transition-colors rounded-lg ${
                      tone === t ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-primary hover:bg-surface-container-lowest'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Sticky Generate Button Frame */}
            <div className="sticky bottom-4 z-20">
               <div className="absolute -inset-4 bg-gradient-to-t from-surface-container-low via-surface-container-low to-transparent -z-10 hidden lg:block"></div>
               <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`w-full py-4 rounded-2xl font-extrabold font-headline text-[15px] flex items-center justify-center gap-3 transition-all ${
                    isGenerating ? 'bg-primary/70 text-white cursor-not-allowed' : 'bg-primary text-white shadow-[0_12px_24px_rgba(0,55,176,0.3)] hover:-translate-y-1 active:scale-95 group'
                  }`}
                >
                  {isGenerating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Icon name="auto_awesome" className="text-[20px] group-hover:rotate-12 transition-transform" filled />
                  )}
                  {isGenerating ? 'Generating...' : 'Generate Magic'}
               </button>
            </div>

          </div>
        </section>

        {/* RIGHT: OUTPUT PANEL */}
        <section className="w-full lg:w-[60%] xl:w-[65%] bg-[#faf8ff] overflow-y-visible lg:overflow-y-auto px-6 sm:px-12 py-8 lg:py-12 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-8 pb-32 lg:pb-12">
            
            {!generatedData ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-32 opacity-60">
                <Icon name="auto_awesome" className="text-[64px] mb-4 text-primary/30" filled />
                <h3 className="text-xl font-bold font-headline text-on-surface">No Message Generated</h3>
                <p className="text-sm font-medium">Fill in the details on the left and hit generate.</p>
              </div>
            ) : (
              <>
                {/* Top Quality Metric Bar */}
                {activeQualityScore && (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="px-4 py-2 bg-white rounded-xl shadow-[0_2px_10px_rgba(15,23,42,0.02)] border border-outline-variant/10 flex items-center gap-2">
                      <span className="text-[9px] font-extrabold font-headline text-slate-400 uppercase tracking-widest">Quality Score</span>
                      <span className="text-sm font-black text-primary font-headline">{activeQualityScore.overallScore}/100</span>
                    </div>
                    <div className="px-4 py-2 bg-white rounded-xl shadow-[0_2px_10px_rgba(15,23,42,0.02)] border border-outline-variant/10 flex items-center gap-2">
                      <span className="text-[9px] font-extrabold font-headline text-slate-400 uppercase tracking-widest">Tone Check</span>
                      <span className="text-[11px] font-bold text-[#366175] uppercase tracking-wide bg-[#366175]/10 px-2 py-0.5 rounded-md">Desperation: {activeQualityScore.desperationLevel}/100</span>
                    </div>
                    <div className="px-4 py-2 bg-white rounded-xl shadow-[0_2px_10px_rgba(15,23,42,0.02)] border border-outline-variant/10 flex items-center gap-2">
                      <span className="text-[9px] font-extrabold font-headline text-slate-400 uppercase tracking-widest">Spam Risk</span>
                      {activeQualityScore.spamPhrases?.length > 0 ? (
                        <span className="text-[11px] font-bold text-red-700 uppercase tracking-wide bg-red-50 px-2 py-0.5 rounded-md border border-red-100">{activeQualityScore.spamPhrases.length} Found</span>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">None</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-outline-variant/15 overflow-x-auto custom-scrollbar">
                  {generatedData.versions.map(v => (
                    <button 
                      key={v.version}
                      onClick={() => { setActiveVersionTab(v.version); setActiveSequenceTab(null); }}
                      className={`whitespace-nowrap px-6 pb-3 text-[13px] font-bold font-headline uppercase tracking-wide transition-colors ${
                        activeVersionTab === v.version && activeSequenceTab === null
                          ? 'border-b-2 border-primary text-primary font-extrabold'
                          : 'text-outline hover:text-on-surface'
                      }`}
                    >
                      {v.label || `Version ${v.version}`}
                    </button>
                  ))}
                  
                  {activeVersionData?.followUpSequence && activeVersionData.followUpSequence.map(seq => (
                    <button 
                      key={seq.day}
                      onClick={() => { setActiveSequenceTab(seq.day); setActiveVersionTab(activeVersionTab); }}
                      className={`whitespace-nowrap px-6 pb-3 text-[13px] font-bold font-headline uppercase tracking-wide transition-colors ${
                        activeSequenceTab === seq.day
                          ? 'border-b-2 border-primary text-primary font-extrabold'
                          : 'text-outline hover:text-on-surface'
                      }`}
                    >
                      Day {seq.day}: {seq.label}
                    </button>
                  ))}
                </div>

                {/* Generated Editor Canvas */}
                <div className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(15,23,42,0.04)] border border-outline-variant/5 overflow-hidden">
                  
                  {/* Mail Header */}
                  {((activeSequenceTab === null && activeVersionData?.subject) || (activeSequenceTab !== null && sequenceDataToRender?.subject)) && (
                    <div className="px-6 py-4 bg-surface-container-low/50 flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant/10 gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <span className="text-[10px] font-extrabold font-headline text-slate-400 uppercase tracking-widest border border-slate-200 px-2 rounded">SUBJECT</span>
                        <span className="text-sm font-bold text-on-surface">
                          {activeSequenceTab === null ? activeVersionData.subject : sequenceDataToRender.subject}
                        </span>
                      </div>
                      <div className="flex gap-2 items-center pl-2 sm:pl-0">
                        <button 
                          onClick={handleSaveTemplate}
                          className="flex items-center gap-1.5 text-[11px] font-extrabold font-headline text-slate-500 hover:text-primary uppercase tracking-widest"
                        >
                          <Icon name="bookmark_add" className="text-[14px]" /> Save Template
                        </button>
                        <button 
                          onClick={() => {
                            const text = activeSequenceTab === null ? activeVersionData.message : sequenceDataToRender.message;
                            navigator.clipboard.writeText(text);
                            toast.success('Copied to clipboard');
                          }}
                          className="flex items-center gap-1.5 text-[11px] font-extrabold font-headline text-primary hover:text-secondary uppercase tracking-widest"
                        >
                          <Icon name="content_copy" className="text-[14px]" /> Copy All
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Editable Content */}
                  <div className="p-8">
                    <div 
                      className="text-on-surface leading-loose text-sm md:text-[15px] space-y-5 outline-none min-h-[220px] font-medium whitespace-pre-wrap" 
                      contentEditable="true"
                      suppressContentEditableWarning={true}
                    >
                      {activeSequenceTab === null ? activeVersionData?.message : sequenceDataToRender?.message}
                    </div>
                  </div>

                  {/* Status Footer */}
                  <div className="px-8 py-4 bg-surface-container-lowest border-t border-outline-variant/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs font-bold text-outline">
                      {activeSequenceTab === null ? activeVersionData?.wordCount : sequenceDataToRender?.wordCount} words
                    </span>
                    <span className="text-[11px] font-extrabold font-headline text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5 uppercase tracking-widest shadow-sm">
                       <Icon name="verified" className="text-[14px]" filled /> Generated
                    </span>
                  </div>
                </div>

                {/* AI Contextual Banner */}
                {activeQualityScore && activeQualityScore.suggestions?.length > 0 && activeSequenceTab === null && (
                  <div className="bg-tertiary-fixed/40 border border-tertiary-fixed rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center gap-4 relative overflow-hidden shadow-sm">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#1b495c] shadow-sm shrink-0 border border-tertiary-fixed">
                       <Icon name="lightbulb" className="text-[24px]" filled />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#001f2a] leading-relaxed">
                         <span className="font-extrabold font-headline uppercase text-[10px] bg-white px-2 py-0.5 rounded shadow-sm mr-2 tracking-widest">AI Suggestion</span>
                         {activeQualityScore.suggestions[0]}
                      </p>
                    </div>
                  </div>
                )}
                
                {generatedData.hooks && activeSequenceTab === null && (
                   <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center gap-4 shadow-sm">
                     <div className="flex-1">
                       <p className="text-sm font-bold text-primary leading-relaxed">
                          <span className="font-extrabold font-headline uppercase text-[10px] bg-white px-2 py-0.5 rounded shadow-sm mr-2 tracking-widest">Context Pulled</span>
                          {generatedData.hooks.companyContext || generatedData.hooks.bestHook}
                       </p>
                     </div>
                   </div>
                )}

                {/* Generate Follow-ups Button */}
                {activeSequenceTab === null && !activeVersionData?.followUpSequence && (
                  <div className="pt-4 flex justify-end">
                    <button 
                      onClick={handleGenerateSequence}
                      disabled={isGeneratingSequence}
                      className="px-6 py-3 bg-secondary text-white rounded-xl font-extrabold font-headline text-[13px] flex items-center justify-center gap-2 hover:-translate-y-1 transition-all active:scale-95 shadow-md"
                    >
                      {isGeneratingSequence ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Icon name="all_inclusive" className="text-[18px]" />
                      )}
                      {isGeneratingSequence ? 'Generating Sequence...' : 'Generate Follow-up Sequence'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

ColdOutreach.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

