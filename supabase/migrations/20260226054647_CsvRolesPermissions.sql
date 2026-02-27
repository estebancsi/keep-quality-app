-- Role Tables
CREATE TABLE public.csv_project_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id text default public.current_tenant_id(),
    lifecycle_project_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Permission Tables
CREATE TABLE public.csv_project_perms (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id text default public.current_tenant_id(),
    lifecycle_project_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Role-Permission Mappings
CREATE TABLE public.csv_project_role_perms (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id text default public.current_tenant_id(),
    lifecycle_project_id uuid NOT NULL,
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    expected_access character varying(50) NOT NULL CHECK (expected_access IN ('Granted', 'Restricted', 'N/A')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Role-Permission Test Results
CREATE TABLE public.csv_project_role_perm_test_results (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id text default public.current_tenant_id(),
    lifecycle_project_id uuid NOT NULL,
    mapping_id uuid NOT NULL,
    actual_result text,
    attachment_urls jsonb DEFAULT '[]'::jsonb,
    status character varying(50) NOT NULL CHECK (status IN ('Pass', 'Fail', 'Pending')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Constraints
ALTER TABLE ONLY public.csv_project_roles
    ADD CONSTRAINT csv_project_roles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.csv_project_perms
    ADD CONSTRAINT csv_project_perms_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.csv_project_role_perms
    ADD CONSTRAINT csv_project_role_perms_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.csv_project_role_perm_test_results
    ADD CONSTRAINT csv_project_role_perm_test_results_pkey PRIMARY KEY (id);

-- Foreign Keys
ALTER TABLE ONLY public.csv_project_roles
    ADD CONSTRAINT csv_project_roles_lifecycle_project_id_fkey FOREIGN KEY (lifecycle_project_id) REFERENCES public.csv_lifecycle_projects(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.csv_project_perms
    ADD CONSTRAINT csv_project_perms_lifecycle_project_id_fkey FOREIGN KEY (lifecycle_project_id) REFERENCES public.csv_lifecycle_projects(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.csv_project_role_perms
    ADD CONSTRAINT csv_project_role_perms_lifecycle_project_id_fkey FOREIGN KEY (lifecycle_project_id) REFERENCES public.csv_lifecycle_projects(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.csv_project_role_perms
    ADD CONSTRAINT csv_project_role_perms_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.csv_project_roles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.csv_project_role_perms
    ADD CONSTRAINT csv_project_role_perms_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.csv_project_perms(id) ON DELETE CASCADE;

-- Test Results mapping foreign key
ALTER TABLE ONLY public.csv_project_role_perm_test_results
    ADD CONSTRAINT csv_project_role_perm_test_results_mapping_id_fkey FOREIGN KEY (mapping_id) REFERENCES public.csv_project_role_perms(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.csv_project_role_perm_test_results
    ADD CONSTRAINT csv_project_role_perm_test_results_lifecycle_project_id_fkey FOREIGN KEY (lifecycle_project_id) REFERENCES public.csv_lifecycle_projects(id) ON DELETE CASCADE;

-- Unique Constraints to prevent duplicate roles/perms names in the same project, and duplicate mappings
ALTER TABLE ONLY public.csv_project_roles
    ADD CONSTRAINT csv_project_roles_name_project_key UNIQUE (lifecycle_project_id, name);

ALTER TABLE ONLY public.csv_project_perms
    ADD CONSTRAINT csv_project_perms_name_project_key UNIQUE (lifecycle_project_id, name);

ALTER TABLE ONLY public.csv_project_role_perms
    ADD CONSTRAINT csv_project_role_perms_mapping_key UNIQUE (role_id, permission_id);

ALTER TABLE ONLY public.csv_project_role_perm_test_results
    ADD CONSTRAINT csv_project_role_perm_test_results_mapping_key UNIQUE (mapping_id);

-- Enable RLS
ALTER TABLE public.csv_project_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csv_project_perms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csv_project_role_perms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csv_project_role_perm_test_results ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage roles for their organization" ON public.csv_project_roles AS PERMISSIVE FOR ALL TO authenticated USING ((tenant_id = public.current_tenant_id())) WITH CHECK ((tenant_id = public.current_tenant_id()));
CREATE POLICY "Users can manage perms for their organization" ON public.csv_project_perms AS PERMISSIVE FOR ALL TO authenticated USING ((tenant_id = public.current_tenant_id())) WITH CHECK ((tenant_id = public.current_tenant_id()));
CREATE POLICY "Users can manage role perms for their organization" ON public.csv_project_role_perms AS PERMISSIVE FOR ALL TO authenticated USING ((tenant_id = public.current_tenant_id())) WITH CHECK ((tenant_id = public.current_tenant_id()));
CREATE POLICY "Users can manage test results for their organization" ON public.csv_project_role_perm_test_results AS PERMISSIVE FOR ALL TO authenticated USING ((tenant_id = public.current_tenant_id())) WITH CHECK ((tenant_id = public.current_tenant_id()));
