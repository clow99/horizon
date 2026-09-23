-- One-time schema migration for existing MySQL installations.
-- Apply before deploying the OAuth callback change; do not infer a subject from email.
ALTER TABLE users
  ADD COLUMN google_sub VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NULL,
  ADD UNIQUE KEY uq_users_google_sub (google_sub);
