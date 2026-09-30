import {
  AlertCircle,
  ArrowUpRight,
  ChevronRight,
  Inbox,
  RotateCcw,
  X,
} from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { initials } from "../lib/store";
export function Avatar({
  name,
  size = "normal",
}: {
  name: string;
  size?: string;
}) {
  return <span className={`avatar ${size}`}>{initials(name)}</span>;
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Score({ value }: { value: number }) {
  return (
    <span className="score">
      <span className="score-track">
        <i style={{ width: `${value}%` }} />
      </span>
      <b>{value}</b>
      <span className="sr-only"> out of 100</span>
    </span>
  );
}
export function Panel({
  title,
  eyebrow,
  action,
  children,
  className = "",
}: {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-head">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2>{title}</h2>
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Empty({
  title = "Nothing here just yet",
  text = "Your next activity will appear here.",
  action,
}: {
  title?: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span>
        <Inbox size={24} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div className="empty error">
      <AlertCircle />
      <h2>We couldn’t load this workspace</h2>
      <p>{message} Your browser’s saved data may be unavailable.</p>
      <button className="btn" onClick={retry}>
        <RotateCcw size={15} />
        Try again
      </button>
    </div>
  );
}
export function Skeleton({ profile = false }: { profile?: boolean }) {
  return (
    <div
      className="skeleton-view"
      aria-busy="true"
      aria-label={profile ? "Loading customer profile" : "Loading workspace"}
    >
      <div className="skeleton title" />
      <div className="skeleton-grid">
        {[1, 2, 3, 4].map((i) => (
          <div className="skeleton card" key={i} />
        ))}
      </div>
      <div className="skeleton chart" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div className="skeleton row" key={i} />
      ))}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
      }
      if (e.key === "Tab") {
        const nodes = ref.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a[href],input,select,textarea,[tabindex="0"]',
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    ref.current?.addEventListener("keydown", listener);
    const node = ref.current;
    return () => {
      node?.removeEventListener("keydown", listener);
      document.body.style.overflow = before;
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`modal ${wide ? "drawer" : ""}`}
      >
        <header className="modal-head">
          <div>
            <span className="eyebrow">FIZZI WORKSPACE</span>
            <h2>{title}</h2>
          </div>
          <button
            className="icon-btn"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
export function Metric({
  label,
  value,
  change,
  children,
  featured = false,
}: {
  label: string;
  value: string;
  change?: string;
  children?: ReactNode;
  featured?: boolean;
}) {
  return (
    <div className={`metric ${featured ? "featured" : ""}`}>
      <div className="metric-label">
        {label}
        <ArrowUpRight size={15} />
      </div>
      <strong>{value}</strong>
      <div className="metric-foot">
        {change && <span>{change}</span>}
        {children}
      </div>
    </div>
  );
}
export function TextLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="text-link" onClick={onClick}>
      {children}
      <ChevronRight size={15} />
    </button>
  );
}
export function Can({
  tone = "#008DDA",
  small = false,
  name = "Yuzu Citrus",
  image,
}: {
  tone?: string;
  small?: boolean;
  name?: string;
  image?: string;
}) {
  if (image)
    return (
      <img
        className={small ? "product-thumb" : "product-image"}
        src={image}
        alt={name}
      />
    );
  return (
    <div
      role="img"
      aria-label={`${name} beverage can`}
      className={`can ${small ? "small" : ""}`}
      style={{ "--can-color": tone } as React.CSSProperties}
    >
      <span className="can-top" />
      <div className="can-label">
        <b>
          fizzi<span>®</span>
        </b>
        <small>
          GOOD TASTE.
          <br />
          GREAT FEELING.
        </small>
        <em>{name}</em>
        <i>SPARKLING FRUIT JUICE</i>
      </div>
      <span className="can-bottom" />
    </div>
  );
}
