import Icon from "@/components/Icon";
import Link from "next/link";

export default function AINudges({ nudges }) {
  if (!nudges || nudges.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon name="tips_and_updates" className="text-amber-500" filled />
        <h3 className="text-sm font-extrabold font-headline uppercase tracking-widest text-slate-500">AI Priority Actions</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nudges.map((nudge) => {
          let iconName = "info";
          let colorTheme = "bg-primary/5 border-primary/20 text-primary";
          let iconColor = "text-primary";
          
          if (nudge.type === 'warning') {
            iconName = "warning";
            colorTheme = "bg-red-50 border-red-100 text-red-700";
            iconColor = "text-red-500";
          } else if (nudge.type === 'success') {
            iconName = "check_circle";
            colorTheme = "bg-emerald-50 border-emerald-100 text-emerald-700";
            iconColor = "text-emerald-500";
          }

          return (
            <div key={nudge.id} className={`p-5 rounded-2xl border ${colorTheme} flex flex-col justify-between shadow-sm transition-transform hover:-translate-y-1`}>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Icon name={iconName} className={iconColor} filled />
                  <h4 className="font-bold text-sm">{nudge.title}</h4>
                </div>
                <p className="text-xs font-medium opacity-80 mb-4">{nudge.message}</p>
              </div>
              <Link href={nudge.actionLink}>
                <button className="text-[11px] font-extrabold uppercase tracking-widest bg-white/50 hover:bg-white px-4 py-2 rounded-lg transition-colors border border-current/10 w-fit">
                  {nudge.actionText}
                </button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
