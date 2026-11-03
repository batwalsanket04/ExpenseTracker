/* eslint-disable react-refresh/only-export-components */
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2, Search, Wallet, X } from "lucide-react";

export const cn = (...classes) => classes.filter(Boolean).join(" ");

/* ------------------------------------------------------------------ */
/*  Brand                                                              */
/* ------------------------------------------------------------------ */
export const Logo = ({ light = false, compact = false, className = "" }) => (
  <div className={cn("flex items-center gap-2.5", className)}>
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] text-white shadow-lg shadow-teal-900/15",
        light ? "bg-teal-500" : "bg-teal-700"
      )}
    >
      <Wallet size={19} strokeWidth={2.3} />
      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-amber-400" />
    </div>
    {!compact && (
      <div className="leading-tight">
        <p
          className={cn(
            "font-display text-[17px] font-extrabold tracking-tight",
            light ? "text-white" : "text-slate-900"
          )}
        >
          Expense<span className={light ? "text-teal-200" : "text-teal-700"}>Tracker</span>
        </p>
        <p
          className={cn(
            "mt-0.5 text-[8.5px] font-semibold uppercase tracking-[0.24em]",
            light ? "text-teal-100/60" : "text-slate-400"
          )}
        >
          Finance workspace
        </p>
      </div>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Buttons & badges                                                   */
/* ------------------------------------------------------------------ */
const BUTTON_VARIANTS = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
  "danger-solid": "btn-danger-solid",
};

const BUTTON_SIZES = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

export const Button = ({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}) => (
  <button
    className={cn(
      "btn",
      BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary,
      BUTTON_SIZES[size] || BUTTON_SIZES.md,
      className
    )}
    {...props}
  >
    {children}
  </button>
);

const TONES = {
  indigo: {
    icon: "bg-teal-50 text-teal-600 ring-teal-100",
    chip: "bg-teal-50 text-teal-700 ring-1 ring-teal-100",
    bar: "bg-teal-500",
  },
  violet: {
    icon: "bg-amber-50 text-amber-600 ring-amber-100",
    chip: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    bar: "bg-amber-500",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    chip: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    bar: "bg-emerald-500",
  },
  rose: {
    icon: "bg-rose-50 text-rose-600 ring-rose-100",
    chip: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
    bar: "bg-rose-500",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600 ring-amber-100",
    chip: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    bar: "bg-amber-500",
  },
  sky: {
    icon: "bg-sky-50 text-sky-600 ring-sky-100",
    chip: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
    bar: "bg-sky-500",
  },
  slate: {
    icon: "bg-slate-100 text-slate-600 ring-slate-200",
    chip: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    bar: "bg-slate-500",
  },
};

export const Badge = ({ tone = "indigo", className, children }) => (
  <span className={cn("badge", TONES[tone]?.chip || TONES.indigo.chip, className)}>
    {children}
  </span>
);

/* ------------------------------------------------------------------ */
/*  Avatar                                                             */
/* ------------------------------------------------------------------ */
const AVATAR_GRADIENTS = [
  "from-teal-600 to-teal-800",
  "from-sky-500 to-teal-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
];

const AVATAR_SIZES = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-10 w-10 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-16 w-16 text-lg",
};

export const Avatar = ({ name = "User", size = "md", className }) => {
  const label = String(name || "User").trim() || "User";
  const initials =
    label.split(/\s+/).length > 1
      ? `${label.split(/\s+/)[0][0]}${label.split(/\s+/).slice(-1)[0][0]}`
      : label.slice(0, 2);
  const hash = [...label].reduce((total, char) => total + char.charCodeAt(0), 0);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold uppercase tracking-wide text-white shadow-sm ring-2 ring-white",
        AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length],
        AVATAR_SIZES[size] || AVATAR_SIZES.md,
        className
      )}
      aria-hidden="true"
    >
      {initials.toUpperCase()}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Page header                                                        */
