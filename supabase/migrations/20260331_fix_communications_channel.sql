-- Fix: Communications table was missing RLS enforcement, INSERT/UPDATE policies,
-- and was not registered for Supabase Realtime — so inter-account messaging
-- (Estate Agent ↔ Conveyancer ↔ Financial Institution) was broken in production.

-- 1. Enable RLS (idempotent)
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

-- 2. INSERT policy: users can send messages from their own organization
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'communications' AND policyname = 'Users can insert communications'
  ) THEN
    CREATE POLICY "Users can insert communications"
    ON communications FOR INSERT
    TO authenticated
    WITH CHECK (
      sender_organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
      )
    );
  END IF;
END $$;

-- 3. UPDATE policy: recipients can mark messages as read
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'communications' AND policyname = 'Recipients can update communications'
  ) THEN
    CREATE POLICY "Recipients can update communications"
    ON communications FOR UPDATE
    TO authenticated
    USING (
      recipient_organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
      )
    )
    WITH CHECK (
      recipient_organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
      )
    );
  END IF;
END $$;

-- 4. Enable Realtime (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'communications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE communications;
  END IF;
END $$;
