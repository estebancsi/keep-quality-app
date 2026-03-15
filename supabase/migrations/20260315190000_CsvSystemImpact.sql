-- ============================================================
-- CSV System Impact Determination
--
-- Two tables:
--   1. csv_system_impact_templates — one org-wide questionnaire template
--   2. csv_system_impact_artifacts — per-project frozen snapshot + answers
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Org-wide questionnaire template
-- ────────────────────────────────────────────────────────────

create table "public"."csv_system_impact_templates" (
  "id"          uuid not null default gen_random_uuid(),
  "tenant_id"   text default public.current_tenant_id(),

  -- Array of { code: string, text: string, position: number }
  "questions"   jsonb not null default '[]'::jsonb,

  -- Traceability
  "created_by"  text,
  "updated_by"  text,
  "created_at"  timestamp with time zone not null default now(),
  "updated_at"  timestamp with time zone not null default now()
);

alter table "public"."csv_system_impact_templates" enable row level security;

CREATE UNIQUE INDEX csv_system_impact_templates_pkey
  ON public.csv_system_impact_templates USING btree (id);

-- One template per organisation
CREATE UNIQUE INDEX csv_system_impact_templates_tenant_unique
  ON public.csv_system_impact_templates USING btree (tenant_id);

alter table "public"."csv_system_impact_templates"
  add constraint "csv_system_impact_templates_pkey"
  PRIMARY KEY using index "csv_system_impact_templates_pkey";

alter table "public"."csv_system_impact_templates"
  add constraint "csv_system_impact_templates_tenant_unique"
  UNIQUE using index "csv_system_impact_templates_tenant_unique";

-- RLS
create policy "Users can manage System Impact Template for their organization"
  on "public"."csv_system_impact_templates"
  as permissive
  for all
  to authenticated
  using ((tenant_id = public.current_tenant_id()))
  with check ((tenant_id = public.current_tenant_id()));

-- Grants
grant select, insert, update, delete on table "public"."csv_system_impact_templates" to "anon";
grant select, insert, update, delete on table "public"."csv_system_impact_templates" to "authenticated";
grant select, insert, update, delete on table "public"."csv_system_impact_templates" to "service_role";

-- Updated-at trigger
CREATE TRIGGER csv_system_impact_templates_set_updated_at
  BEFORE UPDATE ON public.csv_system_impact_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ────────────────────────────────────────────────────────────
-- 2. Per-project artifact (frozen snapshot + answers)
-- ────────────────────────────────────────────────────────────

create table "public"."csv_system_impact_artifacts" (
  "id"                    uuid not null default gen_random_uuid(),
  "tenant_id"             text default public.current_tenant_id(),

  -- 1:1 with lifecycle project
  "lifecycle_project_id"  uuid not null
    references "public"."csv_lifecycle_projects"(id) on delete cascade,

  -- Frozen copy of template questions at initialization time.
  -- Array of { code: string, text: string, position: number }
  "questions_snapshot"    jsonb not null default '[]'::jsonb,

  -- Answers keyed by question code.
  -- { [code]: { answer: boolean | null, justification: string | null } }
  "answers"               jsonb not null default '{}'::jsonb,

  -- Derived GxP impact judgment (persisted for reporting/querying convenience).
  -- true  = at least one answer is Yes → system has GxP impact
  -- false = all answered questions are No → no GxP impact
  -- null  = no answers recorded yet
  "gxp_impact"            boolean,

  -- Traceability
  "created_by"            text,
  "updated_by"            text,
  "created_at"            timestamp with time zone not null default now(),
  "updated_at"            timestamp with time zone not null default now()
);

alter table "public"."csv_system_impact_artifacts" enable row level security;

CREATE UNIQUE INDEX csv_system_impact_artifacts_pkey
  ON public.csv_system_impact_artifacts USING btree (id);

-- One artifact per project per organisation
CREATE UNIQUE INDEX csv_system_impact_artifacts_tenant_project_unique
  ON public.csv_system_impact_artifacts USING btree (tenant_id, lifecycle_project_id);

alter table "public"."csv_system_impact_artifacts"
  add constraint "csv_system_impact_artifacts_pkey"
  PRIMARY KEY using index "csv_system_impact_artifacts_pkey";

alter table "public"."csv_system_impact_artifacts"
  add constraint "csv_system_impact_artifacts_tenant_project_unique"
  UNIQUE using index "csv_system_impact_artifacts_tenant_project_unique";

-- RLS
create policy "Users can manage System Impact Artifacts for their organization"
  on "public"."csv_system_impact_artifacts"
  as permissive
  for all
  to authenticated
  using ((tenant_id = public.current_tenant_id()))
  with check ((tenant_id = public.current_tenant_id()));

-- Grants
grant select, insert, update, delete on table "public"."csv_system_impact_artifacts" to "anon";
grant select, insert, update, delete on table "public"."csv_system_impact_artifacts" to "authenticated";
grant select, insert, update, delete on table "public"."csv_system_impact_artifacts" to "service_role";

-- Updated-at trigger
CREATE TRIGGER csv_system_impact_artifacts_set_updated_at
  BEFORE UPDATE ON public.csv_system_impact_artifacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
