set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.current_user_id()
  RETURNS text
  LANGUAGE sql
  STABLE
AS $function$
  SELECT auth.jwt() ->> 'sub';
$function$
;
