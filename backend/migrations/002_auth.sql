CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role          text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- En biljett kopplas till det inloggade kontot
ALTER TABLE registrations
  ADD COLUMN user_id uuid REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX registrations_user_id_idx ON registrations (user_id);
