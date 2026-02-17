-- ============================================================
-- CSV Lifecycle Projects
-- Tracks lifecycle phases (validation, periodic review,
-- revalidation, retirement) for computerized systems.
-- ============================================================

create table "public"."csv_lifecycle_projects" (
  "id"                     uuid not null default gen_random_uuid(),
  "tenant_id"              text default public.current_tenant_id(),
  "code"                   integer not null default 0,

  -- Relationships
  "system_id"              uuid not null references "public"."csv_systems"(id) on delete cascade,

  -- Core fields
  "type"                   text not null
    check (type in ('validation', 'periodic_review', 'revalidation', 'retirement')),
  "status"                 text not null default 'draft'
    check (status in ('draft', 'in_progress', 'completed', 'cancelled')),

  -- Dates
  "start_date"             date,
  "target_completion_date" date,
  "actual_completion_date" date,

  -- Owner (IdP / Zitadel user ID)
  "assigned_to"            text,

  -- Notes
  "notes"                  text,

  -- Metadata
  "created_at"             timestamp with time zone not null default now(),
  "updated_at"             timestamp with time zone not null default now()
);

alter table "public"."csv_lifecycle_projects" enable row level security;

CREATE UNIQUE INDEX csv_lifecycle_projects_pkey
  ON public.csv_lifecycle_projects USING btree (id);
CREATE UNIQUE INDEX csv_lifecycle_projects_tenant_code_unique
  ON public.csv_lifecycle_projects USING btree (tenant_id, code);

alter table "public"."csv_lifecycle_projects"
  add constraint "csv_lifecycle_projects_pkey"
  PRIMARY KEY using index "csv_lifecycle_projects_pkey";

alter table "public"."csv_lifecycle_projects"
  add constraint "csv_lifecycle_projects_tenant_code_unique"
  UNIQUE using index "csv_lifecycle_projects_tenant_code_unique";

-- RLS
create policy "Users can manage lifecycle projects for their organization"
  on "public"."csv_lifecycle_projects"
  as permissive
  for all
  to authenticated
using ((tenant_id = public.current_tenant_id()))
with check ((tenant_id = public.current_tenant_id()));

-- Grants
grant select, insert, update, delete on table "public"."csv_lifecycle_projects" to "anon";
grant select, insert, update, delete on table "public"."csv_lifecycle_projects" to "authenticated";
grant select, insert, update, delete on table "public"."csv_lifecycle_projects" to "service_role";

-- Updated at trigger
CREATE TRIGGER csv_lifecycle_projects_set_updated_at
  BEFORE UPDATE ON public.csv_lifecycle_projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =====================
-- AUTO-INCREMENT CODE PER TENANT
-- =====================

CREATE OR REPLACE FUNCTION public.csv_lifecycle_projects_auto_code()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.code IS NULL OR NEW.code = 0 THEN
    SELECT COALESCE(MAX(code), 0) + 1 INTO NEW.code
    FROM csv_lifecycle_projects WHERE tenant_id = NEW.tenant_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_csv_lifecycle_projects_auto_code
BEFORE INSERT ON public.csv_lifecycle_projects
FOR EACH ROW EXECUTE FUNCTION public.csv_lifecycle_projects_auto_code();
