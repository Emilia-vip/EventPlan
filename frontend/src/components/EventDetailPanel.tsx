import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../errors";
import { formatDate, imageFor } from "../format";
import { buyTicket } from "../services/events";
import type { EventDto } from "../services/events";
import type { AuthMode } from "./AuthPanel";
import { Icon } from "./Icon";
import { CloseButton, FormError, Overlay, SeatsBadge } from "./ui";

type Props = {
  event: EventDto;
  onClose: () => void;
  onRegistered: (id: string) => void;
  onRequestAuth: (mode: AuthMode) => void;
};

export function EventDetailPanel({ event, onClose, onRegistered, onRequestAuth }: Props) {
  const { user } = useAuth();
  const [gotTicket, setGotTicket] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const date = formatDate(event.startsAt);
  const image = imageFor(event.id);
  const full = event.isFull && !gotTicket;

  async function getTicket() {
    setError("");
    setSubmitting(true);
    try {
      await buyTicket(event.id);
      setGotTicket(true);
      onRegistered(event.id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div className="relative h-72 sm:h-96">
        <img alt={image.alt} className="h-full w-full object-cover" src={image.src} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2a1d15]/70 via-transparent to-transparent" />
        <CloseButton floating onClose={onClose} />
        <SeatsBadge className="absolute bottom-6 left-6" event={event} />
      </div>

      <div className="p-6 sm:p-10">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-[#7a5c45]">{date.long}</p>
        <h2 className="font-display break-words text-5xl leading-[0.98] tracking-[-0.035em] text-[#3b2a20] sm:text-6xl">{event.title}</h2>
        <div className="my-8 grid gap-4 border-y border-[#d8c9b2] py-5 sm:grid-cols-2">
          <div className="flex gap-3 text-sm text-[#6e5c4d]"><Icon name="calendar" /><span><strong className="block text-[#3b2a20]">Time</strong>{date.time}</span></div>
          {event.location && <div className="flex gap-3 text-sm text-[#6e5c4d]"><Icon name="location" /><span><strong className="block text-[#3b2a20]">Location</strong>{event.location}</span></div>}
        </div>
        {event.description && <p className="whitespace-pre-line text-lg leading-relaxed text-[#6e5c4d]">{event.description}</p>}
        <div className="mt-6 flex items-center gap-2 text-sm text-[#8a7767]"><Icon name="people" size={19} /> {event.seatsTaken} of {event.capacity} spots booked</div>

        <div className="my-10 h-px bg-[#dccfba]" />

        {gotTicket ? (
          <div className="rounded-lg bg-[#3b2a20] p-8 text-white sm:p-10">
            <div className="mb-6 grid size-12 place-items-center rounded-full bg-[#e6d8c3] text-[#3b2a20]"><Icon name="check" /></div>
            <h3 className="font-display text-4xl">You've got a ticket!</h3>
            <p className="mt-3 max-w-md leading-relaxed text-white/70">Your spot is booked. See you on {date.long} at {date.time}. You can find the ticket under My tickets.</p>
            <button className="mt-7 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#3b2a20] transition hover:bg-[#e6d8c3]" onClick={onClose}>Back to all events</button>
          </div>
        ) : full ? (
          <div className="rounded-lg border border-[#d7a69b] bg-[#f8e2dc] p-8 text-center">
            <h3 className="font-display text-3xl text-[#762f22]">This event is sold out</h3>
            <p className="mt-2 text-[#8e4b3e]">Unfortunately all spots are taken. Have a look at our other events.</p>
          </div>
        ) : !user ? (
          <div>
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#7a5c45]"><Icon name="spark" size={17} /> Free ticket</span>
            <h3 className="font-display text-4xl text-[#3b2a20]">Log in to get your ticket</h3>
            <p className="mt-2 text-[#8a7767]">You can browse events without an account. To get a ticket, log in or create a free account.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="flex items-center justify-center gap-2 rounded-full bg-[#7a5c45] px-6 py-4 font-semibold text-white transition hover:bg-[#5e4634]" onClick={() => onRequestAuth("login")}>
                Log in <Icon name="arrow" size={18} />
              </button>
              <button className="rounded-full border border-[#7a5c45] px-6 py-4 font-semibold text-[#7a5c45] transition hover:bg-white" onClick={() => onRequestAuth("signup")}>
                Create account
              </button>
            </div>
          </div>
        ) : (
          <div>
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#7a5c45]"><Icon name="spark" size={17} /> Free ticket</span>
            <h3 className="font-display text-4xl text-[#3b2a20]">Get your ticket</h3>
            <p className="mt-2 text-[#8a7767]">Booking as {user.name} ({user.email}).</p>
            {error && <div className="mt-6"><FormError message={error} /></div>}
            <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#7a5c45] px-6 py-4 font-semibold text-white transition hover:bg-[#5e4634] disabled:cursor-wait disabled:opacity-70" disabled={submitting} onClick={() => void getTicket()}>
              {submitting ? "Booking…" : "Get ticket"} {!submitting && <Icon name="arrow" size={18} />}
            </button>
          </div>
        )}
      </div>
    </Overlay>
  );
}
