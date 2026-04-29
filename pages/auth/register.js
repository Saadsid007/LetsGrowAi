import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import AuthFooter from "@/components/AuthFooter";
import { useAuth } from "@/context/AuthContext";
import { signIn } from "next-auth/react";
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

export default function Register() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const { register } = useAuth();

  const update = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
    setServerError("");
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8) errs.password = "Minimum 8 characters";
    else if (!/[A-Z]/.test(form.password)) errs.password = "Must contain an uppercase letter";
    else if (!/[0-9]/.test(form.password)) errs.password = "Must contain a number";
    if (!form.confirmPassword) errs.confirmPassword = "Please confirm password";
    else if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords don't match";
    if (!form.agreeTerms) errs.agreeTerms = "You must agree to the terms";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await register({ name: form.fullName, email: form.email, password: form.password });
      // AuthContext.register() redirects to /onboarding automatically
    } catch (err) {
      setServerError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/onboarding" });
    } catch {
      setServerError("Google sign-up failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up | LetsGrowAi</title>
        <meta name="description" content="Create your LetsGrowAi account and start your AI-powered career journey today." />
      </Head>

      {(loading || googleLoading) && <PageLoader message={googleLoading ? "Connecting to Google..." : "Preparing your profile..."} />}

      <main className="flex-grow flex flex-col md:flex-row min-h-screen">
        {/* ═══ LEFT — Brand Visual Side ═══ */}
        <section className="hidden md:flex md:w-1/2 bg-inverse-surface relative overflow-hidden flex-col justify-between p-12 lg:p-20">
          {/* Abstract BG Blurs */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px]" />
            <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[80px]" />
          </div>

          <div className="relative z-10">
            <Link href="/" className="text-2xl font-bold text-on-primary-container tracking-tight font-headline hover:opacity-80 transition-opacity">
              LetsGrowAi
            </Link>

            <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-6 mt-12 font-headline">
              Unlock your{" "}
              <span className="text-primary-fixed-dim">career potential</span>{" "}
              with AI.
            </h1>
            <p className="text-on-primary-container text-lg max-w-md opacity-80 leading-relaxed">
              Join thousands of professionals using personalized AI insights to navigate their career paths and master new skills.
            </p>
          </div>

          {/* Bento Decorative Elements */}
          <div className="relative z-10 grid grid-cols-2 gap-4 mt-12">
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
              <Icon name="psychology" className="text-primary-fixed-dim text-2xl mb-2" filled />
              <div className="text-white font-semibold text-sm">AI Skill Analysis</div>
              <div className="text-white/60 text-xs mt-1">Real-time market gap detection.</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 mt-8">
              <Icon name="trending_up" className="text-primary-fixed-dim text-2xl mb-2" filled />
              <div className="text-white font-semibold text-sm">Growth Tracking</div>
              <div className="text-white/60 text-xs mt-1">Milestone based career mapping.</div>
            </div>
          </div>

          <div className="relative z-10 text-white/40 text-sm mt-8">
            Curating the future of professional development.
          </div>
        </section>

        {/* ═══ RIGHT — Form Side ═══ */}
        <section className="flex-grow md:w-1/2 bg-surface-bright flex items-center justify-center p-6 md:p-12 lg:p-24">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="md:hidden text-xl font-bold text-primary tracking-tight mb-8 font-headline">
              LetsGrowAi
            </div>

            <div className="mb-10">
              <h2 className="text-3xl font-bold text-on-surface mb-2 font-headline">
                Create Account
              </h2>
              <p className="text-on-surface-variant">
                Start your journey toward professional excellence today.
              </p>
            </div>

            {/* Server Error Banner */}
            {serverError && (
              <div className="mb-6 p-4 bg-error/5 border border-error/20 rounded-xl flex items-start gap-3">
                <Icon name="error" className="text-error text-lg mt-0.5" filled />
                <p className="text-error text-sm font-medium">{serverError}</p>
              </div>
            )}

            {/* Google OAuth */}
            <button
              onClick={handleGoogleSignUp}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl font-medium text-on-surface hover:bg-surface-container transition-all duration-200 mb-8 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {googleLoading ? "Redirecting..." : "Sign up with Google"}
            </button>

            {/* Divider */}
            <div className="relative flex items-center mb-8">
              <div className="flex-grow border-t border-outline-variant/20" />
              <span className="mx-4 text-xs font-semibold text-outline tracking-widest uppercase">
                Or use email
              </span>
              <div className="flex-grow border-t border-outline-variant/20" />
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              {/* Full Name */}
              <div>
                <label htmlFor="reg-fullname" className="block text-xs font-bold text-primary uppercase tracking-wider mb-2 border-b-2 border-secondary inline-block pb-0.5">
                  Full Name
                </label>
                <input
                  id="reg-fullname"
                  type="text"
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  placeholder="Enter your full name"
                  className={`w-full bg-surface-container-low border-none focus:ring-0 rounded-lg px-4 py-3.5 text-on-surface placeholder:text-outline/50 transition-all border-b-2 ${errors.fullName ? "border-error" : "border-transparent focus:border-secondary"}`}
                />
                {errors.fullName && <p className="text-error text-xs ml-1 mt-1">{errors.fullName}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="reg-email" className="block text-xs font-bold text-primary uppercase tracking-wider mb-2 border-b-2 border-secondary inline-block pb-0.5">
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="name@company.com"
                  className={`w-full bg-surface-container-low border-none focus:ring-0 rounded-lg px-4 py-3.5 text-on-surface placeholder:text-outline/50 transition-all border-b-2 ${errors.email ? "border-error" : "border-transparent focus:border-secondary"}`}
                />
                {errors.email && <p className="text-error text-xs ml-1 mt-1">{errors.email}</p>}
              </div>

              {/* Password Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-password" className="block text-xs font-bold text-primary uppercase tracking-wider mb-2 border-b-2 border-secondary inline-block pb-0.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      placeholder="••••••••"
                      className={`w-full bg-surface-container-low border-none focus:ring-0 rounded-lg px-4 py-3.5 pr-10 text-on-surface placeholder:text-outline/50 transition-all border-b-2 ${errors.password ? "border-error" : "border-transparent focus:border-secondary"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                      tabIndex={-1}
                    >
                      <Icon name={showPassword ? "visibility_off" : "visibility"} className="text-lg" />
                    </button>
                  </div>
                  {errors.password && <p className="text-error text-xs ml-1 mt-1">{errors.password}</p>}
                </div>
                <div>
                  <label htmlFor="reg-confirm" className="block text-xs font-bold text-primary uppercase tracking-wider mb-2 border-b-2 border-secondary inline-block pb-0.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="reg-confirm"
                      type={showConfirm ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) => update("confirmPassword", e.target.value)}
                      placeholder="••••••••"
                      className={`w-full bg-surface-container-low border-none focus:ring-0 rounded-lg px-4 py-3.5 pr-10 text-on-surface placeholder:text-outline/50 transition-all border-b-2 ${errors.confirmPassword ? "border-error" : "border-transparent focus:border-secondary"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                      tabIndex={-1}
                    >
                      <Icon name={showConfirm ? "visibility_off" : "visibility"} className="text-lg" />
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-error text-xs ml-1 mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3 py-2">
                <input
                  id="reg-terms"
                  type="checkbox"
                  checked={form.agreeTerms}
                  onChange={(e) => update("agreeTerms", e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-outline-variant bg-surface-container-low text-primary focus:ring-primary/20"
                />
                <label htmlFor="reg-terms" className="text-sm text-on-surface-variant leading-snug">
                  I agree to{" "}
                  <Link href="#" className="text-primary font-semibold hover:underline">Terms</Link>
                  {" & "}
                  <Link href="#" className="text-primary font-semibold hover:underline">Privacy Policy</Link>
                </label>
              </div>
              {errors.agreeTerms && <p className="text-error text-xs ml-1 -mt-2">{errors.agreeTerms}</p>}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-lg hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 mt-4 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            {/* Switch to Login */}
            <p className="mt-10 text-center text-on-surface-variant text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-secondary font-bold hover:underline ml-1">
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </main>

      <AuthFooter />
    </>
  );
}
