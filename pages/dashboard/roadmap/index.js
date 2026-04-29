import Head from "next/head";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/DashboardLayout";
import Icon from "@/components/Icon";
import { useState, useEffect } from "react";

export default function RoadmapGateway() {
  const router = useRouter();
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/roadmap/mine");
        const data = await res.json();
        if (data.success) setRoadmaps(data.roadmaps || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const activeRoadmap = roadmaps.find(r => r.status === "active") || roadmaps[0];
  const hasRoadmap = !loading && roadmaps.length > 0;

  return (
    <>
      <Head>
        <title>My Roadmap | LetsGrowAi</title>
        <meta name="description" content="View and manage your personalized AI career roadmap." />
      </Head>

      <div className="flex-1 overflow-y-auto custom-scrollbar w-full min-h-[calc(100vh-64px)] relative">
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[100px]" />
        </div>

        <div className="max-w-5xl mx-auto px-6 py-12 md:px-10 md:py-16 w-full">

          {/* PAGE HEADER */}
          <div className="mb-12 text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-primary mb-3 font-headline">
              AI Career Guidance
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold font-headline tracking-tight text-on-surface mb-4">
              Your Career Roadmap
            </h1>
            <p className="text-on-surface-variant text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              {hasRoadmap
                ? "Continue your learning journey or create a new personalized path."
                : "Build your first AI-powered roadmap and start your journey today."}
            </p>
          </div>

          {loading ? (
            /* SKELETON LOADER */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {[1, 2].map(i => (
                <div key={i} className="rounded-3xl p-8 bg-surface-container-low border border-outline-variant/10 animate-pulse h-64" />
              ))}
            </div>
          ) : hasRoadmap ? (
            /* HAS ROADMAPS: show active + create new */
            <div className="space-y-8">
              {/* Active Roadmap Card */}
              <div
                onClick={() => router.push(`/dashboard/roadmap/view?id=${activeRoadmap._id}`)}
                className="group relative bg-inverse-surface rounded-3xl overflow-hidden cursor-pointer border border-[#2d3d5e] shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Glow */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-primary/20 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-[60px] -ml-10 -mb-10 pointer-events-none" />

                <div className="relative z-10 p-8 md:p-10">
                  {/* Status badge */}
                  <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-1.5 mb-6">
                    <span className="w-2 h-2 rounded-full bg-primary-fixed-dim animate-pulse" />
                    <span className="text-[10px] font-extrabold text-primary-fixed-dim uppercase tracking-widest font-headline">Active Roadmap</span>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <h2 className="text-2xl md:text-3xl font-extrabold font-headline text-white mb-2 tracking-tight leading-snug">
                        {activeRoadmap.title}
                      </h2>
                      <p className="text-white/50 text-sm font-medium mb-6 line-clamp-1">{activeRoadmap.goal}</p>

                      {/* Progress bar */}
                      <div className="max-w-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-extrabold text-white/40 uppercase tracking-widest font-headline">Progress</span>
                          <span className="text-sm font-extrabold text-primary-fixed-dim font-headline">
                            {activeRoadmap.progress?.percentComplete || 0}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-fixed-dim to-secondary-fixed rounded-full transition-all duration-1000"
                            style={{ width: `${activeRoadmap.progress?.percentComplete || 0}%` }}
                          />
                        </div>
                        <p className="text-white/30 text-[11px] mt-2">
                          {activeRoadmap.progress?.completedTopics || 0} of {activeRoadmap.progress?.totalTopics || 0} topics done
                          {activeRoadmap.totalWeeks && ` • ${activeRoadmap.totalWeeks} week plan`}
                        </p>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex-shrink-0">
                      <div className="inline-flex items-center gap-3 bg-white text-primary px-6 py-3.5 rounded-xl font-extrabold text-sm font-headline shadow-xl group-hover:shadow-2xl group-hover:gap-4 transition-all">
                        Continue Learning
                        <Icon name="arrow_forward" className="text-[18px]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row: Create New + All Roadmaps list if more exist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Create New */}
                <div
                  onClick={() => router.push('/dashboard/roadmap/setup')}
                  className="group bg-surface-container-lowest rounded-3xl p-8 border-2 border-dashed border-outline-variant/30 hover:border-primary/40 cursor-pointer hover:bg-primary/5 transition-all hover:-translate-y-0.5 flex flex-col items-center justify-center text-center gap-4 min-h-[180px]"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/5 group-hover:bg-primary/10 border border-primary/20 flex items-center justify-center transition-all">
                    <Icon name="add" className="text-primary text-3xl" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold font-headline text-on-surface mb-1">Create New Roadmap</h3>
                    <p className="text-on-surface-variant text-sm">Start a fresh learning journey</p>
                  </div>
                </div>

                {/* View all roadmaps if more than 1 */}
                {roadmaps.length > 1 && (
                  <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10 overflow-y-auto max-h-[300px] custom-scrollbar space-y-3">
                    <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4 font-headline">All Roadmaps</h3>
                    {roadmaps.map(rm => (
                      <div key={rm._id}
                        onClick={() => router.push(`/dashboard/roadmap/view?id=${rm._id}`)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container cursor-pointer transition-colors group/item">
                        <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                          <Icon name="route" className="text-primary text-lg" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-on-surface text-sm truncate font-headline">{rm.title}</p>
                          <p className="text-[11px] text-on-surface-variant mt-0.5">{rm.progress?.percentComplete || 0}% • {rm.totalWeeks}w</p>
                        </div>
                        <Icon name="chevron_right" className="text-outline-variant text-lg group-hover/item:text-primary transition-colors" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* NO ROADMAPS: clean empty state with single CTA */
            <div className="flex flex-col items-center justify-center py-12 gap-10">
              {/* Illustration */}
              <div className="relative w-56 h-56">
                <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl" />
                <div className="relative w-full h-full flex flex-col items-center justify-center gap-4">
                  <div className="w-24 h-24 bg-primary/10 rounded-3xl border-2 border-primary/20 flex items-center justify-center shadow-xl">
                    <Icon name="route" className="text-5xl text-primary" />
                  </div>
                  <div className="flex gap-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`h-1.5 rounded-full bg-primary/20 ${i === 0 ? 'w-10' : i === 4 ? 'w-4' : 'w-6'}`} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-center max-w-md">
                <h2 className="text-2xl font-extrabold font-headline text-on-surface mb-3">No Roadmap Yet</h2>
                <p className="text-on-surface-variant leading-relaxed mb-8">
                  Let AI analyze the 2026 job market and build you a week-by-week plan to reach your career goal.
                </p>

                <button
                  onClick={() => router.push('/dashboard/roadmap/setup')}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-extrabold rounded-2xl shadow-[0_10px_30px_rgba(0,55,176,0.3)] hover:shadow-[0_14px_40px_rgba(0,55,176,0.4)] hover:-translate-y-1 transition-all active:scale-95 font-headline text-base group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                  <span className="relative z-10">Generate My First Roadmap</span>
                  <Icon name="bolt" className="relative z-10 text-yellow-300" filled />
                </button>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {['Market-aware (2026)', 'Week-by-week plan', 'Real resource links', 'Progress tracking', 'Re-plan anytime'].map(f => (
                  <span key={f} className="px-4 py-2 bg-surface-container-low border border-outline-variant/20 rounded-full text-xs font-bold text-on-surface-variant">
                    ✓ {f}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

RoadmapGateway.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
