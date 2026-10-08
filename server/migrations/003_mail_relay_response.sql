-- What the relay answered when it accepted a message, e.g.
-- "250 2.0.0 Ok: queued as 4j0lXx0RC1zYl8DT". Acceptance is all the API can
-- see; the queue id is what the UIB's IT needs to trace delivery onwards.
ALTER TABLE outbound_mail ADD COLUMN relay_response TEXT;
