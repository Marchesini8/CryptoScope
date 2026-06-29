CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  google_id VARCHAR(120) UNIQUE,
  avatar_url TEXT,
  auth_provider VARCHAR(30) NOT NULL DEFAULT 'email',
  newsletter BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(120) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(30) NOT NULL DEFAULT 'email';

CREATE TABLE IF NOT EXISTS favorite_coins (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coin_id VARCHAR(120) NOT NULL,
  coin_name VARCHAR(120) NOT NULL,
  symbol VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, coin_id)
);

CREATE TABLE IF NOT EXISTS portfolio_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coin_id VARCHAR(120) NOT NULL,
  coin_name VARCHAR(120) NOT NULL,
  symbol VARCHAR(30) NOT NULL,
  amount_invested NUMERIC(20,8) NOT NULL,
  coin_price NUMERIC(20,8) NOT NULL,
  quantity NUMERIC(28,12) NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_alerts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coin_id VARCHAR(120) NOT NULL,
  coin_name VARCHAR(120) NOT NULL,
  symbol VARCHAR(30) NOT NULL,
  target_price NUMERIC(20,8) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('above', 'below')),
  status VARCHAR(12) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'triggered', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_history (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS search_history (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  query VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_favorite_coins_user_id ON favorite_coins(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_user_id ON portfolio_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_status ON price_alerts(user_id, status);
