-- Run once against PostgreSQL before deploying with TYPEORM_SYNCHRONIZE=false.
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id varchar(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_hash varchar(128);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_unique
  ON users (google_id) WHERE google_id IS NOT NULL;
-- Keep the oldest phone record and clear duplicate legacy values before enforcing uniqueness.
WITH ranked_phones AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at ASC, id ASC) AS row_number
  FROM users
  WHERE phone IS NOT NULL
)
UPDATE users
SET phone = NULL
WHERE id IN (SELECT id FROM ranked_phones WHERE row_number > 1);
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique
  ON users (phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique
  ON users (lower(email));

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_date date;
UPDATE bookings SET booking_date = date WHERE booking_date IS NULL AND date IS NOT NULL;
UPDATE bookings SET date = booking_date WHERE date IS NULL AND booking_date IS NOT NULL;
UPDATE bookings AS b SET user_id = u.id
  FROM users AS u
  WHERE b.user_id IS NULL AND lower(b.email) = lower(u.email);
ALTER TABLE bookings ALTER COLUMN user_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON bookings (user_id);
DROP INDEX IF EXISTS bookings_date_time_unique;
CREATE UNIQUE INDEX IF NOT EXISTS bookings_date_time_active_unique
  ON bookings (date, time)
  WHERE date IS NOT NULL AND status IN ('pending', 'confirmed');
