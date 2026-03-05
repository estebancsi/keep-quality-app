
create table "public"."csv_lifecycle_attachments" (
  "id" uuid not null default gen_random_uuid(),
  "tenant_id" text not null default public.current_tenant_id(),
  "lifecycle_project_id" uuid not null,
  "name" text not null,
  "object_name" text not null,
  "status" text not null default 'publishing'::text,
  "content_type" text default 'application/pdf'::text,
  "file_size" bigint,
  "created_by" text,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);


alter table "public"."csv_lifecycle_attachments" enable row level security;

CREATE UNIQUE INDEX csv_lifecycle_attachments_pkey ON public.csv_lifecycle_attachments USING btree (id);

alter table "public"."csv_lifecycle_attachments" add constraint "csv_lifecycle_attachments_pkey" PRIMARY KEY using index "csv_lifecycle_attachments_pkey";

alter table "public"."csv_lifecycle_attachments" add constraint "csv_lifecycle_attachments_lifecycle_project_id_fkey" FOREIGN KEY (lifecycle_project_id) REFERENCES public.csv_lifecycle_projects(id) ON DELETE CASCADE not valid;

alter table "public"."csv_lifecycle_attachments" validate constraint "csv_lifecycle_attachments_lifecycle_project_id_fkey";

grant delete on table "public"."csv_lifecycle_attachments" to "anon";

grant insert on table "public"."csv_lifecycle_attachments" to "anon";

grant references on table "public"."csv_lifecycle_attachments" to "anon";

grant select on table "public"."csv_lifecycle_attachments" to "anon";

grant trigger on table "public"."csv_lifecycle_attachments" to "anon";

grant truncate on table "public"."csv_lifecycle_attachments" to "anon";

grant update on table "public"."csv_lifecycle_attachments" to "anon";

grant delete on table "public"."csv_lifecycle_attachments" to "authenticated";

grant insert on table "public"."csv_lifecycle_attachments" to "authenticated";

grant references on table "public"."csv_lifecycle_attachments" to "authenticated";

grant select on table "public"."csv_lifecycle_attachments" to "authenticated";

grant trigger on table "public"."csv_lifecycle_attachments" to "authenticated";

grant truncate on table "public"."csv_lifecycle_attachments" to "authenticated";

grant update on table "public"."csv_lifecycle_attachments" to "authenticated";

grant delete on table "public"."csv_lifecycle_attachments" to "service_role";

grant insert on table "public"."csv_lifecycle_attachments" to "service_role";

grant references on table "public"."csv_lifecycle_attachments" to "service_role";

grant select on table "public"."csv_lifecycle_attachments" to "service_role";

grant trigger on table "public"."csv_lifecycle_attachments" to "service_role";

grant truncate on table "public"."csv_lifecycle_attachments" to "service_role";

grant update on table "public"."csv_lifecycle_attachments" to "service_role";


create policy "Users can manage lifecycle files for their organization"
  on "public"."csv_lifecycle_attachments"
  as permissive
  for all
  to authenticated
using ((tenant_id = public.current_tenant_id()))
with check ((tenant_id = public.current_tenant_id()));



