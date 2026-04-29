import Link from "next/link";
import { useRouter } from "next/router";
import Icon from "./Icon";
import { useState, useEffect } from "react";
import GlobalSearch from "./GlobalSearch";

export default function WorkspaceLayout({ children }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="bg-surface text-on-surface h-screen flex flex-col overflow-hidden">
      <header className="bg-slate-50 flex justify-between items-center w-full px-4 md:px-6 py-3 max-w-full mx-auto tonal-shift sticky top-0 z-50 border-b border-outline-variant/20 shadow-sm relative">
        <div className="flex items-center gap-4 md:gap-8">
          {/* Back to Dashboard Button (Mobile Toggle included) */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors group"
              title="Back to Dashboard"
            >
              <Icon
                name="arrow_back"
                className="text-on-surface-variant group-hover:text-primary transition-colors text-xl"
              />
            </Link>
            <span className="text-lg md:text-xl font-bold tracking-tight text-primary font-headline hidden md:block">
              LetsGrowAi
            </span>
          </div>

          {/* Center Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6 ml-4 lg:ml-8">
            <Link
              href="/dashboard/resume"
              className={`font-semibold pb-1 border-b-2 transition-all font-headline text-[13px] lg:text-[15px] ${
                router.pathname.includes("/resume")
                  ? "text-primary border-primary"
                  : "text-on-surface-variant border-transparent hover:text-primary/80"
              }`}
            >
              Resume Builder
            </Link>
            <Link
              href="/dashboard/jd-points"
              className={`font-semibold pb-1 border-b-2 transition-all font-headline text-[13px] lg:text-[15px] ${
                router.pathname.includes("/jd-points")
                  ? "text-primary border-primary"
                  : "text-on-surface-variant border-transparent hover:text-primary/80"
              }`}
            >
              JD Key Points
            </Link>
            <Link
              href="/dashboard/ats"
              className={`font-semibold pb-1 border-b-2 transition-all font-headline text-[13px] lg:text-[15px] ${
                router.pathname.includes("/ats")
                  ? "text-primary border-primary"
                  : "text-on-surface-variant border-transparent hover:text-primary/80"
              }`}
            >
              ATS Scorer
            </Link>
            <Link
              href="/dashboard/interview"
              className={`font-semibold pb-1 border-b-2 transition-all font-headline text-[13px] lg:text-[15px] ${
                router.pathname.includes("/interview")
                  ? "text-primary border-primary"
                  : "text-on-surface-variant border-transparent hover:text-primary/80"
              }`}
            >
              Mock Interview
            </Link>
          </nav>
        </div>

        {/* Right Navigation */}
        <div className="flex items-center gap-3 md:gap-4">
          <button className="p-2 lg:hidden text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container-low transition-colors"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Icon name={mobileMenuOpen ? "close" : "menu"} />
          </button>
          
          <div className="hidden sm:flex items-center gap-3">
            <button onClick={() => setSearchOpen(true)} className="p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container-low transition-colors flex items-center gap-2 px-3 border border-outline-variant/30 hidden md:flex">
              <Icon name="search" className="text-[18px]" />
              <span className="text-[11px] font-medium tracking-wide">Search <kbd className="font-mono bg-surface-container ml-1 px-1.5 py-0.5 rounded border border-outline-variant/20">Ctrl+K</kbd></span>
            </button>
            <button onClick={() => setSearchOpen(true)} className="p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container-low transition-colors md:hidden">
              <Icon name="search" />
            </button>
            <button className="p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container-low transition-colors">
              <Icon name="notifications" />
            </button>
            <button className="p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container-low transition-colors">
              <Icon name="help_outline" />
            </button>
          </div>
          
          <div className="w-[1px] h-6 bg-outline-variant/30 hidden sm:block mx-1"></div>
          
          <button className="w-8 h-8 md:w-9 md:h-9 bg-primary-fixed text-primary font-bold rounded-full flex items-center justify-center ring-2 ring-transparent hover:ring-primary/20 outline-none transition-all">
            RS
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-surface-container-lowest border-b border-outline-variant/20 shadow-lg md:hidden flex flex-col z-50">
            <Link
              href="/dashboard/resume"
              onClick={() => setMobileMenuOpen(false)}
              className="p-4 border-b border-outline-variant/10 font-bold text-on-surface flex items-center gap-3 font-headline"
            >
              <Icon name="history_edu" className="text-outline" /> Resume Builder
            </Link>
            <Link
              href="/dashboard/jd-points"
              onClick={() => setMobileMenuOpen(false)}
              className="p-4 border-b border-outline-variant/10 font-bold text-on-surface flex items-center gap-3 font-headline"
            >
              <Icon name="assignment" className="text-outline" /> JD Key Points
            </Link>
            <Link
              href="/dashboard/ats"
              onClick={() => setMobileMenuOpen(false)}
              className="p-4 border-b border-outline-variant/10 font-bold text-on-surface flex items-center gap-3 font-headline"
            >
              <Icon name="analytics" className="text-outline" /> ATS Scorer
            </Link>
            <Link
              href="/dashboard/interview"
              onClick={() => setMobileMenuOpen(false)}
              className="p-4 font-bold text-on-surface flex items-center gap-3 font-headline"
            >
              <Icon name="psychology" className="text-outline" /> Mock Interview
            </Link>
          </div>
        )}
      </header>

      {/* Main Tools Container Canvas */}
      <main className="flex-1 flex overflow-hidden relative">
        {children}
      </main>

      {/* Global Search Overlay */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
