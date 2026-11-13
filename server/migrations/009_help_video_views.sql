-- How each patient uses the help videos ("píndoles"), one row per video: the
-- pilot's indicators and the therapist's view of the patient. No clinical data.
--
-- video_id is the video (P06), version_id the version last watched (P06 or
-- P06c, the one with screenshots). A video counts as watched once it has
-- played to the end in either version; closed_early says whether the last
-- viewing stopped before the end.

CREATE TABLE help_video_views (
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id     TEXT NOT NULL,
  version_id   TEXT NOT NULL,
  first_at     INTEGER NOT NULL,
  last_at      INTEGER NOT NULL,
  views        INTEGER NOT NULL DEFAULT 1,
  max_percent  INTEGER NOT NULL DEFAULT 0 CHECK (max_percent BETWEEN 0 AND 100),
  completed_at INTEGER,
  closed_early INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, video_id)
);

-- The patient's choice between the diagram and the screenshot versions; it
-- applies to every video that has both. NULL: the diagram one.
ALTER TABLE users ADD COLUMN help_video_variant TEXT CHECK (help_video_variant IN ('esquematica', 'captures'));
