import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  UserRound,
  Wallet,
} from "lucide-react";
import { toast } from "react-toastify";
import { Logo, Spinner } from "../../components/ui";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const roles = [
  {
    value: "user",
    label: "Personal",
    description: "Track your own expenses, income and budgets.",
    icon: UserRound,
  },
  {
    value: "admin",
    label: "Administrator",
    description: "Manage users and monitor platform activity.",
    icon: ShieldCheck,
  },
];

const Signup = () => {
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState(searchParams.get("role") === "admin" ? "admin" : "user");
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    Cpassword: "",
    role,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setData((current) => ({ ...current, role }));
  }, [role]);

  const handleForm = (event) => {
    const { name, value } = event.target;
    setData((current) => ({ ...current, [name]: value }));
    if (error) setError("");
  };

  const checks = {
    length: data.password.length >= 8,
    cases: /[a-z]/.test(data.password) && /[A-Z]/.test(data.password),
    number: /\d/.test(data.password),
    special: /[@$!%*?&]/.test(data.password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const strength =
    score <= 1
      ? { label: "Weak", color: "bg-rose-500", text: "text-rose-600" }
      : score === 2
      ? { label: "Fair", color: "bg-amber-500", text: "text-amber-600" }
      : score === 3
      ? { label: "Good", color: "bg-sky-500", text: "text-sky-600" }
      : { label: "Strong", color: "bg-emerald-500", text: "text-emerald-600" };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!data.name.trim() || !data.email || !data.password || !data.Cpassword) {
      setError("Please fill in all fields before continuing.");
      return;
    }

    if (!passwordRegex.test(data.password)) {
      setError(
        "Your password needs 8+ characters, upper and lowercase letters, a number and a special character."
      );
      return;
    }

    if (data.password !== data.Cpassword) {
      setError("The passwords you entered do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });

      if (response.status === 201) {
        toast.success(response.data.message || "Account created successfully");
        navigate("/login");
      } else {
        setError(response.data.message || "Something went wrong.");
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Signup failed. Please try again.");
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
            Free to start
          </span>
        </div>

        <div className="relative my-auto max-w-lg py-12">
          <div className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.2em] text-teal-300">
            <Sparkles size={14} />
            Create your workspace
          </div>
          <h1 className="mt-4 font-display text-[40px] font-extrabold leading-[1.06] tracking-tight xl:text-[46px]">
            Build a clearer
            <br />
            money habit.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-400">
            One account gives you a complete picture of your spending, income and
            budgets — with reports that update as you go.
          </p>

          <div className="mt-10 space-y-4">
            {[
              {
                icon: Wallet,
                title: "Track both sides",
                description: "Expenses and income in one balanced view.",
              },
              {
                icon: BarChart3,
                title: "See the patterns",
                description: "Category insights and monthly trends, automatically.",
              },
              {
                icon: ShieldCheck,
                title: "Stay protected",
                description: "Role-based access and rotating JWT sessions.",
              },
            ].map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="flex gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-teal-300">
                    <Icon size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{benefit.title}</p>
                    <p className="mt-0.5 text-[12px] text-slate-400">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-[10.5px] text-slate-500">
          <ShieldCheck size={14} className="text-emerald-400" />
          No credit card. No hidden fees. Your data stays yours.
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
          <div className="animate-fade-up w-full max-w-[470px]">
            <span className="badge bg-teal-50 text-teal-700 ring-1 ring-teal-100">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              Get started
            </span>
            <h2 className="mt-3 font-display text-[28px] font-extrabold tracking-tight text-slate-950">
              Create your account
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Choose your workspace type and set up secure access.
            </p>

            <div className="surface mt-7 p-6 sm:p-7">
              <div className="mb-5">
                <p className="label-field">Workspace type</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {roles.map((option) => {
                    const Icon = option.icon;
                    const selected = role === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRole(option.value)}
                        className={`relative rounded-xl border p-3 text-left transition-all ${
                          selected
                            ? "border-teal-500 bg-teal-50/60 ring-2 ring-teal-100"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                        aria-pressed={selected}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              selected
                                ? "bg-teal-600 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <Icon size={15} />
                          </span>
                          <span
                            className={`absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full border ${
                              selected
                                ? "border-teal-600 bg-teal-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {selected && <Check size={10} strokeWidth={3} />}
                          </span>
                        </div>
                        <p className="mt-2 text-[12px] font-bold text-slate-800">
                          {option.label}
                        </p>
                        <p className="mt-0.5 text-[10px] leading-snug text-slate-500">
                          {option.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

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
                  <label htmlFor="name" className="label-field">
                    Full name
                  </label>
                  <div className="relative">
                    <UserRound
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={data.name}
                      onChange={handleForm}
                      placeholder="John Doe"
                      autoComplete="name"
                      required
                      className="field field-icon h-[44px] py-0"
                    />
                  </div>
                </div>

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
                      className="field field-icon h-[44px] py-0"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="label-field">
                    Password
                  </label>
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
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      className="field field-icon h-[44px] py-0 pr-11"
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

                  {data.password && (
                    <div className="mt-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          Password strength
                        </span>
                        <span className={`text-[10.5px] font-bold ${strength.text}`}>
                          {strength.label}
                        </span>
                      </div>
                      <div className="mt-1.5 flex gap-1">
                        {[1, 2, 3, 4].map((step) => (
                          <span
                            key={step}
                            className={`h-1 flex-1 rounded-full ${
                              score >= step ? strength.color : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5">
                        {[
                          { key: "length", label: "8+ characters" },
                          { key: "cases", label: "Upper & lowercase" },
                          { key: "number", label: "A number" },
                          { key: "special", label: "A special character" },
                        ].map((item) => (
                          <span
                            key={item.key}
                            className={`flex items-center gap-1.5 text-[10px] font-medium ${
                              checks[item.key] ? "text-emerald-600" : "text-slate-400"
                            }`}
                          >
                            <span
                              className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${
                                checks[item.key]
                                  ? "bg-emerald-100 text-emerald-600"
                                  : "bg-slate-200 text-slate-400"
                              }`}
                            >
                              <Check size={8} strokeWidth={3} />
                            </span>
                            {item.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="Cpassword" className="label-field">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="Cpassword"
                      id="Cpassword"
                      value={data.Cpassword}
                      onChange={handleForm}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      className="field field-icon h-[44px] py-0 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((visible) => !visible)}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {data.Cpassword && data.password !== data.Cpassword && (
                    <p className="mt-1.5 text-[10.5px] font-medium text-rose-600">
                      Passwords do not match yet.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary h-[46px] w-full"
                >
                  {loading ? (
                    <>
                      <Spinner size={16} />
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>

            <p className="mt-5 text-center text-[12px] text-slate-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-teal-600 transition hover:text-teal-700"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Signup;
