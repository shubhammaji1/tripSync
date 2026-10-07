-- Documents are read through the API so PIN verification cannot be bypassed.
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON documents, chat_messages FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON documents, chat_messages FROM authenticated;
  END IF;
END $$;
