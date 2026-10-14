-- Context sent with each piece of feedback, so a report can be followed up
-- without asking the user where they were or what device they used.
ALTER TABLE feedback ADD COLUMN page TEXT;       -- route the user was on, e.g. /exposure
ALTER TABLE feedback ADD COLUMN contact TEXT;    -- optional email the user left for a reply
ALTER TABLE feedback ADD COLUMN language TEXT;   -- app language at the time
ALTER TABLE feedback ADD COLUMN user_agent TEXT;
ALTER TABLE feedback ADD COLUMN viewport TEXT;   -- e.g. 390x844
