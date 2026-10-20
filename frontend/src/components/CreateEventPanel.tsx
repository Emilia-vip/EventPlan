import { useState } from "react";
import type { FormEvent } from "react";
import { errorMessage } from "../errors";
import { createEvent } from "../services/events";
import type { EventDto } from "../services/events";
import { createEventSchema, parseForm } from "../validation";
import { Icon } from "./Icon";
import { CloseButton, FormError, Overlay, inputClass } from "./ui";

type Props = {
  onClose: () => void;
  onCreated: (event: EventDto) => void;
};

export function CreateEventPanel({ onClose, onCreated }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const parsed = parseForm(createEventSchema, new FormData(e.currentTarget));
    if (!parsed.ok) {
      setFormError(parsed.message);
      return;
    }
    setSubmitting(true);
    try {
      onCreated(await createEvent(parsed.data));
    } catch (err) {
      setFormError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div className="p-6 sm:p-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#7a5c45]">New event</span>
            <h2 className="font-display text-5xl leading-[0.98] tracking-[-0.035em] text-[#3b2a20]">Create event</h2>
          </div>
          <CloseButton onClose={onClose} />
        </div>
        <form className="space-y-4" noValidate onSubmit={submit}>
          <label className="block text-sm font-semibold text-[#4d3b2e]">Title
            <input className={inputClass} maxLength={200} name="title" placeholder="What's your event called?" type="text" />
          </label>
          <label className="block text-sm font-semibold text-[#4d3b2e]">Location
            <input className={inputClass} maxLength={200} name="location" placeholder="e.g. Main Square, Stockholm" type="text" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-[#4d3b2e]">Date and time
              <input className={inputClass} name="startsAt" type="datetime-local" />
            </label>
            <label className="block text-sm font-semibold text-[#4d3b2e]">Number of spots
              <input className={inputClass} max={100000} min={1} name="capacity" placeholder="30" type="number" />
            </label>
          </div>
          <label className="block text-sm font-semibold text-[#4d3b2e]">Description
            <textarea className={`${inputClass} resize-none`} maxLength={5000} name="description" placeholder="Tell us what's happening…" rows={4} />
          </label>
          {formError && <FormError message={formError} />}
          <button className="flex w-full items-center justify-center gap-2 rounded-full bg-[#7a5c45] px-6 py-4 font-semibold text-white transition hover:bg-[#5e4634] disabled:cursor-wait disabled:opacity-70" disabled={submitting} type="submit">
            {submitting ? "Creating…" : "Create event"} {!submitting && <Icon name="arrow" size={18} />}
          </button>
        </form>
      </div>
    </Overlay>
  );
}
