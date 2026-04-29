import Icon from "@/components/Icon";

export default function RecentActivity({ data }) {
  // Aggregate recent events
  const events = [];

  if (data.resume) {
    events.push({
      id: `resume_${data.resume._id}`,
      type: 'resume',
      title: 'Analyzed Resume ATS Score',
      date: new Date(data.resume.updatedAt || data.resume.createdAt),
      icon: 'document_scanner',
      color: 'text-blue-500'
    });
  }

  if (data.interviews && data.interviews.length > 0) {
    data.interviews.slice(0, 2).forEach(i => {
      events.push({
        id: `int_${i._id}`,
        type: 'interview',
        title: `Completed ${i.config?.interviewType || 'Mock'} Interview`,
        date: new Date(i.createdAt),
        icon: 'mic',
        color: 'text-purple-500'
      });
    });
  }

  if (data.outreach && data.outreach.length > 0) {
    data.outreach.slice(0, 2).forEach(o => {
      events.push({
        id: `out_${o._id}`,
        type: 'outreach',
        title: `Generated ${o.messageType} Outreach`,
        date: new Date(o.createdAt),
        icon: 'send',
        color: 'text-amber-500'
      });
    });
  }

  // Sort by date descending
  events.sort((a, b) => b.date - a.date);

  const topEvents = events.slice(0, 4);

  if (topEvents.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-outline-variant/10">
        <h3 className="text-sm font-extrabold font-headline uppercase tracking-widest text-slate-500 mb-4">Recent Activity</h3>
        <div className="text-center py-6 text-slate-400">
          <Icon name="history" className="text-4xl mb-2 opacity-50" />
          <p className="text-xs font-medium">No recent activity found. Start using the tools!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-outline-variant/10">
      <h3 className="text-sm font-extrabold font-headline uppercase tracking-widest text-slate-500 mb-6">Recent Activity</h3>
      
      <div className="space-y-6">
        {topEvents.map((event, idx) => (
          <div key={event.id} className="flex gap-4 relative">
            {/* Timeline line */}
            {idx !== topEvents.length - 1 && (
              <div className="absolute left-4 top-10 bottom-[-24px] w-0.5 bg-slate-100"></div>
            )}
            
            <div className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 z-10 ${event.color} shrink-0`}>
              <Icon name={event.icon} className="text-[16px]" />
            </div>
            
            <div className="pt-1.5">
              <p className="text-sm font-bold text-on-surface">{event.title}</p>
              <p className="text-[10px] font-extrabold font-headline uppercase tracking-widest text-slate-400 mt-1">
                {event.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
