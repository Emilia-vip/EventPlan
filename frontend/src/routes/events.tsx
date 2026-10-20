import { useCallback, useEffect, useState } from "react";
import type { AuthMode } from "../components/AuthPanel";
import { CreateEventPanel } from "../components/CreateEventPanel";
import { EventCard } from "../components/EventCard";
import { EventDetailPanel } from "../components/EventDetailPanel";
import { LoadingState } from "../components/ui";
import { errorMessage } from "../errors";
import { insertByStart, listEvents, withRegistration } from "../services/events";
import type { EventDto } from "../services/events";

type Props = {
  /** Only admins can create events. */
  canCreate: boolean;
  creating: boolean;
  onCreate: () => void;
  onCloseCreate: () => void;
  onRequestAuth: (mode: AuthMode) => void;
};

export function EventsRoute({ canCreate, creating, onCreate, onCloseCreate, onRequestAuth }: Props) {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setEvents(await listEvents());
    } catch (err) {
      setLoadError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = events.find((e) => e.id === selectedId) ?? null;
  const closeSelected = useCallback(() => setSelectedId(null), []);

  function handleRegistered(id: string) {
    setEvents((prev) => prev.map((e) => (e.id === id ? withRegistration(e) : e)));
  }

  function handleCreated(created: EventDto) {
    setEvents((prev) => insertByStart(prev, created));
    onCloseCreate();
    setSelectedId(created.id);
  }

  return (
    <>
      <section className="min-h-[24rem] border-t border-[#d8c9b2] bg-[#ebe0cf] py-16 sm:py-24" id="events">
        <div className="mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12">
          <div className="mb-9 flex items-end justify-between gap-5">
            <div><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#8b5e3c]">Coming up</p><h2 className="font-display text-4xl tracking-[-0.03em] sm:text-5xl">Upcoming events</h2></div>
            {!loading && !loadError && <p className="hidden text-sm text-[#8a7767] sm:block">{events.length} curated experiences</p>}
          </div>
          {loading ? <LoadingState /> : loadError ? (
            <div className="rounded-3xl border border-[#d7a69b] bg-[#f8e2dc] p-8 text-center">
              <h3 className="font-display text-2xl text-[#762f22]">Something went wrong</h3>
              <p className="mx-auto mt-2 max-w-md text-[#8e4b3e]">We couldn't load the events right now. {loadError}</p>
              <button className="mt-5 rounded-full bg-[#762f22] px-5 py-3 text-sm font-semibold text-white" onClick={() => void load()}>Try again</button>
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#bfa88b] p-12 text-center">
              <h3 className="font-display text-3xl">No events yet</h3>
              {canCreate ? (
                <>
                  <p className="mx-auto mt-2 max-w-md text-[#8a7767]">There are no upcoming events right now. Be the first to create one!</p>
                  <button className="mt-5 rounded-full bg-[#3b2a20] px-5 py-3 text-sm font-semibold text-white" onClick={onCreate}>Create event</button>
                </>
              ) : (
                <p className="mx-auto mt-2 max-w-md text-[#8a7767]">There are no upcoming events right now. Check back soon!</p>
              )}
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {events.map((event) => <EventCard event={event} key={event.id} onSelect={() => setSelectedId(event.id)} />)}
            </div>
          )}
        </div>
      </section>

      {selected && <EventDetailPanel event={selected} onClose={closeSelected} onRegistered={handleRegistered} onRequestAuth={onRequestAuth} />}
      {canCreate && creating && <CreateEventPanel onClose={onCloseCreate} onCreated={handleCreated} />}
    </>
  );
}
