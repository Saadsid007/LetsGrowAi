import DashboardLayout from "./DashboardLayout";
import Link from "next/link";
import { useRouter } from "next/router";
import Icon from "./Icon";

export default function CompanyLayout({ children }) {
  const router = useRouter();

  const TABS = [
    { name: "Search Hub", href: "/dashboard/company" },
    { name: "Compare Profiles", href: "/dashboard/company/compare" }
  ];

  return (
    <DashboardLayout>
      {/* Sub-Navigation Bar Sticky right below the main header */}
      <div className="sticky top-16 z-20 bg-[#faf8ff] border-b border-outline-variant/10 px-6 lg:px-8 py-3 flex items-center gap-6 overflow-x-auto custom-scrollbar shadow-sm">
         <div className="flex items-center gap-2 mr-4 border-r border-outline-variant/20 pr-6">
            <Icon name="corporate_fare" className="text-secondary" />
            <span className="font-extrabold text-sm uppercase tracking-widest text-on-surface font-headline">Intelligence</span>
         </div>
         
        {TABS.map((tab) => {
          const isActive = router.pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative px-2 py-1 text-sm font-bold font-headline whitespace-nowrap transition-colors flex items-center gap-2 ${
                isActive ? "text-primary" : "text-slate-500 hover:text-on-surface"
              }`}
            >
              {tab.name}
              {isActive && (
                <span className="absolute -bottom-[15px] left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Renders the specific pages (search/profile/compare) */}
      <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
        {children}
      </div>
    </DashboardLayout>
  );
}
