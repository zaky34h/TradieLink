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

CREATE INDEX IF NOT EXISTS idx_chat_threads_builder_id ON chat_threads(builder_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_tradie_id ON chat_threads(tradie_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id_created_at ON chat_messages(thread_id, created_at);
