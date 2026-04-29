import Icon from "@/components/Icon";

export default function CareerScoreCard({ score }) {
  // Determine color based on score
  let colorClass = "text-emerald-500";
  let bgClass = "bg-emerald-500";
  let message = "Excellent progress! You are on track.";
  
  if (score < 400) {
    colorClass = "text-red-500";
    bgClass = "bg-red-500";
    message = "Time to level up. Start tackling those nudges!";
  } else if (score < 700) {
    colorClass = "text-amber-500";
    bgClass = "bg-amber-500";
    message = "Good momentum! Keep building those skills.";
  }

  // Calculate percentage for circular progress
  const percentage = Math.min((score / 1000) * 100, 100);
  const strokeDasharray = 283; // Circumference of circle (2 * pi * r) where r=45
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-outline-variant/10 flex flex-col md:flex-row items-center gap-5">
      
      {/* Circular Gauge */}
      <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-100"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={`${colorClass} transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-extrabold font-headline ${colorClass}`}>{score}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">/ 1000</span>
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 text-center md:text-left space-y-1.5">
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/5 text-primary text-[9px] font-extrabold uppercase tracking-widest border border-primary/10">
          <Icon name="military_tech" className="text-[12px]" />
          Career Score
        </div>
        <h2 className="text-lg md:text-xl font-extrabold text-on-surface font-headline tracking-tight">
          Your Readiness Score
        </h2>
        <p className="text-slate-500 font-medium text-[12px] max-w-md leading-relaxed">
          {message} This score aggregates your profile completeness, ATS resume strength, mock interview performance, and roadmap progress.
        </p>
      </div>

    </div>
  );
}
