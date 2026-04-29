import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Icon from "./Icon";
import { useAuth } from "@/context/AuthContext";
import GlobalSearch from "./GlobalSearch";

const SIDEBAR_NAV = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { name: "Resume Builder", href: "/dashboard/resume", icon: "description" },
  { name: "Mock Interview", href: "/dashboard/interview", icon: "forum" },
  { name: "Skill Gap Analysis", href: "/dashboard/skills", icon: "psychology" },
  { name: "Roadmap", href: "/dashboard/roadmap", icon: "map" },
  { name: "Company Research", href: "/dashboard/company", icon: "corporate_fare" },
  { name: "Cold Outreach", href: "/dashboard/outreach", icon: "mail" },
  // { name: "Job Tracker", href: "/dashboard/jobs", icon: "assignment_turned_in" },
  { name: "Settings", href: "/settings", icon: "settings" },
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, logout } = useAuth();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router.pathname]);

  // Ctrl+K shortcut for search
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
    <div className="bg-background min-h-screen text-on-background flex">
      {/* ═══ Sidebar ═══ */}
      <>
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <aside
          className={`fixed left-0 top-0 h-screen w-64 bg-[#f2f3ff] border-r border-[#e2e7ff] z-50 flex flex-col font-headline text-sm font-semibold transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
          }`}
        >
          {/* Logo Container */}
          <div className="px-5 py-5 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-[#1D4ED8]">
                LetsGrowAi
              </h1>
              <p className="text-[9px] uppercase tracking-widest text-outline mt-0.5 font-body">
                Career Growth
              </p>
            </div>
            <button
              className="lg:hidden p-1.5 text-outline hover:text-on-surface transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Icon name="close" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto custom-scrollbar">
            {SIDEBAR_NAV.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 text-[13px] ${
                    isActive
                      ? "text-[#1D4ED8] font-bold bg-[#1D4ED8]/10"
                      : "text-slate-500 hover:bg-white/50 hover:text-slate-700"
                  }`}
                >
                  <Icon name={item.icon} className={`text-[18px] ${isActive ? "text-[#1D4ED8]" : ""}`} filled={isActive} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Footer Actions */}
          <div className="mt-auto flex flex-col gap-0.5 border-t border-surface-container pt-3 p-3">
            <Link href="/help" className="flex items-center gap-2.5 px-3 py-2 text-slate-500 font-medium text-[13px] hover:bg-[#f2f3ff] rounded-lg transition-colors">
              <Icon name="help_outline" className="text-[18px]" />
              <span>Help</span>
            </Link>
            <button onClick={logout} className="flex items-center gap-2.5 px-3 py-2 text-slate-500 font-medium text-[13px] hover:bg-red-50 hover:text-error rounded-lg transition-colors w-full text-left">
              <Icon name="logout" className="text-[18px]" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>
      </>

      {/* ═══ Main Content Area ═══ */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64 w-full">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 h-14 bg-[#faf8ff]/80 backdrop-blur-xl border-b border-[#e2e7ff]">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            {/* Hamburger (Mobile only) */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-outline hover:text-on-surface transition-colors rounded-lg hover:bg-surface-container"
            >
              <Icon name="menu" />
            </button>

            {/* Search Trigger */}
            <button onClick={() => setSearchOpen(true)} className="flex items-center bg-surface-container-low px-3 py-1.5 rounded-full flex-1 lg:w-80 border border-transparent hover:border-outline-variant/30 transition-colors gap-2 cursor-pointer">
              <Icon name="search" className="text-outline text-sm" />
              <span className="text-[13px] text-outline-variant font-body">Search... <kbd className="hidden sm:inline font-mono bg-surface-container ml-1 px-1 py-0.5 rounded border border-outline-variant/20 text-[10px]">Ctrl+K</kbd></span>
            </button>
          </div>

          <div className="flex items-center gap-4 lg:gap-6 ml-4">
            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-2">
              <button className="p-2 text-slate-600 hover:text-[#1D4ED8] transition-all scale-95 duration-150 rounded-full hover:bg-surface-container-low">
                <Icon name="notifications" />
              </button>
              <button className="p-2 text-slate-600 hover:text-[#1D4ED8] transition-all scale-95 duration-150 rounded-full hover:bg-surface-container-low">
                <Icon name="help_outline" />
              </button>
            </div>

            <div className="hidden sm:block h-8 w-[1px] bg-outline-variant/30"></div>

            {/* Profile Dropdown */}
            <button className="flex items-center gap-3 hover:opacity-80 transition-opacity outline-none">
              <div className="hidden lg:block text-right">
                <p className="text-xs font-bold text-on-surface">{user?.name || 'Guest'}</p>
                <p className="text-[10px] text-outline font-body">{user?.targetRole || 'Career Explorer'}</p>
              </div>
              {user?.avatar ? (
                <img
                  alt="User profile"
                  className="w-9 h-9 lg:w-10 lg:h-10 rounded-full border-2 border-primary-fixed object-cover"
                  src={user.avatar}
                />
              ) : (
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full border-2 border-primary-fixed bg-primary text-white flex items-center justify-center font-bold text-sm">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        {children}
      </div>

      {/* Global Search Overlay */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
