-- Add custom_field_values to csv_fs_cs_artifacts
-- This stores namespaced values for FS, CS, and DS custom fields.
-- Structure: { "Functional": { ... }, "Configuration": { ... }, "Design": { ... } }

ALTER TABLE "public"."csv_fs_cs_artifacts"
ADD COLUMN "custom_field_values" jsonb default '{}'::jsonb;
