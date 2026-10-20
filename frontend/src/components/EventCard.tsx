import { useState } from "react";
import { formatDate, imageFor } from "../format";
import type { EventDto } from "../services/events";
import { Icon } from "./Icon";
import { SeatsBadge } from "./ui";

export function EventCard({ event, onSelect }: { event: EventDto; onSelect: () => void }) {
  const [imageError, setImageError] = useState(false);
  const date = formatDate(event.startsAt);
  const image = imageFor(event.id);
  return (
    <article className="group grid overflow-hidden rounded-lg border border-[#dccfba] bg-[#fbf7ef] transition duration-500 hover:-translate-y-1 hover:border-[#bfa88b] hover:shadow-[0_24px_60px_rgba(27,31,27,0.08)] md:grid-cols-[0.88fr_1.12fr]">
      <button aria-label={`Read more about ${event.title}`} className="relative min-h-64 overflow-hidden bg-[#e6d9c4] text-left md:min-h-full" onClick={onSelect}>
        {imageError ? (
          <span className="flex h-full min-h-64 items-center justify-center text-sm text-[#7b6858]">Image could not be loaded</span>
        ) : (
          <img alt={image.alt} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" onError={() => setImageError(true)} src={image.src} />
        )}
        <SeatsBadge className="absolute left-5 top-5" event={event} />
      </button>
      <div className="flex flex-col p-6 sm:p-7">
        <div className="mb-8 flex items-start gap-5">
          <div className="w-12 shrink-0 border-t border-[#b59d82] pt-2 text-center">
            <div className="text-[1.65rem] font-semibold leading-none tracking-[-0.04em] text-[#3b2a20]">{date.day}</div>
            <div className="mt-1 text-[0.65rem] font-bold tracking-[0.18em] text-[#8b5e3c]">{date.month}</div>
          </div>
          <div className="min-w-0">
            <h2 className="font-display break-words text-[2rem] leading-[1.02] tracking-[-0.025em] text-[#3b2a20]">{event.title}</h2>
            {event.description && <p className="mt-3 line-clamp-3 leading-relaxed text-[#7b6858]">{event.description}</p>}
          </div>
        </div>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-5 border-t border-[#e8dcc8] pt-5">
          <div className="space-y-2 text-sm text-[#6e5c4d]">
            <div className="flex items-center gap-2"><Icon name="calendar" size={17} />{date.time}</div>
            {event.location && <div className="flex items-center gap-2"><Icon name="location" size={17} />{event.location}</div>}
          </div>
          <button className="inline-flex items-center gap-2 border-b border-[#3b2a20] pb-1 text-sm font-semibold text-[#3b2a20] transition hover:border-[#7a5c45] hover:text-[#7a5c45] focus:outline-none focus:ring-2 focus:ring-[#7a5c45] focus:ring-offset-4" onClick={onSelect}>
            Read more <Icon name="arrow" size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}
