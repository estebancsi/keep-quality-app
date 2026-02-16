
  create table "public"."pdf_templates" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "data" jsonb not null default '{}'::jsonb,
    "tenant_id" text default public.current_tenant_id(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."pdf_templates" enable row level security;

CREATE UNIQUE INDEX pdf_templates_name_tenant_unique ON public.pdf_templates USING btree (name, tenant_id);

CREATE UNIQUE INDEX pdf_templates_pkey ON public.pdf_templates USING btree (id);

alter table "public"."pdf_templates" add constraint "pdf_templates_pkey" PRIMARY KEY using index "pdf_templates_pkey";

alter table "public"."pdf_templates" add constraint "pdf_templates_name_tenant_unique" UNIQUE using index "pdf_templates_name_tenant_unique";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."pdf_templates" to "anon";

grant insert on table "public"."pdf_templates" to "anon";

grant references on table "public"."pdf_templates" to "anon";

grant select on table "public"."pdf_templates" to "anon";

grant trigger on table "public"."pdf_templates" to "anon";

grant truncate on table "public"."pdf_templates" to "anon";

grant update on table "public"."pdf_templates" to "anon";

grant delete on table "public"."pdf_templates" to "authenticated";

grant insert on table "public"."pdf_templates" to "authenticated";

grant references on table "public"."pdf_templates" to "authenticated";

grant select on table "public"."pdf_templates" to "authenticated";

grant trigger on table "public"."pdf_templates" to "authenticated";

grant truncate on table "public"."pdf_templates" to "authenticated";

grant update on table "public"."pdf_templates" to "authenticated";

grant delete on table "public"."pdf_templates" to "service_role";

grant insert on table "public"."pdf_templates" to "service_role";

grant references on table "public"."pdf_templates" to "service_role";

grant select on table "public"."pdf_templates" to "service_role";

grant trigger on table "public"."pdf_templates" to "service_role";

grant truncate on table "public"."pdf_templates" to "service_role";

grant update on table "public"."pdf_templates" to "service_role";


  create policy "Users can manage templates for their organization"
  on "public"."pdf_templates"
  as permissive
  for all
  to authenticated
using ((tenant_id = public.current_tenant_id()))
with check ((tenant_id = public.current_tenant_id()));


CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.pdf_templates FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


