import Head from "next/head";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import Icon from "@/components/Icon";

export default function LiveInterview() {
  const router = useRouter();
  const { sessionId } = router.query;

  const [session, setSession] = useState(null);
  const [currentQ, setCurrentQ] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);

  // Speech States
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  // Core Data Fetcher
  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/interview/session/${sessionId}`);
      const data = await res.json();
      if (data.success && data.session.status === 'active') {
        const sess = data.session;
        setSession(sess);
        const activeMsg = sess.messages[sess.messages.length - 1];
        setCurrentQ(activeMsg);
        
        // Dynamic timer based on difficulty
        const diff = sess.config.difficulty;
        let limit = 180; // default 3 mins
        if (diff === 'medium') limit = 240; // 4 mins
        if (diff === 'senior' || sess.config.interviewType === 'system-design' || sess.config.interviewType === 'technical') limit = 300; // 5 mins
        setTimeRemaining(limit);

        // Hide hint initially wait 15s
        setShowHint(false);
        setTimeout(() => setShowHint(true), 15000);

        // Speak the question after a short delay
        setTimeout(() => speakQuestion(activeMsg.questionText), 1000);
      } else {
        router.replace('/dashboard/interview'); // Session closed/invalid
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [sessionId, router]);

  useEffect(() => {
    if (sessionId && isFullscreen) fetchSession();
  }, [sessionId, isFullscreen, fetchSession]);

  // Anti-Cheat & Screen Enforcement
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden && session && !isSubmitting) {
        // Tab changed! Force end.
        setIsSubmitting(true);
        synthRef.current?.cancel();
        try {
          await fetch('/api/interview/end', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
          });
          alert("Interview terminated. Switching tabs or applications is strictly prohibited during an active session.");
          router.replace(`/dashboard/interview/report?sessionId=${sessionId}`);
        } catch (e) {
             router.replace('/dashboard/interview');
        }
      }
    };

    const handleFullscreenChange = async () => {
      if (!document.fullscreenElement && session && !isSubmitting) {
        // Exited fullscreen without permission!
        setIsSubmitting(true);
        synthRef.current?.cancel();
        try {
          await fetch('/api/interview/end', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
          });
          alert("Interview terminated. You exited the secured full screen mode.");
          router.replace(`/dashboard/interview/report?sessionId=${sessionId}`);
        } catch (e) {
             router.replace('/dashboard/interview');
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
       document.removeEventListener("visibilitychange", handleVisibilityChange);
       document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [session, isSubmitting, router, sessionId]);

  const enforceFullscreen = async () => {
    try {
      // 1. Check/Request Audio Permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 2. Request Fullscreen
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        alert("Fullscreen API not supported by your browser.");
      }
    } catch (err) {
      alert("Microphone permission and Full Screen mode are REQUIRED to start the interview.");
    }
  };

  // Timer Countdown Logic
  useEffect(() => {
    if (loading || isSubmitting || savingAnswer) return;
    if (timeRemaining <= 0) {
       // Time up -> Auto Submit
       handleNextQuestion();
       return;
    }
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, loading, isSubmitting, savingAnswer]);

  // Format time mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Speech synthesis (TTS)
  const speakQuestion = (text) => {
    if (!window.speechSynthesis) return;
    synthRef.current = window.speechSynthesis;
    synthRef.current.cancel(); // clear queue
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Slightly slower, professional pace
    utterance.pitch = 1.0;
    
    // Attempt to pick a good voice
    const voices = synthRef.current.getVoices();
    const goodVoice = voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en-US'));
    if (goodVoice) utterance.voice = goodVoice;
    
    synthRef.current.speak(utterance);
  };

  // Pre-load voices to avoid delay
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Speech Recognition (STT)
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        }
      }
      if (finalTranscript) {
        setAnswerText(prev => prev + finalTranscript);
      }
    };

    recognition.onerror = (e) => {
      console.error(e);
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  // Submit Answer & Handle Next Route
  const handleNextQuestion = async (skipped = false) => {
    if (!session || !currentQ || isSubmitting) return;

    const answer = skipped ? "Skipped." : answerText;
    if (!skipped && answer.trim().length < 10 && timeRemaining > 0) {
       alert("Please provide a more detailed answer before continuing or wait for time to run out.");
       return;
    }

    setSavingAnswer(true);
    synthRef.current?.cancel(); // Stop talking
    if (isListening) toggleListening(); // Stop listening

    try {
      const res = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionNumber: currentQ.questionNumber,
          answerText: answer,
          answerMode: isListening ? 'voice' : 'text',
          answerDuration: 300 - timeRemaining // approximation
        })
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.isComplete) {
          setIsSubmitting(true);
          // Exit fullscreen gracefully safely before moving to report
          if (document.fullscreenElement) {
             await document.exitFullscreen().catch(e => console.log(e));
          }
          router.replace(`/dashboard/interview/report?sessionId=${sessionId}`);
        } else {
          // Reset UI for next question
          setAnswerText("");
          fetchSession(); // Re-fetch gets the latest active question
        }
      } else {
        alert(data.error || "Failed to submit answer.");
      }
    } catch (e) {
      alert("Network error.");
    } finally {
      setSavingAnswer(false);
    }
  };

  // FIRST: Always show fullscreen gate if not in fullscreen mode
  if (!isFullscreen) {
     return (
       <div className="min-h-screen bg-surface flex items-center justify-center flex-col gap-6 p-6 select-none relative z-50">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-bounce">
             <Icon name="fullscreen" className="text-4xl text-primary" />
          </div>
          <h2 className="text-2xl font-headline font-extrabold text-on-surface">Ready to Begin?</h2>
          <p className="text-on-surface-variant font-body text-center max-w-md">This interview uses strong anti-cheat measures. Entering full screen is required. Keep your microphone on. Do not switch tabs.</p>
          <button onClick={enforceFullscreen} className="bg-primary px-8 py-4 rounded-xl text-on-primary font-headline font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-primary/30">
            Enter Secured Mode
          </button>
       </div>
     );
  }

  // SECOND: Show loading only after fullscreen is active
  if (loading) {
     return <div className="min-h-screen bg-surface flex items-center justify-center font-headline animate-pulse">Loading Interview Session...</div>;
  }

  return (
    <>
      <Head>
        <title>Live Secured Session | LetsGrowAi</title>
      </Head>

      <div className="w-full h-screen overflow-hidden flex flex-col md:flex-row bg-surface select-none relative z-50">
        
        {/* Saving Overlay */}
        {savingAnswer && (
           <div className="absolute inset-0 z-[100] bg-surface/90 backdrop-blur-md flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <h2 className="mt-4 font-headline font-extrabold text-xl animate-pulse text-on-surface">Analyzing Semantic Response...</h2>
           </div>
        )}

        {/* ═══ LIVE CANVAS (LEFT PANEL) ═══ */}
        <section className="w-full md:w-[65%] lg:w-[70%] flex flex-col p-4 md:p-8 bg-surface transition-all relative z-20 h-full">
          
          {/* Progress & Timer Header */}
          <div className="flex justify-between items-center bg-surface-container-lowest border border-outline-variant/10 p-4 rounded-xl shadow-sm mb-6">
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5 items-center">
                 {/* Progress Tracker Dots */}
                 {Array.from({ length: session.config.totalQuestions }).map((_, idx) => {
                    const qNum = idx + 1;
                    const isPast = qNum < currentQ.questionNumber;
                    const isCurrent = qNum === currentQ.questionNumber;
                    return (
                      <div 
                        key={idx} 
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${isPast ? 'bg-primary' : isCurrent ? 'bg-secondary animate-pulse scale-125' : 'bg-outline-variant/30'}`}
                        title={`Question ${qNum}`}
                      />
                    );
                 })}
              </div>
              <span className="text-on-surface font-extrabold text-sm md:text-[15px] font-headline ml-4">
                Q{currentQ.questionNumber} of {session.config.totalQuestions}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-lg border border-[var(--error)] shadow-sm">
              <Icon name="timer" className={`text-sm ${timeRemaining < 30 ? 'text-error animate-pulse' : 'text-primary'}`} />
              <span className={`font-headline font-extrabold text-lg md:text-xl tabular-nums tracking-tight ${timeRemaining < 30 ? 'text-error animate-pulse' : 'text-on-surface'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-6 md:gap-8 min-h-0">
            {/* AI Interviewer Card */}
            <div className="bg-inverse-surface text-on-primary rounded-2xl p-6 md:p-10 flex flex-col items-center text-center gap-6 relative overflow-hidden shadow-2xl shrink-0">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-fixed to-secondary-fixed opacity-70"></div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-primary-fixed/20 rounded-full animate-ping"></div>
                <div className="w-16 h-16 md:w-20 md:h-20 bg-surface-container/10 rounded-full flex items-center justify-center border-4 border-surface-container/20 relative z-10 backdrop-blur-sm">
                  <Icon name="psychology" className="text-3xl md:text-5xl text-primary-fixed-dim" filled />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg md:text-2xl font-headline font-extrabold text-white max-w-3xl leading-relaxed md:leading-snug">
                  "{currentQ.questionText}"
                </h2>
              </div>
              <button onClick={() => speakQuestion(currentQ.questionText)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/30 px-6 py-2.5 rounded-full border border-white/10 transition-colors font-body">
                <Icon name="volume_up" className="text-sm" />
                <span className="font-bold text-[11px] md:text-sm tracking-widest uppercase">Replay Audio</span>
              </button>
            </div>

            {/* Answer Editor */}
            <div className="flex-1 flex flex-col min-h-0 relative group">
              <label className="block text-[11px] font-bold text-outline uppercase tracking-widest mb-3 font-headline">
                Your Answer <span className="lowercase font-body font-medium ml-2 opacity-70">(speak or type)</span>
              </label>
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                disabled={isListening}
                className="w-full h-full flex-1 bg-surface-container-lowest border-2 border-outline-variant/20 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-2xl p-6 text-on-surface placeholder:text-outline-variant resize-none text-base md:text-lg leading-relaxed shadow-inner transition-all outline-none font-body custom-scrollbar"
                placeholder={isListening ? "Listening... Keep speaking..." : "Start typing your detailed response here..."}
              ></textarea>
              
              {/* Mic Controls Overlay */}
              <div className="absolute bottom-5 right-5 flex items-center gap-3">
                {isListening && (
                  <div className="flex items-center gap-2 bg-error/10 border border-error/20 px-3 py-1.5 rounded-full backdrop-blur-md">
                    <span className="w-2 h-2 bg-error rounded-full animate-pulse"></span>
                    <span className="text-[11px] font-bold text-error uppercase tracking-wider font-headline">Recording</span>
                  </div>
                )}
                <button 
                   onClick={toggleListening}
                   className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:-translate-y-1 transition-all active:scale-95 border-2 relative group ${isListening ? 'bg-error text-white border-white/20' : 'bg-gradient-to-br from-primary to-secondary text-white border-white/20'}`}>
                  {isListening && <div className="absolute inset-0 rounded-full border-2 border-error animate-ping"></div>}
                  <Icon name={isListening ? "mic_off" : "mic"} className="text-2xl relative z-10" filled />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-outline-variant/20 bg-surface mt-6">
            <button onClick={() => { if(confirm("Are you sure you want to skip this question? You won't get points for it.")) handleNextQuestion(true) }} className="text-on-surface-variant font-bold hover:text-error hover:bg-error/10 transition-colors px-6 py-3 rounded-lg flex items-center gap-2 font-headline">
              <Icon name="skip_next"/> Skip
            </button>
            <button
               onClick={() => handleNextQuestion(false)}
               className="bg-primary hover:bg-primary-fixed-variant text-on-primary font-headline font-extrabold text-base md:text-lg px-10 py-4 rounded-xl flex items-center gap-3 shadow-[0_8px_20px_rgba(0,55,176,0.3)] hover:-translate-y-0.5 active:scale-95 transition-all group"
            >
              <span>{currentQ.questionNumber === session.config.totalQuestions ? "Finish Interview" : "Submit Answer"}</span>
              <Icon name="arrow_forward" className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>

        {/* ═══ ASSISTANT SIDEBAR (RIGHT PANEL) ═══ */}
        <aside className="hidden md:flex w-[35%] lg:w-[30%] flex-col bg-surface-container-low border-l border-outline-variant/20 p-8 overflow-y-auto h-full">
          <div className="flex flex-col gap-6 h-full">
            <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/10">
              <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center flex-shrink-0">
                <Icon name="psychology" className="text-3xl text-primary" />
              </div>
              <div>
                <h3 className="font-headline font-extrabold text-on-surface leading-tight text-[15px]">AI Protocol Monitor</h3>
                <p className="text-[10px] text-outline font-bold uppercase tracking-widest mt-0.5">Automated Oversight</p>
              </div>
            </div>

            {/* Hint System */}
            <div className={`bg-white rounded-2xl p-5 shadow-sm border border-transparent flex flex-col transition-all duration-700 ${showHint ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none hidden'}`}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-secondary">
                  <Icon name="lightbulb" filled />
                  <span className="font-headline font-bold text-[13px] uppercase tracking-widest">Live Prompt Hint</span>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed font-body bg-secondary/5 p-4 border border-secondary/20 rounded-xl italic">
                 {currentQ.hints && currentQ.hints.length > 0 ? currentQ.hints[0] : "Think about tradeoffs, scalabilty, or edge cases for this scenario."}
              </p>
            </div>

            {/* Digital Note Pad */}
            <div className="bg-white rounded-2xl p-5 shadow-sm flex-grow flex flex-col gap-4 border border-outline-variant/10 mt-2">
              <div className="flex items-center gap-2 text-on-surface border-b border-outline-variant/10 pb-3">
                <Icon name="edit_note" className="text-primary text-xl" />
                <span className="font-headline font-extrabold text-[13px] uppercase tracking-widest text-outline">Scratchpad</span>
              </div>
              <textarea
                className="w-full flex-grow bg-transparent border-none focus:ring-0 p-0 text-sm text-on-surface placeholder:text-outline-variant resize-none font-body leading-relaxed outline-none"
                placeholder="Use this space to jot down technical structures (e.g., STAR framework points) before compiling your final spoken or typed answer on the left."
              ></textarea>
            </div>
            
            <button 
              onClick={async () => {
                 if(confirm("Exit the interview early? This will submit a partial evaluation based on what you have answered so far.")){
                    setIsSubmitting(true);
                    if(document.fullscreenElement) await document.exitFullscreen().catch(e=>console.log(e));
                    await fetch('/api/interview/end', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ sessionId }) });
                    router.replace(`/dashboard/interview/report?sessionId=${sessionId}`);
                 }
              }}
              className="py-4 border-2 border-error/20 text-error font-bold rounded-xl hover:bg-error/5 hover:border-error transition-colors flex items-center justify-center gap-2 group font-headline uppercase tracking-widest text-[11px] mt-4"
            >
              <Icon name="exit_to_app" className="group-hover:-translate-x-1 transition-transform" />
              <span>Force Terminate Session</span>
            </button>
          </div>
        </aside>

      </div>
    </>
  );
}

// Ensure layout isolation! Professional mode.
LiveInterview.getLayout = function getLayout(page) {
  return page;
};
