import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import Icon from "@/components/Icon";

export default function InterviewReport() {
  const router = useRouter();
  const { sessionId } = router.query;

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!sessionId) return;
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/interview/session/${sessionId}/report`);
        const data = await res.json();
        if (data.success) {
          setReportData(data);
        } else {
          alert('Could not fetch report.');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex-1 w-full flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="mt-4 font-headline font-bold text-on-surface-variant animate-pulse">Compiling detailed semantic report...</p>
        </div>
      </div>
    );
  }

  if (!reportData) return <div className="p-8 text-center text-error">Failed to load report.</div>;

  const { report, config, messages, duration } = reportData;

  const gradeColor = () => {
    const score = report.overallScore || 0;
    if (score >= 70) return 'bg-[#10b981] text-white shadow-lg shadow-[#10b981]/30';
    if (score >= 40) return 'bg-[#f59e0b] text-white shadow-lg shadow-[#f59e0b]/30';
    return 'bg-error text-white shadow-lg shadow-error/30';
  };

  // Count only answered questions
  const answeredMessages = messages.filter(m => m.evaluation && m.evaluation.score !== undefined);

  return (
    <>
      <Head>
        <title>Interview Diagnostic Report | LetsGrowAi</title>
      </Head>

      <div className="flex-1 w-full overflow-y-auto custom-scrollbar bg-surface pb-20">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          
          {/* Header Banner */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-10 shadow-sm border border-outline-variant/20 mb-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
             
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div>
                   <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full mb-3 inline-block">
                     {answeredMessages.length < config.totalQuestions ? 'Partial Analysis' : 'Diagnostic Completed'}
                   </span>
                   <h1 className="text-3xl md:text-5xl font-headline font-extrabold text-on-surface tracking-tight mb-2">
                     Performance Report
                   </h1>
                   <p className="text-on-surface-variant font-body">
                     Targeting: <strong className="text-on-surface">{config.role} at {config.company}</strong>
                     <span className="ml-3 text-[11px] font-bold text-outline">({answeredMessages.length}/{config.totalQuestions} answered)</span>
                   </p>
                </div>
                
                <div className="flex items-center gap-6">
                   <div className="text-right">
                      <p className="text-[11px] font-bold text-outline uppercase tracking-widest font-headline mb-1">Overall Grade</p>
                      <h2 className="text-xl md:text-2xl font-body font-bold text-on-surface">{report.grade || 'N/A'}</h2>
                   </div>
                   <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center border border-white/20 ${gradeColor()}`}>
                      <span className="text-3xl md:text-4xl font-headline font-extrabold tracking-tighter">
                         {report.overallScore || '0'} 
                         <span className="text-sm opacity-80 block text-center -mt-2">/100</span>
                      </span>
                   </div>
                </div>
             </div>
          </div>

          {/* Nav Tabs */}
          <div className="flex items-center gap-4 border-b-2 border-outline-variant/20 mb-8 overflow-x-auto custom-scrollbar pb-1">
             <button onClick={() => setActiveTab("overview")} className={`pb-3 px-2 font-headline font-extrabold text-[13px] uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 -mb-[2px] ${activeTab === 'overview' ? 'text-primary border-primary' : 'text-outline hover:text-on-surface border-transparent'}`}>Executive Summary</button>
             <button onClick={() => setActiveTab("questions")} className={`pb-3 px-2 font-headline font-extrabold text-[13px] uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 -mb-[2px] ${activeTab === 'questions' ? 'text-primary border-primary' : 'text-outline hover:text-on-surface border-transparent'}`}>Question Breakdown ({messages.length})</button>
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Feedback Block */}
                 <div className="md:col-span-2 bg-surface-container-lowest rounded-2xl p-6 md:p-8 border border-outline-variant/10 shadow-sm flex flex-col">
                    <h3 className="font-headline font-extrabold text-lg text-on-surface mb-4 flex items-center gap-2">
                      <Icon name="psychology" className="text-primary"/> AI Evaluator Assessment
                    </h3>
                    <p className="font-body text-base text-on-surface-variant leading-relaxed mb-8 flex-grow">
                      {report.summary}
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-outline-variant/10">
                       <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-widest text-primary mb-3">Top Strengths</h4>
                          <ul className="space-y-2">
                             {report.topStrengths?.map((str, i) => (
                               <li key={i} className="flex items-start gap-2 text-sm text-on-surface font-body"><Icon name="check_circle" className="text-primary text-[16px] mt-0.5 shrink-0"/> {str}</li>
                             ))}
                          </ul>
                       </div>
                       <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-widest text-error mb-3">Weak Skills & Failed Concepts</h4>
                          <ul className="space-y-2">
                             {report.areasToImprove?.map((imp, i) => (
                               <li key={i} className="flex items-start gap-2 text-sm text-on-surface font-body"><Icon name="warning" className="text-error text-[16px] mt-0.5 shrink-0"/> {imp}</li>
                             ))}
                          </ul>
                       </div>
                    </div>
                 </div>

                 {/* Metric Cards */}
                 <div className="flex flex-col gap-6">
                    <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 shadow-sm">
                       <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-4">Technical Breakdown</p>
                       <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-xs font-bold text-on-surface mb-1">
                               <span>Accuracy</span><span>{Number(report.avgScores?.technical || 0).toFixed(1)}/10</span>
                            </div>
                            <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                               <div className="h-full bg-primary" style={{width: `${(report.avgScores?.technical / 10) * 100}%`}}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs font-bold text-on-surface mb-1">
                               <span>Communication</span><span>{Number(report.avgScores?.communication || 0).toFixed(1)}/10</span>
                            </div>
                            <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                               <div className="h-full bg-secondary" style={{width: `${(report.avgScores?.communication / 10) * 100}%`}}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs font-bold text-on-surface mb-1">
                               <span>Depth of Knowledge</span><span>{Number(report.avgScores?.depth || 0).toFixed(1)}/10</span>
                            </div>
                            <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                               <div className="h-full bg-tertiary" style={{width: `${(report.avgScores?.depth / 10) * 100}%`}}></div>
                            </div>
                          </div>
                       </div>
                    </div>

                    <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20 shadow-sm">
                       <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Verdict Status</p>
                       <h3 className="text-xl font-headline font-extrabold text-on-surface tracking-tight leading-none mb-4">{report.readinessVerdict || 'Needs Practice'}</h3>
                       <button onClick={() => router.push('/dashboard/interview')} className="w-full bg-primary text-white py-3 rounded-xl font-headline font-bold text-xs uppercase tracking-widest hover:scale-[1.02] transition-transform">
                          Schedule Next
                       </button>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* QUESTIONS TAB */}
          {activeTab === "questions" && (
            <div className="space-y-6 animate-fade-in">
              {messages.map((msg, i) => (
                <div key={i} className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl overflow-hidden shadow-sm">
                   {/* Q Header */}
                   <div className="bg-surface-container p-4 md:p-6 border-b border-outline-variant/10">
                      <div className="flex items-center justify-between mb-3">
                         <span className="bg-primary text-white font-headline font-extrabold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                            Question {msg.questionNumber}
                         </span>
                         {msg.evaluation?.score !== undefined ? (
                           <span className="font-headline font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg">
                             Score: {msg.evaluation.score}/10
                           </span>
                         ) : (
                           <span className="font-headline text-[10px] text-error font-bold uppercase tracking-widest">Unanswered (Skipped)</span>
                         )}
                      </div>
                      <h3 className="font-headline font-bold text-lg md:text-xl text-on-surface">{msg.questionText}</h3>
                   </div>
                   
                   {/* Context Details */}
                   <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left: User Answer */}
                      <div className="space-y-4">
                         <h4 className="text-[11px] font-bold text-outline uppercase tracking-widest mb-2 font-headline">Your Transcript</h4>
                         <div className="bg-surface-container-low p-4 rounded-xl text-sm font-body text-on-surface-variant leading-relaxed">
                            {msg.answerText || "No answer provided. Question was skipped or timed out."}
                         </div>
                         
                         {msg.evaluation && (
                           <>
                              <h4 className="text-[11px] font-bold text-outline uppercase tracking-widest mb-2 mt-6 font-headline">Quick Pitch Feedback</h4>
                              <p className="text-sm font-body italic text-primary bg-primary/5 p-4 rounded-xl border-l-[3px] border-primary">
                                "{msg.evaluation.quickFeedback}"
                              </p>
                           </>
                         )}
                      </div>

                      {/* Right: Deep Gemini Eval */}
                      {msg.evaluation && msg.evaluation.score !== undefined && (
                        <div className="space-y-6 md:border-l border-outline-variant/10 md:pl-8">
                           <div>
                              <h4 className="text-[11px] font-bold text-[#10b981] uppercase tracking-widest mb-2 flex items-center gap-1 font-headline">
                                <Icon name="check" className="text-sm border rounded-full border-[#10b981]" /> Found Concepts
                              </h4>
                              <ul className="text-sm font-body text-on-surface space-y-1.5 list-disc pl-4 opacity-90">
                                 {msg.evaluation.strengths?.map((s, idx) => <li key={idx}>{s}</li>)}
                              </ul>
                           </div>
                           
                           <div>
                              <h4 className="text-[11px] font-bold text-error uppercase tracking-widest mb-2 flex items-center gap-1 font-headline">
                                <Icon name="close" className="text-sm border rounded-full border-error" /> Missed / Incorrect
                              </h4>
                              <ul className="text-sm font-body text-on-surface space-y-1.5 list-disc pl-4 opacity-90">
                                 {msg.evaluation.improvements?.map((im, idx) => <li key={idx}>{im}</li>)}
                                 {msg.evaluation.missedConcepts?.map((mc, idx) => <li key={`mc-${idx}`} className="text-error font-medium">Missed Concept: {mc}</li>)}
                              </ul>
                           </div>

                           <div className="pt-4 border-t border-outline-variant/10">
                              <h4 className="text-[11px] font-bold text-secondary uppercase tracking-widest mb-2 font-headline">Ideal Technical Answer</h4>
                              <p className="text-xs font-body text-on-surface-variant leading-relaxed">
                                {msg.evaluation.idealAnswer}
                              </p>
                           </div>
                        </div>
                      )}
                   </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

// Hook it into the Workspace Layout
InterviewReport.getLayout = function getLayout(page) {
  return <WorkspaceLayout>{page}</WorkspaceLayout>;
};
