import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AuthFooter from "@/components/AuthFooter";
import { useAuth } from "@/context/AuthContext";
import PageLoader from "@/components/PageLoader";

function Icon({ name, className = "", filled = false }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   STEP DATA
   ═══════════════════════════════════════════════════════ */
const STEPS = [
  {
    title: "Let's confirm your details",
    subtitle: "We need a few basics before we tailor your career growth path.",
    type: "form",
    options: [],
  },
  {
    title: "What's your current status?",
    subtitle: "We'll tailor your career growth path based on where you are in your journey right now.",
    type: "single-select",
    options: [
      {
        id: "student",
        icon: "school",
        label: "Student",
        desc: "Currently enrolled in high school, college, or university.",
      },
      {
        id: "fresher",
        icon: "workspace_premium",
        label: "Fresh Graduate",
        desc: "Recently completed education and looking for first job.",
      },
      {
        id: "working",
        icon: "badge",
        label: "Professional",
        desc: "Currently employed and looking to level up or optimize.",
      },
      {
        id: "switcher",
        icon: "published_with_changes",
        label: "Switcher",
        desc: "Transitioning from one industry or role to another.",
      },
    ],
  },
  {
    title: "What's your target domain?",
    subtitle: "Select the career area you're most interested in pursuing.",
    type: "single-select",
    options: [
      {
        id: "software",
        icon: "code",
        label: "Software Engineering",
        desc: "Full-stack, backend, frontend, mobile, or DevOps roles.",
      },
      {
        id: "data",
        icon: "analytics",
        label: "Data Science & AI",
        desc: "ML engineering, data analysis, research, or AI product roles.",
      },
      {
        id: "product",
        icon: "inventory_2",
        label: "Product & Design",
        desc: "Product management, UX/UI design, or growth roles.",
      },
      {
        id: "business",
        icon: "account_balance",
        label: "Business & Finance",
        desc: "Consulting, investment banking, accounting, or operations.",
      },
      {
        id: "marketing",
        icon: "campaign",
        label: "Marketing & Sales",
        desc: "Digital marketing, brand management, or sales development.",
      },
      {
        id: "other",
        icon: "more_horiz",
        label: "Other",
        desc: "A different field not listed above.",
      },
    ],
  },
  {
    title: "What skills do you already have?",
    subtitle: "Pick all that apply. We'll identify gaps and build your personalized roadmap.",
    type: "multi-select",
    options: [
      { id: "python", icon: "terminal", label: "Python" },
      { id: "javascript", icon: "javascript", label: "JavaScript" },
      { id: "react", icon: "web", label: "React / Next.js" },
      { id: "sql", icon: "database", label: "SQL & Databases" },
      { id: "ml", icon: "psychology", label: "Machine Learning" },
      { id: "figma", icon: "draw", label: "Figma / Design" },
      { id: "communication", icon: "forum", label: "Communication" },
      { id: "leadership", icon: "groups", label: "Leadership" },
      { id: "excel", icon: "table_chart", label: "Excel & Data" },
      { id: "cloud", icon: "cloud", label: "Cloud / AWS / GCP" },
      { id: "git", icon: "merge_type", label: "Git & DevOps" },
      { id: "writing", icon: "edit_note", label: "Technical Writing" },
    ],
  },
  {
    title: "How should we prioritize?",
    subtitle: "Choose the modules you'd like to start with. You can always change this later.",
    type: "multi-select",
    options: [
      { id: "resume", icon: "description", label: "AI Resume Builder", desc: "Craft ATS-optimized resumes." },
      { id: "interview", icon: "video_chat", label: "Mock Interviews", desc: "Practice with AI interviewers." },
      { id: "skills", icon: "bolt", label: "Skill Gap Analyzer", desc: "Find missing certifications." },
      { id: "roadmap", icon: "map", label: "Career Roadmap", desc: "Personalized learning paths." },
      { id: "company", icon: "search_insights", label: "Company Research", desc: "Deep company insights." },
      { id: "outreach", icon: "mail", label: "Cold Outreach AI", desc: "Personalized networking." },
    ],
  },
];

const STEP_LABELS = [
  "Basic Profile",
  "Personalizing your journey",
  "Defining your target",
  "Mapping your skills",
  "Setting your priorities",
];

/* ═══════════════════════════════════════════════════════
   ONBOARDING PAGE
   ═══════════════════════════════════════════════════════ */
export default function Onboarding() {
  const router = useRouter();
  const { user, completeOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({
    0: { name: "", phone: "", email: "" }, // form
    1: null,   // single-select
    2: null,   // single-select
    3: [],     // multi-select
    4: [],     // multi-select
  });
  const [animating, setAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setSelections((prev) => ({
        ...prev,
        0: {
          ...prev[0],
          name: user.name || prev[0].name,
          email: user.email || prev[0].email,
        },
      }));
    }
  }, [user]);

  const step = STEPS[currentStep];
  const totalSteps = STEPS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setSelections((p) => ({
      ...p,
      0: { ...p[0], [name]: value },
    }));
  };

  const handleSelect = (optionId) => {
    if (step.type === "single-select") {
      setSelections((p) => ({ ...p, [currentStep]: optionId }));
    } else if (step.type === "multi-select") {
      setSelections((p) => {
        const current = p[currentStep] || [];
        const exists = current.includes(optionId);
        return {
          ...p,
          [currentStep]: exists
            ? current.filter((id) => id !== optionId)
            : [...current, optionId],
        };
      });
    }
  };

  const isSelected = (optionId) => {
    if (step.type === "single-select") {
      return selections[currentStep] === optionId;
    }
    return (selections[currentStep] || []).includes(optionId);
  };

  const canProceed = () => {
    if (step.type === "form") {
      const basic = selections[0];
      // Strip spaces and hyphens for validation
      const cleanPhone = (basic.phone || "").replace(/[\s-]/g, "");
      const validPhone = /^\+?[1-9]\d{7,14}$/.test(cleanPhone);
      return basic.name?.trim().length >= 2 && validPhone;
    }
    if (step.type === "single-select") return selections[currentStep] !== null;
    return (selections[currentStep] || []).length > 0;
  };

  const goNext = async () => {
    if (currentStep < totalSteps - 1) {
      setAnimating(true);
      setTimeout(() => {
        setCurrentStep((p) => p + 1);
        setAnimating(false);
      }, 200);
    } else {
      // Final step → submit data to API
      setIsSubmitting(true);
      try {
        const payload = {
          name: selections[0].name,
          phone: selections[0].phone,
          currentStatus: selections[1],
          targetRole: selections[2],
          skills: selections[3],
        };
        await completeOnboarding(payload);
        // completeOnboarding automatically routes to /dashboard
      } catch (err) {
        alert("Error saving onboarding details: " + err.message);
        setIsSubmitting(false);
      }
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setAnimating(true);
      setTimeout(() => {
        setCurrentStep((p) => p - 1);
        setAnimating(false);
      }, 200);
    }
  };

  const skip = () => {
    router.push("/dashboard");
  };

  return (
    <>
      <Head>
        <title>{`Onboarding — Step ${currentStep + 1} | LetsGrowAi`}</title>
        <meta name="description" content="Personalize your LetsGrowAi experience by telling us about your career goals." />
      </Head>

      {isSubmitting && <PageLoader message="Initializing your AI career path..." />}

      {/* Ambient Glow Decorations */}
      <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-secondary/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="bg-surface text-on-surface antialiased min-h-screen flex flex-col">
        {/* ═══ Nav Bar ═══ */}
        <nav className="flex justify-between items-center px-6 py-4 w-full max-w-7xl mx-auto">
          <Link href="/" className="text-xl font-bold text-primary-container tracking-tight font-headline hover:opacity-80 transition-opacity">
            LetsGrowAi
          </Link>
          <div className="flex items-center gap-6">
            {currentStep > 0 && (
              <button
                onClick={goBack}
                className="text-slate-500 font-semibold hover:text-primary transition-colors flex items-center gap-1"
              >
                <Icon name="arrow_back" className="text-lg" />
                Back
              </button>
            )}
            <span className="text-slate-500 font-semibold cursor-pointer hover:text-primary transition-colors">
              Help
            </span>
          </div>
        </nav>

        {/* ═══ Progress Indicator ═══ */}
        <div className="w-full max-w-2xl mx-auto px-6 mt-4 md:mt-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary signature-accent">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span className="text-xs font-medium text-outline">
              {STEP_LABELS[currentStep]}
            </span>
          </div>
          <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* ═══ Main Content ═══ */}
        <main className="flex-grow flex items-center justify-center p-6">
          <div
            className={`w-full max-w-4xl transition-all duration-300 ${
              animating ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
            }`}
          >
            {/* Title */}
            <div className="text-center mb-10 md:mb-12">
              <h1 className="text-3xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-4 font-headline">
                {step.title}
              </h1>
              <p className="text-on-surface-variant text-base md:text-lg max-w-xl mx-auto">
                {step.subtitle}
              </p>
            </div>

            {/* ═══ Option Cards Grid or Form ═══ */}
            {step.type === "form" ? (
              <div className="max-w-md mx-auto space-y-6 text-left">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">
                    Full Name <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <Icon name="person" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                    <input
                      type="text"
                      name="name"
                      value={selections[0]?.name || ""}
                      onChange={handleFormChange}
                      className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-outline-variant text-on-surface text-base"
                      placeholder="e.g. Jane Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">
                    Email Address
                    <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium">
                      <Icon name="verified" className="text-[14px]" /> Verified
                    </span>
                  </label>
                  <div className="relative">
                    <Icon name="mail" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                    <input
                      type="email"
                      name="email"
                      value={selections[0]?.email || ""}
                      readOnly
                      className="w-full pl-12 pr-4 py-3 bg-surface-container/50 border border-outline-variant/30 rounded-xl outline-none text-on-surface-variant cursor-not-allowed opacity-70 text-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">
                    Phone Number <span className="text-error">*</span>
                    <span className="text-xs font-normal text-outline ml-2">(International format, e.g. +91...)</span>
                  </label>
                  <div className="relative">
                    <Icon name="call" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                    <input
                      type="tel"
                      name="phone"
                      value={selections[0]?.phone || ""}
                      onChange={handleFormChange}
                      className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-outline-variant text-on-surface text-base tracking-wide"
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`grid gap-4 md:gap-6 ${
                  step.options.length <= 4
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                    : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                } ${step.options.length > 8 ? "lg:grid-cols-4" : ""}`}
              >
                {step.options.map((option) => {
                  const selected = isSelected(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelect(option.id)}
                      className={`group relative flex flex-col items-start p-6 md:p-8 rounded-xl text-left transition-all duration-300 outline-none onboarding-card ${
                        selected
                          ? "bg-primary-fixed ring-2 ring-secondary -translate-y-1 shadow-[0_20px_40px_rgba(15,23,42,0.08)]"
                          : "bg-surface-container-lowest ring-1 ring-inset ring-outline-variant/15 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.06)]"
                      }`}
                    >
                      {/* Selection Indicator */}
                      {selected && (
                        <div className="absolute top-3 right-3">
                          <Icon name="check_circle" className="text-secondary text-xl" filled />
                        </div>
                      )}

                      {/* Icon */}
                      <div
                        className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-4 md:mb-6 transition-colors ${
                          selected ? "bg-secondary/15" : "bg-surface-container group-hover:bg-primary-fixed"
                        }`}
                      >
                        <Icon name={option.icon} className="text-primary text-2xl md:text-3xl" />
                      </div>

                      {/* Label */}
                      <h3 className="text-base md:text-xl font-bold text-on-surface mb-1 md:mb-2">
                        {option.label}
                      </h3>

                      {/* Description */}
                      {option.desc && (
                        <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">
                          {option.desc}
                        </p>
                      )}

                      {/* Hover Hint (single-select only) */}
                      {step.type === "single-select" && !selected && (
                        <div className="mt-auto pt-4 md:pt-6 flex items-center text-primary font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          Select <Icon name="arrow_forward" className="ml-1 text-sm" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ═══ Action Area ═══ */}
            <div className="mt-12 md:mt-16 flex flex-col items-center gap-4 md:gap-6">
              <button
                onClick={goNext}
                disabled={!canProceed()}
                className="bg-primary text-on-primary px-10 py-4 rounded-lg font-bold text-lg flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {currentStep === totalSteps - 1 ? "Finish Setup" : "Continue"}
                <Icon name="arrow_forward" />
              </button>
              <button
                onClick={skip}
                className="text-outline font-medium hover:text-on-surface transition-colors duration-200"
              >
                Skip for now
              </button>
            </div>
          </div>
        </main>

        {/* ═══ Footer ═══ */}
        <footer className="flex flex-col md:flex-row justify-between items-center px-6 md:px-8 py-6 w-full border-t border-slate-100">
          <div className="text-lg font-bold text-primary-container mb-4 md:mb-0 font-headline">LetsGrowAi</div>
          <div className="flex gap-6 md:gap-8 text-sm text-slate-500">
            <Link href="#" className="hover:underline transition-all">Privacy Policy</Link>
            <Link href="#" className="hover:underline transition-all">Terms of Service</Link>
            <Link href="#" className="hover:underline transition-all">Support</Link>
          </div>
          <div className="text-sm text-slate-500 mt-4 md:mt-0">
            © 2024 LetsGrowAi. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}