/* ------------------------------------------------------------------ */
export const PageHeader = ({ eyebrow, title, subtitle, actions, className }) => (
  <div
    className={cn(
      "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
      className
    )}
  >
    <div className="min-w-0">
      {eyebrow && (
        <span className="badge bg-teal-50 text-teal-700 ring-1 ring-teal-100">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
          {eyebrow}
        </span>
      )}
      <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
          {subtitle}
        </p>
      )}
    </div>
    {actions && (
      <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
        {actions}
      </div>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */
export const StatCard = ({
  label,
  value,
  icon: Icon,
  tone = "indigo",
  hint,
  className,
}) => {
  const theme = TONES[tone] || TONES.indigo;

  return (
    <div
      className={cn(
        "surface surface-hover group relative overflow-hidden p-5",
        className
      )}
    >
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 truncate font-display text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
              theme.icon
            )}
          >
            <Icon size={20} strokeWidth={2.2} />
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Progress bar                                                       */
/* ------------------------------------------------------------------ */
export const ProgressBar = ({ value = 0, tone = "indigo", className }) => {
  const clamped = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700 ease-out",
          TONES[tone]?.bar || TONES.indigo.bar
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Empty / loading states                                             */
/* ------------------------------------------------------------------ */
export const EmptyState = ({ icon: Icon, title, description, action, className }) => (
  <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
    {Icon && (
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
        <Icon size={24} strokeWidth={1.8} />
      </div>
    )}
    <h3 className="font-display text-base font-bold text-slate-800">{title}</h3>
    {description && (
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const Spinner = ({ className, size = 18 }) => (
  <Loader2
    size={size}
    className={cn("animate-spin", className)}
    aria-label="Loading"
  />
);

export const PageLoader = ({ label = "Loading your workspace…" }) => (
  <div className="flex min-h-[420px] flex-col items-center justify-center gap-3">
    <div className="relative flex h-14 w-14 items-center justify-center">
      <div className="absolute inset-0 rounded-2xl bg-teal-100/80" />
      <Loader2 size={24} className="relative animate-spin text-teal-600" />
    </div>
    <p className="text-sm font-medium text-slate-500">{label}</p>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Search input                                                       */
/* ------------------------------------------------------------------ */
export const SearchInput = ({
  value,
  onChange,
  placeholder = "Search…",
  className,
}) => (
  <div className={cn("relative", className)}>
    <Search
      size={17}
      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
    />
    <input
      type="search"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="field field-icon h-[42px] py-0"
    />
  </div>
);

/* ------------------------------------------------------------------ */
/*  Modal                                                              */
/* ------------------------------------------------------------------ */
const MODAL_SIZES = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  size = "md",
}) => {
  useEffect(() => {
    if (!open) return undefined;

    const handleKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="animate-fade-in absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "Dialog"}
        className={cn(
          "animate-fade-up relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-slate-900/5 sm:rounded-3xl",
          MODAL_SIZES[size] || MODAL_SIZES.md
        )}
      >
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6 sm:py-5">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-teal-100">
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-base font-bold text-slate-900 sm:text-lg">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost -mr-1 h-9 w-9 shrink-0 rounded-full p-0"
            aria-label="Close dialog"
          >
            <X size={17} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

/* ------------------------------------------------------------------ */
/*  Confirm dialog                                                     */
/* ------------------------------------------------------------------ */
export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
}) => (
  <Modal
    open={open}
    onClose={onClose}
    size="sm"
    title={title}
    subtitle={message}
    icon={<AlertTriangle size={19} />}
  >
    <div className="flex gap-2.5">
      <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
        {cancelLabel}
      </Button>
      <Button
        variant={tone === "danger" ? "danger-solid" : "primary"}
        className="flex-1"
        onClick={onConfirm}
        disabled={loading}
      >
        {loading && <Spinner size={15} />}
        {confirmLabel}
      </Button>
    </div>
  </Modal>
);

/* ------------------------------------------------------------------ */
/*  Misc                                                               */
/* ------------------------------------------------------------------ */
export const SectionTitle = ({ icon: Icon, title, subtitle, action, className }) => (
  <div className={cn("flex items-start justify-between gap-3", className)}>
    <div className="flex items-center gap-2.5">
      {Icon && (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-100">
          <Icon size={17} />
        </div>
      )}
      <div>
        <h3 className="font-display text-[15px] font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

export const FieldError = ({ children }) =>
  children ? (
    <p className="mt-1.5 text-xs font-medium text-rose-600">{children}</p>
  ) : null;
