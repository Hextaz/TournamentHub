-- Restreint la langue aux locales supportées (fr, en) : le bot et le web retombent sinon silencieusement sur 'fr'.
UPDATE server_settings SET language = 'fr' WHERE language IS NULL OR language NOT IN ('fr', 'en');
UPDATE tournaments SET language = 'fr' WHERE language IS NULL OR language NOT IN ('fr', 'en');

ALTER TABLE server_settings
  ALTER COLUMN language SET NOT NULL,
  ADD CONSTRAINT server_settings_language_check CHECK (language IN ('fr', 'en'));

ALTER TABLE tournaments
  ALTER COLUMN language SET NOT NULL,
  ADD CONSTRAINT tournaments_language_check CHECK (language IN ('fr', 'en'));
