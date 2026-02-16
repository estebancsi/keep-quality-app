-- ============================================================================
-- 21 CFR Part 11 Compliant Audit Trail for Supabase
-- ============================================================================
-- Apply this migration in the Supabase SQL Editor.
-- It creates:
--   1. audit_trail table (append-only)
--   2. RLS policies (tenant isolation, no UPDATE/DELETE)
--   3. Generic trigger function for automatic audit capture
--   4. Example trigger attachment
-- ============================================================================

-- 1. Create the audit_trail table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_trail (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id   TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id   TEXT NOT NULL,
    action      TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'ACTION')),
    action_label TEXT,
    user_id     TEXT NOT NULL,
    reason      TEXT,
    changes     JSONB DEFAULT '[]'::jsonb,
    metadata    JSONB,
    created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS ix_audit_trail_tenant
    ON public.audit_trail (tenant_id);

CREATE INDEX IF NOT EXISTS ix_audit_trail_entity
    ON public.audit_trail (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS ix_audit_trail_tenant_created
    ON public.audit_trail (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_audit_trail_user
    ON public.audit_trail (user_id);

COMMENT ON TABLE public.audit_trail IS
    '21 CFR Part 11 compliant audit trail. This table is APPEND-ONLY. '
    'No UPDATE or DELETE operations are permitted.';


-- 2. Enable Row Level Security
-- ============================================================================
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only read audit entries for their tenant
CREATE POLICY audit_trail_select_policy ON public.audit_trail
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
    );

-- INSERT: Authenticated users can insert for their tenant
CREATE POLICY audit_trail_insert_policy ON public.audit_trail
    FOR INSERT
    WITH CHECK (
        tenant_id = current_tenant_id()
        AND auth.uid() IS NOT NULL
    );

-- NO UPDATE policy → updates are blocked by RLS
-- NO DELETE policy → deletes are blocked by RLS


-- 3. Generic trigger function for automatic audit capture
-- ============================================================================
-- This function can be attached to any table to automatically record
-- INSERT, UPDATE, and DELETE operations in the audit_trail table.
--
-- Usage:
--   CREATE TRIGGER audit_<table_name>
--       AFTER INSERT OR UPDATE OR DELETE ON public.<table_name>
--       FOR EACH ROW EXECUTE FUNCTION fn_audit_trail('<EntityType>');
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_audit_trail()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_action      TEXT;
    v_entity_type TEXT;
    v_entity_id   TEXT;
    v_user_id     TEXT;
    v_tenant_id   TEXT;
    v_changes     JSONB := '[]'::jsonb;
    v_old_data    JSONB;
    v_new_data    JSONB;
    v_key         TEXT;
BEGIN
    -- Get the entity type from the trigger argument
    v_entity_type := TG_ARGV[0];

    -- Extract user and tenant from JWT context
    v_user_id   := COALESCE(auth.uid()::text, 'system');
    v_tenant_id := COALESCE(
        current_tenant_id(),
        'unknown'
    );

    -- Determine action and compute changes
    IF TG_OP = 'INSERT' THEN
        v_action    := 'CREATE';
        v_entity_id := COALESCE(NEW.id::text, gen_random_uuid()::text);

    ELSIF TG_OP = 'UPDATE' THEN
        v_action    := 'UPDATE';
        v_entity_id := OLD.id::text;

        -- Compute field-level diffs
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);

        FOR v_key IN SELECT jsonb_object_keys(v_new_data)
        LOOP
            -- Skip system fields
            IF v_key IN ('updated_at', 'created_at') THEN
                CONTINUE;
            END IF;

            IF (v_old_data ->> v_key) IS DISTINCT FROM (v_new_data ->> v_key) THEN
                v_changes := v_changes || jsonb_build_array(
                    jsonb_build_object(
                        'field', v_key,
                        'old_value', v_old_data ->> v_key,
                        'new_value', v_new_data ->> v_key
                    )
                );
            END IF;
        END LOOP;

        -- Skip if no meaningful changes
        IF jsonb_array_length(v_changes) = 0 THEN
            RETURN NEW;
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        v_action    := 'DELETE';
        v_entity_id := OLD.id::text;
    END IF;

    -- Insert audit record (bypasses RLS via SECURITY DEFINER)
    INSERT INTO public.audit_trail (
        tenant_id, entity_type, entity_id, action, user_id, changes
    ) VALUES (
        v_tenant_id, v_entity_type, v_entity_id, v_action, v_user_id, v_changes
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_audit_trail() IS
    'Generic audit trail trigger function. Attach to any table with: '
    'CREATE TRIGGER audit_<table> AFTER INSERT OR UPDATE OR DELETE '
    'ON public.<table> FOR EACH ROW EXECUTE FUNCTION fn_audit_trail(''EntityType'');';


-- 4. Example: Attach trigger to a table (uncomment and customize)
-- ============================================================================
-- CREATE TRIGGER audit_cmfq_muestras
--     AFTER INSERT OR UPDATE OR DELETE ON public.cmfq_muestras
--     FOR EACH ROW EXECUTE FUNCTION fn_audit_trail('MuestraFQ');
--
-- CREATE TRIGGER audit_cmm_especificaciones
--     AFTER INSERT OR UPDATE OR DELETE ON public.cmm_especificaciones
--     FOR EACH ROW EXECUTE FUNCTION fn_audit_trail('EspecificacionMB');
