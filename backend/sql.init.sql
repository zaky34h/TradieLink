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

CREATE TABLE IF NOT EXISTS chat_threads (
  id SERIAL PRIMARY KEY,
  builder_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tradie_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (builder_id, tradie_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  thread_id INTEGER NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_thread_reads (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  peer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, peer_id)
);

CREATE TABLE IF NOT EXISTS chat_thread_closures (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  peer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, peer_id)
);

CREATE TABLE IF NOT EXISTS chat_typing (
  from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_typing BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (from_user_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_threads_builder_id ON chat_threads(builder_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_tradie_id ON chat_threads(tradie_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id_created_at ON chat_messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_reads_user_peer ON chat_thread_reads(user_id, peer_id);
CREATE INDEX IF NOT EXISTS idx_chat_closures_user_peer ON chat_thread_closures(user_id, peer_id);
CREATE INDEX IF NOT EXISTS idx_chat_typing_pair_updated_at ON chat_typing(from_user_id, to_user_id, updated_at);

CREATE TABLE IF NOT EXISTS builder_jobs (
  id SERIAL PRIMARY KEY,
  builder_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  location TEXT,
  trades_needed TEXT[] NOT NULL DEFAULT '{}',
  details TEXT,
  status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('posted', 'inProgress', 'done')),
  interested_tradies TEXT[] NOT NULL DEFAULT '{}',
  enquiry_tradie_ids INTEGER[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE builder_jobs
  ADD COLUMN IF NOT EXISTS trades_needed TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE builder_jobs
  ADD COLUMN IF NOT EXISTS enquiry_tradie_ids INTEGER[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_builder_jobs_builder_id_status
  ON builder_jobs(builder_id, status, created_at DESC);
