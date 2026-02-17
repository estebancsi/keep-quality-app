-- ============================================================
-- CSV FS/CS Artifacts & Requirements
-- Combined Functional / Configuration / Design Specs
-- linked to lifecycle projects (Cat 4 & 5).
-- ============================================================

-- ─── Parent: csv_fs_cs_artifacts ───────────────────────

create table "public"."csv_fs_cs_artifacts" (
  "id"                     uuid not null default gen_random_uuid(),
  "tenant_id"              text default public.current_tenant_id(),

  -- 1:1 with lifecycle project
  "lifecycle_project_id"   uuid not null
    references "public"."csv_lifecycle_projects"(id) on delete cascade,

  -- Meta
  "created_by"             text,
  "updated_by"             text,
  "created_at"             timestamp with time zone not null default now(),
  "updated_at"             timestamp with time zone not null default now()
);

alter table "public"."csv_fs_cs_artifacts" enable row level security;

CREATE UNIQUE INDEX csv_fs_cs_artifacts_pkey
  ON public.csv_fs_cs_artifacts USING btree (id);
CREATE UNIQUE INDEX csv_fs_cs_artifacts_tenant_project_unique
  ON public.csv_fs_cs_artifacts USING btree (tenant_id, lifecycle_project_id);

alter table "public"."csv_fs_cs_artifacts"
  add constraint "csv_fs_cs_artifacts_pkey"
  PRIMARY KEY using index "csv_fs_cs_artifacts_pkey";

alter table "public"."csv_fs_cs_artifacts"
  add constraint "csv_fs_cs_artifacts_tenant_project_unique"
  UNIQUE using index "csv_fs_cs_artifacts_tenant_project_unique";

-- RLS
create policy "Users can manage FS/CS artifacts for their organization"
  on "public"."csv_fs_cs_artifacts"
  as permissive
  for all
  to authenticated
using ((tenant_id = public.current_tenant_id()))
with check ((tenant_id = public.current_tenant_id()));

-- Grants
grant select, insert, update, delete on table "public"."csv_fs_cs_artifacts" to "anon";
grant select, insert, update, delete on table "public"."csv_fs_cs_artifacts" to "authenticated";
grant select, insert, update, delete on table "public"."csv_fs_cs_artifacts" to "service_role";

-- Updated at trigger
CREATE TRIGGER csv_fs_cs_artifacts_set_updated_at
  BEFORE UPDATE ON public.csv_fs_cs_artifacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ─── Child: csv_fs_cs_requirements ─────────────────────

create table "public"."csv_fs_cs_requirements" (
  "id"                uuid not null default gen_random_uuid(),
  "tenant_id"         text default public.current_tenant_id(),

  -- Parent artifact
  "fs_cs_artifact_id" uuid not null
    references "public"."csv_fs_cs_artifacts"(id) on delete cascade,

  -- Discriminator: 'Functional', 'Configuration', 'Design'
  "req_type"          text not null,

  -- Core fields
  "code"              integer not null default 0,
  "category"          text,  -- optional categorization
  "position"          integer not null default 0,
  "description"       text default '',
  
  -- Traceability (Array of URS Requirement IDs)
  "trace_urs_ids"     uuid[] default '{}',

  -- Meta
  "created_by"        text,
  "updated_by"        text,
  "created_at"        timestamp with time zone not null default now(),
  "updated_at"        timestamp with time zone not null default now()
);

alter table "public"."csv_fs_cs_requirements" enable row level security;

CREATE UNIQUE INDEX csv_fs_cs_requirements_pkey
  ON public.csv_fs_cs_requirements USING btree (id);

-- Code uniqueness is per Artifact + Type (e.g., FS-1, FS-2... and CS-1, CS-2...)
CREATE UNIQUE INDEX csv_fs_cs_requirements_code_unique
  ON public.csv_fs_cs_requirements USING btree (fs_cs_artifact_id, req_type, code);

alter table "public"."csv_fs_cs_requirements"
  add constraint "csv_fs_cs_requirements_pkey"
  PRIMARY KEY using index "csv_fs_cs_requirements_pkey";

alter table "public"."csv_fs_cs_requirements"
  add constraint "csv_fs_cs_requirements_code_unique"
  UNIQUE using index "csv_fs_cs_requirements_code_unique";

-- RLS
create policy "Users can manage FS/CS requirements for their organization"
  on "public"."csv_fs_cs_requirements"
  as permissive
  for all
  to authenticated
using ((tenant_id = public.current_tenant_id()))
with check ((tenant_id = public.current_tenant_id()));

-- Grants
grant select, insert, update, delete on table "public"."csv_fs_cs_requirements" to "anon";
grant select, insert, update, delete on table "public"."csv_fs_cs_requirements" to "authenticated";
grant select, insert, update, delete on table "public"."csv_fs_cs_requirements" to "service_role";

-- Updated at trigger
CREATE TRIGGER csv_fs_cs_requirements_set_updated_at
  BEFORE UPDATE ON public.csv_fs_cs_requirements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =====================
-- AUTO-INCREMENT CODE PER ARTIFACT + TYPE
-- =====================

CREATE OR REPLACE FUNCTION public.csv_fs_cs_requirements_auto_code()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.code IS NULL OR NEW.code = 0 THEN
    -- Get Max code for this Artifact AND this Type
    SELECT COALESCE(MAX(code), 0) + 1 INTO NEW.code
    FROM csv_fs_cs_requirements 
    WHERE fs_cs_artifact_id = NEW.fs_cs_artifact_id
      AND req_type = NEW.req_type;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_csv_fs_cs_requirements_auto_code
BEFORE INSERT ON public.csv_fs_cs_requirements
FOR EACH ROW EXECUTE FUNCTION public.csv_fs_cs_requirements_auto_code();
