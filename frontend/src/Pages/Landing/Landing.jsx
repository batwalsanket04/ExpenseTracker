import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../../components/ui";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronRight,
  CircleCheck,
  Lock,
  Menu,
  PieChart,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";

const features = [
  {
    icon: ReceiptText,
    title: "Every rupee, accounted for",
    description:
      "Log expenses with categories, notes and dates in seconds. Search and filter your full history whenever you need it.",
    className: "lg:col-span-2",
    tone: "bg-teal-50 text-teal-600 ring-teal-100",
  },
  {
    icon: PieChart,
    title: "Budgets that stay honest",
    description:
      "Set monthly limits by category and instantly see how much room is left before you overspend.",
    className: "",
    tone: "bg-amber-50 text-amber-600 ring-amber-100",
  },
  {
    icon: Wallet,
    title: "Income in the same picture",
    description:
      "Record salary, refunds and side income alongside expenses to see your real net balance.",
    className: "",
    tone: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  },
  {
    icon: BarChart3,
    title: "Reports that make sense",
    description:
      "Category breakdowns and monthly trends turn raw transactions into decisions you can act on.",
    className: "",
    tone: "bg-sky-50 text-sky-600 ring-sky-100",
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    description:
      "JWT access and refresh tokens with Redis-backed sessions keep your financial data protected.",
    className: "",
    tone: "bg-amber-50 text-amber-600 ring-amber-100",
  },
  {
    icon: Users,
    title: "Made for users and admins",
    description:
      "Personal users get a focused workspace. Admins get platform-wide visibility and controls.",
    className: "",
    tone: "bg-rose-50 text-rose-600 ring-rose-100",
  },
];

const steps = [
  {
    title: "Create your account",
    description:
      "Choose a personal or admin workspace, then sign up with a secure password.",
  },
  {
    title: "Add your first entry",
    description:
      "Record an expense or income. Categorise it, add a note, and set a date.",
  },
  {
    title: "Let the picture form",
    description:
      "Watch budgets, category insights and monthly reports update automatically.",
  },
];

const plans = [
  {
    name: "Personal",
    description: "A private workspace for your own money habits.",
    features: [
      "Unlimited expense & income entries",
      "Category budgets with progress",
      "Monthly reports and trends",
      "Secure JWT authentication",
    ],
    cta: "Start tracking free",
    to: "/signup?role=user",
    highlighted: false,
  },
  {
    name: "Admin workspace",
    description: "Platform-level visibility for teams and administrators.",
    features: [
      "Everything in Personal",
      "Manage users and roles",
      "Monitor all transactions",
      "Audit logs and security controls",
    ],
    cta: "Create admin account",
    to: "/signup?role=admin",
    highlighted: true,
  },
];

