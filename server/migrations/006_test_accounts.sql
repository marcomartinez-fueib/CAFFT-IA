-- Staff mark a patient account as a test account from the clinical panel.
-- Only those accounts see the testing controls (random QPV-II answers,
-- simulated video viewing), and the pilot's figures can leave them out.
ALTER TABLE users ADD COLUMN is_test_account INTEGER NOT NULL DEFAULT 0;
