import { useEffect } from "react";
import type { ReactNode } from "react";
import type { EventDto } from "../services/events";
import { Icon } from "./Icon";

export const inputClass =
  "mt-2 w-full border-x-0 border-b border-t-0 border-[#cbb9a0] bg-transparent px-0 py-3 font-normal outline-none transition placeholder:text-[#ab9a89] focus:border-[#8b5e3c] focus:ring-0";

export function SeatsBadge({ event, className = "" }: { event: EventDto; className?: string }) {
  return (
    <span className={`border border-white/40 bg-[#faf5ea] px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] ${event.isFull ? "text-[#8e3424]" : "text-[#3b2a20]"} ${className}`}>
      {event.isFull ? "Sold out" : `${event.seatsLeft} spots left`}
    </span>
  );
}

// Open panels, in the order they were opened. Esc only closes the top one (e.g. the login
// panel opened on top of an event), and closing it restores the scroll lock of the one below.
const openOverlays: object[] = [];

export function Overlay({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const self = {};
    openOverlays.push(self);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openOverlays[openOverlays.length - 1] === self) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      openOverlays.splice(openOverlays.indexOf(self), 1);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div aria-modal="true" className="fixed inset-0 z-50 bg-[#2a1d15]/60" role="dialog">
      <button aria-label="Close" className="absolute inset-0 h-full w-full cursor-default" onClick={onClose} tabIndex={-1} />
      <div className="absolute inset-y-0 right-0 w-full max-w-2xl overflow-y-auto bg-[#f5efe3] shadow-2xl">{children}</div>
    </div>
  );
}

export function CloseButton({ onClose, floating }: { onClose: () => void; floating?: boolean }) {
  return (
    <button aria-label="Close" className={`grid size-11 place-items-center rounded-full border border-white/50 bg-[#f8f2e6] text-[#3b2a20] shadow-lg transition hover:rotate-6 hover:bg-white ${floating ? "absolute right-5 top-5" : ""}`} onClick={onClose}>
      <Icon name="close" />
    </button>
  );
}

export function FormError({ message }: { message: string }) {
  return <div className="rounded-xl border border-[#d7a69b] bg-[#f8e2dc] px-4 py-3 text-sm text-[#8e3424]" role="alert">{message}</div>;
}

export function LoadingState() {
  return (
    <div aria-label="Loading events" className="grid gap-6 md:grid-cols-2">
      {[0, 1, 2, 3].map((item) => (
        <div className="grid min-h-80 animate-pulse overflow-hidden rounded-lg border border-[#e3d6c0] bg-white md:grid-cols-[0.9fr_1.1fr]" key={item}>
          <div className="bg-[#e6d9c4]" />
          <div className="space-y-5 p-7"><div className="h-4 w-20 rounded bg-[#e8dcc8]" /><div className="h-8 w-4/5 rounded bg-[#dccfba]" /><div className="h-4 w-full rounded bg-[#eee3d0]" /><div className="h-4 w-3/4 rounded bg-[#eee3d0]" /></div>
        </div>
      ))}
    </div>
  );
}
