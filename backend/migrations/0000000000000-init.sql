--
-- PostgreSQL Better-Auth initial migration
--

-- Enable extensions if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===== user table =====
CREATE TABLE IF NOT EXISTS public."user" (
    id text PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean NOT NULL,
    image text,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_email_key'
    ) THEN
        ALTER TABLE public."user" ADD CONSTRAINT user_email_key UNIQUE (email);
    END IF;
END$$;

-- ===== account table =====
CREATE TABLE IF NOT EXISTS public.account (
    id text PRIMARY KEY,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" text NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamptz,
    "refreshTokenExpiresAt" timestamptz,
    scope text,
    password text,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamptz NOT NULL
);

-- Foreign key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'account_userId_fkey'
    ) THEN
        ALTER TABLE public.account
        ADD CONSTRAINT account_userId_fkey FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;
    END IF;
END$$;

-- ===== session table =====
CREATE TABLE IF NOT EXISTS public.session (
    id text PRIMARY KEY,
    "expiresAt" timestamptz NOT NULL,
    token text NOT NULL,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamptz NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" text NOT NULL
);

-- Unique token
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'session_token_key'
    ) THEN
        ALTER TABLE public.session ADD CONSTRAINT session_token_key UNIQUE (token);
    END IF;
END$$;

-- Foreign key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'session_userId_fkey'
    ) THEN
        ALTER TABLE public.session
        ADD CONSTRAINT session_userId_fkey FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;
    END IF;
END$$;

-- ===== verification table =====
CREATE TABLE IF NOT EXISTS public.verification (
    id text PRIMARY KEY,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamptz NOT NULL,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);
