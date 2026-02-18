-- Add category and group_name columns to csv_urs_requirements

ALTER TABLE csv_urs_requirements
ADD COLUMN category text NOT NULL DEFAULT 'Functional' CHECK (category IN ('Functional', 'Configuration', 'Design')),
ADD COLUMN group_name text;

-- Add index for group_name for faster grouping queries if needed
CREATE INDEX idx_csv_urs_requirements_group_name ON csv_urs_requirements(group_name);
