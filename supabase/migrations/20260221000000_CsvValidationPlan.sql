-- ============================================================
-- CSV Validation Plan Artifacts
-- 1:1 with lifecycle projects (validation / revalidation).
-- ============================================================

create table "public"."csv_validation_plan_artifacts" (
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

alter table "public"."csv_validation_plan_artifacts" enable row level security;

CREATE UNIQUE INDEX csv_validation_plan_artifacts_pkey
  ON public.csv_validation_plan_artifacts USING btree (id);
CREATE UNIQUE INDEX csv_validation_plan_artifacts_tenant_project_unique
  ON public.csv_validation_plan_artifacts USING btree (tenant_id, lifecycle_project_id);

alter table "public"."csv_validation_plan_artifacts"
  add constraint "csv_validation_plan_artifacts_pkey"
  PRIMARY KEY using index "csv_validation_plan_artifacts_pkey";

alter table "public"."csv_validation_plan_artifacts"
  add constraint "csv_validation_plan_artifacts_tenant_project_unique"
  UNIQUE using index "csv_validation_plan_artifacts_tenant_project_unique";

-- RLS
create policy "Users can manage Validation Plan for their organization"
  on "public"."csv_validation_plan_artifacts"
  as permissive
  for all
  to authenticated
using ((tenant_id = public.current_tenant_id()))
with check ((tenant_id = public.current_tenant_id()));

-- Grants
grant select, insert, update, delete on table "public"."csv_validation_plan_artifacts" to "anon";
grant select, insert, update, delete on table "public"."csv_validation_plan_artifacts" to "authenticated";
grant select, insert, update, delete on table "public"."csv_validation_plan_artifacts" to "service_role";

-- Updated at trigger
CREATE TRIGGER csv_validation_plan_artifacts_set_updated_at
  BEFORE UPDATE ON public.csv_validation_plan_artifacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