const faqs = [
  {
    question: "Is my financial data secure?",
    answer:
      "Every request is protected with JWT access tokens and refresh rotation. Passwords are hashed, sessions are managed server-side, and role-based access keeps data scoped to the right account.",
  },
  {
    question: "Can I use ExpenseTracker on my phone?",
    answer:
      "Yes. The interface is fully responsive, with a slide-out navigation drawer, touch-friendly forms, and mobile layouts for every dashboard view.",
  },
  {
    question: "What can an admin see that a user cannot?",
    answer:
      "Admins get a platform-wide console covering users, transactions, category insights, audit activity and security. Personal users only ever see their own records.",
  },
  {
    question: "Do I need to pay to get started?",
    answer:
      "No. Both the personal and admin workspaces are free to create. Sign up, add your first transaction, and explore every feature without a credit card.",
  },
];

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      {/* Navigation */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-100/80 bg-white/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="ExpenseTracker home">
            <Logo />
          </Link>

          <div className="hidden items-center gap-8 text-[13px] font-semibold text-slate-500 md:flex">
            <a href="#features" className="transition hover:text-teal-600">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-teal-600">
              How it works
            </a>
            <a href="#pricing" className="transition hover:text-teal-600">
              Pricing
            </a>
            <a href="#faq" className="transition hover:text-teal-600">
              FAQ
            </a>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/login"
              className="rounded-xl px-3.5 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Log in
            </Link>
            <Link to="/signup?role=user" className="btn btn-primary btn-sm">
              Get started
              <ArrowRight size={15} />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="btn btn-secondary h-10 w-10 rounded-xl p-0 md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="animate-fade-up border-t border-slate-100 bg-white px-4 pb-5 pt-3 md:hidden">
            <div className="space-y-1">
              {[
                ["Features", "#features"],
                ["How it works", "#how-it-works"],
                ["Pricing", "#pricing"],
                ["FAQ", "#faq"],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  {label}
                </a>
              ))}
            </div>
            <div className="mt-3 flex gap-2 border-t border-slate-100 pt-4">
              <Link to="/login" className="btn btn-secondary flex-1">
                Log in
              </Link>
              <Link to="/signup?role=user" className="btn btn-primary flex-1">
                Get started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pb-20 pt-32 sm:pt-36 lg:pb-28 lg:pt-44">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-x-0 top-0 h-[560px] bg-gradient-to-b from-teal-50/80 via-white to-white" />
          <div className="absolute -left-24 top-20 h-[420px] w-[420px] rounded-full bg-teal-200/40 blur-3xl" />
          <div className="absolute -right-20 top-40 h-[420px] w-[420px] rounded-full bg-amber-200/40 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-full bg-grid opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8">
          <div className="animate-fade-up max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white/80 px-3 py-1.5 text-[11px] font-bold text-teal-700 shadow-sm backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-500" />
              </span>
              Budgets, reports and role-based access — all in one place
            </span>

            <h1 className="mt-6 font-display text-[42px] font-extrabold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-[58px]">
              Clarity for every
              <br />
              <span className="gradient-text">rupee you spend.</span>
            </h1>

            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-slate-600 sm:text-base">
              ExpenseTracker brings your expenses, income, budgets and reports into one
              calm, secure workspace — so you always know where your money stands.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/signup?role=user" className="btn btn-primary btn-lg">
                Start tracking free
                <ArrowRight size={18} />
              </Link>
              <a href="#features" className="btn btn-secondary btn-lg">
                Explore features
              </a>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] font-medium text-slate-500">
              {["No credit card required", "Free to start", "Secure JWT sessions"].map(
                (item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <CircleCheck size={14} className="text-emerald-500" />
                    {item}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Product preview */}
          <div className="animate-fade-up delay-150 relative mx-auto w-full max-w-[480px]">
            <div className="absolute -inset-8 rounded-[44px] bg-gradient-to-br from-teal-500/20 via-amber-500/10 to-transparent blur-2xl" />

            <div className="relative rounded-[32px] border border-white/70 bg-white/60 p-2 shadow-2xl shadow-teal-900/10 backdrop-blur">
              <div className="overflow-hidden rounded-[25px] bg-white ring-1 ring-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-700 text-white">
                      <Wallet size={15} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-900">ExpenseTracker</p>
                      <p className="text-[9px] text-slate-400">Personal dashboard</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-slate-500">
                    Preview
                  </span>
                </div>

                <div className="p-5">
                  <div className="relative overflow-hidden rounded-2xl bg-[#102a25] p-4 text-white">
                    <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-teal-500/30 blur-2xl" />
                    <p className="relative text-[8.5px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Available balance
                    </p>
                    <p className="relative mt-1.5 font-display text-2xl font-extrabold tracking-tight">
                      ₹84,250
                    </p>
                    <div className="relative mt-3 flex items-center gap-4 text-[10px] font-semibold">
                      <span className="flex items-center gap-1 text-emerald-300">
                        <TrendingUp size={11} /> ₹32,000 in
                      </span>
                      <span className="flex items-center gap-1 text-rose-300">
                        <TrendingDown size={11} /> ₹12,450 out
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-2">
                    {[38, 62, 44, 78, 52, 90, 68].map((height, index) => (
                      <div key={index} className="flex flex-1 flex-col items-center gap-1.5">
                        <div
                          className={`w-full rounded-t-md ${
                            index === 5
                              ? "bg-gradient-to-t from-teal-700 to-teal-400"
                              : "bg-teal-100"
                          }`}
                          style={{ height: `${height * 0.85}px` }}
                        />
                        <span className="text-[7.5px] font-semibold uppercase text-slate-400">
                          {["M", "T", "W", "T", "F", "S", "S"][index]}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                          <ReceiptText size={13} />
                        </span>
                        <div>
                          <p className="text-[10.5px] font-semibold text-slate-800">
                            Groceries
                          </p>
                          <p className="text-[8.5px] text-slate-400">Today · Food</p>
                        </div>
                      </div>
                      <p className="text-[10.5px] font-bold text-rose-600">−₹450</p>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                          <Wallet size={13} />
                        </span>
                        <div>
                          <p className="text-[10.5px] font-semibold text-slate-800">
                            Monthly salary
                          </p>
                          <p className="text-[8.5px] text-slate-400">01 Nov · Income</p>
                        </div>
                      </div>
                      <p className="text-[10.5px] font-bold text-emerald-600">+₹32,000</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating cards */}
            <div className="animate-float absolute -left-8 bottom-24 hidden rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xl shadow-slate-900/10 sm:block">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{ background: "conic-gradient(#0f766e 0 76%, #e2e8f0 76% 100%)" }}
                  />
                  <div className="absolute inset-1 flex items-center justify-center rounded-full bg-white text-[8px] font-extrabold text-teal-600">
                    76%
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-800">Food budget</p>
                  <p className="text-[9px] text-slate-400">₹2,250 of ₹3,000 left</p>
                </div>
              </div>
            </div>

            <div className="animate-float absolute -right-4 top-20 hidden items-center gap-2 rounded-2xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-xl shadow-slate-900/10 sm:flex" style={{ animationDelay: "1.2s" }}>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <ShieldCheck size={14} />
              </span>
              <div>
                <p className="text-[9.5px] font-bold text-slate-800">Session secured</p>
                <p className="text-[8.5px] text-slate-400">JWT + refresh tokens</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-100 bg-white/70 p-5 shadow-sm backdrop-blur sm:grid-cols-4 sm:p-6">
            {[
              { icon: Lock, label: "JWT protected", note: "Secure sessions" },
              { icon: Users, label: "Role-based", note: "User + admin" },
              { icon: PieChart, label: "6 categories", note: "Clear insights" },
              { icon: BarChart3, label: "Live reports", note: "Always current" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                    <Icon size={16} />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.label}</p>
                    <p className="text-[10px] text-slate-400">{item.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-24 bg-[#f8f7f2] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-teal-600">
              Features
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Everything you need to feel in control
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              Purpose-built tools for everyday money management — without the clutter
              of a full accounting suite.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={`group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal-100 hover:shadow-xl hover:shadow-teal-900/[0.06] ${feature.className}`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-105">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${feature.tone}`}>
                      <Icon size={20} />
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-lg font-bold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                    {feature.description}
                  </p>
                  {feature.title === "Every rupee, accounted for" && (
                    <div className="mt-5 space-y-2.5 rounded-xl border border-slate-100 bg-[#f8f7f2] p-4">
                      {[
                        ["Food", "68%", "bg-amber-500"],
                        ["Shopping", "46%", "bg-rose-500"],
                        ["Bills", "32%", "bg-teal-600"],
                      ].map(([label, width, color]) => (
                        <div key={label} className="flex items-center gap-3">
                          <span className="w-16 text-[10px] font-semibold text-slate-500">{label}</span>
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200/70">
                            <span className={`block h-full rounded-full ${color}`} style={{ width }} />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {feature.title === "Budgets that stay honest" && (
                    <div className="mt-5 flex items-center gap-3 rounded-xl bg-amber-50/70 p-3">
                      <div className="relative flex h-11 w-11 items-center justify-center rounded-full">
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{ background: "conic-gradient(#f59e0b 0 82%, #fde68a 82% 100%)" }}
                        />
                        <div className="absolute inset-1 flex items-center justify-center rounded-full bg-white text-[8px] font-extrabold text-amber-600">
                          82%
                        </div>
                      </div>
                      <p className="text-[10.5px] leading-snug text-amber-800">
                        <span className="font-bold">Almost there.</span> ₹1,080 left in your
                        food budget this month.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-24 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-teal-600">
              How it works
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              From first entry to full clarity
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              Three simple steps. No setup marathon, no spreadsheet maintenance.
            </p>
          </div>

          <div className="relative mt-14 grid gap-5 lg:grid-cols-3">
            <div className="pointer-events-none absolute left-[16%] right-[16%] top-12 hidden border-t border-dashed border-teal-200 lg:block" />
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:border-teal-100 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 font-display text-lg font-extrabold text-white shadow-lg shadow-teal-900/15">
                  {index + 1}
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-24 bg-[#f8f7f2] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-teal-600">
              Pricing
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Two workspaces. Both free.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              Pick the role that fits how you use ExpenseTracker. You can always create
              another account.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl p-7 transition-all duration-300 ${
                  plan.highlighted
                    ? "border-2 border-teal-500 bg-white shadow-2xl shadow-teal-600/10 md:-translate-y-2"
                    : "border border-slate-200 bg-white shadow-sm hover:shadow-lg"
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-600 px-3 py-1 text-[9.5px] font-bold uppercase tracking-wider text-white shadow-lg">
                    Most complete
                  </span>
                )}
                <h3 className="font-display text-lg font-bold text-slate-900">
                  {plan.name}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {plan.description}
                </p>
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-extrabold text-slate-950">
                    Free
                  </span>
                  <span className="text-xs font-medium text-slate-400">forever</span>
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-[13px] text-slate-600">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <Check size={10} strokeWidth={3} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.to}
                  className={`mt-7 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition ${
                    plan.highlighted
                      ? "btn-primary"
                      : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {plan.cta}
                  <ChevronRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-teal-600">
              FAQ
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Questions, answered
            </h2>
          </div>

          <div className="mt-10 space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-teal-200 open:border-teal-200 open:shadow-md"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-slate-800 [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-open:rotate-90 group-open:bg-teal-50 group-open:text-teal-600">
                    <ChevronRight size={14} />
                  </span>
                </summary>
                <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-slate-500">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-[#102a25] px-6 py-16 text-white shadow-2xl shadow-teal-950/30 sm:px-12 lg:px-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-16 -top-24 h-80 w-80 rounded-full bg-teal-500/30 blur-3xl" />
            <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-amber-500/25 blur-3xl" />
            <div className="absolute inset-0 bg-grid opacity-25" />
          </div>

          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300">
                <Sparkles size={14} />
                Start today
              </div>
              <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                Your money story deserves a clearer view.
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300">
                Create your free workspace in under a minute and add your first
                transaction today.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <Link
                to="/signup?role=user"
                className="btn btn-lg bg-white text-slate-900 hover:bg-teal-50"
              >
                Create free account
                <ArrowUpRight size={18} />
              </Link>
              <Link
                to="/login"
                className="btn btn-lg border border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12]"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-slate-50/80">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Logo />
              <p className="mt-4 max-w-xs text-[12.5px] leading-relaxed text-slate-500">
                A secure, focused workspace for tracking expenses, income, budgets and
                financial reports.
              </p>
              <div className="mt-4 flex items-center gap-2 text-[10.5px] font-semibold text-slate-400">
                <ShieldCheck size={14} className="text-emerald-500" />
                JWT-protected sessions
              </div>
            </div>

            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Product
              </p>
              <div className="mt-4 space-y-2.5 text-[12.5px] text-slate-500">
                <a href="#features" className="block transition hover:text-teal-600">
                  Features
                </a>
                <a href="#how-it-works" className="block transition hover:text-teal-600">
                  How it works
                </a>
                <a href="#pricing" className="block transition hover:text-teal-600">
                  Pricing
                </a>
                <a href="#faq" className="block transition hover:text-teal-600">
                  FAQ
                </a>
              </div>
            </div>

            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Account
              </p>
              <div className="mt-4 space-y-2.5 text-[12.5px] text-slate-500">
                <Link to="/login" className="block transition hover:text-teal-600">
                  Log in
                </Link>
                <Link to="/signup?role=user" className="block transition hover:text-teal-600">
                  Create account
                </Link>
                <Link to="/signup?role=admin" className="block transition hover:text-teal-600">
                  Admin workspace
                </Link>
              </div>
            </div>

            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Security
              </p>
              <div className="mt-4 space-y-2.5 text-[12.5px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Lock size={12} className="text-slate-400" />
                  Encrypted credentials
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-slate-400" />
                  Role-based access
                </span>
                <span className="flex items-center gap-1.5">
                  <CircleCheck size={12} className="text-slate-400" />
                  Session rotation
                </span>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 text-[11px] text-slate-400 sm:flex-row">
            <p>© {new Date().getFullYear()} ExpenseTracker. All rights reserved.</p>
            <p>Built for clarity, designed for everyday life.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
