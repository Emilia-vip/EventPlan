import { request } from "../http";
import type { CreateEventInput } from "../validation";

export interface EventDto {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  capacity: number;
  seatsTaken: number;
  seatsLeft: number;
  isFull: boolean;
}

export interface TicketDto {
  id: string;
  createdAt: string;
  event: EventDto;
}

export const listEvents = () => request<EventDto[]>("/events");

export const getEvent = (id: string) => request<EventDto>(`/events/${id}`);

/** Admin only (the backend checks the role). */
export const createEvent = (input: CreateEventInput) =>
  request<EventDto>("/events", { method: "POST", body: JSON.stringify(input) });

/** Requires login. The ticket is booked for the logged-in account. */
export const buyTicket = (eventId: string) =>
  request<{ id: string; eventId: string; name: string; email: string }>(`/events/${eventId}/registrations`, {
    method: "POST",
  });

/** The logged-in user's tickets. */
export const listMyTickets = () => request<TicketDto[]>("/me/tickets");

/** The event as it looks after one more ticket (same math as the backend's DTO). */
export function withRegistration(event: EventDto): EventDto {
  const seatsTaken = event.seatsTaken + 1;
  const seatsLeft = Math.max(0, event.capacity - seatsTaken);
  return { ...event, seatsTaken, seatsLeft, isFull: seatsLeft === 0 };
}


export function insertByStart(events: EventDto[], event: EventDto): EventDto[] {
  return [...events, event].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
