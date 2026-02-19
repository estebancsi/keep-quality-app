-- ============================================================
-- CSV Risk Analysis (FMEA)
-- Risk Analysis Artifacts & Items (FMEA Rows)
-- ============================================================

-- ─── Parent: csv_risk_analysis_artifacts ──────────────────

create table "public"."csv_risk_analysis_artifacts" (
  "id"                     uuid not null default gen_random_uuid(),
  "tenant_id"              text default public.current_tenant_id(),

  -- 1:1 with lifecycle project
  "lifecycle_project_id"   uuid not null
    references "public"."csv_lifecycle_projects"(id) on delete cascade,

  -- Custom fields (future integration)
  "custom_field_values"    jsonb default '{}'::jsonb,

  -- Metadata
  "created_by"             text,
  "updated_by"             text,
  "created_at"             timestamp with time zone not null default now(),
  "updated_at"             timestamp with time zone not null default now()
);

alter table "public"."csv_risk_analysis_artifacts" enable row level security;

CREATE UNIQUE INDEX csv_risk_analysis_artifacts_pkey
  ON public.csv_risk_analysis_artifacts USING btree (id);
CREATE UNIQUE INDEX csv_risk_analysis_artifacts_tenant_project_unique
  ON public.csv_risk_analysis_artifacts USING btree (tenant_id, lifecycle_project_id);

alter table "public"."csv_risk_analysis_artifacts"
  add constraint "csv_risk_analysis_artifacts_pkey"
  PRIMARY KEY using index "csv_risk_analysis_artifacts_pkey";

alter table "public"."csv_risk_analysis_artifacts"
  add constraint "csv_risk_analysis_artifacts_tenant_project_unique"
  UNIQUE using index "csv_risk_analysis_artifacts_tenant_project_unique";

-- RLS
create policy "Users can manage Risk Analysis artifacts for their organization"
  on "public"."csv_risk_analysis_artifacts"
  as permissive
  for all
  to authenticated
  using ((tenant_id = public.current_tenant_id()))
  with check ((tenant_id = public.current_tenant_id()));

-- Grants
grant select, insert, update, delete on table "public"."csv_risk_analysis_artifacts" to "anon";
grant select, insert, update, delete on table "public"."csv_risk_analysis_artifacts" to "authenticated";
grant select, insert, update, delete on table "public"."csv_risk_analysis_artifacts" to "service_role";

-- Updated at trigger
CREATE TRIGGER csv_risk_analysis_artifacts_set_updated_at
  BEFORE UPDATE ON public.csv_risk_analysis_artifacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ─── Child: csv_risk_analysis_items ───────────────────────

create table "public"."csv_risk_analysis_items" (
  "id"                          uuid not null default gen_random_uuid(),
  "tenant_id"                   text default public.current_tenant_id(),

  -- Parent artifact
  "risk_analysis_artifact_id"   uuid not null
    references "public"."csv_risk_analysis_artifacts"(id) on delete cascade,

  -- Core FMEA fields
  "code"                        integer not null default 0,
  "position"                    integer not null default 0,
  
  "failure_mode"                text default '',
  "cause"                       text default '',
  "effect"                      text default '',
  
  -- Assessment S/P/D (1-3)
  "severity"                    integer default 1,
  "probability"                 integer default 1,
  "detectability"               integer default 1,
  
  -- Calculated Risk
  "rpn"                         integer default 1, -- Risk Priority (GAMP 5)
  "risk_class"                  integer default 1, -- Risk Class (GAMP 5)
  
  "mitigation"                  text default '',
  
  -- Traceability Identifiers (Arrays of UUIDs)
  "trace_urs_ids"               text[] default '{}',
  "trace_fs_cs_ids"             text[] default '{}',

  -- Metadata
  "created_by"                  text,
  "updated_by"                  text,
  "created_at"                  timestamp with time zone not null default now(),
  "updated_at"                  timestamp with time zone not null default now()
);

alter table "public"."csv_risk_analysis_items" enable row level security;

CREATE UNIQUE INDEX csv_risk_analysis_items_pkey
  ON public.csv_risk_analysis_items USING btree (id);
CREATE UNIQUE INDEX csv_risk_analysis_items_artifact_code_unique
  ON public.csv_risk_analysis_items USING btree (risk_analysis_artifact_id, code);

alter table "public"."csv_risk_analysis_items"
  add constraint "csv_risk_analysis_items_pkey"
  PRIMARY KEY using index "csv_risk_analysis_items_pkey";

alter table "public"."csv_risk_analysis_items"
  add constraint "csv_risk_analysis_items_artifact_code_unique"
  UNIQUE using index "csv_risk_analysis_items_artifact_code_unique";

-- RLS
create policy "Users can manage Risk Analysis items for their organization"
  on "public"."csv_risk_analysis_items"
  as permissive
  for all
  to authenticated
  using ((tenant_id = public.current_tenant_id()))
  with check ((tenant_id = public.current_tenant_id()));

-- Grants
grant select, insert, update, delete on table "public"."csv_risk_analysis_items" to "anon";
grant select, insert, update, delete on table "public"."csv_risk_analysis_items" to "authenticated";
grant select, insert, update, delete on table "public"."csv_risk_analysis_items" to "service_role";

-- Updated at trigger
CREATE TRIGGER csv_risk_analysis_items_set_updated_at
  BEFORE UPDATE ON public.csv_risk_analysis_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =====================
-- AUTO-INCREMENT CODE PER ARTIFACT
-- =====================

CREATE OR REPLACE FUNCTION public.csv_risk_analysis_items_auto_code()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.code IS NULL OR NEW.code = 0 THEN
    SELECT COALESCE(MAX(code), 0) + 1 INTO NEW.code
    FROM csv_risk_analysis_items WHERE risk_analysis_artifact_id = NEW.risk_analysis_artifact_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_csv_risk_analysis_items_auto_code
BEFORE INSERT ON public.csv_risk_analysis_items
FOR EACH ROW EXECUTE FUNCTION public.csv_risk_analysis_items_auto_code();
