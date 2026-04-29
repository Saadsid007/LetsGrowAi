import Icon from "./Icon";

export default function PageLoader({ message = "Setting up your workspace..." }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-surface/80 backdrop-blur-xl transition-all duration-500 animate-in fade-in">
      <div className="relative flex flex-col items-center">
        {/* Animated Rings */}
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-4 border-4 border-secondary/20 rounded-full"></div>
          <div className="absolute inset-4 border-4 border-secondary border-b-transparent rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
          
          {/* Central Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-primary/10 p-2 rounded-xl animate-pulse">
                <Icon name="bolt" className="text-2xl text-primary" filled />
            </div>
          </div>
        </div>

        {/* Text Area */}
        <div className="text-center">
          <h2 className="text-xl font-extrabold font-headline tracking-tight text-on-surface mb-1">
            LetsGrowAi
          </h2>
          <div className="flex items-center gap-2 justify-center">
             <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
             <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
             <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
             <p className="text-sm text-on-surface-variant font-medium ml-1">{message}</p>
          </div>
        </div>
      </div>
      
      {/* Visual Accents */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/5 blur-[100px] rounded-full pointer-events-none"></div>
    </div>
  );
}
