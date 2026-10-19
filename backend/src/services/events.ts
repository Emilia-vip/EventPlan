import { pool } from "../db.js";
import { AppError, notFound } from "../errors.js";
import type { CreateEventInput, RegistrationInput } from "../validation.js";

export interface EventRow {
  id: string;
  title: string;
  description: string;
  location: string;
  starts_at: Date;
  capacity: number;
  seats_taken: number;
}

export function toEventDto(row: EventRow) {
  const seatsLeft = Math.max(0, row.capacity - row.seats_taken);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    startsAt: row.starts_at.toISOString(),
    capacity: row.capacity,
    seatsTaken: row.seats_taken,
    seatsLeft,
    isFull: seatsLeft === 0,
  };
}

const PG_UNIQUE_VIOLATION = "23505";

export async function listEvents() {
  const { rows } = await pool.query<EventRow>(
    "SELECT * FROM events WHERE starts_at > now() ORDER BY starts_at LIMIT 200",
  );
  return rows.map(toEventDto);
}

export async function getEvent(id: string) {
  const { rows } = await pool.query<EventRow>("SELECT * FROM events WHERE id = $1", [id]);
  if (!rows[0]) throw notFound("Eventet");
  return toEventDto(rows[0]);
}

export async function createEvent(input: CreateEventInput) {
  const { rows } = await pool.query<EventRow>(
    `INSERT INTO events (title, description, location, starts_at, capacity)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [input.title, input.description, input.location, input.startsAt, input.capacity],
  );
  return toEventDto(rows[0]!);
}

export async function register(eventId: string, input: RegistrationInput) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const taken = await client.query(
      `UPDATE events SET seats_taken = seats_taken + 1
       WHERE id = $1 AND seats_taken < capacity
       RETURNING id`,
      [eventId],
    );
    if (taken.rowCount === 0) {
      const exists = await client.query("SELECT 1 FROM events WHERE id = $1", [eventId]);
      throw exists.rowCount
        ? new AppError(409, "EVENT_FULL", "Eventet är fullbokat")
        : notFound("Eventet");
    }

    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO registrations (event_id, name, email) VALUES ($1, $2, $3) RETURNING id`,
      [eventId, input.name, input.email],
    );

    await client.query("COMMIT");
    return { id: rows[0]!.id, eventId, name: input.name, email: input.email };
  } catch (err) {
    await client.query("ROLLBACK");
    if ((err as { code?: string }).code === PG_UNIQUE_VIOLATION) {
      throw new AppError(409, "ALREADY_REGISTERED", "Den här e-postadressen är redan anmäld");
    }
    throw err;
  } finally {
    client.release();
  }
}