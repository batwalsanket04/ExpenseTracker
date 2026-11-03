import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../../Context/storeContext";
import { Logo, Spinner } from "../../components/ui";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const benefits = [
  {
    icon: Wallet,
    title: "One clear balance",
    description: "Expenses and income together, so you always know where you stand.",
  },
  {
    icon: BarChart3,
    title: "Insights that matter",
    description: "Category breakdowns, monthly trends and budget progress at a glance.",
  },
  {
    icon: ShieldCheck,
    title: "Security built in",
    description: "JWT access tokens with refresh rotation protect every session.",
  },
];

const Login = () => {
  const { login } = useAuth();
  const [data, setData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleForm = (event) => {
    const { name, value } = event.target;
    setData((current) => ({ ...current, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!data.email || !data.password) {
      setError("Please enter both your email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, data);

      if (response.status === 200 || response.status === 201) {
        const { accessToken, refreshToken, user } = response.data;
        login({ accessToken, refreshToken }, user);
        toast.success(`Welcome back, ${user.name}!`);
        navigate("/dashboard", { replace: true });
      } else {
        setError(response.data.message || "Invalid credentials.");
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Error connecting to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f5f0] lg:grid lg:grid-cols-[1.02fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-[#102a25] p-10 text-white lg:flex lg:flex-col xl:p-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-28 h-96 w-96 rounded-full bg-teal-500/25 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="absolute inset-0 bg-grid opacity-30" />
        </div>

        <div className="relative flex items-center justify-between">
          <Link to="/" aria-label="ExpenseTracker home">
            <Logo light />
          </Link>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[9.5px] font-bold uppercase tracking-[0.18em] text-teal-200/80">
            Secure sign in
          </span>
        </div>

        <div className="relative my-auto max-w-lg py-12">
          <div className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.2em] text-teal-300">
            <Sparkles size={14} />
            Welcome back
          </div>
          <h1 className="mt-4 font-display text-[40px] font-extrabold leading-[1.06] tracking-tight xl:text-[46px]">
            Your finances,
            <br />
            finally in focus.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-400">
            Sign in to pick up exactly where you left off — your transactions,
            budgets and reports are waiting.
          </p>

          <div className="mt-10 space-y-5">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="flex gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-teal-300">
                    <Icon size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{benefit.title}</p>
                    <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-slate-400">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200">
              Protected by JWT access & refresh tokens
            </p>
            <p className="mt-0.5 text-[10.5px] text-slate-500">
              Sessions rotate automatically — your data stays yours.
            </p>
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8 lg:justify-end">
          <Link to="/" className="lg:hidden" aria-label="ExpenseTracker home">
            <Logo />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500 transition hover:text-teal-600"
          >
            <ArrowLeft size={14} />
            Back to home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-6">
          <div className="animate-fade-up w-full max-w-[430px]">
            <span className="badge bg-teal-50 text-teal-700 ring-1 ring-teal-100">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              Welcome back
            </span>
            <h2 className="mt-3 font-display text-[28px] font-extrabold tracking-tight text-slate-950">
              Sign in to your workspace
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Enter your credentials to access your dashboard.
            </p>

            <div className="surface mt-7 p-6 sm:p-7">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-3 text-[12px] font-medium leading-relaxed text-rose-700"
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-600">
                      !
                    </span>
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="label-field">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={data.email}
                      onChange={handleForm}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      className="field field-icon h-[46px] py-0"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="password" className="label-field mb-0">
                      Password
                    </label>
                    <Link
                      to="/signup"
                      className="text-[11px] font-semibold text-teal-600 transition hover:text-teal-700"
                    >
                      Create account
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      id="password"
                      value={data.password}
                      onChange={handleForm}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      minLength={8}
                      className="field field-icon h-[46px] py-0 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary h-[46px] w-full"
                >
                  {loading ? (
                    <>
                      <Spinner size={16} />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  New here?
                </span>
                <span className="h-px flex-1 bg-slate-100" />
              </div>

              <Link
                to="/signup?role=user"
                className="btn btn-secondary mt-4 h-[46px] w-full"
              >
                Create a free account
              </Link>
            </div>

            <div className="mt-5 flex items-center justify-center gap-1.5 text-[10.5px] text-slate-400">
              <ShieldCheck size={12} className="text-emerald-500" />
              Your session is secured with encrypted tokens
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
