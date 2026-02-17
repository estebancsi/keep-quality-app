-- ============================================================
-- CSV URS Artifacts & Requirements
-- Parent/child tables for User Requirements Specification
-- linked to lifecycle projects (validation / revalidation).
-- ============================================================

-- ─── Parent: csv_urs_artifacts ─────────────────────────

create table "public"."csv_urs_artifacts" (
  "id"                     uuid not null default gen_random_uuid(),
  "tenant_id"              text default public.current_tenant_id(),

  -- 1:1 with lifecycle project
  "lifecycle_project_id"   uuid not null
    references "public"."csv_lifecycle_projects"(id) on delete cascade,

  -- Custom fields (future integration with custom-fields module)
  "custom_field_values"    jsonb default '{}'::jsonb,

  -- Traceability
  "created_by"             text,
  "updated_by"             text,
  "created_at"             timestamp with time zone not null default now(),
  "updated_at"             timestamp with time zone not null default now()
);

alter table "public"."csv_urs_artifacts" enable row level security;

CREATE UNIQUE INDEX csv_urs_artifacts_pkey
  ON public.csv_urs_artifacts USING btree (id);
CREATE UNIQUE INDEX csv_urs_artifacts_tenant_project_unique
  ON public.csv_urs_artifacts USING btree (tenant_id, lifecycle_project_id);

alter table "public"."csv_urs_artifacts"
  add constraint "csv_urs_artifacts_pkey"
  PRIMARY KEY using index "csv_urs_artifacts_pkey";

alter table "public"."csv_urs_artifacts"
  add constraint "csv_urs_artifacts_tenant_project_unique"
  UNIQUE using index "csv_urs_artifacts_tenant_project_unique";

-- RLS
create policy "Users can manage URS artifacts for their organization"
  on "public"."csv_urs_artifacts"
  as permissive
  for all
  to authenticated
using ((tenant_id = public.current_tenant_id()))
with check ((tenant_id = public.current_tenant_id()));

-- Grants
grant select, insert, update, delete on table "public"."csv_urs_artifacts" to "anon";
grant select, insert, update, delete on table "public"."csv_urs_artifacts" to "authenticated";
grant select, insert, update, delete on table "public"."csv_urs_artifacts" to "service_role";

-- Updated at trigger
CREATE TRIGGER csv_urs_artifacts_set_updated_at
  BEFORE UPDATE ON public.csv_urs_artifacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ─── Child: csv_urs_requirements ───────────────────────

create table "public"."csv_urs_requirements" (
  "id"                uuid not null default gen_random_uuid(),
  "tenant_id"         text default public.current_tenant_id(),

  -- Parent artifact
  "urs_artifact_id"   uuid not null
    references "public"."csv_urs_artifacts"(id) on delete cascade,

  -- Core fields
  "code"              integer not null default 0,
  "position"          integer not null default 0,
  "description"       text default '',

  -- Traceability
  "created_by"        text,
  "updated_by"        text,
  "created_at"        timestamp with time zone not null default now(),
  "updated_at"        timestamp with time zone not null default now()
);

alter table "public"."csv_urs_requirements" enable row level security;

CREATE UNIQUE INDEX csv_urs_requirements_pkey
  ON public.csv_urs_requirements USING btree (id);
CREATE UNIQUE INDEX csv_urs_requirements_artifact_code_unique
  ON public.csv_urs_requirements USING btree (urs_artifact_id, code);

alter table "public"."csv_urs_requirements"
  add constraint "csv_urs_requirements_pkey"
  PRIMARY KEY using index "csv_urs_requirements_pkey";

alter table "public"."csv_urs_requirements"
  add constraint "csv_urs_requirements_artifact_code_unique"
  UNIQUE using index "csv_urs_requirements_artifact_code_unique";

-- RLS
create policy "Users can manage URS requirements for their organization"
  on "public"."csv_urs_requirements"
  as permissive
  for all
  to authenticated
using ((tenant_id = public.current_tenant_id()))
with check ((tenant_id = public.current_tenant_id()));

-- Grants
grant select, insert, update, delete on table "public"."csv_urs_requirements" to "anon";
grant select, insert, update, delete on table "public"."csv_urs_requirements" to "authenticated";
grant select, insert, update, delete on table "public"."csv_urs_requirements" to "service_role";

-- Updated at trigger
CREATE TRIGGER csv_urs_requirements_set_updated_at
  BEFORE UPDATE ON public.csv_urs_requirements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =====================
-- AUTO-INCREMENT CODE PER ARTIFACT
-- =====================

CREATE OR REPLACE FUNCTION public.csv_urs_requirements_auto_code()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.code IS NULL OR NEW.code = 0 THEN
    SELECT COALESCE(MAX(code), 0) + 1 INTO NEW.code
    FROM csv_urs_requirements WHERE urs_artifact_id = NEW.urs_artifact_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_csv_urs_requirements_auto_code
BEFORE INSERT ON public.csv_urs_requirements
FOR EACH ROW EXECUTE FUNCTION public.csv_urs_requirements_auto_code();
