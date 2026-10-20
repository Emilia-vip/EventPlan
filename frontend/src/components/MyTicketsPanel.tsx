import { useEffect, useState } from "react";
import { errorMessage } from "../errors";
import { formatDate } from "../format";
import { listMyTickets } from "../services/events";
import type { TicketDto } from "../services/events";
import { Icon } from "./Icon";
import { CloseButton, FormError, Overlay } from "./ui";

export function MyTicketsPanel({ onClose }: { onClose: () => void }) {
  const [tickets, setTickets] = useState<TicketDto[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listMyTickets()
      .then((result) => {
        if (!cancelled) setTickets(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Overlay onClose={onClose}>
      <div className="p-6 sm:p-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#7a5c45]">Your bookings</span>
            <h2 className="font-display text-5xl leading-[0.98] tracking-[-0.035em] text-[#3b2a20]">My tickets</h2>
          </div>
          <CloseButton onClose={onClose} />
        </div>

        {error ? (
          <FormError message={error} />
        ) : tickets === null ? (
          <p className="text-[#8a7767]">Loading your tickets…</p>
        ) : tickets.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#bfa88b] p-10 text-center">
            <h3 className="font-display text-3xl text-[#3b2a20]">No tickets yet</h3>
            <p className="mt-2 text-[#8a7767]">When you get a ticket for an event, it shows up here.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {tickets.map((ticket) => {
              const date = formatDate(ticket.event.startsAt);
              return (
                <li className="rounded-lg border border-[#dccfba] bg-[#fbf7ef] p-5" key={ticket.id}>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8b5e3c]">{date.long}</p>
                  <h3 className="font-display mt-1 break-words text-3xl leading-tight text-[#3b2a20]">{ticket.event.title}</h3>
                  <div className="mt-3 space-y-1 text-sm text-[#6e5c4d]">
                    <div className="flex items-center gap-2"><Icon name="calendar" size={16} />{date.time}</div>
                    {ticket.event.location && <div className="flex items-center gap-2"><Icon name="location" size={16} />{ticket.event.location}</div>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Overlay>
  );
}
