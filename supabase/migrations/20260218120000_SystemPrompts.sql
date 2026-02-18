
create table "public"."system_prompts" (
  "id" uuid not null default gen_random_uuid(),
  "name" text not null,
  "description" text,
  "system_prompt_template" text not null,
  "user_prompt_template" text not null,
  "model_config" jsonb,
  "is_active" boolean default true,
  "tenant_id" text default public.current_tenant_id(),
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

alter table "public"."system_prompts" enable row level security;

CREATE UNIQUE INDEX system_prompts_name_tenant_unique ON public.system_prompts USING btree (name, tenant_id);
CREATE UNIQUE INDEX system_prompts_pkey ON public.system_prompts USING btree (id);

alter table "public"."system_prompts" add constraint "system_prompts_pkey" PRIMARY KEY using index "system_prompts_pkey";
alter table "public"."system_prompts" add constraint "system_prompts_name_tenant_unique" UNIQUE using index "system_prompts_name_tenant_unique";

CREATE TRIGGER set_system_prompts_updated_at BEFORE UPDATE ON public.system_prompts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

grant delete on table "public"."system_prompts" to "anon";
grant insert on table "public"."system_prompts" to "anon";
grant references on table "public"."system_prompts" to "anon";
grant select on table "public"."system_prompts" to "anon";
grant trigger on table "public"."system_prompts" to "anon";
grant truncate on table "public"."system_prompts" to "anon";
grant update on table "public"."system_prompts" to "anon";

grant delete on table "public"."system_prompts" to "authenticated";
grant insert on table "public"."system_prompts" to "authenticated";
grant references on table "public"."system_prompts" to "authenticated";
grant select on table "public"."system_prompts" to "authenticated";
grant trigger on table "public"."system_prompts" to "authenticated";
grant truncate on table "public"."system_prompts" to "authenticated";
grant update on table "public"."system_prompts" to "authenticated";

grant delete on table "public"."system_prompts" to "service_role";
grant insert on table "public"."system_prompts" to "service_role";
grant references on table "public"."system_prompts" to "service_role";
grant select on table "public"."system_prompts" to "service_role";
grant trigger on table "public"."system_prompts" to "service_role";
grant truncate on table "public"."system_prompts" to "service_role";
grant update on table "public"."system_prompts" to "service_role";

create policy "Users can manage system prompts for their organization"
on "public"."system_prompts"
as permissive
for all
to authenticated
using ((tenant_id = public.current_tenant_id()))
with check ((tenant_id = public.current_tenant_id()));
