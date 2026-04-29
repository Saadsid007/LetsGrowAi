import Icon from "@/components/Icon";
import Link from "next/link";

export default function MetricGrid({ data }) {
  const metrics = [
    {
      title: "ATS Resume Score",
      value: data.resume?.atsScore ? `${data.resume.atsScore}/100` : "N/A",
      icon: "document_scanner",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      link: "/dashboard/resume"
    },
    {
      title: "Avg Interview Score",
      value: data.interviews?.length > 0 
        ? `${Math.round(data.interviews.reduce((a, b) => a + (b.overallScore || 0), 0) / data.interviews.length)}%` 
        : "N/A",
      icon: "mic",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      link: "/dashboard/interview/history"
    },
    {
      title: "Roadmap Progress",
      value: data.roadmap?.progress?.percentComplete !== undefined ? `${data.roadmap.progress.percentComplete}%` : "0%",
      icon: "explore",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      link: "/dashboard/roadmap"
    },
    {
      title: "Outreach Generated",
      value: data.outreach?.length || 0,
      icon: "send",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      link: "/dashboard/outreach"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m, idx) => (
        <Link href={m.link} key={idx}>
          <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group cursor-pointer h-full flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl ${m.bg} ${m.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon name={m.icon} className="text-[20px]" />
              </div>
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-tight">
                {m.title}
              </h3>
            </div>
            <div className="text-3xl font-black font-headline text-on-surface">
              {m.value}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
