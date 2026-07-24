-- Align journey_status enum with portal runtime bootstrap value

ALTER TYPE public.journey_status ADD VALUE IF NOT EXISTS 'OPEN';
