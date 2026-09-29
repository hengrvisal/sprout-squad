-- Sprout Squad · track whether a user has seen the intro slides.
-- Stored on the account (not the phone) so it follows them to a new device.
alter table public.profiles add column onboarded_at timestamptz;
