"use client";
import { useId } from "react";

// App logo — a dynamic "swoosh" checkmark in an indigo→violet gradient
// squircle. Self-contained SVG so it scales crisply and needs no wrapper
// styling. useId gives an SSR-stable, collision-free gradient id.
export default function Logo({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  // Sanitize the useId output (contains ":") so it's a valid url(#…) target.
  const gid = `logo${useId().replace(/:/g, "")}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="Simpletodo logo"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="14" fill={`url(#${gid})`} />
      <path
        d="M14 25c3 0 5 1 7.5 4.5C25 22 30 17 37 13.5c-6 5-9.5 11-13 19-2-4-4.5-6.5-10-7.5z"
        fill="#fff"
      />
    </svg>
  );
}
