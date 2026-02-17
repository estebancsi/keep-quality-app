-- ============================================================
-- Computerized Systems Inventory (CSV) Module
-- GAMP 5 compliant inventory for GxP computerized systems
-- ============================================================

-- =====================
-- 1. CATEGORIES TABLE
-- =====================

create table "public"."csv_categories" (
  "id" uuid not null default gen_random_uuid(),
  "tenant_id" text default public.current_tenant_id(),
  "code" integer not null,
  "name" text not null,
  "description" text,
  "typical_examples" text,
  "validation_effort" text,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

alter table "public"."csv_categories" enable row level security;

CREATE UNIQUE INDEX csv_categories_pkey ON public.csv_categories USING btree (id);
CREATE UNIQUE INDEX csv_categories_tenant_code_unique ON public.csv_categories USING btree (tenant_id, code);

alter table "public"."csv_categories" add constraint "csv_categories_pkey" PRIMARY KEY using index "csv_categories_pkey";
alter table "public"."csv_categories" add constraint "csv_categories_tenant_code_unique" UNIQUE using index "csv_categories_tenant_code_unique";

-- RLS
create policy "Users can manage categories for their organization"
  on "public"."csv_categories"
  as permissive
  for all
  to authenticated
using ((tenant_id = public.current_tenant_id()))
with check ((tenant_id = public.current_tenant_id()));

-- Grants
grant select, insert, update, delete on table "public"."csv_categories" to "anon";
grant select, insert, update, delete on table "public"."csv_categories" to "authenticated";
grant select, insert, update, delete on table "public"."csv_categories" to "service_role";

-- Updated at trigger
CREATE TRIGGER csv_categories_set_updated_at BEFORE UPDATE ON public.csv_categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =====================
-- 2. SYSTEMS TABLE
-- =====================

create table "public"."csv_systems" (
  "id" uuid not null default gen_random_uuid(),
  "tenant_id" text default public.current_tenant_id(),
  "code" integer not null default 0,

  -- Core fields
  "name" text not null,
  "version" text,
  "location" text,
  "description" text,

  -- Classification
  "category_id" uuid references "public"."csv_categories"(id),
  "custom_coding" text check (custom_coding in ('automatic', 'manual')),

  -- Lifecycle & Validation
  "lifecycle_status" text not null default 'draft'
    check (lifecycle_status in ('draft', 'in_validation', 'operational', 'retired', 'decommissioned')),
  "validation_status" text not null default 'not_validated'
    check (validation_status in ('not_validated', 'validation_in_progress', 'validated', 'revalidation_required')),

  -- Risk Assessment (3 simple questions)
  "risk_patient_safety" boolean not null default false,
  "risk_product_quality" boolean not null default false,
  "risk_data_integrity" boolean not null default false,

  -- Data Integrity / ALCOA+
  "alcoa_relevant" boolean not null default false,

  -- Periodic Review
  "last_review_date" date,
  "next_review_date" date,
  "review_notes" text,

  -- Metadata
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

alter table "public"."csv_systems" enable row level security;

CREATE UNIQUE INDEX csv_systems_pkey ON public.csv_systems USING btree (id);
CREATE UNIQUE INDEX csv_systems_tenant_code_unique ON public.csv_systems USING btree (tenant_id, code);

alter table "public"."csv_systems" add constraint "csv_systems_pkey" PRIMARY KEY using index "csv_systems_pkey";
alter table "public"."csv_systems" add constraint "csv_systems_tenant_code_unique" UNIQUE using index "csv_systems_tenant_code_unique";

-- RLS
create policy "Users can manage systems for their organization"
  on "public"."csv_systems"
  as permissive
  for all
  to authenticated
using ((tenant_id = public.current_tenant_id()))
with check ((tenant_id = public.current_tenant_id()));

-- Grants
grant select, insert, update, delete on table "public"."csv_systems" to "anon";
grant select, insert, update, delete on table "public"."csv_systems" to "authenticated";
grant select, insert, update, delete on table "public"."csv_systems" to "service_role";

-- Updated at trigger
CREATE TRIGGER csv_systems_set_updated_at BEFORE UPDATE ON public.csv_systems FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =====================
-- 3. AUTO-INCREMENT CODE PER TENANT
-- =====================

CREATE OR REPLACE FUNCTION public.csv_systems_auto_code()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.code IS NULL OR NEW.code = 0 THEN
    SELECT COALESCE(MAX(code), 0) + 1 INTO NEW.code
    FROM csv_systems WHERE tenant_id = NEW.tenant_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_csv_systems_auto_code
BEFORE INSERT ON public.csv_systems
FOR EACH ROW EXECUTE FUNCTION public.csv_systems_auto_code();


-- =====================
-- 4. SEED DEFAULT CATEGORIES
-- =====================
-- Note: These are inserted without tenant_id so they apply via current_tenant_id().
-- In production, you may want a trigger that seeds categories when a new tenant is created.
-- For now, seed them for the current tenant context or via service_role.

-- The INSERT below uses current_tenant_id() default. Run this as the appropriate tenant
-- or seed via a function that creates categories per tenant on first access.

INSERT INTO "public"."csv_categories" (code, name, description, typical_examples, validation_effort) VALUES
  (1, 'Infrastructure Software',
   'Operating systems, database engines, and network infrastructure that provide the platform on which applications run. These are established, commercially available products.',
   'Windows Server, Linux, Oracle Database, Network switches, Firewalls',
   'Minimal - Typically covered by IT infrastructure qualification'),
  (3, 'Non-Configured Products (COTS)',
   'Commercial off-the-shelf software used as-is without configuration that affects GxP data. The software is used in its standard form.',
   'Microsoft Office, Acrobat Reader, antivirus software, backup utilities',
   'Standard - Verify intended use, installation qualification'),
  (4, 'Configured Products',
   'Software products that are configured (but not custom coded) to meet specific business process requirements. Configuration determines system behavior within GxP processes.',
   'ERP systems (SAP), LIMS, CDS (Empower), MES, Document Management Systems',
   'Significant - Configuration verification, IQ/OQ, user acceptance testing'),
  (5, 'Custom Applications',
   'Software that is custom developed or contains custom code to meet specific requirements. This includes bespoke applications, macros, and scripts.',
   'In-house developed applications, Excel macros/VBA, custom integrations, Python scripts',
   'Full - Complete SDLC validation including design, code review, IQ/OQ/PQ')
ON CONFLICT (tenant_id, code) DO NOTHING;
