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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const { login } = useAuth();

  const validate = () => {
    const errs = {};
    if (!email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
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
      await login({ email, password }); // redirects automatically on success
    } catch (err) {
      setServerError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setServerError("Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login | LetsGrowAi</title>
        <meta name="description" content="Login to your LetsGrowAi account and continue your AI-powered career journey." />
      </Head>

      {(loading || googleLoading) && <PageLoader message={googleLoading ? "Connecting to Google..." : "Authenticating..."} />}

      <main className="min-h-screen flex flex-col md:flex-row">
        {/* ═══ LEFT — Form Section (60%) ═══ */}
        <section className="w-full md:w-[60%] flex flex-col items-center justify-center p-8 md:p-16 bg-surface-container-lowest">
          <div className="w-full max-w-md">
            {/* Brand Anchor */}
            <div className="mb-12">
              <Link href="/" className="text-2xl font-headline font-bold text-primary-container tracking-tight hover:opacity-80 transition-opacity">
                LetsGrowAi
              </Link>
            </div>

            {/* Header */}
            <div className="mb-10">
              <h1 className="text-4xl font-headline font-bold text-on-surface mb-2">
                Welcome Back 👋
              </h1>
              <p className="text-on-surface-variant text-lg">
                Continue your career journey
              </p>
            </div>

            {/* Server Error Banner */}
            {serverError && (
              <div className="mb-6 p-4 bg-error/5 border border-error/20 rounded-lg flex items-start gap-3">
                <Icon name="error" className="text-error text-lg mt-0.5" filled />
                <p className="text-error text-sm font-medium">{serverError}</p>
              </div>
            )}

            {/* Login Form */}
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className="space-y-1">
                <label htmlFor="login-email" className="text-sm font-semibold text-on-surface-variant ml-1">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); setServerError(""); }}
                  placeholder="name@company.com"
                  className={`w-full px-4 py-3 rounded-lg border-none bg-surface-container-low focus:ring-0 focus:outline-none border-b-2 ${errors.email ? "border-error" : "border-transparent focus:border-secondary"} transition-all placeholder:text-outline-variant`}
                />
                {errors.email && <p className="text-error text-xs ml-1 mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="login-password" className="text-sm font-semibold text-on-surface-variant">
                    Password
                  </label>
                  <Link href="#" className="text-xs font-bold text-secondary hover:underline transition-all">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); setServerError(""); }}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 pr-12 rounded-lg border-none bg-surface-container-low focus:ring-0 focus:outline-none border-b-2 ${errors.password ? "border-error" : "border-transparent focus:border-secondary"} transition-all placeholder:text-outline-variant`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                    tabIndex={-1}
                  >
                    <Icon name={showPassword ? "visibility_off" : "visibility"} className="text-xl" />
                  </button>
                </div>
                {errors.password && <p className="text-error text-xs ml-1 mt-1">{errors.password}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary font-bold py-4 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all active:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-variant" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-surface-container-lowest text-outline italic">
                  or continue with
                </span>
              </div>
            </div>

            {/* Google OAuth */}
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-outline-variant/30 rounded-lg font-semibold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
              {googleLoading ? "Redirecting..." : "Sign in with Google"}
            </button>

            {/* Footer Link */}
            <p className="mt-10 text-center text-on-surface-variant">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="text-primary font-bold hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </section>

        {/* ═══ RIGHT — Brand Experience (40%) ═══ */}
        <section className="hidden md:flex md:w-[40%] bg-gradient-to-br from-[#1D4ED8] to-[#0EA5E9] relative overflow-hidden flex-col justify-center p-12">
          {/* Decorative Overlays */}
          <div className="absolute inset-0 grid-pattern opacity-30" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/10 rounded-full blur-3xl" />

          <div className="relative z-10 space-y-12">
            {/* Main Quote */}
            <div className="max-w-xs">
              <div className="h-1 w-12 bg-white/40 mb-6" />
              <h2 className="text-3xl lg:text-4xl font-headline font-extrabold text-white leading-tight">
                &ldquo;From confused student to confident professional&rdquo;
              </h2>
            </div>

            {/* Testimonial Pills — Asymmetric */}
            <div className="space-y-6">
              <div className="glass-pill px-6 py-4 rounded-xl inline-flex items-center gap-3 translate-x-4 shadow-xl">
                <Icon name="check_circle" className="text-white text-xl" filled />
                <span className="text-white font-medium">Got placed at Google ✅</span>
              </div>

              <div className="flex justify-end">
                <div className="glass-pill px-6 py-4 rounded-xl inline-flex items-center gap-3 -translate-x-6 shadow-xl">
                  <Icon name="rocket_launch" className="text-white text-xl" filled />
                  <span className="text-white font-medium">ATS Score went from 40 to 94 🚀</span>
                </div>
              </div>

              <div className="glass-pill px-6 py-4 rounded-xl inline-flex items-center gap-3 shadow-xl">
                <Icon name="record_voice_over" className="text-white text-xl" filled />
                <span className="text-white font-medium">Mock interview helped me crack TCS</span>
              </div>
            </div>

            {/* Featured Image */}
            <div className="mt-12 rounded-2xl overflow-hidden aspect-video shadow-2xl relative">
              <img
                alt="Professional team collaborating"
                className="w-full h-full object-cover grayscale opacity-50 contrast-125 mix-blend-overlay"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAP9KFcyBvj2kVa0wQr0E7uTLJhnCJQhAHkObLORuzmto7T-FR9-sjRDb0kF4kUKy7ExOm8dNZ3MWf-McwPNVFu-3-yU8Si5QAJXYsTQ5Rq1YqgyG28y1vuuGhQQxLp_8YXglOoXgPNHPJHmJ6OQQdnUskr8R3RAHL-Es980fTgHnUPmauJ7kKB6MdMTNodwWTryjkgfdH2Wcn8F9CKBBi8m7j3idFDN1sZguIMZtpdgfH5Vjr_k-9Q3B-2DrQrR-HVhoUy9Op_AWg"
              />
              <div className="absolute inset-0 bg-primary/20" />
            </div>
          </div>
        </section>
      </main>

      <AuthFooter />
    </>
  );
}
