import type { ReactNode } from "react";

export type IconName = "arrow" | "calendar" | "check" | "close" | "location" | "people" | "spark" | "plus";

const paths: Record<IconName, ReactNode> = {
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  calendar: <><rect width="18" height="16" x="3" y="5" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  close: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
  location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  people: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  spark: <path d="m12 3-1.2 4.2a5.2 5.2 0 0 1-3.6 3.6L3 12l4.2 1.2a5.2 5.2 0 0 1 3.6 3.6L12 21l1.2-4.2a5.2 5.2 0 0 1 3.6-3.6L21 12l-4.2-1.2a5.2 5.2 0 0 1-3.6-3.6Z" />,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      {paths[name]}
    </svg>
  );
}
