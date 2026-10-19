CREATE TABLE events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text NOT NULL DEFAULT '',
  location    text NOT NULL DEFAULT '',
  starts_at   timestamptz NOT NULL,
  capacity    integer NOT NULL CHECK (capacity > 0),
  seats_taken integer NOT NULL DEFAULT 0
              CHECK (seats_taken >= 0 AND seats_taken <= capacity),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE registrations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name       text NOT NULL,
  email      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, email)
);

CREATE INDEX events_starts_at_idx ON events (starts_at);