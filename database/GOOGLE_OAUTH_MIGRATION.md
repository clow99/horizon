# Google account subject migration

The OAuth callback now requires `users.google_sub`. Deploy this change only after
reviewing and applying `migration-add-google-subject.sql` to the target database.
Back up the database first. This repository patch does not run a live migration.
The new session cookie name requires existing sessions to sign in again.

Existing `@gmail.com` users are linked on their first verified Google callback.
The same Google subject keeps its user ID and stored email on later sign-ins, even
if Google's email changes. The stored email remains stable because current data
lookups use it.

Existing non-Gmail users are denied until their account owner is verified through
an independent recovery channel. After that proof, an operator can associate the
verified Google `sub` with the existing user ID under a reviewed, audited procedure.
Never fill `google_sub` using email alone. New users with verified Google identity
are created with their subject at first sign-in.

Before deployment, verify the schema migration on a disposable database and plan
recovery for existing non-Gmail users. After deployment, test a genuine Google
sign-in and a returning user. Public callback availability and Google Console
registration are separate checks.
