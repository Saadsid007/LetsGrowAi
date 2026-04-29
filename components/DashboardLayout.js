import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Icon from "./Icon";
import { useAuth } from "@/context/AuthContext";

const SIDEBAR_NAV = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { name: "Resume Builder", href: "/dashboard/resume", icon: "description" },
  { name: "Mock Interview", href: "/dashboard/interview", icon: "forum" },
  { name: "Skill Gap Analysis", href: "/dashboard/skills", icon: "psychology" },
  { name: "Roadmap", href: "/dashboard/roadmap", icon: "map" },
  { name: "Company Research", href: "/dashboard/company", icon: "corporate_fare" },
  { name: "Cold Outreach", href: "/dashboard/outreach", icon: "mail" },
  // { name: "Job Tracker", href: "/dashboard/jobs", icon: "assignment_turned_in" },
  { name: "Settings", href: "/dashboard/settings", icon: "settings" },
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router.pathname]);

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
          <div className="p-8 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#1D4ED8]">
                LetsGrowAi
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-outline mt-1 font-body">
                Career Growth
              </p>
            </div>
            <button
              className="lg:hidden p-2 text-outline hover:text-on-surface transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Icon name="close" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
            {SIDEBAR_NAV.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "text-[#1D4ED8] font-bold bg-[#1D4ED8]/10"
                      : "text-slate-500 hover:bg-white/50 hover:text-slate-700"
                  }`}
                >
                  <Icon name={item.icon} className={isActive ? "text-[#1D4ED8]" : ""} filled={isActive} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Footer Actions */}
          <div className="mt-auto flex flex-col gap-1 border-t border-surface-container pt-4 p-4">
            <Link href="/help" className="flex items-center gap-3 px-3 py-2 text-slate-500 font-medium text-sm hover:bg-[#f2f3ff] rounded-lg transition-colors">
              <Icon name="help_outline" />
              <span>Help</span>
            </Link>
            <button onClick={logout} className="flex items-center gap-3 px-3 py-2 text-slate-500 font-medium text-sm hover:bg-red-50 hover:text-error rounded-lg transition-colors w-full text-left">
              <Icon name="logout" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>
      </>

      {/* ═══ Main Content Area ═══ */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64 w-full">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 lg:px-8 h-16 bg-[#faf8ff]/80 backdrop-blur-xl border-b border-[#e2e7ff]">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            {/* Hamburger (Mobile only) */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-outline hover:text-on-surface transition-colors rounded-lg hover:bg-surface-container"
            >
              <Icon name="menu" />
            </button>

            {/* Search */}
            <div className="flex items-center bg-surface-container-low px-4 py-2 rounded-full flex-1 lg:w-96 border border-transparent focus-within:border-outline-variant/30 transition-colors">
              <Icon name="search" className="text-outline text-sm mr-2" />
              <input
                className="bg-transparent border-none focus:ring-0 text-sm w-full font-body outline-none text-on-surface placeholder:text-outline-variant"
                placeholder="Search resources..."
                type="text"
              />
            </div>
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
    </div>
  );
}
