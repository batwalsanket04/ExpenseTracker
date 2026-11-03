import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Compass, LayoutDashboard } from "lucide-react";
import { Logo } from "../../components/ui";
import { useAuth } from "../../Context/storeContext";

const FallBack = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f6f5f0] px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-teal-50 to-transparent" />
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />
      </div>

      <div className="relative w-full max-w-lg text-center">
        <div className="flex justify-center">
          <Link to="/" aria-label="ExpenseTracker home">
            <Logo />
          </Link>
        </div>

        <div className="relative mx-auto mt-10 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-teal-500/15 to-amber-500/15 ring-1 ring-teal-100" />
          <Compass size={40} className="relative text-teal-500" strokeWidth={1.6} />
          <span className="absolute -right-1 -top-1 rounded-full bg-white px-2 py-1 text-[9px] font-bold text-teal-600 shadow-sm ring-1 ring-teal-100">
            404
          </span>
        </div>

        <p className="mt-8 font-display text-[86px] font-extrabold leading-none tracking-tighter gradient-text sm:text-[104px]">
          404
        </p>
        <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-slate-950">
          This page is off the map
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
          The page you're looking for doesn't exist, was moved, or the address may be
          incorrect.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to={isAuthenticated ? "/dashboard" : "/"}
            className="btn btn-primary"
          >
            {isAuthenticated ? (
              <>
                <LayoutDashboard size={16} />
                Go to dashboard
              </>
            ) : (
              <>
                <ArrowLeft size={16} />
                Back to home
              </>
            )}
          </Link>
          <Link to="/login" className="btn btn-secondary">
            Sign in
          </Link>
        </div>

        <p className="mt-8 text-[10.5px] text-slate-400">
          If you believe this is a mistake, try returning to the dashboard and navigating
          from the sidebar.
        </p>
      </div>
    </div>
  );
};

export default FallBack;
