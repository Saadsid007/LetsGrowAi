import Head from "next/head";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

/* ───────────────── Icon helper ───────────────── */
function Icon({ name, className = "", filled = false }) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? "filled" : ""} ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}

/* ───────────────── Scroll-animate hook ───────────────── */
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".animate-on-scroll").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ───────────────── Animated counter hook ───────────────── */
function useCountUp(end, duration = 2000, shouldStart = false) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (!shouldStart) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) ref.current = requestAnimationFrame(step);
    };
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [end, duration, shouldStart]);

  return count;
}

/* ═══════════════════════════════════════════════════════
   NAVBAR
   ═══════════════════════════════════════════════════════ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const navLinks = [
    { label: "Features", href: "#modules" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "AI Engine", href: "#ai-architecture" },
    { label: "Testimonials", href: "#testimonials" },
  ];

  return (
    <>
      <nav
        id="navbar"
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl navbar-scrolled"
            : "bg-white/80 backdrop-blur-md"
        }`}
      >
        <div className="flex justify-between items-center px-6 md:px-8 py-4 max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Icon name="hub" className="text-primary text-2xl" />
            <span className="text-xl font-bold tracking-tight text-blue-700 font-headline">
              LetsGrow<span className="text-primary">Ai</span>
            </span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 font-headline font-semibold text-sm">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-slate-600 hover:text-blue-600 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/auth/login" className="text-slate-600 font-semibold text-sm hover:text-primary transition-colors">
              Login
            </Link>
            <Link
              href="/auth/register"
              className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-bold text-sm hover:-translate-y-0.5 transition-all shadow-md"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-surface-container-low transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Icon name="menu" className="text-primary text-2xl" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-[60] mobile-menu-overlay ${
          mobileOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setMobileOpen(false)}
      >
        <div className="absolute inset-0 bg-on-background/30 backdrop-blur-sm" />
      </div>

      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[75%] max-w-xs z-[70] bg-white shadow-2xl mobile-menu-panel flex flex-col ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-6">
          <span className="text-lg font-bold text-primary font-headline">LetsGrowAi</span>
          <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <Icon name="close" className="text-on-surface text-2xl" />
          </button>
        </div>
        <div className="flex flex-col gap-2 px-6 flex-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="py-3 px-4 text-on-surface font-semibold text-base rounded-lg hover:bg-surface-container-low transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="p-6 space-y-3">
          <Link
            href="/auth/login"
            className="block w-full text-center py-3 rounded-lg font-semibold text-primary border border-outline-variant/20 hover:bg-surface-container-low transition-colors"
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="block w-full text-center py-3 rounded-lg font-bold text-on-primary bg-primary shadow-lg transition-transform active:scale-95"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <header className="pt-28 md:pt-32 pb-16 md:pb-20 px-6 md:px-8 max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Left — Copy */}
        <div className="space-y-6 md:space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-fixed rounded-full">
            <span className="text-xs font-bold text-on-primary-fixed-variant font-label uppercase tracking-widest">
              🚀 AI-Powered Career Platform
            </span>
          </div>

          <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-extrabold text-on-background leading-[1.1] tracking-tight">
            Land Your Dream Job With{" "}
            <span className="text-primary">AI-Powered Guidance</span>
          </h1>

          <p className="text-on-surface-variant text-lg leading-relaxed max-w-xl">
            The ultimate career acceleration platform. Optimize your resume,
            master interviews, and close skill gaps with our proprietary
            multi-model AI routing technology.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              href="/auth/register"
              className="bg-primary text-on-primary px-8 py-4 rounded-lg font-bold text-base hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/20 text-center flex items-center justify-center gap-2"
            >
              Start For Free
              <Icon name="arrow_forward" className="text-xl" />
            </Link>
            <button className="flex items-center justify-center gap-2 bg-surface-container-lowest text-primary px-8 py-4 rounded-lg font-bold text-base hover:bg-surface-container transition-all">
              <Icon name="play_circle" className="text-xl" />
              Watch Demo
            </button>
          </div>

          {/* Social Proof */}
          <div className="pt-4 flex items-center gap-4">
            <div className="flex -space-x-3">
              <img className="w-10 h-10 rounded-full border-2 border-surface object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDun5sPaX8TiZtOANevXyMAqgDinCFxAk4DRsc8HnncJTCBW4f3pzPpCmIKU_xf9AMd0xr6nAvddvyQdNbYnyeE0EkcHf3cPzAloBFCoJmDwi1CuRP3_0AHVIkDyP-SxxEhZCGRkcJ_5rf0vs8HO-o6W8itlkIBSbKXrggWj4vuqlykOrneohUbgh8Yj634_lnc4wQ_-OKL9lUr5oseuWmujx9dIE9EieUuzuzEqEj4V_oZHDMO2TDWhGAQDdTngoKihMXKFQroWgc" alt="User" />
              <img className="w-10 h-10 rounded-full border-2 border-surface object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLf7ng2lRL7azIaWaf-FmK3sFKiPHDuO8z5DQ4p97F7c6lcMSp4uUiniCm002-YFThIXyg1ykM3nfZIgZVg8kFyGDuKQmt6X5ZkYnhAV7wdMIVRAvlUmFw0TwQB-oDKdmiL03f-btSdaEVvDjGmzZZe86GBMY5MyHzngZNSUbWmp5ohQdmq8UkrCpWPiSdPSvQJkHowxSqE8zVerlghnMTXjubXPV3rsayMEM9jldd0eqYK2l42t0DYYbGr7NuTE6d1ycPEH2Fyj4" alt="User" />
              <img className="w-10 h-10 rounded-full border-2 border-surface object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9PDIIB3lz3Pk_Qqygi68-WxXqkdk2h4tybUCXPKtwu7P1aNLuny5FUQ2EcGXMNVeKprPH6MkE-3b7ciEZQdJnjPkjaxOxPut8lUS4pBvGnz7OekNMK42tNsDcUcXqyLHwW0Z3CT0DPEiiZ0kKFc1vlT6xMoSuyEfjGhOgCAzJhEgIHHoQ58bhY97oaqRtduW_ysDddeaDjrfG2--1Pv7xNRWwnl0FxcnN3CG7d6jo7vLc-DPvM_RLia2ZtPZK9FpdKs2PDaK_RKA" alt="User" />
            </div>
            <p className="text-sm font-semibold text-on-surface-variant">
              Trusted by <span className="text-primary">10k+</span> students globally
            </p>
          </div>
        </div>

        {/* Right — Hero Visual */}
        <div className="relative min-h-[400px] md:min-h-[500px] flex items-center justify-center">
          {/* Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-secondary/10 rounded-full blur-3xl" />

          {/* Main Card — Career Readiness */}
          <div className="relative w-full max-w-md bg-surface-container-lowest p-8 rounded-xl shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-headline font-bold text-lg">Career Readiness</h3>
              <Icon name="more_horiz" className="text-outline text-xl" />
            </div>

            {/* Progress Ring */}
            <div className="flex flex-col items-center py-4">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                  <circle
                    className="text-surface-container"
                    cx="80" cy="80" r="70"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="12"
                  />
                  <circle
                    className="text-primary progress-circle"
                    cx="80" cy="80" r="70"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray="440"
                    strokeDashoffset="80"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-4xl font-extrabold text-on-background">82%</span>
              </div>
            </div>

            {/* Score Chips */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-surface-container-low rounded-lg text-center">
                <p className="text-xs text-on-surface-variant font-medium">Resume</p>
                <p className="text-lg font-bold text-primary">94</p>
              </div>
              <div className="p-3 bg-surface-container-low rounded-lg text-center">
                <p className="text-xs text-on-surface-variant font-medium">Skills</p>
                <p className="text-lg font-bold text-secondary">78</p>
              </div>
              <div className="p-3 bg-surface-container-low rounded-lg text-center">
                <p className="text-xs text-on-surface-variant font-medium">Network</p>
                <p className="text-lg font-bold text-tertiary">89</p>
              </div>
            </div>
          </div>

          {/* Floating Notification — ATS Score */}
          <div className="absolute -top-2 -right-2 md:-top-4 md:-right-4 bg-white p-3 md:p-4 rounded-xl shadow-lg shadow-primary/10 flex items-center gap-3 animate-float z-10">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon name="check_circle" className="text-primary text-xl" filled />
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">ATS Score 94</p>
              <p className="text-[10px] text-on-surface-variant">Optimal Keyword Density</p>
            </div>
          </div>

          {/* Floating Notification — Interview Ready */}
          <div className="absolute bottom-5 -left-4 md:-left-12 bg-white p-3 md:p-4 rounded-xl shadow-xl shadow-secondary/10 flex items-center gap-3 animate-float-delayed z-12">
            <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
              <Icon name="record_voice_over" className="text-secondary text-xl" />
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">Interview Ready</p>
              <p className="text-[10px] text-on-surface-variant">Mastery in 12 Competencies</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════
   STATS BAR
   ═══════════════════════════════════════════════════════ */
function StatsBar() {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const stat1 = useCountUp(50, 2000, visible);
  const stat2 = useCountUp(30, 2000, visible);
  const stat3 = useCountUp(95, 2000, visible);

  const stats = [
    { value: `${stat1}K+`, label: "Resumes Built" },
    { value: `${stat2}K+`, label: "Mock Interviews" },
    { value: "8", label: "AI Modules" },
    { value: `${stat3}%`, label: "Placement Rate" },
  ];

  return (
    <section ref={ref} className="bg-surface-container-low py-12 px-6 md:px-8">
      {/* Desktop: horizontal row */}
      <div className="hidden md:flex max-w-7xl mx-auto justify-between items-center text-on-surface-variant">
        {stats.map((stat, i) => (
          <div key={stat.label} className="flex items-center gap-4">
            {i > 0 && (
              <div className="h-8 w-[1px] bg-outline-variant/30 mr-4" />
            )}
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
              <span className="font-headline text-3xl font-bold text-primary">{stat.value}</span>
              <span className="text-sm font-semibold uppercase tracking-wider">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>
      {/* Mobile: 2x2 grid */}
      <div className="md:hidden grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface-container-lowest p-6 rounded-xl">
            <span className="text-3xl font-headline font-bold text-primary">{stat.value}</span>
            <p className="text-xs font-label font-bold text-on-surface-variant mt-1 border-b-2 border-primary inline-block uppercase">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   MODULES BENTO GRID
   ═══════════════════════════════════════════════════════ */
function ModulesSection() {
  return (
    <section className="py-20 md:py-24 px-6 md:px-8 max-w-7xl mx-auto" id="modules">
      <div className="animate-on-scroll mb-12 md:mb-16">
        <span className="text-xs font-bold text-primary uppercase tracking-[0.2em] border-b-2 border-primary pb-1 font-label">
          Our Modules
        </span>
        <h2 className="font-headline text-3xl md:text-4xl font-bold mt-6">
          Comprehensive AI Toolkit
        </h2>
      </div>

      {/* Desktop Bento Grid */}
      <div className="hidden md:grid grid-cols-4 lg:grid-cols-6 gap-6 animate-on-scroll">
        {/* AI Resume Builder — large */}
        <div className="col-span-2 lg:col-span-3 bg-gradient-to-br from-primary to-primary-container p-10 rounded-xl text-on-primary bento-card shadow-lg flex flex-col justify-between min-h-[340px]">
          <div>
            <Icon name="description" className="text-4xl mb-6 block" />
            <h3 className="font-headline text-2xl font-bold mb-3">AI Resume Builder</h3>
            <p className="text-on-primary-container text-base leading-relaxed opacity-90">
              Craft ATS-winning resumes tailored to specific job descriptions with real-time score tracking.
            </p>
          </div>
          <button className="mt-8 flex items-center gap-2 font-bold text-sm hover:gap-3 transition-all">
            Explore Module <Icon name="arrow_forward" className="text-lg" />
          </button>
        </div>

        {/* Mock Interview AI */}
        <div className="col-span-2 lg:col-span-3 bg-surface-container-low p-8 rounded-xl bento-card shadow-sm flex flex-col justify-between">
          <div>
            <Icon name="video_chat" className="text-3xl text-secondary mb-4 block" />
            <h3 className="font-headline text-xl font-bold mb-2">Mock Interview AI</h3>
            <p className="text-on-surface-variant text-sm">
              Practice with role-specific AI avatars and receive instant feedback on sentiment and content.
            </p>
          </div>
          <div className="flex gap-2 mt-6">
            <span className="bg-secondary/10 text-secondary text-[10px] font-bold px-2 py-1 rounded-full uppercase">
              Real-time Feedback
            </span>
          </div>
        </div>

        {/* Skill Gap Analysis */}
        <div className="col-span-2 bg-surface-container-low p-8 rounded-xl bento-card shadow-sm">
          <Icon name="bolt" className="text-3xl text-tertiary mb-4 block" />
          <h3 className="font-headline text-xl font-bold mb-2">Skill Gap Analysis</h3>
          <p className="text-on-surface-variant text-sm">
            Upload your profile and dream job to find exactly what certifications you&apos;re missing.
          </p>
        </div>

        {/* Personalized Roadmap — large */}
        <div className="col-span-2 lg:col-span-4 bg-gradient-to-br from-secondary to-secondary-container p-10 rounded-xl text-on-primary bento-card shadow-lg flex flex-col justify-between min-h-[340px]">
          <div>
            <Icon name="map" className="text-4xl mb-6 block" />
            <h3 className="font-headline text-2xl font-bold mb-3">Personalized Roadmap</h3>
            <p className="text-on-primary-container text-base leading-relaxed opacity-90">
              A 12-week step-by-step plan to transform your career trajectory based on current market trends.
            </p>
          </div>
          <div className="flex gap-4 mt-8">
            <div className="bg-white/20 p-4 rounded-lg flex-1">
              <p className="text-xs opacity-80 mb-1">Success Rate</p>
              <p className="text-xl font-bold">92%</p>
            </div>
            <div className="bg-white/20 p-4 rounded-lg flex-1">
              <p className="text-xs opacity-80 mb-1">Time to Job</p>
              <p className="text-xl font-bold">-40%</p>
            </div>
          </div>
        </div>

        {/* Company Research */}
        <div className="col-span-2 bg-surface-container-low p-8 rounded-xl bento-card shadow-sm">
          <Icon name="search_insights" className="text-3xl text-primary mb-4 block" />
          <h3 className="font-headline text-xl font-bold mb-2">Company Research</h3>
          <p className="text-on-surface-variant text-sm">
            Get deep insights on company culture, recent funding, and common interview patterns.
          </p>
        </div>

        {/* Cold Outreach AI */}
        <div className="col-span-2 bg-surface-container-low p-8 rounded-xl bento-card shadow-sm">
          <Icon name="mail" className="text-3xl text-secondary mb-4 block" />
          <h3 className="font-headline text-xl font-bold mb-2">Cold Outreach AI</h3>
          <p className="text-on-surface-variant text-sm">
            Generate personalized LinkedIn messages and emails that actually get responses.
          </p>
        </div>

        {/* Secure Auth */}
        <div className="col-span-2 bg-surface-container-low p-8 rounded-xl bento-card shadow-sm">
          <Icon name="lock" className="text-3xl text-tertiary mb-4 block" />
          <h3 className="font-headline text-xl font-bold mb-2">Secure Auth</h3>
          <p className="text-on-surface-variant text-sm">
            Enterprise-grade security protecting your sensitive career data and resume information.
          </p>
        </div>
      </div>

      {/* Mobile: stacked cards (matching mobile design) */}
      <div className="md:hidden flex flex-col gap-6 animate-on-scroll">
        {/* Resume Architect — gradient */}
        <div className="bg-gradient-to-br from-primary to-secondary p-8 rounded-2xl text-on-primary shadow-xl">
          <Icon name="description" className="text-4xl mb-4" filled />
          <h3 className="text-xl font-headline font-bold mb-2">Resume Architect</h3>
          <p className="text-on-primary-container text-sm leading-relaxed mb-6">
            AI-driven optimization that bypasses ATS and highlights your narrative impact.
          </p>
          <button className="px-6 py-3 bg-white/10 backdrop-blur text-white font-bold rounded-lg text-sm border border-white/20 transition-transform active:scale-95">
            Launch Builder
          </button>
        </div>

        {/* Dynamic Roadmap — dark */}
        <div className="bg-gradient-to-br from-inverse-surface to-[#434655] p-8 rounded-2xl text-white shadow-xl">
          <Icon name="alt_route" className="text-4xl mb-4" filled />
          <h3 className="text-xl font-headline font-bold mb-2">Dynamic Roadmap</h3>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            Visual paths generated in real-time based on live market demand and your skills.
          </p>
          <button className="px-6 py-3 bg-primary text-white font-bold rounded-lg text-sm transition-transform active:scale-95">
            Explore Path
          </button>
        </div>

        {/* Growth Hub */}
        <div className="bg-surface-container p-8 rounded-2xl">
          <Icon name="hub" className="text-primary text-4xl mb-4" />
          <h3 className="text-xl font-headline font-bold text-on-surface mb-2">Growth Hub</h3>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Connect with peers and mentors curated for your specific career trajectory.
          </p>
        </div>

        {/* AI Mock Interviews */}
        <div className="bg-surface-container-high p-8 rounded-2xl">
          <Icon name="forum" className="text-primary text-4xl mb-4" />
          <h3 className="text-xl font-headline font-bold text-on-surface mb-2">AI Mock Interviews</h3>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Role-specific interview simulations with real-time feedback on performance.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   HOW IT WORKS
   ═══════════════════════════════════════════════════════ */
function HowItWorks() {
  const steps = [
    {
      icon: "person_add",
      title: "1. Create Profile",
      mobileTitle: "Identity Mapping",
      desc: "Sync your LinkedIn and upload your current resume to build your base.",
      mobileDesc: "Securely upload your experience. Our AI analyzes your unique \"Career DNA\".",
      color: "bg-primary",
      shadow: "shadow-primary/20",
    },
    {
      icon: "analytics",
      title: "2. Analyze Gaps",
      mobileTitle: "Path Synthesis",
      desc: "Our AI scans 1M+ job postings to find exact skill requirements you lack.",
      mobileDesc: "We cross-reference your profile with 1M+ job market data points.",
      color: "bg-secondary",
      shadow: "shadow-secondary/20",
    },
    {
      icon: "fitness_center",
      title: "3. Practice & Prepare",
      mobileTitle: "Iterative Growth",
      desc: "Run mock interviews and build projects tailored to your target roles.",
      mobileDesc: "Execute your roadmap with AI-assisted modules and real-time mentor feedback.",
      color: "bg-tertiary",
      shadow: "shadow-tertiary/20",
    },
    {
      icon: "rocket_launch",
      title: "4. Apply Confidently",
      mobileTitle: null,
      desc: "Use AI outreach tools to land referrals and crush your interviews.",
      mobileDesc: null,
      color: "bg-on-background",
      shadow: "shadow-on-background/20",
    },
  ];

  return (
    <section className="py-20 md:py-24 px-6 md:px-8 bg-surface-container-low" id="how-it-works">
      <div className="max-w-7xl mx-auto">
        <div className="animate-on-scroll text-center md:text-left mb-16 md:mb-20">
          <span className="text-xs font-bold text-primary uppercase tracking-[0.2em] border-b-2 border-primary pb-1 font-label">
            Process
          </span>
          <h2 className="font-headline text-3xl md:text-4xl font-bold mt-6">
            Four Steps to Success
          </h2>
        </div>

        {/* Desktop: horizontal steps */}
        <div className="hidden md:grid md:grid-cols-4 gap-12 relative animate-on-scroll">
          <div className="absolute top-10 left-0 w-full h-[2px] bg-outline-variant/30 z-0" />
          {steps.map((step) => (
            <div key={step.title} className="relative z-10 bg-surface-container-low stagger-child">
              <div className={`w-20 h-20 ${step.color} rounded-full flex items-center justify-center text-white mb-6 shadow-xl ${step.shadow}`}>
                <Icon name={step.icon} className="text-3xl" />
              </div>
              <h4 className="font-headline text-xl font-bold mb-3">{step.title}</h4>
              <p className="text-on-surface-variant text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Mobile: vertical timeline */}
        <div className="md:hidden relative pl-8 flex flex-col gap-12 animate-on-scroll">
          <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-primary/20" />
          {steps.filter(s => s.mobileTitle).map((step, i) => (
            <div key={step.mobileTitle} className="relative stagger-child">
              <div className="absolute -left-10 top-0 w-6 h-6 rounded-full bg-primary border-4 border-surface-container-low z-10" />
              <span className="text-primary font-bold font-label text-xs mb-2 block">
                STEP {String(i + 1).padStart(2, "0")}
              </span>
              <h4 className="text-lg font-headline font-bold text-on-surface mb-2">{step.mobileTitle}</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">{step.mobileDesc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   AI ARCHITECTURE SECTION
   ═══════════════════════════════════════════════════════ */
function AIArchitecture() {
  const models = [
    {
      name: "Cerebras",
      desc: "Lightning fast inference for real-time interview feedback.",
      color: "text-blue-400",
      icon: "speed",
    },
    {
      name: "Gemini 2.5",
      desc: "Multimodal analysis for resume layout and design optimization.",
      color: "text-emerald-400",
      icon: "psychology",
    },
    {
      name: "Exa Search",
      desc: "Real-time web search for current job market trends.",
      color: "text-amber-400",
      icon: "travel_explore",
    },
  ];

  return (
    <section className="bg-[#0F172A] py-20 md:py-24 px-6 md:px-8 overflow-hidden" id="ai-architecture">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12 md:mb-16 animate-on-scroll">
          {/* Mobile label */}
          <p className="md:hidden text-tertiary-fixed font-bold font-label text-xs tracking-widest uppercase mb-3">
            The Engine Room
          </p>
          <h2 className="font-headline text-3xl md:text-5xl font-extrabold text-white mb-6">
            <span className="hidden md:inline">Not Just One AI — Smart Multi-Model Routing</span>
            <span className="md:hidden">Built on the Edge</span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto hidden md:block">
            We leverage the specialized strengths of top-tier models to provide the most accurate career insights available.
          </p>
        </div>

        {/* Desktop: 3-column layout */}
        <div className="hidden lg:flex items-center justify-between gap-12 mt-12 animate-on-scroll">
          {/* Left — Models */}
          <div className="flex flex-col gap-6 w-1/4">
            {models.map((m) => (
              <div key={m.name} className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 backdrop-blur-sm stagger-child">
                <h4 className={`${m.color} font-bold mb-2`}>{m.name}</h4>
                <p className="text-slate-400 text-xs">{m.desc}</p>
              </div>
            ))}
          </div>

          {/* Center — Flow */}
          <div className="flex-1 flex flex-col items-center justify-center relative py-12">
            <div className="absolute inset-0 bg-blue-500/10 blur-[120px] rounded-full" />
            <div className="relative z-10 flex flex-col items-center gap-8">
              <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white">
                <Icon name="person" className="text-2xl" />
              </div>
              <Icon name="arrow_downward" className="text-slate-600 text-2xl" />
              <div className="px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-2xl shadow-primary/20 border border-white/10 font-headline">
                LetsGrow Intelligent Router
              </div>
              <Icon name="arrow_downward" className="text-slate-600 text-2xl" />
              <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-2xl">
                <Icon name="auto_awesome" className="text-primary text-4xl" />
              </div>
            </div>
          </div>

          {/* Right — Output */}
          <div className="w-1/4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 space-y-4">
              <h5 className="text-white font-bold text-sm uppercase tracking-wider">Optimized Output</h5>
              <div className="space-y-3">
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-4/5 transition-all duration-1000" />
                </div>
                <div className="h-2 w-3/4 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-2/3 transition-all duration-1000" />
                </div>
                <div className="h-2 w-1/2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary w-1/3 transition-all duration-1000" />
                </div>
              </div>
              <p className="text-slate-400 text-xs italic mt-4">
                &quot;Result: 100% matched to Senior Product Manager role at Stripe.&quot;
              </p>
            </div>
          </div>
        </div>

        {/* Tablet (md but not lg): simplified */}
        <div className="hidden md:flex lg:hidden flex-col items-center gap-8 animate-on-scroll">
          <div className="grid grid-cols-3 gap-4 w-full">
            {models.map((m) => (
              <div key={m.name} className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50">
                <h4 className={`${m.color} font-bold mb-1 text-sm`}>{m.name}</h4>
                <p className="text-slate-400 text-xs">{m.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 text-primary-fixed">
            <span className="text-xs bg-white/10 px-3 py-1.5 rounded font-bold">DATA IN</span>
            <Icon name="arrow_forward" className="text-slate-600" />
            <div className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg text-sm font-headline">
              Intelligent Router
            </div>
            <Icon name="arrow_forward" className="text-slate-600" />
            <span className="text-xs bg-white/10 px-3 py-1.5 rounded font-bold">INSIGHT</span>
          </div>
        </div>

        {/* Mobile: vertical list */}
        <div className="md:hidden flex flex-col gap-8 animate-on-scroll">
          {models.map((m) => (
            <div key={m.name} className="flex gap-5 items-start stagger-child">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 shrink-0">
                <Icon name={m.icon} className="text-tertiary-fixed text-2xl" />
              </div>
              <div>
                <h4 className="text-lg font-bold mb-1 text-white">{m.name}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{m.desc}</p>
              </div>
            </div>
          ))}

          {/* Simplified Diagram */}
          <div className="mt-4 p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/40">
              <Icon name="hub" className="text-white text-xl" filled />
            </div>
            <p className="text-xs font-label uppercase text-slate-500 tracking-widest mb-3">Neural Orchestrator</p>
            <div className="flex items-center gap-3 text-primary-fixed flex-wrap justify-center">
              <span className="text-[10px] bg-white/10 px-2 py-1 rounded font-bold">DATA IN</span>
              <Icon name="arrow_forward" className="text-sm text-slate-600" />
              <span className="text-[10px] bg-white/10 px-2 py-1 rounded font-bold">AI CORE</span>
              <Icon name="arrow_forward" className="text-sm text-slate-600" />
              <span className="text-[10px] bg-white/10 px-2 py-1 rounded font-bold">INSIGHT</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   TESTIMONIALS
   ═══════════════════════════════════════════════════════ */
function Testimonials() {
  const testimonials = [
    {
      text: "The Skill Gap analysis was a game-changer. I realized I was just three certifications away from my dream role at Google. The AI even suggested the best courses.",
      name: "David Chen",
      role: "Stanford University • Software Engineer @ Google",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDgYobSC_UmSkZtktfZ2QlQCzdUKIUwkL6qEEDMB5VNgHqdqkxiW-avyb7uEIPn4MGVpclFmXQzVLlJs68ZYNlPwMkmLTYSWADGYie63_3c_L8NUp3bWO7uU-LXqrTpNAwdpV4cMWGFw_FKSdRK9uSwAbg6m7xMOaQVmS53PguQvQ-8ihdu4lLg5avK_5kGqEVb9EllJd0ij5uJZ5vM-7TwglUcqYjRtQ8oumEFNb_lmTD67EOzQ728Ep2GRVm2bTmNr8R6Y1RB0qs",
    },
    {
      text: "I practiced for my Meta interview 20+ times with the AI. By the time the real interview happened, I felt like I already knew all the answers. Simply incredible.",
      name: "Sarah Jenkins",
      role: "MIT • Product Designer @ Meta",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAb_Dl-1izFdju-XCp5o3DbYy9ZlFF4QP39mwOd56BQPfgbGjIglPTnAb7xJ4csTClAZvI-9QCbeGAogJUnxi_afFWtAL5Lw4YJXFa4l_bth8NYzwwKMlE-OxZTw99it61KlmqemwlzyuviHJUNpTyQoa3QCkdabr47b1gDiOq-7HUpQ78tUKodPpO0_-XgmHnU3NoRzPfgKaxA4pjRf2QBh_ON_4PRsHBxLirFhq3HqJK57kW_BwJo_CdJzk5VsYI--2QNPAlv7wE",
    },
    {
      text: "The Resume Builder bumped my ATS score from 45 to 94 in 10 minutes. I started getting interview calls within the same week. Highly recommended!",
      name: "Michael Ross",
      role: "Oxford • Analyst @ McKinsey",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA17uMbtYQUTCwUW5A3L1QoNSuJbisFBMeZ_wE003pdP8oCzvwzaH7KpiNskHhdFIKgqJrs56NB-huG4IM2Ge3uY5mMjfPT0Znw6vU8qPTQ-xLeDgkawmdXb1hssUvSKqfjGLs_26GtzAK3FEpNQBff9Bk4voqNmun9l-y5KKx4jTINRRnvkZdVYpQkJjrm2f9t2nBWgsLjxP_Ls2LVY2MVZsSlgL-UCibm2bmMI4xo3XjtSxrddAuypCGzXZn4gywuN41JaOg_G90",
    },
  ];

  return (
    <section className="py-20 md:py-24 px-6 md:px-8 max-w-7xl mx-auto" id="testimonials">
      <div className="animate-on-scroll mb-12 md:mb-16 text-center md:text-left">
        <span className="hidden md:inline text-xs font-bold text-primary uppercase tracking-[0.2em] border-b-2 border-primary pb-1 font-label">
          Success Stories
        </span>
        <h2 className="font-headline text-3xl md:text-4xl font-bold mt-0 md:mt-6">
          <span className="hidden md:inline">Hear From Our Placed Students</span>
          <span className="md:hidden">Success Stories</span>
        </h2>
      </div>

      {/* Desktop: 3-column */}
      <div className="hidden md:grid md:grid-cols-3 gap-8 animate-on-scroll">
        {testimonials.map((t) => (
          <div key={t.name} className="bg-white p-8 rounded-xl shadow-xl shadow-slate-200/50 flex flex-col justify-between stagger-child">
            <div>
              <div className="flex text-amber-400 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Icon key={i} name="star" className="text-xl" filled />
                ))}
              </div>
              <p className="text-on-surface-variant italic leading-relaxed mb-8">&quot;{t.text}&quot;</p>
            </div>
            <div className="flex items-center gap-4">
              <img className="w-12 h-12 rounded-full object-cover" src={t.img} alt={t.name} />
              <div>
                <h5 className="font-bold">{t.name}</h5>
                <p className="text-xs text-on-surface-variant">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: stacked */}
      <div className="md:hidden flex flex-col gap-6 animate-on-scroll">
        {testimonials.slice(0, 2).map((t) => (
          <div key={t.name} className="p-8 bg-surface-container-lowest rounded-2xl stagger-child">
            <p className="text-on-surface text-lg font-medium leading-relaxed italic mb-6">&quot;{t.text}&quot;</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-surface-container overflow-hidden">
                <img className="w-full h-full object-cover" src={t.img} alt={t.name} />
              </div>
              <div>
                <p className="font-bold text-sm">{t.name}</p>
                <p className="text-xs text-on-surface-variant">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   CTA SECTION
   ═══════════════════════════════════════════════════════ */
function CTASection() {
  return (
    <section className="py-12 md:py-24 px-6 md:px-8">
      <div className="max-w-5xl mx-auto bg-gradient-to-r from-primary to-primary-container p-10 md:p-16 rounded-3xl md:rounded-[2rem] text-center shadow-2xl relative overflow-hidden animate-on-scroll">
        {/* Decorative circles */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 border-4 border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 border-4 border-white rounded-full translate-x-1/3 translate-y-1/3" />
        </div>

        <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4 md:mb-8 relative z-10">
          <span className="hidden md:inline">Get Started For Free</span>
          <span className="md:hidden">Ready to Elevate?</span>
        </h2>
        <p className="text-on-primary-container text-sm md:text-lg mb-8 md:mb-10 max-w-xl mx-auto relative z-10 leading-relaxed">
          Join 50,000+ career-focused individuals using AI to land their dream jobs. Start building your future today.
        </p>
        <div className="flex flex-col items-center gap-3 md:gap-4 relative z-10">
          <Link
            href="/auth/register"
            className="w-full sm:w-auto bg-white text-primary px-10 md:px-12 py-4 md:py-5 rounded-xl md:rounded-lg font-bold text-base md:text-lg hover:scale-105 transition-transform shadow-xl text-center"
          >
            <span className="hidden md:inline">Create Your AI Profile</span>
            <span className="md:hidden">Get Started Now</span>
          </Link>
          <p className="text-white/60 md:text-primary-fixed/80 text-[10px] md:text-sm uppercase md:normal-case tracking-widest md:tracking-normal font-bold md:font-normal">
            No credit card required
            <span className="hidden md:inline"> • Instant access</span>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════ */
function Footer() {
  const footerLinks = {
    Platform: ["Resume Builder", "Mock Interviews", "Skill Gap Analysis", "AI Roadmap"],
    Company: ["About Us", "Our Team", "Careers", "Blog"],
    "Legal & Support": ["Privacy Policy", "Terms of Service", "Cookie Policy", "Contact Us"],
  };

  return (
    <footer className="bg-slate-950 py-12 md:py-20 px-6 md:px-8 text-slate-400">
      {/* Desktop Footer */}
      <div className="hidden md:grid max-w-7xl mx-auto grid-cols-1 md:grid-cols-4 gap-12 lg:gap-24">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Icon name="hub" className="text-blue-400 text-2xl" />
            <span className="text-lg font-bold text-white tracking-tight font-headline">LetsGrowAi</span>
          </div>
          <p className="text-sm leading-relaxed">
            The world&apos;s most advanced AI-powered career mentorship platform. Empowering the next generation of global talent.
          </p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors"><Icon name="share" className="text-xl" /></a>
            <a href="#" className="hover:text-white transition-colors"><Icon name="public" className="text-xl" /></a>
            <a href="#" className="hover:text-white transition-colors"><Icon name="group" className="text-xl" /></a>
          </div>
        </div>
        {Object.entries(footerLinks).map(([category, links]) => (
          <div key={category} className="space-y-6">
            <h6 className="text-white font-bold uppercase text-xs tracking-widest">{category}</h6>
            <ul className="space-y-4 text-sm">
              {links.map((link) => (
                <li key={link}>
                  <a href="#" className="hover:text-blue-400 transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Mobile Footer */}
      <div className="md:hidden">
        <div className="font-headline font-bold text-white mb-4 text-2xl">LetsGrowAi</div>
        <div className="flex flex-col gap-4 mb-8">
          <a href="#" className="text-sm hover:text-white transition-colors">Privacy</a>
          <a href="#" className="text-sm hover:text-white transition-colors">Terms</a>
          <a href="#" className="text-sm hover:text-white transition-colors">Support</a>
          <a href="#" className="text-sm hover:text-white transition-colors">LinkedIn</a>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-8 md:mt-20 pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between gap-4 text-xs font-medium">
        <p>© 2026 LetsGrowAi. All rights reserved.</p>
        <p className="hidden md:block">Made with ❤️ for the future of work.</p>
        <p className="md:hidden">Built for visionaries.</p>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */
export default function Home() {
  useScrollReveal();

  return (
    <>
      <Head>
        <title>LetsGrowAi | AI-Powered Career Guidance & Job Prep Platform</title>
        <meta
          name="description"
          content="Land your dream job with AI-powered guidance. Resume Builder, Mock Interviews, Skill Gap Analysis, Career Roadmaps — all in one intelligent platform."
        />
      </Head>

      <Navbar />
      <main>
        <HeroSection />
        <StatsBar />
        <ModulesSection />
        <HowItWorks />
        <AIArchitecture />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
