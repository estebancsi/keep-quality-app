-- ============================================================
-- CSV Test Protocols
-- Tables for IQ, OQ, PQ testing
-- ============================================================

-- ─── 1. Parent: csv_test_protocols ──────────────────────────

create table "public"."csv_test_protocols" (
  "id"                     uuid not null default gen_random_uuid(),
  "tenant_id"              text default public.current_tenant_id(),

  -- Links to project
  "lifecycle_project_id"   uuid not null references "public"."csv_lifecycle_projects"(id) on delete cascade,

  -- Phase (iq, oq, pq)
  "phase"                  text not null,

  -- Field variables
  "custom_field_values"    jsonb default '{}'::jsonb,

  -- Metadata
  "created_by"             text,
  "updated_by"             text,
  "created_at"             timestamp with time zone not null default now(),
  "updated_at"             timestamp with time zone not null default now()
);

alter table "public"."csv_test_protocols" enable row level security;

CREATE UNIQUE INDEX csv_test_protocols_pkey ON public.csv_test_protocols USING btree (id);
CREATE UNIQUE INDEX csv_test_protocols_project_phase_unique ON public.csv_test_protocols USING btree (tenant_id, lifecycle_project_id, phase);

alter table "public"."csv_test_protocols" add constraint "csv_test_protocols_pkey" PRIMARY KEY using index "csv_test_protocols_pkey";
alter table "public"."csv_test_protocols" add constraint "csv_test_protocols_project_phase_unique" UNIQUE using index "csv_test_protocols_project_phase_unique";

create policy "Users can manage Test Protocols for their organization"
  on "public"."csv_test_protocols"
  as permissive for all to authenticated
  using ((tenant_id = public.current_tenant_id()))
  with check ((tenant_id = public.current_tenant_id()));

grant select, insert, update, delete on table "public"."csv_test_protocols" to "anon";
grant select, insert, update, delete on table "public"."csv_test_protocols" to "authenticated";
grant select, insert, update, delete on table "public"."csv_test_protocols" to "service_role";

CREATE TRIGGER csv_test_protocols_set_updated_at
  BEFORE UPDATE ON public.csv_test_protocols
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── 2. Child: csv_test_verifications ───────────────────────

create table "public"."csv_test_verifications" (
  "id"                     uuid not null default gen_random_uuid(),
  "tenant_id"              text default public.current_tenant_id(),

  "test_protocol_id"       uuid not null references "public"."csv_test_protocols"(id) on delete cascade,

  "reference"              text not null default '',
  "objective"              text default '',
  "acceptance_criteria"    text default '',
  "status"                 text default 'pending',

  "trace_urs_ids"          text[] default '{}',
  "trace_fs_cs_ids"        text[] default '{}',
  "trace_risk_ids"         text[] default '{}',

  "order_index"            integer not null default 0,

  "created_by"             text,
  "updated_by"             text,
  "created_at"             timestamp with time zone not null default now(),
  "updated_at"             timestamp with time zone not null default now()
);

alter table "public"."csv_test_verifications" enable row level security;

CREATE UNIQUE INDEX csv_test_verifications_pkey ON public.csv_test_verifications USING btree (id);

alter table "public"."csv_test_verifications" add constraint "csv_test_verifications_pkey" PRIMARY KEY using index "csv_test_verifications_pkey";

create policy "Users can manage Test Verifications for their organization"
  on "public"."csv_test_verifications"
  as permissive for all to authenticated
  using ((tenant_id = public.current_tenant_id()))
  with check ((tenant_id = public.current_tenant_id()));

grant select, insert, update, delete on table "public"."csv_test_verifications" to "anon";
grant select, insert, update, delete on table "public"."csv_test_verifications" to "authenticated";
grant select, insert, update, delete on table "public"."csv_test_verifications" to "service_role";

CREATE TRIGGER csv_test_verifications_set_updated_at
  BEFORE UPDATE ON public.csv_test_verifications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── 3. Grandchild: csv_test_steps ──────────────────────────

create table "public"."csv_test_steps" (
  "id"                     uuid not null default gen_random_uuid(),
  "tenant_id"              text default public.current_tenant_id(),

  "test_verification_id"   uuid not null references "public"."csv_test_verifications"(id) on delete cascade,

  "step_number"            text not null default '1.0',
  
  "action"                 text default '',
  "data_to_record"         text default '',
  "expected_result"        text default '',
  "actual_result"          text default '',
  
  "status"                 text default 'pending',
  "order_index"            integer not null default 0,

  "created_by"             text,
  "updated_by"             text,
  "created_at"             timestamp with time zone not null default now(),
  "updated_at"             timestamp with time zone not null default now()
);

alter table "public"."csv_test_steps" enable row level security;

CREATE UNIQUE INDEX csv_test_steps_pkey ON public.csv_test_steps USING btree (id);

alter table "public"."csv_test_steps" add constraint "csv_test_steps_pkey" PRIMARY KEY using index "csv_test_steps_pkey";

create policy "Users can manage Test Steps for their organization"
  on "public"."csv_test_steps"
  as permissive for all to authenticated
  using ((tenant_id = public.current_tenant_id()))
  with check ((tenant_id = public.current_tenant_id()));

grant select, insert, update, delete on table "public"."csv_test_steps" to "anon";
grant select, insert, update, delete on table "public"."csv_test_steps" to "authenticated";
grant select, insert, update, delete on table "public"."csv_test_steps" to "service_role";

CREATE TRIGGER csv_test_steps_set_updated_at
  BEFORE UPDATE ON public.csv_test_steps
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
