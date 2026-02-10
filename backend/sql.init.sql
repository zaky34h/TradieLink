CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('builder', 'tradie')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  about TEXT NOT NULL,
  company_name TEXT,
  address TEXT,
  occupation TEXT,
  price_per_hour NUMERIC,
  experience_years INTEGER,
  certifications TEXT[] DEFAULT '{}',
  photo_url TEXT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
