import Head from "next/head";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import Icon from "@/components/Icon";
import PageLoader from "@/components/PageLoader";
import { useState, useEffect } from "react";
import CareerScoreCard from "@/components/dashboard/CareerScoreCard";
import AINudges from "@/components/dashboard/AINudges";
import MetricGrid from "@/components/dashboard/MetricGrid";
import RecentActivity from "@/components/dashboard/RecentActivity";

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/dashboard/summary');
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } catch (err) {
        console.error("Error fetching dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (isLoading) return <PageLoader message="Welcome back! Syncing your data..." />;

  const user = data?.user || { name: 'User' };
  const targetRole = user.targetRole || 'Your Dream Role';

  return (
    <>
      <Head>
        <title>Dashboard | LetsGrowAi</title>
      </Head>

      <main className="p-4 md:p-6 pb-10 w-full max-w-[1400px] mx-auto">
        {/* Welcome Header */}
        <div className="mb-4 md:mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-on-surface font-headline">
              Good evening, {user.name.split(' ')[0]} 👋
            </h2>
            <p className="text-on-surface-variant font-body mt-0.5 text-[13px] md:text-sm">
              Here is what&apos;s happening with your journey to become a <span className="font-bold text-primary">{targetRole}</span>.
            </p>
          </div>
        </div>

        {data ? (
          <>
            {/* Hero: Career Readiness & Nudges */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="lg:col-span-2">
                <CareerScoreCard score={data.careerScore} />
              </div>
              <div className="lg:col-span-1 bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/10">
                <AINudges nudges={data.nudges} />
              </div>
            </section>

            {/* KPI Stats Grid */}
            <section className="mb-6">
              <MetricGrid data={data} />
            </section>

            {/* Split Layout: Activity & Active Roadmap */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
              <RecentActivity data={data} />
              
              {/* Active Roadmap Highlight */}
              {data.roadmap ? (
                <div className="bg-inverse-surface p-5 md:p-6 rounded-2xl relative overflow-hidden flex flex-col justify-center shadow-lg">
                  <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-primary/20 to-transparent pointer-events-none"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon name="map" className="text-primary-fixed-dim text-[18px]" />
                      <h3 className="text-base font-bold text-white font-headline">Active Roadmap: {data.roadmap.targetRole || data.roadmap.title}</h3>
                    </div>
                    <p className="text-[12px] text-on-primary-container mb-4 opacity-80">
                      {data.roadmap.weeks?.length > 0 ? `${data.roadmap.weeks.length} Weeks Total` : 'Generated Path'}
                    </p>
                    
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                          <div className="bg-primary-fixed-dim h-full rounded-full transition-all duration-1000" style={{ width: `${data.roadmap.progress?.percentComplete || 0}%` }}></div>
                        </div>
                      </div>
                      <p className="text-xl font-extrabold text-white font-headline">{data.roadmap.progress?.percentComplete || 0}%</p>
                    </div>
                    <div className="mt-4">
                      <Link href="/dashboard/roadmap">
                        <button className="px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-bold hover:bg-secondary transition-colors duration-200 active:scale-95 shadow-md shadow-primary/20">
                          Resume Learning
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-surface-container-lowest p-5 md:p-6 rounded-2xl relative overflow-hidden border border-outline-variant/10 shadow-sm flex flex-col items-center justify-center text-center">
                  <Icon name="explore" className="text-3xl text-primary/30 mb-3" />
                  <h3 className="text-base font-bold font-headline mb-1.5">No Active Roadmap</h3>
                  <p className="text-[13px] text-slate-500 mb-4 max-w-sm">
                    Generate a personalized learning path to hit your target role.
                  </p>
                  <Link href="/dashboard/roadmap">
                    <button className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-[13px] font-bold hover:bg-primary/20 transition-colors">
                      Create One Now
                    </button>
                  </Link>
                </div>
              )}
            </section>
          </>
        ) : null}

        {/* Module Quick Access Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base md:text-lg font-bold font-headline">Growth Modules</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {[
              { href: "/dashboard/resume", icon: "history_edu", title: "Resume Builder", desc: "Create AI-optimized resumes tailored for top-tier tech roles." },
              { href: "/dashboard/interview", icon: "video_chat", title: "Mock Interview", desc: "Practice with our AI interviewer and get instant performance feedback." },
              { href: "/dashboard/skills", icon: "trending_up", title: "Skill Gap Analysis", desc: "Identify missing skills required for your dream job description." },
              { href: "/dashboard/company", icon: "corporate_fare", title: "Company Research", desc: "Deep dive into culture, pay scales, and interview loops." },
              { href: "/dashboard/outreach", icon: "mail", title: "Cold Outreach", desc: "AI-generated templates for LinkedIn networking and referrals." },
              { href: "/dashboard/jobs", icon: "assignment_turned_in", title: "Job Tracker", desc: "Manage your applications and interviews in one central kanban." }
            ].map((mod, idx) => (
              <Link key={idx} href={mod.href} className="bg-surface-container-lowest p-4 md:p-5 rounded-xl border ring-1 ring-transparent hover:ring-outline-variant/30 transition-all shadow-[0_4px_20px_rgba(15,23,42,0.02)] hover:shadow-[0_10px_30px_rgba(15,23,42,0.06)] hover:-translate-y-1 group block outline-none">
                <div className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center mb-3 group-hover:bg-primary-fixed transition-colors">
                  <Icon name={mod.icon} className="text-primary text-xl" />
                </div>
                <h5 className="font-bold text-on-surface mb-1 font-headline text-[15px]">{mod.title}</h5>
                <p className="text-[12px] text-on-surface-variant mb-4 leading-relaxed">
                  {mod.desc}
                </p>
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-primary group-hover:gap-2 transition-all">
                  Open <Icon name="arrow_forward" className="text-[13px]" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

// Map this page to the shared DashboardLayout
Dashboard.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
