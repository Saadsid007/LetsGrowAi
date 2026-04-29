import Link from "next/link";

export default function AuthFooter() {
  return (
    <footer className="flex flex-col md:flex-row justify-between items-center px-6 md:px-8 py-6 w-full bg-surface border-t border-slate-100 font-body text-sm">
      <div className="text-lg font-bold text-primary-container mb-4 md:mb-0 font-headline">
        LetsGrowAi
      </div>
      <div className="text-slate-500 mb-4 md:mb-0">
        © 2026 LetsGrowAi. All rights reserved.
      </div>
      <div className="flex gap-6">
        <Link href="#" className="text-slate-500 hover:underline transition-all">
          Privacy Policy
        </Link>
        <Link href="#" className="text-slate-500 hover:underline transition-all">
          Terms of Service
        </Link>
        <Link href="#" className="text-slate-500 hover:underline transition-all">
          Support
        </Link>
      </div>
    </footer>
  );
}
