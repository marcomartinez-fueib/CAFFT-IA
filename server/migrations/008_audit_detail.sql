-- What an audited access touched, as JSON (e.g. the patients whose clinical
-- data a therapist loaded). The DPD needs to know who saw which patient.
ALTER TABLE audit_log ADD COLUMN detail TEXT;
CREATE INDEX audit_log_actor ON audit_log(actor_id, at);
