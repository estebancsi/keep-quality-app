-- Add attachment_urls column to csv_test_steps table
ALTER TABLE public.csv_test_steps
ADD COLUMN IF NOT EXISTS attachment_urls JSONB DEFAULT '[]'::jsonb;
