-- The patient journey of the pilot (fita 5).

-- The language of the patient's emails, chosen when the therapist registers
-- them (later emails fall back to the language of their consent).
ALTER TABLE users ADD COLUMN language TEXT CHECK (language IN ('ca', 'es', 'en'));

-- The three-step welcome: consent, P01, and the check of the computer, sound
-- and headphones (P02). The planner is offered at the end.
ALTER TABLE users ADD COLUMN welcome_completed_at INTEGER;

-- A QPV-II being answered, saved as the patient goes, so they can finish it
-- another day. Deleted when the questionnaire is submitted.
CREATE TABLE qpvii_drafts (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  answers    TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- The real flight: the date the patient expects to fly (for a reminder to
-- tell how it went), and their self-report afterwards.
ALTER TABLE users ADD COLUMN planned_flight_date TEXT;
CREATE TABLE flight_reports (
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  flew        INTEGER NOT NULL,              -- 1: flew; 0: not (yet)
  flight_date TEXT,
  max_anxiety INTEGER CHECK (max_anxiety BETWEEN 1 AND 9),
  comment     TEXT,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);
