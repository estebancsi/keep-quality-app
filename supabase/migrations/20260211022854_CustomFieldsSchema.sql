set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.current_tenant_id()
 RETURNS text
 LANGUAGE sql
AS $function$SELECT auth.jwt() ->> 'urn:zitadel:iam:org:id';$function$
;

create table "public"."custom_fields_schemas" (
  "id" uuid not null default gen_random_uuid(),
  "name" character varying not null,
  "description" character varying,
  "schema_definition" jsonb,
  "is_active" boolean not null default true,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone default now(),
  "tenant_id" text default public.current_tenant_id()
    );


alter table "public"."custom_fields_schemas" enable row level security;

CREATE UNIQUE INDEX custom_fields_schemas_name_key ON public.custom_fields_schemas USING btree (name);

CREATE UNIQUE INDEX custom_fields_schemas_pkey ON public.custom_fields_schemas USING btree (id);

alter table "public"."custom_fields_schemas" add constraint "custom_fields_schemas_pkey" PRIMARY KEY using index "custom_fields_schemas_pkey";

alter table "public"."custom_fields_schemas" add constraint "custom_fields_schemas_name_key" UNIQUE using index "custom_fields_schemas_name_key";


grant delete on table "public"."custom_fields_schemas" to "anon";

grant insert on table "public"."custom_fields_schemas" to "anon";

grant references on table "public"."custom_fields_schemas" to "anon";

grant select on table "public"."custom_fields_schemas" to "anon";

grant trigger on table "public"."custom_fields_schemas" to "anon";

grant truncate on table "public"."custom_fields_schemas" to "anon";

grant update on table "public"."custom_fields_schemas" to "anon";

grant delete on table "public"."custom_fields_schemas" to "authenticated";

grant insert on table "public"."custom_fields_schemas" to "authenticated";

grant references on table "public"."custom_fields_schemas" to "authenticated";

grant select on table "public"."custom_fields_schemas" to "authenticated";

grant trigger on table "public"."custom_fields_schemas" to "authenticated";

grant truncate on table "public"."custom_fields_schemas" to "authenticated";

grant update on table "public"."custom_fields_schemas" to "authenticated";

grant delete on table "public"."custom_fields_schemas" to "service_role";

grant insert on table "public"."custom_fields_schemas" to "service_role";

grant references on table "public"."custom_fields_schemas" to "service_role";

grant select on table "public"."custom_fields_schemas" to "service_role";

grant trigger on table "public"."custom_fields_schemas" to "service_role";

grant truncate on table "public"."custom_fields_schemas" to "service_role";

grant update on table "public"."custom_fields_schemas" to "service_role";


  create policy "Users can access their own tenant data"
  on "public"."custom_fields_schemas"
  as permissive
  for all
  to authenticated
using ((tenant_id = public.current_tenant_id()))
with check ((tenant_id = public.current_tenant_id()));



