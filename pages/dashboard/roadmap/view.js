import Head from "next/head";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/DashboardLayout";
import Icon from "@/components/Icon";
import WeekCard from "@/components/roadmap/WeekCard";
import ProgressSidebar from "@/components/roadmap/ProgressSidebar";
import { useState, useEffect, useCallback } from "react";

export default function RoadmapView() {
  const router = useRouter();
  const { id } = router.query;

  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [fetchingRes, setFetchingRes] = useState(false);

  // Fetch roadmap
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/roadmap/${id}`);
        const data = await res.json();
        if (data.success) setRoadmap(data.roadmap);
        else setError(data.error || "Failed to load roadmap");
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [id]);

  // Toggle topic completion
  const handleToggleTopic = useCallback(async (weekNumber, topicName) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/roadmap/${id}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekNumber, topicName })
      });
      const data = await res.json();
      if (data.success) {
        setRoadmap(prev => {
          const updated = { ...prev, progress: data.progress };
          updated.weeks = prev.weeks.map(w => {
            if (w.weekNumber !== weekNumber) return w;
            return { ...w, topics: w.topics.map(t => t.name === topicName ? { ...t, completed: !t.completed } : t) };
          });
          return updated;
        });
      }
    } catch (e) { console.error(e); }
  }, [id]);

  // Fetch resources for topics
  const handleFetchResources = useCallback(async (topics) => {
    if (!id || fetchingRes) return;
    setFetchingRes(true);
    try {
      const res = await fetch(`/api/roadmap/${id}/fetch-resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics })
      });
      const data = await res.json();
      if (data.success && data.resourceMap) {
        setRoadmap(prev => ({
          ...prev,
          weeks: prev.weeks.map(w => ({
            ...w,
            topics: w.topics.map(t => data.resourceMap[t.name] ? { ...t, resources: data.resourceMap[t.name] } : t)
          }))
        }));
      }
    } catch (e) { console.error(e); }
    finally { setFetchingRes(false); }
  }, [id, fetchingRes]);

  // Regenerate
  const handleRegenerate = useCallback(async () => {
    if (!id || regenerating) return;
    setRegenerating(true);
    try {
      const res = await fetch(`/api/roadmap/${id}/regenerate`, { method: "POST" });
      const data = await res.json();
      if (data.success) setRoadmap(data.roadmap);
      else alert(data.error === 'MAX_REGENERATIONS_REACHED' ? 'Maximum regeneration limit reached (5).' : data.error);
    } catch (e) { console.error(e); }
    finally { setRegenerating(false); }
  }, [id, regenerating]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-on-surface-variant font-headline text-sm">Loading your roadmap...</p>
        </div>
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Icon name="error" className="text-error text-5xl" />
          <p className="text-on-surface-variant">{error || "Roadmap not found"}</p>
          <button onClick={() => router.push('/dashboard/roadmap')} className="text-primary font-bold">← Back</button>
        </div>
      </div>
    );
  }

  // Group weeks into months (4 weeks per month)
  const months = [];
  for (let i = 0; i < roadmap.weeks.length; i += 4) {
    months.push(roadmap.weeks.slice(i, i + 4));
  }

  return (
    <>
      <Head><title>{roadmap.title} | LetsGrowAi</title></Head>

      <div className="flex-1 flex flex-col w-full bg-surface pb-24 lg:pb-0 relative">
        
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 bg-[#faf8ff]/90 backdrop-blur-xl border-b border-[#e2e7ff] px-6 lg:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-extrabold text-[#131b2e] tracking-tight font-headline">
              {roadmap.title} — {roadmap.config?.targetDeadline?.replace('months', ' Month').replace('month', ' Month').replace('year', ' Year')} Plan
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="w-56 h-1.5 bg-[#eaedff] rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-[#0037b0] rounded-r-full transition-all duration-700" style={{ width: `${roadmap.progress?.percentComplete || 0}%` }}></div>
              </div>
              <span className="text-xs font-bold text-[#0037b0] font-headline uppercase tracking-widest">{roadmap.progress?.percentComplete || 0}% Complete</span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-3">
             <button onClick={handleRegenerate} disabled={regenerating}
               className="px-6 py-2.5 rounded-xl border-2 border-outline-variant/30 text-slate-600 font-bold text-sm hover:bg-surface-container hover:text-primary transition-all active:scale-95 font-headline disabled:opacity-50">
                {regenerating ? 'Re-planning...' : 'Re-plan Roadmap'}
            </button>
          </div>
        </header>

        {/* Market Influenced Banner */}
        {roadmap.marketInfluenced?.length > 0 && (
          <div className="mx-6 lg:mx-8 mt-4 bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center gap-3">
            <Icon name="trending_up" className="text-primary text-xl shrink-0" />
            <p className="text-sm text-on-surface-variant">
              <span className="font-bold text-primary">Market-influenced: </span>
              {roadmap.marketInfluenced.join(', ')} — prioritized based on 2026 trends.
            </p>
          </div>
        )}

        {/* Content: Timeline + Sidebar */}
        <div className="flex flex-col xl:flex-row flex-1 p-6 lg:p-8 gap-8">
          
          {/* Timeline */}
          <div className="flex-1 space-y-6">
            {months.map((monthWeeks, mi) => (
              <div key={mi} className="bg-surface-container-low rounded-3xl overflow-hidden border border-outline-variant/5 shadow-sm">
                <div className="flex items-center justify-between p-6 bg-[#e2e7ff]/40">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-outline-variant/5">
                      <Icon name="calendar_month" className="text-primary text-[28px]" />
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-extrabold font-headline tracking-tight text-on-surface">Month {mi + 1}</h2>
                      <p className="text-sm text-on-surface-variant font-medium mt-0.5">{monthWeeks.length} Weeks</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 md:p-8 space-y-6 bg-surface-container-lowest">
                  {monthWeeks.map(week => (
                    <WeekCard key={week.weekNumber} week={week} onToggleTopic={handleToggleTopic} onFetchResources={handleFetchResources} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <ProgressSidebar roadmap={roadmap} />
        </div>

        {/* Mobile Bottom Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-outline-variant/20 px-6 py-4 flex items-center gap-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
           <button onClick={handleRegenerate} disabled={regenerating}
             className="flex-1 py-3.5 rounded-xl border-2 border-outline-variant/30 text-slate-600 font-bold text-sm bg-white font-headline shadow-sm">
                {regenerating ? 'Re-planning...' : 'Re-plan'}
            </button>
        </div>
      </div>
    </>
  );
}

RoadmapView.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
